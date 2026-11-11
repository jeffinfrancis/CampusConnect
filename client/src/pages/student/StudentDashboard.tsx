
import { CalendarDays, ClipboardList, UserRound } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import EventList from "../../components/events/EventList";

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="student-dashboard">
      <section className="student-welcome">
        <div>
          <h1>Welcome back, {user?.name}!</h1>
          <p>
            Discover campus events, explore new activities,
            and connect with your college community.
          </p>
        </div>
      </section>

      <section className="student-stats">
        <div className="student-stat-card">
          <div className="stat-icon blue">
            <CalendarDays size={24} />
          </div>
          <div>
            <h3>Explore Events</h3>
            <p>Find upcoming campus events.</p>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="stat-icon green">
            <ClipboardList size={24} />
          </div>
          <div>
            <h3>My Registrations</h3>
            <p>Keep track of your registrations.</p>
          </div>
        </div>

        <div className="student-stat-card">
          <div className="stat-icon purple">
            <UserRound size={24} />
          </div>
          <div>
            <h3>My Account</h3>
            <p>Manage your student profile.</p>
          </div>
        </div>
      </section>

      <section className="student-events-section">
        <div className="section-heading">
          <div>
            <h2>Discover Campus Events</h2>
            <p>Explore the latest approved events.</p>
          </div>
        </div>

        <EventList />
      </section>
    </div>
  );
};

export default StudentDashboard;
