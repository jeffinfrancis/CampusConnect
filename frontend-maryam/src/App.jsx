import { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import DetailsPage from "./pages/DetailsPage";
import CreatePage from "./pages/CreatePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  const [user, setUser] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [registrations, setRegistrations] = useState([]);

  function toggleWishlist(id) {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((item) => item !== id));
    } else {
      setWishlist([...wishlist, id]);
    }
  }

  function toggleReminder(id) {
    if (reminders.includes(id)) {
      setReminders(reminders.filter((item) => item !== id));
    } else {
      setReminders([...reminders, id]);
    }
  }

  function toggleRegistration(id) {
    if (registrations.includes(id)) {
      setRegistrations(registrations.filter((item) => item !== id));
    } else {
      setRegistrations([...registrations, id]);
    }
  }

  return (
    <>
      <nav className="navbar">
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "white",
            textDecoration: "none",
          }}
        >
          <img
            src="/images/logo.png"
            alt="CampusConnect logo"
            style={{ width: "50px", height: "50px", objectFit: "contain" }}
          />
          <h2>CampusConnect</h2>
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/dashboard">Calendar</Link>
          <Link to="/create">Create Event</Link>
          <Link to="/profile">My Events</Link>
          {user ? (
            <button onClick={() => setUser(null)}>Sign Out</button>
          ) : (
            <Link to="/login">Sign In</Link>
          )}
        </div>
      </nav>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage user={user} wishlist={wishlist} toggleWishlist={toggleWishlist} />
          }
        />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/event/:id"
          element={
            <DetailsPage
              user={user}
              wishlist={wishlist}
              reminders={reminders}
              registrations={registrations}
              toggleWishlist={toggleWishlist}
              toggleReminder={toggleReminder}
              toggleRegistration={toggleRegistration}
            />
          }
        />
        <Route path="/create" element={<CreatePage user={user} />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser} />} />
        <Route
          path="/profile"
          element={
            <ProfilePage
              user={user}
              wishlist={wishlist}
              reminders={reminders}
              registrations={registrations}
              toggleWishlist={toggleWishlist}
              toggleReminder={toggleReminder}
              toggleRegistration={toggleRegistration}
            />
          }
        />
      </Routes>
    </>
  );
}

export default App;