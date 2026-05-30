import { useEffect, useState, useRef } from "react";
import axios from "axios";
import socket from "../socket/socket";
import { apiUrl } from "../config/api";

import Navbar from "../components/Navbar";

import "../styles/leaderboard.css";

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const prevDataRef = useRef("");

  useEffect(() => {
    socket.connect();
    fetchLeaderboard();

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 5000);

    
    const onMatchRecorded = () => fetchLeaderboard();
    socket.on("match_recorded", onMatchRecorded);

    return () => {
      clearInterval(interval);
      socket.off("match_recorded", onMatchRecorded);
      socket.disconnect();
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      
      
      if ((players || []).length === 0) setLoading(true);
      setError("");

      const res = await axios.get(apiUrl("/api/leaderboard"));

      const data = res.data || [];

      
      const str = JSON.stringify(data);
      if (prevDataRef.current !== str) {
        prevDataRef.current = str;
        setPlayers(data);
      }
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load leaderboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return `#${index + 1}`;
  };

  const getWinRate = (wins, matchesPlayed) => {
    if (!matchesPlayed) return 0;

    return Math.round(
      (wins / matchesPlayed) * 100
    );
  };

  return (
    <>
      <Navbar />

      <div className="leaderboard-page">

        <div className="leaderboard-header">

          <h1>
            🏆 GameSphere Champions
          </h1>

          <p>
            Rise through the ranks and
            dominate the leaderboard.
          </p>

          {}

        </div>

        {error && (
          <div
            style={{
              textAlign: "center",
              color: "#ef4444",
              marginTop: "20px",
              fontSize: "16px",
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              marginTop: "30px",
              fontSize: "16px",
            }}
          >
            Loading leaderboard...
          </div>
        ) : (
          <div className="leaderboard-card">

            <div className="leaderboard-table-header">

              <span>Rank</span>
              <span>Player</span>
              <span>Wins</span>
              <span>Losses</span>
              <span>Matches</span>
              <span>Win Rate</span>

            </div>

            {players.length > 0 ? (
              players.map((player, index) => (
                <div
                  key={player._id || index}
                  className={`leaderboard-row ${
                    index < 3
                      ? "top-player"
                      : ""
                  }`}
                >

                  <div className="rank">
                    {getRankBadge(index)}
                  </div>

                  <div className="player-info">

                    <div className="player-avatar">
                      {player.username
                        ?.charAt(0)
                        ?.toUpperCase()}
                    </div>

                    <span>
                      {player.username}
                    </span>

                  </div>

                  <div>
                    {player.wins || 0}
                  </div>

                  <div>
                    {player.losses || 0}
                  </div>

                  <div>
                    {player.matchesPlayed || 0}
                  </div>

                  <div>
                    {getWinRate(
                      player.wins || 0,
                      player.matchesPlayed || 0
                    )}
                    %
                  </div>

                </div>
              ))
            ) : (
              <div
                className="empty-state"
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#94a3b8",
                }}
              >
                No Players Found
              </div>
            )}

          </div>
        )}

      </div>
    </>
  );
}

export default Leaderboard;