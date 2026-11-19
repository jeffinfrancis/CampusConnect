import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import events from "../data/events.js";

const categories = ["Academic", "Music", "Sports", "Entertainment", "Other"];

function CreatePage({ user }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Academic");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

  if (!user) {
    return (
      <div className="page">
        <h2>Please sign in first</h2>
        <p>You need an account to create an event.</p>
        <Link to="/login" className="details-link">Sign In / Register</Link>
      </div>
    );
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    events.push({
      id: Date.now(),
      title: title,
      category: category,
      date: date,
      time: time,
      location: location,
      description: description,
      image: image || "/images/default.webp",
    });
    navigate("/");
  }

  return (
    <div className="page">
      <h1>Create an Event</h1>
      <form className="form-box" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Time (example: 6:00 PM)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <textarea
          rows="4"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label>Event picture (optional):</label>
        <input type="file" accept="image/*" onChange={handleImage} />
        {image && <img src={image} alt="Preview" className="preview" />}

        <button type="submit">Post Event</button>
      </form>
    </div>
  );
}

export default CreatePage;