import mongoose from "mongoose";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

// 1. Register for an event
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    const studentId = req.user._id;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        message: "A valid event ID is required.",
      });
    }

    // Find an approved event
    const event = await Event.findOne({
      _id: eventId,
      status: "approved",
    });

    if (!event) {
      return res.status(404).json({
        message: "Approved event not found.",
      });
    }

    if (new Date(event.eventDate) <= new Date()) {
      return res.status(400).json({
        message: "Registration is closed because this event has already started.",
      });
    }

    // Check whether the student already has a registration
    let registration = await Registration.findOne({
      student: studentId,
      event: eventId,
    });

    if (registration && registration.status === "registered") {
      return res.status(409).json({
        message: "You are already registered for this event.",
      });
    }

    // Check event capacity
    const registeredCount = await Registration.countDocuments({
      event: eventId,
      status: "registered",
    });

    if (registeredCount >= event.capacity) {
      return res.status(400).json({
        message: "Sorry, this event has reached its maximum capacity.",
      });
    }

    if (registration) {
      // Reactivate the previous cancelled registration
      registration.status = "registered";
      registration.registrationDate = new Date();
      registration.attendanceStatus = "not-marked";
      await registration.save();
    } else {
      registration = await Registration.create({
        student: studentId,
        event: eventId,
      });
    }

    return res.status(201).json({
      message: "Successfully registered for the event.",
      registration,
    });
  } catch (error) {
    console.error("Register for event error:", error);

    // Handle duplicate registration in case of simultaneous requests
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You are already registered for this event.",
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

// 3. Cancel a student's own registration
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
      status: "registered",
    });

    if (!registration) {
      return res.status(404).json({
        message: "Active registration not found.",
      });
    }

    registration.status = "cancelled";
    await registration.save();

    return res.status(200).json({
      message: "Registration cancelled successfully.",
      registration,
    });
  } catch (error) {
    console.error("Cancel registration error:", error);

    return res.status(500).json({
      message: "Failed to cancel registration.",
    });
  }
};

// 4. Organizer/Admin: View participants for an event
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

    // Only the event owner or an admin can view participants
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

// 5. Organizer/Admin: Mark participant attendance
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

    // Only the event owner or an admin can mark attendance
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