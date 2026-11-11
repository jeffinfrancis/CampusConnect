
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  MapPin,
  Users,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList,
} from "lucide-react";

import {
  getPendingEvents,
  updateEventStatus,
} from "../../services/eventService";

import type { Event } from "../../types";
import "./PendingEvents.css";

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong."
    );
  }

  return "Something went wrong. Please try again.";
};

const PendingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPendingEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPendingEvents();
      setEvents(response.events);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPendingEvents();
  }, [fetchPendingEvents]);

  const handleStatusChange = async (
    event: Event,
    status: "approved" | "rejected"
  ) => {
    const action = status === "approved" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${event.title}"?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(event._id);
      setError("");
      setSuccess("");

      const response = await updateEventStatus(event._id, status);

      // Remove the reviewed event from the pending list.
      setEvents((currentEvents) =>
        currentEvents.filter((item) => item._id !== event._id)
      );

      setSuccess(
        response.message ||
          `Event "${event.title}" has been ${status}.`
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="pending-events-loading">
        Loading pending events...
      </div>
    );
  }

  return (
    <div className="pending-events-page">
      <div className="pending-events-header">
        <div>
          <h1>Event Approval Management</h1>
          <p>
            Review event submissions and decide whether they can be
            published on CampusEvents.
          </p>
        </div>

        <button
          className="pending-refresh-btn"
          onClick={() => void fetchPendingEvents()}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="pending-alert error">
          <span>{error}</span>
          <button onClick={() => void fetchPendingEvents()}>
            Try again
          </button>
        </div>
      )}

      {success && (
        <div className="pending-alert success">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="pending-overview">
        <div className="pending-overview-icon">
          <ClipboardList size={25} />
        </div>
        <div>
          <span>Events Awaiting Review</span>
          <strong>{events.length}</strong>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="pending-empty">
          <CheckCircle size={45} />
          <h2>No pending events</h2>
          <p>
            All event submissions have been reviewed. New submissions
            will appear here.
          </p>
          <button onClick={() => void fetchPendingEvents()}>
            <RefreshCw size={16} />
            Check again
          </button>
        </div>
      ) : (
        <div className="pending-events-list">
          {events.map((event) => {
            const organizer =
              typeof event.organizer === "string"
                ? null
                : event.organizer;

            const isUpdating = updatingId === event._id;

            return (
              <article className="pending-event-card" key={event._id}>
                <div className="pending-event-top">
                  <div>
                    <span className="pending-category">
                      {event.category}
                    </span>
                    <h2>{event.title}</h2>
                  </div>

                  <span className="pending-status">
                    <Clock size={14} />
                    Pending
                  </span>
                </div>

                <p className="pending-description">
                  {event.description}
                </p>

                <div className="pending-event-details">
                  <div>
                    <CalendarDays size={17} />
                    <span>{formatDate(event.eventDate)}</span>
                  </div>

                  <div>
                    <MapPin size={17} />
                    <span>{event.venue}</span>
                  </div>

                  <div>
                    <Users size={17} />
                    <span>Capacity: {event.capacity}</span>
                  </div>
                </div>

                <div className="pending-organizer">
                  <strong>Submitted by</strong>
                  <span>{organizer?.name || "Organizer details unavailable"}</span>
                  {organizer?.email && (
                    <span>{organizer.email}</span>
                  )}
                </div>

                <div className="pending-event-actions">
                  <button
                    className="pending-approve-btn"
                    onClick={() =>
                      void handleStatusChange(event, "approved")
                    }
                    disabled={isUpdating}
                  >
                    <CheckCircle size={17} />
                    {isUpdating ? "Updating..." : "Approve"}
                  </button>

                  <button
                    className="pending-reject-btn"
                    onClick={() =>
                      void handleStatusChange(event, "rejected")
                    }
                    disabled={isUpdating}
                  >
                    <XCircle size={17} />
                    {isUpdating ? "Updating..." : "Reject"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingEvents;
