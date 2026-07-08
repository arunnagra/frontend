import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import Navbar from "../components/Navbar";

import "../styles/home.css";

function Home() {
  const navigate = useNavigate();
  const username = localStorage.getItem("gs_username") || "You";

  const [showGameModal, setShowGameModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const games = [
    {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      icon: "⭕",
    },
    // {
    //   id: "chess",
    //   name: "Chess",
    //   icon: "♟️",
    // },
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

  const handlePlayAI = () => {
    navigate("/game/AI", {
      state: {
        singlePlayer: true,
        username,
      },
    });
  };

  const handlePlayMemorySolo = () => {
    navigate("/memory/SINGLE", {
      state: {
        singlePlayer: true,
        username,
      },
    });
  };

  const handlePlayMemoryAI = () => {
    navigate("/memory/AI", {
      state: {
        ai: true,
        username,
      },
    });
  };

  const handlePlaySnakeAI = () => {
    navigate("/snake/AI", {
      state: {
        ai: true,
        username,
      },
    });
  };

  const getModeTargets = (gameId) => {
    switch (gameId) {
      case "tic-tac-toe":
        return {
          multiplayer: "/create-room",
          ai: "/game/AI",
          single: "/game/SINGLE",
        };
      case "memory-match":
        return {
          multiplayer: "/create-room",
          ai: "/memory/AI",
          single: "/memory/SINGLE",
        };
      case "quiz-battle":
        return {
          multiplayer: "/create-room",
          ai: null,
          single: null,
        };
      case "snake-ladder":
        return {
          multiplayer: "/create-room",
          ai: "/snake/AI",
          single: "/snake/SINGLE",
        };
      default:
        return {
          multiplayer: "/create-room",
          ai: null,
          single: null,
        };
    }
  };

  const isModeAvailable = (gameId, mode) => Boolean(getModeTargets(gameId)[mode]);

  const handleModeSelect = (mode) => {
    if (!selectedGame) return;

    const targets = getModeTargets(selectedGame.id);
    const target = targets[mode];

    if (mode === "multiplayer") {
      navigate("/create-room", {
        state: {
          selectedGame,
        },
      });
    } else if (target) {
      const state = {
        username,
        ...(mode === "ai" ? { ai: true } : { singlePlayer: true }),
      };

      navigate(target, { state });
    }

    setSelectedGame(null);
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

            {games.map((game) => (
              <button
                key={game.id}
                type="button"
                className="game-option-btn"
                onClick={() => setSelectedGame(game)}
              >
                <div className="player-circle">{game.icon}</div>
                <span>{game.name}</span>
                <span className="game-option-arrow">▶</span>
              </button>
            ))}

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
            </div>

            {/* Quick Links removed from host-card */}

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

            <div className="card info-card how-to-play-card">
              <div className="how-to-play-header">
                <span className="how-to-play-badge">⚡ Quick Start</span>
                <h2>How to Play !</h2>
                <p>Jump into a multiplayer match in just a few simple steps.</p>
              </div>

              <div className="steps-grid">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <h3>Create a Room</h3>
                </div>

                <div className="step-item">
                  <div className="step-number">2</div>
                  <h3>Select a Game</h3>
                </div>

                <div className="step-item">
                  <div className="step-number">3</div>
                  <h3>Share the Room ID</h3>
                </div>

                <div className="step-item">
                  <div className="step-number">4</div>
                  <h3>Start Playing</h3>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {selectedGame && (
        <div className="game-modal-overlay" onClick={() => setSelectedGame(null)}>
          <div className="game-modal mode-picker-card" onClick={(e) => e.stopPropagation()}>
            <h2>Choose a mode</h2>
            <p className="modal-subtitle">How would you like to play {selectedGame.name}?</p>

            <div className="mode-option-grid">
              <button
                type="button"
                className="mode-option-btn primary-btn"
                onClick={() => handleModeSelect("multiplayer")}
              >
                <span className="mode-option-title">🌐 Multiplayer</span>
                <span className="mode-option-desc">Create a room and invite friends</span>
              </button>

              <button
                type="button"
                className={`mode-option-btn success-btn ${!isModeAvailable(selectedGame.id, "ai") ? "mode-option-disabled" : ""}`}
                onClick={() => handleModeSelect("ai")}
                disabled={!isModeAvailable(selectedGame.id, "ai")}
              >
                <span className="mode-option-title">🤖 VS AI</span>
                <span className="mode-option-desc">Play against the computer</span>
              </button>

              <button
                type="button"
                className={`mode-option-btn primary-btn ${!isModeAvailable(selectedGame.id, "single") ? "mode-option-disabled" : ""}`}
                onClick={() => handleModeSelect("single")}
                disabled={!isModeAvailable(selectedGame.id, "single")}
              >
                <span className="mode-option-title">🎮 Single Mode</span>
                <span className="mode-option-desc">Play alone at your own pace</span>
              </button>
            </div>

            <button
              className="close-modal-btn"
              onClick={() => setSelectedGame(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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