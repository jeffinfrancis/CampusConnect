
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays,
  Search,
  RefreshCw,
  MapPin,
  Users,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";

import {
  getAllEventsAdmin,
  updateEventStatus,
  deleteEvent,
} from "../../services/eventService";

import type { Event } from "../../types";
import "./ManageEvents.css";

type EventStatus = "all" | "pending" | "approved" | "rejected" | "cancelled";

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

const ManageEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus>("all");

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllEventsAdmin();
      setEvents(response.events);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return events.filter((event) => {
      const organizer =
        typeof event.organizer === "string"
          ? ""
          : `${event.organizer.name} ${event.organizer.email}`;

      const matchesSearch =
        !search ||
        event.title.toLowerCase().includes(search) ||
        event.category.toLowerCase().includes(search) ||
        event.venue.toLowerCase().includes(search) ||
        organizer.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const statusCounts = useMemo(
    () => ({
      all: events.length,
      pending: events.filter((event) => event.status === "pending").length,
      approved: events.filter((event) => event.status === "approved").length,
      rejected: events.filter((event) => event.status === "rejected").length,
      cancelled: events.filter((event) => event.status === "cancelled").length,
    }),
    [events]
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const handleStatusChange = async (
    event: Event,
    status: "approved" | "rejected"
  ) => {
    const action = status === "approved" ? "approve" : "reject";

    if (!window.confirm(`Are you sure you want to ${action} "${event.title}"?`)) {
      return;
    }

    try {
      setUpdatingId(event._id);
      setError("");
      setSuccess("");

      const response = await updateEventStatus(event._id, status);

      setEvents((current) =>
        current.map((item) =>
          item._id === event._id ? response.event : item
        )
      );

      setSelectedEvent((current) =>
        current?._id === event._id ? response.event : current
      );

      setSuccess(response.message || `Event ${status} successfully.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (event: Event) => {
    const confirmed = window.confirm(
      `Delete "${event.title}" permanently? All registrations for this event will also be deleted.`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(event._id);
      setError("");
      setSuccess("");

      const response = await deleteEvent(event._id);

      setEvents((current) =>
        current.filter((item) => item._id !== event._id)
      );

      setSelectedEvent((current) =>
        current?._id === event._id ? null : current
      );

      setSuccess(response.message || "Event deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  const getOrganizerName = (event: Event) =>
    typeof event.organizer === "string"
      ? "Unknown organizer"
      : event.organizer.name;

  if (loading) {
    return <div className="manage-events-loading">Loading events...</div>;
  }

  return (
    <div className="manage-events-page">
      <div className="manage-events-header">
        <div>
          <h1>Manage All Events</h1>
          <p>View, review, and manage all CampusEvents submissions.</p>
        </div>

        <button
          className="manage-refresh-btn"
          onClick={() => void fetchEvents()}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="manage-alert error">
          <span>{error}</span>
          <button onClick={() => void fetchEvents()}>Try again</button>
        </div>
      )}

      {success && (
        <div className="manage-alert success">
          <CheckCircle size={17} />
          {success}
        </div>
      )}

      <div className="manage-status-summary">
        {(
          ["all", "pending", "approved", "rejected", "cancelled"] as const
        ).map((status) => (
          <button
            key={status}
            className={`manage-summary-card ${
              statusFilter === status ? "active" : ""
            }`}
            onClick={() => setStatusFilter(status)}
          >
            <span>
              {status === "all"
                ? "All Events"
                : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
            </span>
            <strong>{statusCounts[status]}</strong>
          </button>
        ))}
      </div>

      <div className="manage-toolbar">
        <div className="manage-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search title, category, venue, or organizer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EventStatus)}
          aria-label="Filter events by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span className="manage-result-count">
          {filteredEvents.length} event(s)
        </span>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="manage-empty">
          <CalendarDays size={42} />
          <h2>No events found</h2>
          <p>Try changing your search or status filter.</p>
        </div>
      ) : (
        <div className="manage-table-wrapper">
          <table className="manage-events-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Organizer</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEvents.map((event) => {
                const isUpdating = updatingId === event._id;

                return (
                  <tr key={event._id}>
                    <td>
                      <div className="manage-event-title">
                        <strong>{event.title}</strong>
                        <span>{event.category}</span>
                      </div>
                    </td>

                    <td>{getOrganizerName(event)}</td>

                    <td>{formatDate(event.eventDate)}</td>

                    <td>
                      <span className="manage-venue">
                        <MapPin size={14} />
                        {event.venue}
                      </span>
                    </td>

                    <td>
                      <span className="manage-capacity">
                        <Users size={14} />
                        {event.capacity}
                      </span>
                    </td>

                    <td>
                      <span className={`manage-status-badge ${event.status}`}>
                        {event.status}
                      </span>
                    </td>

                    <td>
                      <div className="manage-actions">
                        <button
                          className="manage-view-btn"
                          title="View event details"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Eye size={16} />
                        </button>

                        {event.status === "pending" && (
                          <>
                            <button
                              className="manage-approve-btn"
                              title="Approve event"
                              disabled={isUpdating}
                              onClick={() =>
                                void handleStatusChange(event, "approved")
                              }
                            >
                              <CheckCircle size={16} />
                            </button>

                            <button
                              className="manage-reject-btn"
                              title="Reject event"
                              disabled={isUpdating}
                              onClick={() =>
                                void handleStatusChange(event, "rejected")
                              }
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}

                        <button
                          className="manage-delete-btn"
                          title="Delete event"
                          disabled={isUpdating}
                          onClick={() => void handleDelete(event)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedEvent && (
        <div
          className="manage-modal-overlay"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="manage-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="manage-modal-header">
              <div>
                <span className={`manage-status-badge ${selectedEvent.status}`}>
                  {selectedEvent.status}
                </span>
                <h2 id="manage-modal-title">{selectedEvent.title}</h2>
              </div>

              <button
                className="manage-modal-close"
                onClick={() => setSelectedEvent(null)}
                aria-label="Close event details"
              >
                ×
              </button>
            </div>

            <p className="manage-modal-description">
              {selectedEvent.description}
            </p>

            <div className="manage-modal-details">
              <p><strong>Category:</strong> {selectedEvent.category}</p>
              <p><strong>Date:</strong> {formatDate(selectedEvent.eventDate)}</p>
              <p><strong>Venue:</strong> {selectedEvent.venue}</p>
              <p><strong>Capacity:</strong> {selectedEvent.capacity}</p>
              <p><strong>Organizer:</strong> {getOrganizerName(selectedEvent)}</p>
              {typeof selectedEvent.organizer !== "string" && (
                <p><strong>Email:</strong> {selectedEvent.organizer.email}</p>
              )}
            </div>

            {selectedEvent.status === "pending" && (
              <div className="manage-modal-actions">
                <button
                  className="manage-approve-btn"
                  disabled={updatingId === selectedEvent._id}
                  onClick={() =>
                    void handleStatusChange(selectedEvent, "approved")
                  }
                >
                  <CheckCircle size={16} /> Approve
                </button>

                <button
                  className="manage-reject-btn"
                  disabled={updatingId === selectedEvent._id}
                  onClick={() =>
                    void handleStatusChange(selectedEvent, "rejected")
                  }
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;
