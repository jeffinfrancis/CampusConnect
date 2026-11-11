
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  PlusCircle,
  Users,
  CheckCircle,
  GraduationCap,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const menuItems = {
  student: [
    { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { label: "Browse Events", path: "/student/events", icon: CalendarDays },
    { label: "My Registrations", path: "/student/registrations", icon: ClipboardList },
  ],
  organizer: [
    { label: "Dashboard", path: "/organizer/dashboard", icon: LayoutDashboard },
    { label: "My Events", path: "/organizer/events", icon: CalendarDays },
    { label: "Create Event", path: "/organizer/events/create", icon: PlusCircle },
    { label: "Participants", path: "/organizer/participants", icon: Users },
  ],
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Pending Events", path: "/admin/events/pending", icon: CheckCircle },
    { label: "All Events", path: "/admin/events", icon: CalendarDays },
  ],
};

const Sidebar = () => {
  const { user } = useAuth();

  if (!user) return null;

  const items = menuItems[user.role];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <GraduationCap size={30} />
        <span>CampusConnect</span>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>

        <div>
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-heading">MENU</p>

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        CampusEvents © 2026
      </div>
    </aside>
  );
};

export default Sidebar;
