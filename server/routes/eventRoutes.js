
import express from "express";

import {
  createEvent,
  getAllEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  getPendingEvents,
} from "../controllers/eventController.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllEvents);

// Organizer routes
router.post(
  "/",
  authenticate,
  authorizeRoles("organizer", "admin"),
  createEvent
);

router.get(
  "/my-events",
  authenticate,
  authorizeRoles("organizer", "admin"),
  getMyEvents
);

router.get("/:id", getEventById);

// Admin routes
router.get(
  "/admin/pending",
  authenticate,
  authorizeRoles("admin"),
  getPendingEvents
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRoles("admin"),
  updateEventStatus
);

// Owner/Admin routes
router.put(
  "/:id",
  authenticate,
  authorizeRoles("organizer", "admin"),
  updateEvent
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("organizer", "admin"),
  deleteEvent
);

export default router;
