
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import Login from "../pages/auth/Login";
import HomePage from "../pages/common/HomePage";
import Register from "../pages/auth/Register";
import DashboardLayout from "../components/layout/DashboardLayout";
import StudentDashboard from "../pages/student/StudentDashboard";
import MyRegistrations from "../pages/student/MyRegistrations";
import OrganizerDashboard from "../pages/organizer/OrganizerDashboard";
import CreateEvent from "../pages/organizer/CreateEvent";
import MyEvents from "../pages/organizer/MyEvents";
import OrganizerParticipants from "../pages/organizer/OrganizerParticipants";
import AdminDashboard from "../pages/admin/AdminDashboard";
import PendingEvents from "../pages/admin/PendingEvents";
import ManageEvents from "../pages/admin/ManageEvents";
const DashboardHome = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-welcome">
      <h1>Hello, {user?.name}!</h1>
      <p>
        Welcome to your CampusEvents {user?.role} dashboard.
      </p>
    </div>
  );
};

const RoleLayout = ({ role }: { role: string }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <DashboardLayout />;
};

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  const homePath = isAuthenticated && user
    ? `/${user.role}/dashboard`
    : "/";

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated && user
            ? <Navigate to={homePath} replace />
            : <HomePage />
        }
      />

      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={homePath} replace />
            : <Login />
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated
            ? <Navigate to={homePath} replace />
            : <Register />
        }
      />

      {/* Student routes */}
      <Route
        path="/student"
        element={<RoleLayout role="student" />}
      >
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="events" element={<DashboardHome />} />
        <Route path="registrations" element={<MyRegistrations />} />
      </Route>

      {/* Organizer routes */}
      <Route
        path="/organizer"
        element={<RoleLayout role="organizer" />}
      >
        <Route path="dashboard" element={<OrganizerDashboard  />} />
        <Route path="events" element={<MyEvents />} />
        <Route path="events/create" element={<CreateEvent />} />
        <Route path="participants" element={<OrganizerParticipants />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={<RoleLayout role="admin" />}
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="events/pending" element={<PendingEvents />} />
        <Route path="events" element={<ManageEvents />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};

export default AppRoutes;
