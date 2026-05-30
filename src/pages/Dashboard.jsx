import { useNavigate } from "react-router-dom";
import { useContext } from "react";

import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  return (
    <>
      <Navbar />

      <div className="dashboard">

        <div className="dashboard-header">
          <h1>
            Welcome Back,
            <span className="username">
              {" "}
              {user?.username || "Player"}
            </span>
          </h1>

          <p>
            Create rooms, join friends and
            compete in GameSphere.
          </p>
        </div>

        <div className="dashboard-buttons">

          <button
            className="dashboard-btn"
            onClick={() =>
              navigate("/create-room")
            }
          >
            🎮 Create Room
          </button>

          <button
            className="dashboard-btn"
            onClick={() =>
              navigate("/join-room")
            }
          >
            🚀 Join Room
          </button>

          <button
            className="dashboard-btn"
            onClick={() =>
              navigate("/leaderboard")
            }
          >
            🏆 Leaderboard
          </button>

        </div>
      </div>
    </>
  );
}

export default Dashboard;