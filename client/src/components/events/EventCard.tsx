
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { Event } from "../../types";

interface EventCardProps {
  event: Event;
  onRegister?: (eventId: string) => void;
  isRegistered?: boolean;
  isLoading?: boolean;
}

const EventCard = ({
  event,
  onRegister,
  isRegistered = false,
  isLoading = false,
}: EventCardProps) => {
  const formattedDate = new Date(event.eventDate).toLocaleDateString(
    "en-CA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const isPastEvent = new Date(event.eventDate) <= new Date();

  return (
    <article className="event-card">
      <div className="event-card-top">
        <span className="event-category">{event.category}</span>
        <span className="event-status">{event.status}</span>
      </div>

      <h3>{event.title}</h3>

      <p className="event-description">{event.description}</p>

      <div className="event-details">
        <div>
          <CalendarDays size={17} />
          <span>{formattedDate}</span>
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

      {onRegister && (
        <button
          className="event-register-button"
          disabled={isRegistered || isPastEvent || isLoading}
          onClick={() => onRegister(event._id)}
        >
          {isLoading
            ? "Registering..."
            : isRegistered
              ? "Already Registered"
              : isPastEvent
                ? "Event Completed"
                : "Register Now"}
        </button>
      )}
    </article>
  );
};

export default EventCard;
