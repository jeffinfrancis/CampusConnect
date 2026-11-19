import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import events, { averageRating } from "../data/events";

function DetailsPage({
  user,
  wishlist,
  reminders,
  registrations,
  toggleWishlist,
  toggleReminder,
  toggleRegistration,
}) {
  const { id } = useParams();
  const event = events.find((item) => item.id === Number(id));

  const [reviews, setReviews] = useState(event ? event.reviews || [] : []);
  const [author, setAuthor] = useState("");
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");

  if (!event) {
    return (
      <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 20px" }}>
        <h2>Event not found</h2>
        <Link to="/">Back to Events</Link>
      </div>
    );
  }

  const isSaved = wishlist.includes(event.id);
  const hasReminder = reminders.includes(event.id);
  const isRegistered = registrations.includes(event.id);

  const today = new Date().toISOString().slice(0, 10);
  const isPast = event.date < today;

  const seatsTaken = event.seatsTaken + (isRegistered ? 1 : 0);
  const seatsLeft = event.capacity - seatsTaken;
  const isFull = seatsLeft <= 0 && !isRegistered;

  function handleReviewSubmit(e) {
    e.preventDefault();
    if (!author || !text) return;

    const newReview = {
      id: Date.now(),
      author: author,
      stars: Number(stars),
      text: text,
    };

    setReviews([...reviews, newReview]);
    setAuthor("");
    setText("");
    setStars(5);
  }

  return (
    <div style={{ maxWidth: "800px", margin: "30px auto", padding: "0 20px" }}>
      <Link to="/">← Back to Events</Link>

      <img
        src={event.image}
        alt={event.title}
        style={{ width: "100%", height: "320px", objectFit: "cover", borderRadius: "12px", marginTop: "15px" }}
      />

      <h1>{event.title}</h1>
      <p style={{ color: "#2563eb", fontWeight: "bold" }}>{event.category}</p>
      <p><strong>Date: {event.date} at {event.time}</strong></p>
      <p><strong>Location: {event.location}</strong></p>

      <div style={{ margin: "15px 0", padding: "12px", background: "#e0f2fe", borderRadius: "8px" }}>
        <strong>Registration: </strong>
        {isPast ? (
          <span>This event has already ended.</span>
        ) : (
          <>
            <span>{seatsLeft} of {event.capacity} seats remaining</span>
            <div style={{ marginTop: "8px" }}>
              {!user ? (
                <p style={{ margin: 0 }}>
                  <Link to="/login">Sign in</Link> to register for this event.
                </p>
              ) : isRegistered ? (
                <button
                  onClick={() => toggleRegistration(event.id)}
                  style={{ background: "#dc2626", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px" }}
                >
                  Cancel Registration
                </button>
              ) : isFull ? (
                <button disabled style={{ padding: "8px 14px" }}>Sold Out</button>
              ) : (
                <button
                  onClick={() => toggleRegistration(event.id)}
                  style={{ background: "#16a34a", color: "white", padding: "8px 14px", border: "none", borderRadius: "6px" }}
                >
                  Register for Event
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
        {user ? (
          <>
            <button onClick={() => toggleWishlist(event.id)}>
              {isSaved ? "♥ Saved to Wishlist" : "♡ Save to Wishlist"}
            </button>
            <button onClick={() => toggleReminder(event.id)}>
              {hasReminder ? "🔔 Reminder On" : "🔔 Set Reminder"}
            </button>
          </>
        ) : (
          <p>
            <Link to="/login">Sign in</Link> to save this event or set a reminder.
          </p>
        )}
      </div>

      <p>{event.description}</p>

      <hr style={{ margin: "30px 0" }} />

      <h3>Overall Rating: {averageRating(reviews)}</h3>

      <div>
        {reviews.length === 0 ? (
          <p>No reviews yet. Be the first to leave one!</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} style={{ borderBottom: "1px solid #ccc", padding: "8px 0" }}>
              <strong>{r.author}</strong> - {"★".repeat(r.stars)}
              <p style={{ margin: "4px 0" }}>{r.text}</p>
            </div>
          ))
        )}
      </div>

      <h4 style={{ marginTop: "25px" }}>Leave a Review</h4>
      <form onSubmit={handleReviewSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "400px" }}>
        <input
          type="text"
          placeholder="Your Name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <select value={stars} onChange={(e) => setStars(e.target.value)}>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <textarea
          placeholder="Your Review"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="3"
        />
        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
}

export default DetailsPage;