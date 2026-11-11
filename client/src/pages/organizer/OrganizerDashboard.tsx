
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Plus,
  MapPin,
  RefreshCw,
} from "lucide-react";

import { getMyEvents } from "../../services/eventService";
import type { Event } from "../../types";

import "./OrganizerDashboard.css";

const OrganizerDashboard = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyEvents();
      setEvents(response.events);
    } catch (err) {
      console.error("Failed to load organizer events:", err);
      setError("Unable to load your events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const totalEvents = events.length;
  const approvedEvents = events.filter(
    (event) => event.status === "approved"
  ).length;
  const pendingEvents = events.filter(
    (event) => event.status === "pending"
  ).length;
  const rejectedEvents = events.filter(
    (event) => event.status === "rejected"
  ).length;

  const recentEvents = events.slice(0, 4);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusClass = (status: Event["status"]) => {
    return `event-status ${status}`;
  };

  return (
    <div className="organizer-dashboard">
      <div className="organizer-welcome">
        <div>
          <span className="welcome-label">ORGANIZER PORTAL</span>
          <h1>Organizer Dashboard</h1>
          <p>
            Manage your campus events, track approvals, and connect
            with students.
          </p>
        </div>

        <Link to="/organizer/events/create" className="create-event-button">
          <Plus size={18} />
          Create Event
        </Link>
      </div>

      <div className="organizer-section-heading">
        <div>
          <h2>Event Overview</h2>
          <p>Here is a summary of the events you have created.</p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={fetchEvents}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <div className="organizer-stats-grid">
        <div className="organizer-stat-card">
          <div className="stat-icon total">
            <CalendarDays size={22} />
          </div>
          <div>
            <p>Total Events</p>
            <h3>{loading ? "—" : totalEvents}</h3>
          </div>
        </div>

        <div className="organizer-stat-card">
          <div className="stat-icon approved">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p>Approved</p>
            <h3>{loading ? "—" : approvedEvents}</h3>
          </div>
        </div>

        <div className="organizer-stat-card">
          <div className="stat-icon pending">
            <Clock3 size={22} />
          </div>
          <div>
            <p>Pending Approval</p>
            <h3>{loading ? "—" : pendingEvents}</h3>
          </div>
        </div>

        <div className="organizer-stat-card">
          <div className="stat-icon rejected">
            <XCircle size={22} />
          </div>
          <div>
            <p>Rejected</p>
            <h3>{loading ? "—" : rejectedEvents}</h3>
          </div>
        </div>
      </div>

      <section className="recent-events-section">
        <div className="recent-events-heading">
          <div>
            <h2>My Recent Events</h2>
            <p>Recently created events and their approval status.</p>
          </div>

          <Link to="/organizer/events" className="view-all-link">
            View All Events
          </Link>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            Loading your events...
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="empty-events">
            <CalendarDays size={42} />
            <h3>No events created yet</h3>
            <p>
              Create your first campus event to get started.
            </p>
            <Link
              to="/organizer/events/create"
              className="create-first-event"
            >
              <Plus size={17} />
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="recent-events-list">
            {recentEvents.map((event) => (
              <div className="recent-event-card" key={event._id}>
                <div className="recent-event-main">
                  <div className="recent-event-icon">
                    <CalendarDays size={21} />
                  </div>

                  <div className="recent-event-info">
                    <h3>{event.title}</h3>
                    <span>{event.category}</span>

                    <div className="recent-event-details">
                      <span>
                        <CalendarDays size={14} />
                        {formatDate(event.eventDate)}
                      </span>

                      <span>
                        <MapPin size={14} />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={getStatusClass(event.status)}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default OrganizerDashboard;
