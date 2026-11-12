
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import { getEventById } from "../../services/eventService";

import {
  getEventAvailability,
  getMyRegistrations,
  registerForEvent,
  type EventAvailability,
} from "../../services/registrationService";

import { useAuth } from "../../context/AuthContext";

import type { Event, Registration } from "../../types";

import "./EventDetails.css";

type ActiveRegistrationStatus = "registered" | "waitlisted";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { isAuthenticated, user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [availability, setAvailability] =
    useState<EventAvailability | null>(null);

  const [registrationStatus, setRegistrationStatus] =
    useState<ActiveRegistrationStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load the latest availability
  const refreshAvailability = async () => {
    if (!id) return;

    const response = await getEventAvailability(id);
    setAvailability(response.availability);
  };

  // Load event details and student's registration status
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) {
        setError("Invalid event ID.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [eventResponse, availabilityResponse] =
          await Promise.all([
            getEventById(id),
            getEventAvailability(id),
          ]);

        setEvent(eventResponse.event);
        setAvailability(availabilityResponse.availability);

        // Check whether the logged-in student already has a place
        if (isAuthenticated && user?.role === "student") {
          const registrationResponse = await getMyRegistrations();

          const existingRegistration =
            registrationResponse.registrations.find(
              (registration: Registration) => {
                const registrationEvent =
                  registration.event;

                const eventId =
                  typeof registrationEvent === "string"
                    ? registrationEvent
                    : registrationEvent?._id;

                return (
                  eventId === id &&
                  (registration.status === "registered" ||
                    registration.status === "waitlisted")
                );
              }
            );

          setRegistrationStatus(
            existingRegistration
              ? existingRegistration.status as ActiveRegistrationStatus
              : null
          );
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(
            err.response?.data?.message ||
              "Failed to load event details."
          );
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    void fetchEventDetails();
  }, [id, isAuthenticated, user?.role]);

  // Register or join the waitlist
  const handleRegistration = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "student") {
      setError("Only students can register for events.");
      return;
    }

    if (!id) return;

    try {
      setRegistering(true);
      setError("");
      setMessage("");

      const response = await registerForEvent(id);

      setRegistrationStatus(response.registration.status as ActiveRegistrationStatus);
      setMessage(response.message);

      await refreshAvailability();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        );

        // Refresh availability in case another student took the last seat
        try {
          await refreshAvailability();
        } catch {
          // Keep the original registration error
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <section className="event-details-page">
        <div className="event-details-loading">
          <div className="loading-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </section>
    );
  }

  if (error && !event) {
    return (
      <section className="event-details-page">
        <div className="event-details-error">
          <h2>Unable to load event</h2>
          <p>{error}</p>
          <Link to="/student/events" className="back-link">
            Back to Events
          </Link>
        </div>
      </section>
    );
  }

  if (!event) return null;

  const registeredCount =
    availability?.registeredCount ?? event.registeredCount ?? 0;

  const availableSeats =
    availability?.availableSeats ??
    Math.max(0, event.capacity - registeredCount);

  const waitlistedCount = availability?.waitlistedCount ?? 0;

  const isFull =
    availability?.isFull ?? availableSeats <= 0;

  const organizerName =
    typeof event.organizer === "string"
      ? "CampusEvents Organizer"
      : event.organizer?.name || "CampusEvents Organizer";

  const progressPercentage =
    event.capacity > 0
      ? Math.min(100, (registeredCount / event.capacity) * 100)
      : 0;

  return (
    <section className="event-details-page">
      <div className="event-details-container">

        <Link
          to={
            user?.role === "student"
              ? "/student/events"
              : "/"
          }
          className="back-link"
        >
          ← Back to Events
        </Link>

        <div className="event-details-card">

          <div className="event-details-header">
            <span className="event-category">
              {event.category}
            </span>

            <span className={`event-status ${isFull ? "full" : "available"}`}>
              {isFull ? "Fully Booked" : "Seats Available"}
            </span>
          </div>

          <h1>{event.title}</h1>

          <div className="event-details-meta">
            <div className="event-meta-item">
              <span>📅</span>
              <div>
                <small>Date & Time</small>
                <p>
                  {new Date(event.eventDate).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="event-meta-item">
              <span>📍</span>
              <div>
                <small>Venue</small>
                <p>{event.venue}</p>
              </div>
            </div>

            <div className="event-meta-item">
              <span>👤</span>
              <div>
                <small>Organizer</small>
                <p>{organizerName}</p>
              </div>
            </div>
          </div>

          <div className="event-description">
            <h2>About This Event</h2>
            <p>{event.description}</p>
          </div>

          <div className="event-availability">
            <h2>Seat Availability</h2>

            <div className="availability-numbers">
              <div>
                <small>Total Capacity</small>
                <strong>{event.capacity}</strong>
              </div>

              <div>
                <small>Registered</small>
                <strong>{registeredCount}</strong>
              </div>

              <div>
                <small>Available Seats</small>
                <strong>{availableSeats}</strong>
              </div>

              <div>
                <small>Waitlisted</small>
                <strong>{waitlistedCount}</strong>
              </div>
            </div>

            <div className="availability-progress">
              <div
                className="availability-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="availability-caption">
              {registeredCount} of {event.capacity} seats filled
            </p>
          </div>

          {message && (
            <div className="event-success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="event-error-message">
              {error}
            </div>
          )}

          <div className="event-registration-action">

            {registrationStatus === "registered" ? (
              <>
                <div className="registration-confirmed">
                  <h3>✓ You're Registered!</h3>
                  <p>Your seat at this event is confirmed.</p>
                </div>

                <Link
                  to="/student/registrations"
                  className="event-action-button"
                >
                  View My Registrations
                </Link>
              </>
            ) : registrationStatus === "waitlisted" ? (
              <>
                <div className="registration-waitlisted">
                  <h3>You're on the Waitlist</h3>
                  <p>
                    You'll be promoted automatically when a seat
                    becomes available.
                  </p>
                </div>

                <Link
                  to="/student/registrations"
                  className="event-action-button"
                >
                  View My Registrations
                </Link>
              </>
            ) : (
              <>
                <button
                  className="event-action-button"
                  onClick={handleRegistration}
                  disabled={
                    registering ||
                    (isAuthenticated && user?.role !== "student")
                  }
                >
                  {registering
                    ? "Processing..."
                    : !isAuthenticated
                      ? "Login to Register"
                      : user?.role !== "student"
                        ? "Student Login Required"
                        : isFull
                          ? "Join Waitlist"
                          : "Register Now"}
                </button>

                {isFull && (
                  <p className="waitlist-note">
                    This event is full. You can still join the waitlist.
                  </p>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default EventDetails;
