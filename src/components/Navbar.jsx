

import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();

    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2>GameSphere</h2>

      <div>
        <Link to="/">Home</Link>

        <Link to="/leaderboard">
          Leaderboard
        </Link>

        <Link to="/profile">
          Profile
        </Link>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;