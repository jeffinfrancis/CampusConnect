
import { useEffect, useState } from "react";
import axios from "axios";

import {
  cancelRegistration,
  getMyRegistrations,
} from "../../services/registrationService";

import type { Event, Registration } from "../../types";

const MyRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyRegistrations();
      setRegistrations(response.registrations);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to load your registrations."
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRegistrations();
  }, []);

  const handleCancel = async (registrationId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this registration?"
    );

    if (!confirmed) return;

    try {
      setCancellingId(registrationId);
      setError("");
      setMessage("");

      const response = await cancelRegistration(registrationId);

      setRegistrations((previous) =>
        previous.map((registration) =>
          registration._id === registrationId
            ? response.registration
            : registration
        )
      );

      setMessage(response.message);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Failed to cancel registration."
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setCancellingId(null);
    }
  };

  const getEvent = (registration: Registration): Event | null => {
    return typeof registration.event === "string"
      ? null
      : registration.event;
  };

    if (loading) {
    return (
      <section className="my-registrations">
        <div className="registrations-loading">
          <div className="loading-spinner"></div>
          <p>Loading your registrations...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="my-registrations">
      <div className="registrations-header">
        <div>
          <h2>My Registrations</h2>
          <p>View and manage the events you have registered for.</p>
        </div>

        <span className="registration-count">
          {registrations.filter((r) => r.status === "registered").length} Active
        </span>
      </div>

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="empty-registrations">
          <div className="empty-icon">📅</div>
          <h3>No registrations yet</h3>
          <p>
            You haven't registered for any events. Explore upcoming
            events and find something interesting!
          </p>
        </div>
      ) : (
        <div className="registration-list">
          {registrations.map((registration) => {
            const event = getEvent(registration);

            return (
              <article
                className="registration-card"
                key={registration._id}
              >
                <div className="registration-card-header">
                  <div>
                    <h3>
                      {event?.title || "Event details unavailable"}
                    </h3>
                    {event && (
                      <span className="event-category">
                        {event.category}
                      </span>
                    )}
                  </div>

                  <span
                    className={`status-badge ${
                      registration.status === "registered"
                        ? "status-active"
                        : "status-cancelled"
                    }`}
                  >
                    {registration.status}
                  </span>
                </div>

                {event && (
                  <div className="registration-details">
                    <div className="registration-detail">
                      <span className="detail-icon">📅</span>
                      <div>
                        <small>Date & Time</small>
                        <p>
                          {new Date(event.eventDate).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="registration-detail">
                      <span className="detail-icon">📍</span>
                      <div>
                        <small>Venue</small>
                        <p>{event.venue}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="registration-card-footer">
                  <div className="attendance-info">
                    <span>Attendance</span>
                    <strong className={`attendance-${registration.attendanceStatus}`}>
                      {registration.attendanceStatus.replace("-", " ")}
                    </strong>
                  </div>

                  {registration.status === "registered" && (
                    <button
                      className="cancel-button"
                      disabled={cancellingId === registration._id}
                      onClick={() => handleCancel(registration._id)}
                    >
                      {cancellingId === registration._id
                        ? "Cancelling..."
                        : "Cancel Registration"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default MyRegistrations;
