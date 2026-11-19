import { Link } from "react-router-dom";
import events from "../data/events";

function ProfilePage({
  user,
  wishlist,
  reminders,
  registrations,
  toggleWishlist,
  toggleReminder,
  toggleRegistration,
}) {
  if (!user) {
    return (
      <div className="page">
        <h1>My Events</h1>
        <p>
          Please <Link to="/login">Sign In</Link> to view your registered and saved events.
        </p>
      </div>
    );
  }

  const registeredEvents = events.filter((e) => registrations.includes(e.id));
  const wishlistEvents = events.filter((e) => wishlist.includes(e.id));
  const reminderEvents = events.filter((e) => reminders.includes(e.id));

  return (
    <div className="page">
      <h1>My Events</h1>
      <p>Signed in as: <strong>{user.email}</strong></p>

      <h2>Registered Events ({registeredEvents.length})</h2>
      {registeredEvents.length === 0 ? (
        <p>You have not registered for any events yet.</p>
      ) : (
        registeredEvents.map((event) => (
          <div key={event.id} style={{ background: "white", padding: "12px", margin: "10px 0", borderRadius: "8px" }}>
            <h3><Link to={"/event/" + event.id}>{event.title}</Link></h3>
            <p><strong>Date: {event.date} at {event.time}</strong></p>
            <p><strong>Location: {event.location}</strong></p>
            <button
              onClick={() => toggleRegistration(event.id)}
              style={{ background: "#dc2626", color: "white", padding: "6px 12px", border: "none", borderRadius: "6px" }}
            >
              Cancel Registration
            </button>
          </div>
        ))
      )}

      <h2 style={{ marginTop: "30px" }}>Saved Events (Wishlist) ({wishlistEvents.length})</h2>
      {wishlistEvents.length === 0 ? (
        <p>No events saved to your wishlist.</p>
      ) : (
        wishlistEvents.map((event) => (
          <div key={event.id} style={{ background: "white", padding: "12px", margin: "10px 0", borderRadius: "8px" }}>
            <h3><Link to={"/event/" + event.id}>{event.title}</Link></h3>
            <p><strong>Date: {event.date} at {event.time}</strong></p>
            <button onClick={() => toggleWishlist(event.id)}>Remove</button>
          </div>
        ))
      )}

      <h2 style={{ marginTop: "30px" }}>Reminders ({reminderEvents.length})</h2>
      {reminderEvents.length === 0 ? (
        <p>No reminders set.</p>
      ) : (
        reminderEvents.map((event) => (
          <div key={event.id} style={{ background: "white", padding: "12px", margin: "10px 0", borderRadius: "8px" }}>
            <h3><Link to={"/event/" + event.id}>{event.title}</Link></h3>
            <p><strong>Date: {event.date} at {event.time}</strong></p>
            <button onClick={() => toggleReminder(event.id)}>Remove Reminder</button>
          </div>
        ))
      )}
    </div>
  );
}

export default ProfilePage;