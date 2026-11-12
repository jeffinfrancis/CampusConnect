
import mongoose from "mongoose";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

// Helper: return current event availability
const getAvailabilityData = async (eventId, session = null) => {
  let eventQuery = Event.findById(eventId);

  if (session) {
    eventQuery = eventQuery.session(session);
  }

  const event = await eventQuery;

  if (!event) {
    return null;
  }

  let waitlistQuery = Registration.countDocuments({
    event: eventId,
    status: "waitlisted",
  });

  if (session) {
    waitlistQuery = waitlistQuery.session(session);
  }

  const waitlistedCount = await waitlistQuery;

  const registeredCount = event.registeredCount ?? 0;

  return {
    eventId: event._id,
    capacity: event.capacity,
    registeredCount,
    availableSeats: Math.max(0, event.capacity - registeredCount),
    waitlistedCount,
    isFull: registeredCount >= event.capacity,
  };
};

// 1. Register for an event or join the waitlist
export const registerForEvent = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { eventId } = req.body;
    const studentId = req.user._id;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "A valid event ID is required.",
      });
    }

    const now = new Date();
    let result;

    await session.withTransaction(async () => {
      const event = await Event.findOne({
        _id: eventId,
        status: "approved",
        eventDate: { $gt: now },
      }).session(session);

      if (!event) {
        throw new Error("APPROVED_EVENT_NOT_FOUND");
      }

      let registration = await Registration.findOne({
        student: studentId,
        event: eventId,
      }).session(session);

      if (
        registration &&
        registration.status === "registered"
      ) {
        throw new Error("ALREADY_REGISTERED");
      }

      if (
        registration &&
        registration.status === "waitlisted"
      ) {
        throw new Error("ALREADY_WAITLISTED");
      }

      // Atomically reserve a seat if one is available.
      const seatResult = await Event.updateOne(
        {
          _id: eventId,
          status: "approved",
          eventDate: { $gt: now },
          $expr: {
            $lt: ["$registeredCount", "$capacity"],
          },
        },
        {
          $inc: { registeredCount: 1 },
        },
        { session }
      );

      const hasSeat = seatResult.modifiedCount === 1;

      const newStatus = hasSeat
        ? "registered"
        : "waitlisted";

      if (registration) {
        // Reactivate a previously cancelled registration.
        registration.status = newStatus;
        registration.registrationDate = now;
        registration.attendanceStatus = "not-marked";

        await registration.save({ session });
      } else {
        registration = await Registration.create(
          [
            {
              student: studentId,
              event: eventId,
              status: newStatus,
              registrationDate: now,
            },
          ],
          { session }
        );

        registration = registration[0];
      }

      const availability = await getAvailabilityData(
        eventId,
        session
      );

      result = {
        registration,
        availability,
        status: newStatus,
      };
    });

    if (result.status === "registered") {
      return res.status(201).json({
        message: "Successfully registered for the event.",
        registration: result.registration,
        availability: result.availability,
      });
    }

    return res.status(201).json({
      message:
        "The event is full. You have been added to the waitlist.",
      registration: result.registration,
      availability: result.availability,
    });
  } catch (error) {
    console.error("Register for event error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have a registration for this event.",
      });
    }

    if (error.message === "APPROVED_EVENT_NOT_FOUND") {
      return res.status(404).json({
        message: "Approved future event not found.",
      });
    }

    if (error.message === "ALREADY_REGISTERED") {
      return res.status(409).json({
        message: "You are already registered for this event.",
      });
    }

    if (error.message === "ALREADY_WAITLISTED") {
      return res.status(409).json({
        message: "You are already on the waitlist for this event.",
      });
    }

    return res.status(500).json({
      message: "Failed to register for the event.",
    });
  } finally {
    await session.endSession();
  }
};

// 2. Get registrations for the logged-in student
export const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      student: req.user._id,
    })
      .populate("event")
      .sort({ registrationDate: -1 });

    return res.status(200).json({
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error("Get my registrations error:", error);

    return res.status(500).json({
      message: "Failed to retrieve registrations.",
    });
  }
};

// 3. Cancel registration or waitlist position
export const cancelRegistration = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid registration ID.",
      });
    }

    let result;

    await session.withTransaction(async () => {
      const registration = await Registration.findOne({
        _id: id,
        student: req.user._id,
        status: { $in: ["registered", "waitlisted"] },
      }).session(session);

      if (!registration) {
        throw new Error("ACTIVE_REGISTRATION_NOT_FOUND");
      }

      const previousStatus = registration.status;

      registration.status = "cancelled";
      await registration.save({ session });

      let promotedRegistration = null;

      if (previousStatus === "registered") {
        // Release the confirmed seat.
        const event = await Event.findById(
          registration.event
        ).session(session);

        if (event) {
          const decrementResult = await Event.updateOne(
            {
              _id: event._id,
              registeredCount: { $gt: 0 },
            },
            {
              $inc: { registeredCount: -1 },
            },
            { session }
          );

          if (decrementResult.modifiedCount !== 1) {
            throw new Error("SEAT_COUNT_UPDATE_FAILED");
          }

          // Promote the earliest waitlisted student,
          // but only if the event is still active.
          if (
            event.status === "approved" &&
            event.eventDate > new Date()
          ) {
            promotedRegistration =
              await Registration.findOneAndUpdate(
                {
                  event: event._id,
                  status: "waitlisted",
                },
                {
                  $set: {
                    status: "registered",
                    attendanceStatus: "not-marked",
                  },
                },
                {
                  sort: {
                    registrationDate: 1,
                    createdAt: 1,
                    _id: 1,
                  },
                  new: true,
                  session,
                }
              );

            // The promoted student takes the released seat.
            if (promotedRegistration) {
              await Event.updateOne(
                { _id: event._id },
                { $inc: { registeredCount: 1 } },
                { session }
              );
            }
          }
        }
      }

      const availability = await getAvailabilityData(
        registration.event,
        session
      );

      result = {
        registration,
        promotedRegistration,
        availability,
        previousStatus,
      };
    });

    let message = "Registration cancelled successfully.";

    if (result.previousStatus === "waitlisted") {
      message = "Your waitlist position has been cancelled.";
    } else if (result.promotedRegistration) {
      message =
        "Registration cancelled. The next waitlisted student has been promoted.";
    }

    return res.status(200).json({
      message,
      registration: result.registration,
      promotedRegistration: result.promotedRegistration,
      availability: result.availability,
    });
  } catch (error) {
    console.error("Cancel registration error:", error);

    if (error.message === "ACTIVE_REGISTRATION_NOT_FOUND") {
      return res.status(404).json({
        message: "Active registration or waitlist position not found.",
      });
    }

    return res.status(500).json({
      message: "Failed to cancel registration.",
    });
  } finally {
    await session.endSession();
  }
};

// 4. Get availability for an approved event
export const getEventAvailability = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID.",
      });
    }

    const event = await Event.findOne({
      _id: eventId,
      status: "approved",
    });

    if (!event) {
      return res.status(404).json({
        message: "Approved event not found.",
      });
    }

    const availability = await getAvailabilityData(eventId);

    return res.status(200).json({
      event: {
        _id: event._id,
        title: event.title,
        eventDate: event.eventDate,
      },
      availability,
    });
  } catch (error) {
    console.error("Get event availability error:", error);

    return res.status(500).json({
      message: "Failed to retrieve event availability.",
    });
  }
};

// 5. Organizer/Admin: View confirmed participants
export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "Invalid event ID.",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found.",
      });
    }

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not authorized to view these participants.",
      });
    }

    const participants = await Registration.find({
      event: eventId,
      status: "registered",
    })
      .populate("student", "name email")
      .sort({ registrationDate: 1 });

    return res.status(200).json({
      event: event.title,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error("Get participants error:", error);

    return res.status(500).json({
      message: "Failed to retrieve event participants.",
    });
  }
};

// 6. Organizer/Admin: Mark participant attendance
export const markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendanceStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid registration ID.",
      });
    }

    if (!["attended", "absent"].includes(attendanceStatus)) {
      return res.status(400).json({
        message: "Attendance status must be attended or absent.",
      });
    }

    const registration = await Registration.findById(id)
      .populate("event");

    if (!registration || registration.status !== "registered") {
      return res.status(404).json({
        message: "Active registration not found.",
      });
    }

    const event = registration.event;

    if (
      event.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You are not authorized to mark attendance.",
      });
    }

    registration.attendanceStatus = attendanceStatus;
    await registration.save();

    return res.status(200).json({
      message: "Attendance updated successfully.",
      registration,
    });
  } catch (error) {
    console.error("Mark attendance error:", error);

    return res.status(500).json({
      message: "Failed to update attendance.",
    });
  }
};
