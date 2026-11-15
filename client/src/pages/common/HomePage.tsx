
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  ArrowRight,
  Sparkles,GraduationCap 
} from "lucide-react";

import { getAllEvents } from "../../services/eventService";
import { useAuth } from "../../context/AuthContext";
import type { Event } from "../../types";

import "./HomePage.css";

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const dashboardPath = user
    ? `/${user.role}/dashboard`
    : "/login";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getAllEvents();
        setEvents(response.events.slice(0, 6));
      } catch (error) {
        console.error("Unable to load events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="homepage">
      {/* Navigation */}
      <nav className="home-navbar">
        <Link to="/" className="home-logo">
        <img src="/logo.png" alt="CampusConnect Logo" width={75} height={75} />
          <span>CampusConnect</span>
        </Link>

        <div className="home-nav-links">
          <a href="#home">Home</a>
          <a href="#events">Explore Events</a>

          {isAuthenticated ? (
            <Link to={dashboardPath} className="nav-primary-button">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="nav-login">
                Login
              </Link>
              <Link to="/register" className="nav-primary-button">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="home-hero" id="home">
        <div className="hero-content">
          <span className="hero-label">
            <Sparkles size={16} />
            YOUR CAMPUS, YOUR EXPERIENCES
          </span>

          <h1>
            Discover Events.
            <br />
            <span>Create Memories.</span>
          </h1>

          <p>
            Explore exciting campus events, connect with fellow students,
            and never miss an opportunity to learn, participate, and have fun.
          </p>

          <div className="hero-actions">
            <a href="#events" className="hero-primary-button">
              Explore Events <ArrowRight size={18} />
            </a>

            {!isAuthenticated && (
              <Link to="/register" className="hero-secondary-button">
                Join CampusEvents
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="home-events-section" id="events">
        <div className="home-section-heading">
          <div>
            <span className="section-label">WHAT'S HAPPENING</span>
            <h2>Upcoming Campus Events</h2>
            <p>
              Find events that inspire you, bring people together,
              and make campus life exciting.
            </p>
          </div>

          <span className="events-count">
            {events.length} Featured Events
          </span>
        </div>

        {loading ? (
          <p className="home-loading">Loading upcoming events...</p>
        ) : events.length === 0 ? (
          <div className="home-empty-events">
            <CalendarDays size={42} />
            <h3>No upcoming events yet</h3>
            <p>Check back soon for exciting campus activities!</p>
          </div>
        ) : (
          <div className="home-events-grid">
            {events.map((event) => (
              <article className="home-event-card" key={event._id}>
                <div className="event-card-category">
                  {event.category}
                </div>

                <h3>{event.title}</h3>

                <p className="event-description">
                  {event.description}
                </p>

                <div className="home-event-details">
                  <span>
                    <CalendarDays size={15} />
                    {formatDate(event.eventDate)}
                  </span>

                  <span>
                    <MapPin size={15} />
                    {event.venue}
                  </span>
                </div>

                <div className="event-card-footer">
                  <span>{event.capacity} seats available (capacity)</span>

                  <Link to={isAuthenticated ? dashboardPath : "/login"}>
                    View Events <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action */}
      {!isAuthenticated && (
        <section className="home-cta">
          <h2>Make Your Campus Experience Count!</h2>
          <p>
            Join CampusEvents and discover what's happening around you.
          </p>
          <Link to="/register" className="cta-button">
            Create Your Account <ArrowRight size={18} />
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer className="home-footer">
        <p>
          © {new Date().getFullYear()} CampusEvents. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
