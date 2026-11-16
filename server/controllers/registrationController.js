import mongoose from "mongoose";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

// Helper: return current event availability
const getAvailabilityData = async (eventId) => {
  const event = await Event.findById(eventId);

  if (!event) {
    return null;
  }

  const waitlistedCount = await Registration.countDocuments({
    event: eventId,
    status: "waitlisted",
  });

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
  try {
    const { eventId } = req.body;
    const studentId = req.user._id;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "A valid event ID is required.",
      });
    }

    const now = new Date();

    const event = await Event.findOne({
      _id: eventId,
      status: "approved",
      eventDate: { $gt: now },
    });

    if (!event) {
      return res.status(404).json({
        message: "Approved future event not found.",
      });
    }

    let registration = await Registration.findOne({
      student: studentId,
      event: eventId,
    });

    if (registration && registration.status === "registered") {
      return res.status(409).json({
        message: "You are already registered for this event.",
      });
    }

    if (registration && registration.status === "waitlisted") {
      return res.status(409).json({
        message: "You are already on the waitlist for this event.",
      });
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
      }
    );

    const hasSeat = seatResult.modifiedCount === 1;
    const newStatus = hasSeat ? "registered" : "waitlisted";

    if (registration) {
      // Reactivate a previously cancelled registration.
      registration.status = newStatus;
      registration.registrationDate = now;
      registration.attendanceStatus = "not-marked";

      await registration.save();
    } else {
      registration = await Registration.create({
        student: studentId,
        event: eventId,
        status: newStatus,
        registrationDate: now,
      });
    }

    const availability = await getAvailabilityData(eventId);

    if (newStatus === "registered") {
      return res.status(201).json({
        message: "Successfully registered for the event.",
        registration,
        availability,
      });
    }

    return res.status(201).json({
      message: "The event is full. You have been added to the waitlist.",
      registration,
      availability,
    });
  } catch (error) {
    console.error("Register for event error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "You already have a registration for this event.",
      });
    }

    return res.status(500).json({
      message: "Failed to register for the event.",
    });
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
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid registration ID.",
      });
    }

    const registration = await Registration.findOne({
      _id: id,
      student: req.user._id,
      status: { $in: ["registered", "waitlisted"] },
    });

    if (!registration) {
      return res.status(404).json({
        message: "Active registration or waitlist position not found.",
      });
    }

    const previousStatus = registration.status;

    registration.status = "cancelled";
    await registration.save();

    let promotedRegistration = null;

    if (previousStatus === "registered") {
      // Release the confirmed seat.
      const event = await Event.findById(registration.event);

      if (event) {
        const decrementResult = await Event.updateOne(
          {
            _id: event._id,
            registeredCount: { $gt: 0 },
          },
          {
            $inc: { registeredCount: -1 },
          }
        );

        if (decrementResult.modifiedCount !== 1) {
          console.warn("Warning: Seat count update failed or already at 0.");
        }

        // Promote the earliest waitlisted student, if event is still active.
        if (event.status === "approved" && event.eventDate > new Date()) {
          promotedRegistration = await Registration.findOneAndUpdate(
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
            }
          );

          // The promoted student takes the released seat.
          if (promotedRegistration) {
            await Event.updateOne(
              { _id: event._id },
              { $inc: { registeredCount: 1 } }
            );
          }
        }
      }
    }

    const availability = await getAvailabilityData(registration.event);

    let message = "Registration cancelled successfully.";
    if (previousStatus === "waitlisted") {
      message = "Your waitlist position has been cancelled.";
    } else if (promotedRegistration) {
      message = "Registration cancelled. The next waitlisted student has been promoted.";
    }

    return res.status(200).json({
      message,
      registration,
      promotedRegistration,
      availability,
    });
  } catch (error) {
    console.error("Cancel registration error:", error);

    return res.status(500).json({
      message: "Failed to cancel registration.",
    });
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

    const registration = await Registration.findById(id).populate("event");

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