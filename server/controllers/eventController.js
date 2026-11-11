import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import mongoose from "mongoose";


export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      eventDate,
      venue,
      capacity,
    } = req.body;

    // Validate required fields
    if (
      !title?.trim() ||
      !description?.trim() ||
      !category ||
      !eventDate ||
      !venue?.trim() ||
      capacity === undefined
    ) {
      return res.status(400).json({
        message: "All event fields are required",
      });
    }

    // Validate capacity
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
      return res.status(400).json({
        message: "Capacity must be a positive integer",
      });
    }

    // Validate event date
    const parsedDate = new Date(eventDate);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate <= new Date()
    ) {
      return res.status(400).json({
        message: "Event date must be in the future",
      });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description.trim(),
      category,
      eventDate: parsedDate,
      venue: venue.trim(),
      capacity: Number(capacity),
      organizer: req.user._id,
      status: "pending",
    });

    return res.status(201).json({
      message: "Event created successfully. Awaiting admin approval.",
      event,
    });

  } catch (error) {
    console.error("Create event error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create event",
    });
  }
};

//Get all approved events

export const getAllEvents = async (req, res) => {
  try {
    const { category, search } = req.query;

    const filter = {
      status: "approved",
    };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
      ];
    }

    const events = await Event.find(filter)
      .populate("organizer", "name email")
      .sort({ eventDate: 1 });

    return res.status(200).json({
      count: events.length,
      events,
    });

  } catch (error) {
    console.error("Get events error:", error);

    return res.status(500).json({
      message: "Failed to retrieve events",
    });
  }
};


//Get event by ID


export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const event = await Event.findOne({
      _id: id,
      status: "approved",
    }).populate("organizer", "name email");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    return res.status(200).json({ event });

  } catch (error) {
    console.error("Get event error:", error);

    return res.status(500).json({
      message: "Failed to retrieve event",
    });
  }
};

// Get events organized by the authenticated user

export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({
      organizer: req.user._id,
    })
      .populate("organizer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: events.length,
      events,
    });

  } catch (error) {
    console.error("Get my events error:", error);

    return res.status(500).json({
      message: "Failed to retrieve your events",
    });
  }
};

// Update an event by ID (only for the event organizer or admin)

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check ownership
    const isOwner =
      event.organizer.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You cannot update this event",
      });
    }

    // Only allow these fields to be updated
    const allowedFields = [
      "title",
      "description",
      "category",
      "eventDate",
      "venue",
      "capacity",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    if (
      updates.title !== undefined &&
      !updates.title.trim()
    ) {
      return res.status(400).json({
        message: "Title cannot be empty",
      });
    }

    if (
      updates.description !== undefined &&
      !updates.description.trim()
    ) {
      return res.status(400).json({
        message: "Description cannot be empty",
      });
    }

    if (
      updates.venue !== undefined &&
      !updates.venue.trim()
    ) {
      return res.status(400).json({
        message: "Venue cannot be empty",
      });
    }

    if (updates.capacity !== undefined) {
      if (
        !Number.isInteger(Number(updates.capacity)) ||
        Number(updates.capacity) < 1
      ) {
        return res.status(400).json({
          message: "Capacity must be a positive integer",
        });
      }

      updates.capacity = Number(updates.capacity);
    }

    if (updates.eventDate !== undefined) {
      const parsedDate = new Date(updates.eventDate);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate <= new Date()
      ) {
        return res.status(400).json({
          message: "Event date must be in the future",
        });
      }

      updates.eventDate = parsedDate;
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      updates.description = updates.description.trim();
    }

    if (updates.venue !== undefined) {
      updates.venue = updates.venue.trim();
    }

    Object.assign(event, updates);

    // Organizer edits require reapproval
    if (!isAdmin) {
      event.status = "pending";
    }

    await event.save();

    return res.status(200).json({
      message: "Event updated successfully",
      event,
    });

  } catch (error) {
    console.error("Update event error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update event",
    });
  }
};

// Delete an event and its registrations (only for the event organizer or admin)

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const isOwner =
      event.organizer.toString() === req.user._id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You cannot delete this event",
      });
    }

    await Registration.deleteMany({ event: id });
    await event.deleteOne();

    return res.status(200).json({
      message: "Event and associated registrations deleted successfully",
    });

  } catch (error) {
    console.error("Delete event error:", error);

    return res.status(500).json({
      message: "Failed to delete event",
    });
  }
};


// Admin approval/rejection of events

export const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid event ID",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be approved or rejected",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    event.status = status;

    await event.save();

    return res.status(200).json({
      message: `Event ${status} successfully`,
      event,
    });

  } catch (error) {
    console.error("Update event status error:", error);

    return res.status(500).json({
      message: "Failed to update event status",
    });
  }
};

//Admin: View Pending events

export const getPendingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "pending",
    })
      .populate("organizer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: events.length,
      events,
    });

  } catch (error) {
    console.error("Get pending events error:", error);

    return res.status(500).json({
      message: "Failed to retrieve pending events",
    });
  }
};

// Admin: View all events (approved, pending, rejected)
export const getAllEventsAdmin = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("organizer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve events.",
      error: error.message,
    });
  }
};