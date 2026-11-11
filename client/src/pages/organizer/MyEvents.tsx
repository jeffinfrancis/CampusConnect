
import { useEffect, useMemo, useState, type FormEvent } from "react";
import axios from "axios";
import {
  CalendarDays,
  MapPin,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getMyEvents,
  updateEvent,
  deleteEvent,
  type UpdateEventData,
} from "../../services/eventService";

import type { Event } from "../../types";

import "./MyEvents.css";

type EventStatus = Event["status"];
type StatusFilter = "all" | EventStatus;

interface EditFormData {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  venue: string;
  capacity: string;
}

const toLocalDateTime = (date: string) => {
  const value = new Date(date);
  const offset = value.getTimezoneOffset() * 60000;

  return new Date(value.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const MyEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyEvents();
      setEvents(response.events);
    } catch (err) {
      console.error("Failed to fetch organizer events:", err);
      setError("Unable to load your events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const openEditModal = (event: Event) => {
    setError("");
    setMessage("");
    setEditingEvent(event);

    setFormData({
      title: event.title,
      description: event.description,
      category: event.category,
      eventDate: toLocalDateTime(event.eventDate),
      venue: event.venue,
      capacity: String(event.capacity),
    });
  };

  const closeEditModal = () => {
    if (saving) return;

    setEditingEvent(null);
    setFormData(null);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) =>
      previous ? { ...previous, [name]: value } : previous
    );
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingEvent || !formData) return;

    setError("");
    setMessage("");

    const eventDate = new Date(formData.eventDate);

    if (Number.isNaN(eventDate.getTime()) || eventDate.getTime() <= Date.now()) {
      setError("Please select a future event date and time.");
      return;
    }

    const capacity = Number(formData.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    const eventData: UpdateEventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      eventDate: eventDate.toISOString(),
      venue: formData.venue.trim(),
      capacity,
    };

    try {
      setSaving(true);

      const response = await updateEvent(editingEvent._id, eventData);

      setEvents((previous) =>
        previous.map((event) =>
          event._id === editingEvent._id
            ? response.event
            : event
        )
      );

      setEditingEvent(null);
      setFormData(null);

      setMessage(
        response.message ||
        "Event updated successfully. It may require admin approval again."
      );
    } catch (err) {
      console.error("Failed to update event:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          "Unable to update event. Please try again."
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event: Event) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.title}"? This will also delete its registrations.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteEvent(event._id);

      setEvents((previous) =>
        previous.filter((item) => item._id !== event._id)
      );

      setMessage("Event deleted successfully.");
    } catch (err) {
      console.error("Failed to delete event:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          "Unable to delete event. Please try again."
        );
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const getStatusLabel = (status: EventStatus) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "pending":
        return "Pending Approval";
      case "rejected":
        return "Rejected";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getStatusDescription = (status: EventStatus) => {
    switch (status) {
      case "approved":
        return "This event is approved and can appear on the public homepage.";
      case "pending":
        return "This event is waiting for an administrator to review it.";
      case "rejected":
        return "This event was rejected. You can edit and resubmit it for review.";
      case "cancelled":
        return "This event has been cancelled.";
      default:
        return "";
    }
  };

  const countByStatus = (status: EventStatus) =>
    events.filter((event) => event.status === status).length;

  return (
    <div className="my-events-page">
      <div className="my-events-header">
        <div>
          <span className="my-events-label">ORGANIZER PORTAL</span>
          <h1>My Events</h1>
          <p>Manage, update, and track the events you have created.</p>
        </div>

        <Link
          to="/organizer/events/create"
          className="my-events-create-button"
        >
          <Plus size={18} />
          Create Event
        </Link>
      </div>

      <div className="my-events-summary">
        <div className="my-events-summary-card">
          <span>Total Events</span>
          <strong>{events.length}</strong>
        </div>

        <div className="my-events-summary-card approved">
          <span>Approved</span>
          <strong>{countByStatus("approved")}</strong>
        </div>

        <div className="my-events-summary-card pending">
          <span>Pending</span>
          <strong>{countByStatus("pending")}</strong>
        </div>

        <div className="my-events-summary-card rejected">
          <span>Rejected</span>
          <strong>{countByStatus("rejected")}</strong>
        </div>
      </div>

      {error && !editingEvent && (
        <div className="my-events-alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="my-events-alert success">
          {message}
        </div>
      )}

      <div className="my-events-toolbar">
        <div className="my-events-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search events by title, category, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as StatusFilter)
          }
          aria-label="Filter events by status"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          type="button"
          className="my-events-refresh"
          onClick={fetchEvents}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="my-events-empty">Loading your events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="my-events-empty">
          <CalendarDays size={42} />
          <h3>
            {events.length === 0
              ? "You haven't created any events yet"
              : "No matching events found"}
          </h3>
          <p>
            {events.length === 0
              ? "Create your first event to get started."
              : "Try changing your search or status filter."}
          </p>

          {events.length === 0 && (
            <Link
              to="/organizer/events/create"
              className="my-events-create-button"
            >
              <Plus size={17} />
              Create Your First Event
            </Link>
          )}
        </div>
      ) : (
        <div className="my-events-list">
          {filteredEvents.map((event) => (
            <article className="my-event-card" key={event._id}>
              <div className="my-event-main">
                <div className="my-event-icon">
                  <CalendarDays size={23} />
                </div>

                <div className="my-event-information">
                  <div className="my-event-title-row">
                    <h3>{event.title}</h3>
                    <span className={`my-event-status ${event.status}`}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>

                  <span className="my-event-category">
                    {event.category}
                  </span>

                  <p className="my-event-description">
                    {event.description}
                  </p>

                  <div className="my-event-details">
                    <span>
                      <CalendarDays size={15} />
                      {formatDate(event.eventDate)}
                    </span>

                    <span>
                      <MapPin size={15} />
                      {event.venue}
                    </span>

                    <span>
                      <Users size={15} />
                      Capacity: {event.capacity}
                    </span>
                  </div>

                  <p className="my-event-status-description">
                    {getStatusDescription(event.status)}
                  </p>
                </div>
              </div>

              <div className="my-event-actions">
                <button
                  type="button"
                  className="my-event-edit-button"
                  onClick={() => openEditModal(event)}
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  className="my-event-delete-button"
                  onClick={() => handleDelete(event)}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingEvent && formData && (
        <div
          className="edit-event-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div
            className="edit-event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-event-title"
          >
            <div className="edit-event-modal-header">
              <div>
                <h2 id="edit-event-title">Edit Event</h2>
                <p>Update your event information.</p>
              </div>

              <button
                type="button"
                className="edit-event-close"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Close edit form"
              >
                <X size={21} />
              </button>
            </div>

            {error && (
              <div className="my-events-alert error">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdate} className="edit-event-form">
              <label>
                Event Title *
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Description *
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  maxLength={2000}
                  required
                />
              </label>

              <label>
                Category *
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                >
                  <option value="Academic">Academic</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Sports">Sports</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Social">Social</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label>
                Event Date and Time *
                <input
                  type="datetime-local"
                  name="eventDate"
                  min={toLocalDateTime(new Date().toISOString())}
                  value={formData.eventDate}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <label>
                Venue *
                <input
                  name="venue"
                  value={formData.venue}
                  onChange={handleFormChange}
                  maxLength={200}
                  required
                />
              </label>

              <label>
                Capacity *
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  step="1"
                  value={formData.capacity}
                  onChange={handleFormChange}
                  required
                />
              </label>

              <div className="edit-event-approval-note">
                Saving changes may reset this event to Pending Approval.
                An administrator must approve it again before it appears
                publicly.
              </div>

              <div className="edit-event-actions">
                <button
                  type="button"
                  className="edit-event-cancel"
                  onClick={closeEditModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="edit-event-save"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
