
import { LogOut } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageTitle =
    location.pathname.split("/").filter(Boolean).pop() || "Dashboard";

  const formattedTitle = pageTitle
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <header className="dashboard-header">
      <div>
        <h2>{formattedTitle}</h2>
        <p>Welcome back, {user?.name}</p>
      </div>

      <button className="logout-button" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </header>
  );
};

export default Header;
