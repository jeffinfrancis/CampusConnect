import { useState } from "react";
import { Link } from "react-router-dom";
import events, { averageRating } from "../data/events";

const linkButton = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  fontSize: "14px",
};

const actionRow = {
  display: "flex",
  gap: "20px",
  alignItems: "center",
};

const showAllButton = {
  padding: "8px 16px",
  border: "1px solid #b91c1c",
  background: "white",
  color: "#b91c1c",
  borderRadius: "20px",
  cursor: "pointer",
};

function HomePage({ user, wishlist, toggleWishlist }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const categories = ["All", "Academic", "Music", "Sports", "Entertainment", "Other"];
  const today = new Date().toISOString().slice(0, 10);

  const filtered = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || event.category === category;
    return matchesSearch && matchesCategory;
  });

  const upcoming = filtered.filter((event) => event.date >= today);
  const past = filtered.filter((event) => event.date < today);

  const isFiltered = search !== "" || category !== "All";

  function showAll() {
    setSearch("");
    setCategory("All");
  }

  return (
    <div>
      <div className="banner">
        <h1>Find Your Next College Event</h1>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="page">
        <div className="filters">
          {categories.map((cat) => (
            <button
              key={cat}
              className={category === cat ? "active" : ""}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}

          {isFiltered && (
            <button style={showAllButton} onClick={showAll}>
              Show All Events
            </button>
          )}
        </div>

        {filtered.length === 0 && (
          <p>No events match your search. Click "Show All Events" to see everything.</p>
        )}

        {upcoming.length > 0 && <h2>Upcoming Events</h2>}
        <div className="event-list">
          {upcoming.map((event) => (
            <div className="event-card" key={event.id}>
              <img className="event-img" src={event.image} alt={event.title} />
              <div className="event-body">
                <span className="tag">{event.category}</span>
                <h3>{event.title}</h3>
                <p><strong>Date: {event.date} at {event.time}</strong></p>
                <p><strong>Location: {event.location}</strong></p>
                <p>{event.description}</p>

                <div style={actionRow}>
                  <Link className="details-link" to={"/event/" + event.id}>
                    View Details
                  </Link>

                  {user ? (
                    <button
                      className="details-link"
                      style={linkButton}
                      onClick={() => toggleWishlist(event.id)}
                    >
                      {wishlist.includes(event.id) ? "♥ Saved" : "♡ Save"}
                    </button>
                  ) : (
                    <Link className="details-link" to="/login">
                      Sign in to save
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {past.length > 0 && <h2>Past Events</h2>}
        <div className="event-list">
          {past.map((event) => (
            <div className="event-card" key={event.id}>
              <img className="event-img" src={event.image} alt={event.title} />
              <div className="event-body">
                <span className="tag">{event.category}</span>
                <h3>{event.title}</h3>
                <p><strong>Date: {event.date} at {event.time}</strong></p>
                <p><strong>Overall Rating: {averageRating(event.reviews)}</strong></p>
                <Link className="details-link" to={"/event/" + event.id}>
                  See Reviews
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HomePage;