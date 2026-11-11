
import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  CalendarDays,
  ArrowLeft,
  Plus,
  MapPin,
  Users,
  FileText,
} from "lucide-react";

import {
  createEvent,
  type CreateEventData,
} from "../../services/eventService";

import "./CreateEvent.css";

interface EventFormData {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  venue: string;
  capacity: string;
}

const initialFormData: EventFormData = {
  title: "",
  description: "",
  category: "",
  eventDate: "",
  venue: "",
  capacity: "50",
};

const getLocalDateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

const CreateEvent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] =
    useState<EventFormData>(initialFormData);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (new Date(formData.eventDate).getTime() <= Date.now()) {
      setError("Please select a future event date and time.");
      return;
    }

    const capacity = Number(formData.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    const eventData: CreateEventData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      eventDate: new Date(formData.eventDate).toISOString(),
      venue: formData.venue.trim(),
      capacity,
    };

    try {
      setLoading(true);

      const response = await createEvent(eventData);

      setSuccess(
        response.message ||
        "Event created successfully. Awaiting admin approval."
      );

      setFormData(initialFormData);
    } catch (err) {
      console.error("Event creation failed:", err);

      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
          "Unable to create event. Please try again."
        );
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-event-page">
      <div className="create-event-header">
        <div>
          <Link to="/organizer/dashboard" className="back-dashboard-link">
            <ArrowLeft size={17} />
            Back to Dashboard
          </Link>

          <h1>Create New Event</h1>
          <p>
            Share an exciting campus event with students.
          </p>
        </div>
      </div>

      <div className="create-event-card">
        <div className="create-event-card-heading">
          <div className="create-event-heading-icon">
            <CalendarDays size={25} />
          </div>

          <div>
            <h2>Event Information</h2>
            <p>Complete the details below to create your event.</p>
          </div>
        </div>

        {error && (
          <div className="create-event-alert error-alert">
            {error}
          </div>
        )}

        {success && (
          <div className="create-event-alert success-alert">
            {success}
            <p>
              Your event has been submitted and is awaiting admin approval.
            </p>
            <button
              type="button"
              onClick={() => navigate("/organizer/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Enter event title"
              value={formData.title}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <FileText size={16} />
              Event Description *
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your event, activities, and what participants can expect..."
              value={formData.description}
              onChange={handleChange}
              rows={5}
              maxLength={2000}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Event Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              <option value="Academic">Academic</option>
              <option value="Workshop">Workshop</option>
              <option value="Sports">Sports</option>
              <option value="Cultural">Cultural</option>
              <option value="Social">Social</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="eventDate">
                <CalendarDays size={16} />
                Event Date and Time *
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="datetime-local"
                min={getLocalDateTime()}
                value={formData.eventDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="capacity">
                <Users size={16} />
                Maximum Capacity *
              </label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                step="1"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="venue">
              <MapPin size={16} />
              Event Venue *
            </label>
            <input
              id="venue"
              name="venue"
              type="text"
              placeholder="Enter event location"
              value={formData.venue}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>

          <div className="event-approval-note">
            <strong>Admin approval required</strong>
            <p>
              After submission, your event will have Pending status.
              It will appear on the public homepage after an administrator
              approves it.
            </p>
          </div>

          <div className="create-event-actions">
            <button
              type="button"
              className="cancel-event-button"
              onClick={() => navigate("/organizer/dashboard")}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-event-button"
              disabled={loading}
            >
              <Plus size={18} />
              {loading ? "Creating Event..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
