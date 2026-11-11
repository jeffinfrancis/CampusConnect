
import { useEffect, useState } from "react";
import axios from "axios";

import api from "../../services/api";
import {
  registerForEvent,
  getMyRegistrations,
} from "../../services/registrationService";

import type { Event, Registration } from "../../types";
import EventCard from "./EventCard";

const EventList = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch events and existing registrations
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [eventResponse, registrationResponse] = await Promise.all([
        api.get<{ count: number; events: Event[] }>("/events"),
        getMyRegistrations(),
      ]);

      setEvents(eventResponse.data.events);
      setRegistrations(registrationResponse.registrations);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Unable to load events. Please try again."
        );
      } else {
        setError("Something went wrong while loading events.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  // Register for an event
  const handleRegister = async (eventId: string) => {
    try {
      setRegisteringId(eventId);
      setError("");
      setMessage("");

      const response = await registerForEvent(eventId);

      setRegistrations((previous) => [
        response.registration,
        ...previous,
      ]);

      setMessage(response.message);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.message ||
            "Registration failed. Please try again."
        );
      } else {
        setError("Something went wrong during registration.");
      }
    } finally {
      setRegisteringId(null);
    }
  };

  // Check whether the student is already registered
  const isEventRegistered = (eventId: string) => {
    return registrations.some((registration) => {
      const registrationEventId =
        typeof registration.event === "string"
          ? registration.event
          : registration.event?._id;

      return (
        registrationEventId === eventId &&
        registration.status === "registered"
      );
    });
  };

  if (loading) {
    return <div className="event-message">Loading events...</div>;
  }

  if (error && events.length === 0) {
    return (
      <div className="event-error">
        <p>{error}</p>
        <button onClick={() => void fetchData()}>Try Again</button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="event-message">
        <h3>No events available</h3>
        <p>Check back later for upcoming campus events.</p>
      </div>
    );
  }

  return (
    <section className="event-list-section">

      {message && <p className="success-message">{message}</p>}
      {error && <p className="event-error">{error}</p>}

      <div className="event-list">
        {events.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onRegister={handleRegister}
            isRegistered={isEventRegistered(event._id)}
            isLoading={registeringId === event._id}
          />
        ))}
      </div>
    </section>
  );
};

export default EventList;
