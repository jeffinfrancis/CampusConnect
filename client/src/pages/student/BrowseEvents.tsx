
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllEvents } from "../../services/eventService";
import type { Event } from "../../types";
import "./BrowseEvents.css";
import { RefreshCw } from "lucide-react";

const categories = [
  "All",
  "Academic",
  "Workshop",
  "Sports",
  "Cultural",
  "Social",
  "Other",
];

const BrowseEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAllEvents();
      setEvents(response.events);
    } catch (err) {
      console.error("Failed to load events:", err);
      setError("Unable to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return events
      .filter((event) => {
        const matchesSearch =
          event.title.toLowerCase().includes(search) ||
          event.description.toLowerCase().includes(search) ||
          event.venue.toLowerCase().includes(search);

        const matchesCategory =
          selectedCategory === "All" ||
          event.category === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort(
        (a, b) =>
          new Date(a.eventDate).getTime() -
          new Date(b.eventDate).getTime()
      );
  }, [events, searchTerm, selectedCategory]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="browse-events-page">
        <div className="browse-message">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="browse-events-page">
      <div className="browse-events-header">
        <div>
          <h1>Browse Events</h1>
          <p>Discover events happening around your campus.</p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={fetchEvents}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && <div className="browse-error">{error}</div>}

      <div className="browse-filters">
        <input
          type="text"
          placeholder="Search events by title, description, or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All Categories" : category}
            </option>
          ))}
        </select>
      </div>

      <div className="browse-results-info">
        <span>
          {filteredEvents.length} event
          {filteredEvents.length !== 1 ? "s" : ""} found
        </span>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="browse-empty">
          <h3>No events found</h3>
          <p>
            Try changing your search term or selecting another category.
          </p>
        </div>
      ) : (
        <div className="browse-events-grid">
          {filteredEvents.map((event) => (
            <article className="browse-event-card" key={event._id}>
              <div className="browse-event-card-top">
                <span className="browse-category">
                  {event.category}
                </span>
              </div>

              <h3>{event.title}</h3>

              <p className="browse-event-description">
                {event.description}
              </p>

              
<div className="browse-event-details">
  <p>
    <strong>Date:</strong> {formatDate(event.eventDate)}
  </p>

  <p>
    <strong>Venue:</strong> {event.venue}
  </p>

  <div className="event-capacity">
    <div className="event-capacity-info">
      <span>Total seats: {event.capacity}</span>
      <span>
        {event.registeredCount} registered
      </span>
    </div>

    <div className="event-capacity-bar">
      <div
        className="event-capacity-progress"
        style={{
          width: `${
            event.capacity > 0
              ? Math.min(
                  100,
                  (event.registeredCount / event.capacity) * 100
                )
              : 0
          }%`,
        }}
      />
    </div>

    <p className="event-seats-remaining">
      {Math.max(
        0,
        event.capacity - event.registeredCount
      )}{" "}
      seats remaining
    </p>
  </div>

  {event.registeredCount >= event.capacity && (
    <span className="event-full-label">
      Event Full – Join Waitlist
    </span>
  )}
</div>


              <Link
                to={`/events/${event._id}`}
                className="browse-view-btn"
              >
                View Details & Register
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseEvents;
