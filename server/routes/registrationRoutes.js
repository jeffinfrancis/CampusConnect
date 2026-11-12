
import express from "express";

import {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventAvailability,
  getEventParticipants,
  markAttendance,
} from "../controllers/registrationController.js";

import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route: Check event seat availability
router.get(
  "/event/:eventId/availability",
  getEventAvailability
);

// Student routes
router.post(
  "/",
  authenticate,
  authorizeRoles("student"),
  registerForEvent
);

router.get(
  "/my-registrations",
  authenticate,
  authorizeRoles("student"),
  getMyRegistrations
);

router.patch(
  "/:id/cancel",
  authenticate,
  authorizeRoles("student"),
  cancelRegistration
);

// Organizer/Admin routes
router.get(
  "/event/:eventId/participants",
  authenticate,
  authorizeRoles("organizer", "admin"),
  getEventParticipants
);

router.patch(
  "/:id/attendance",
  authenticate,
  authorizeRoles("organizer", "admin"),
  markAttendance
);

export default router;
