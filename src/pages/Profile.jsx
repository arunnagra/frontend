import { useContext, useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";

import "../styles/profile.css";

function Profile() {
  const { user, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    
    const token = localStorage.getItem("token");
    if (token) {
      refreshUserStats();
    }
  }, []);

  const refreshUserStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        apiUrl("/api/profile"),
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (res.data) {
        
        const profile = {
          ...res.data,
          matchesPlayed:
            res.data.matchesPlayed || res.data.matches?.length || 0,
        };

        
        login(localStorage.getItem("token"), profile);
      }
    } catch (error) {
      console.log("Error refreshing user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  
  const wins = user?.wins || 0;
  const losses = user?.losses || 0;
  const matchesPlayed = user?.matchesPlayed || 0;

  const winRate =
    matchesPlayed > 0
      ? Math.round((wins / matchesPlayed) * 100)
      : 0;

  return (
    <>
      <Navbar />

      <div className="profile-page">

        <div className="profile-card">

          <div className="profile-card-intro">
            <div className="profile-avatar">
              {user?.username?.charAt(0)?.toUpperCase()}
            </div>

            <div className="profile-info">
              <h1>{user?.username}</h1>

              <span className="player-rank">
                Username: {user?.username}
              </span>

              <p>{user?.email}</p>
            </div>
          </div>

          <div className="stats-grid">

            <div className="stat-box">
              <h2>{wins}</h2>
              <span>Wins</span>
            </div>

            <div className="stat-box">
              <h2>{losses}</h2>
              <span>Losses</span>
            </div>

            <div className="stat-box">
              <h2>{matchesPlayed}</h2>
              <span>Matches</span>
            </div>

          </div>

          <div className="winrate-section">

            <div className="winrate-header">
              <span>Win Rate</span>
              <span>{winRate}%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${winRate}%`,
                }}
              />
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default Profile;