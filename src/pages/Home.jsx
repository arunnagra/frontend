import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Navbar from "../components/Navbar";

import "../styles/home.css";

function Home() {
  const navigate = useNavigate();

  const [showGameModal, setShowGameModal] = useState(false);

  const games = [
    {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      icon: "⭕",
    },
    {
      id: "chess",
      name: "Chess",
      icon: "♟️",
    },
    {
      id: "memory-match",
      name: "Memory Match",
      icon: "🧠",
    },
    {
      id: "quiz-battle",
      name: "Quiz Battle",
      icon: "🎯",
    },
    {
      id: "snake-ladder",
      name: "Snake & Ladder",
      icon: "🐍",
    },
  ];

  const handleGameSelect = (game) => {
    navigate("/create-room", {
      state: {
        selectedGame: game,
      },
    });

    setShowGameModal(false);
  };

  return (
    <div className="home-page">
      <Navbar />

      <div className="lobby-container">

        <div className="lobby-title">
          <h1>🎮 GAME SPHERE</h1>
          <span>HOST • PLAY • CONNECT</span>
        </div>

        <div className="lobby-grid">

          <div className="card profile-card">

            <div className="avatar">
              🎮
            </div>

            <h2>Multiplayer Gaming</h2>

            <div className="status-row">
              <span className="status-dot" aria-hidden="true"></span>
              <span className="status-text">Online</span>
            </div>

            <hr style={{ margin: "20px 0" }} />

            <h3>Available Games</h3>

            <div className="player-item">
              <div className="player-circle">T</div>
              <span>Tic Tac Toe</span>
            </div>

            <div className="player-item">
              <div className="player-circle">C</div>
              <span>Chess</span>
            </div>

            <div className="player-item">
              <div className="player-circle">M</div>
              <span>Memory Match</span>
            </div>

            <div className="player-item">
              <div className="player-circle">Q</div>
              <span>Quiz Battle</span>
            </div>

          </div>

          <div className="action-column">

            <div className="card join-card">

              <h2>Join Existing Room</h2>

              <p
                style={{
                  marginBottom: "20px",
                  opacity: 0.8,
                }}
              >
                Enter a room ID shared by your friend
              </p>

              <button
                className="btn primary-btn"
                style={{
                  width: "100%",
                }}
                onClick={() => navigate("/join-room")}
              >
                🚪 Join Room
              </button>

            </div>

            <div className="card host-card">

              <h2>Create New Room</h2>

              <p
                style={{
                  marginBottom: "20px",
                  opacity: 0.8,
                }}
              >
                Become the host and invite players
              </p>

              <button
                className="btn primary-btn"
                style={{
                  width: "100%",
                }}
                onClick={() => setShowGameModal(true)}
              >
                🎯 Create Room
              </button>

              {/* Quick Links removed from host-card; moved below join/create */}

            </div>

            <div className="card quick-links-card">
              <h2>Quick Links</h2>

              <div className="button-group">

                <Link to="/leaderboard">
                  <button className="btn success-btn">
                    Leaderboard
                  </button>
                </Link>

                <Link to="/profile">
                  <button className="btn primary-btn">
                    Profile
                  </button>
                </Link>

              </div>
            </div>

            <div className="card info-card">
              <h2>How Multiplayer Works</h2>

              <p>1️⃣ Create a Room</p>
              <p>2️⃣ Select a Game</p>
              <p>3️⃣ Share Room ID</p>
              <p>4️⃣ Friend Joins Room</p>
              <p>5️⃣ Start Playing</p>
            </div>

          </div>

        </div>

      </div>

      {showGameModal && (
        <div className="game-modal-overlay">

          <div className="game-modal">

            <h2>Select a Game</h2>

            <p className="modal-subtitle">
              Choose a game before creating your room
            </p>

            <div className="game-grid">

              {games.map((game) => (
                <div
                  key={game.id}
                  className="game-card"
                  onClick={() => handleGameSelect(game)}
                >
                  <div className="game-icon">
                    {game.icon}
                  </div>

                  <h3>{game.name}</h3>
                </div>
              ))}

            </div>

            <button
              className="close-modal-btn"
              onClick={() => setShowGameModal(false)}
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Home;