import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import socket from "../socket/socket";

const CreateRoom = () => {
  const { user } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.username || "");

  const navigate = useNavigate();
  const location = useLocation();

  const selectedGame =
    location.state?.selectedGame || {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      icon: "⭕",
    };

  const handleCreateRoom = async () => {
    const trimmedUsername =
      (username || user?.username || "").trim();

    if (!trimmedUsername) {
      alert("Please enter username");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in again");
      return;
    }

    try {
      const res = await axios.post(
        apiUrl("/api/rooms/create"),
        {
          game: selectedGame.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const createdRoom = res.data?.room;

      if (!createdRoom?.roomId) {
        alert("Room creation failed");
        return;
      }

      try {
        localStorage.setItem("gs_username", trimmedUsername);
        localStorage.setItem("gs_roomId", createdRoom.roomId);
      } catch (e) {}

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit(
        "create_room",
        {
          roomId: createdRoom.roomId,
          username: trimmedUsername,
          game: selectedGame.id,
        },
        (socketRoom) => {
          if (socketRoom?.roomId) {
            navigate(`/lobby/${socketRoom.roomId}`, {
              state: {
                roomId: socketRoom.roomId,
                isHost: true,
                username: trimmedUsername,
                players: socketRoom.players || [],
                selectedGame: {
                  id: createdRoom.game || selectedGame.id,
                  name: selectedGame.name,
                  icon: selectedGame.icon,
                },
              },
            });
            return;
          }

          navigate(`/lobby/${createdRoom.roomId}`, {
            state: {
              roomId: createdRoom.roomId,
              isHost: true,
              username: trimmedUsername,
              players: createdRoom.players || [],
              selectedGame: {
                id: createdRoom.game || selectedGame.id,
                name: selectedGame.name,
                icon: selectedGame.icon,
              },
            },
          });
        }
      );
    } catch (error) {
      alert(error.response?.data?.msg || "Room creation failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlow1}></div>
      <div style={styles.backgroundGlow2}></div>

      <div style={styles.card}>
        <div style={styles.logo}>
          {selectedGame.icon}
        </div>

        <h1 style={styles.title}>
          Create Game Room
        </h1>

        <p style={styles.subtitle}>
          Become the host and invite your friends
          to join your match.
        </p>

        <div style={styles.gameCard}>
          <div style={styles.gameIcon}>
            {selectedGame.icon}
          </div>

          <div>
            <h3 style={styles.gameTitle}>
              {selectedGame.name}
            </h3>

            <p style={styles.gameText}>
              Selected Game
            </p>
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Host Username
          </label>

          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            style={styles.input}
          />
        </div>

        <button
          style={styles.button}
          onClick={handleCreateRoom}
        >
          Create {selectedGame.name} Room
        </button>

        <button
          style={styles.backButton}
          onClick={() => navigate("/")}
        >
          Back Home
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "clamp(16px, 3vw, 20px)",
  },

  backgroundGlow1: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "#3b82f6",
    borderRadius: "50%",
    filter: "blur(140px)",
    top: "-120px",
    left: "-120px",
    opacity: 0.3,
  },

  backgroundGlow2: {
    position: "absolute",
    width: "400px",
    height: "400px",
    background: "#8b5cf6",
    borderRadius: "50%",
    filter: "blur(140px)",
    bottom: "-120px",
    right: "-120px",
    opacity: 0.3,
  },

  card: {
    width: "100%",
    maxWidth: "550px",
    padding: "clamp(24px, 5vw, 40px)",
    borderRadius: "28px",
    backdropFilter: "blur(25px)",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow:
      "0 25px 60px rgba(0,0,0,0.45)",
    textAlign: "center",
    color: "#fff",
    position: "relative",
    zIndex: 10,
  },

  logo: {
    fontSize: "clamp(56px, 10vw, 80px)",
    marginBottom: "15px",
  },

  title: {
    fontSize: "clamp(28px, 5vw, 36px)",
    fontWeight: "700",
    marginBottom: "10px",
  },

  subtitle: {
    color: "#94a3b8",
    marginBottom: "30px",
    lineHeight: "1.6",
    fontSize: "15px",
  },

  gameCard: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    padding: "22px",
    marginBottom: "25px",
    borderRadius: "18px",
    textAlign: "left",

    background:
      "linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.15))",

    border:
      "1px solid rgba(255,255,255,.12)",

    boxShadow:
      "0 10px 25px rgba(0,0,0,.25)",
  },

  gameIcon: {
    width: "clamp(56px, 12vw, 70px)",
    height: "clamp(56px, 12vw, 70px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "18px",
    fontSize: "clamp(28px, 6vw, 34px)",

    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",

    boxShadow:
      "0 8px 20px rgba(59,130,246,.35)",
  },

  gameTitle: {
    margin: 0,
    fontSize: "clamp(18px, 3.5vw, 22px)",
    color: "#fff",
    fontWeight: "700",
  },

  gameText: {
    marginTop: "6px",
    color: "#94a3b8",
    fontSize: "14px",
    letterSpacing: "1px",
  },

  inputGroup: {
    textAlign: "left",
    marginBottom: "25px",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    color: "#cbd5e1",
    fontWeight: "600",
  },

  input: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.05)",
    color: "#fff",
    outline: "none",
    fontSize: "15px",
    boxSizing: "border-box",
  },

  button: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "700",

    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",

    color: "#fff",

    boxShadow:
      "0 10px 25px rgba(59,130,246,.35)",

    marginBottom: "12px",
  },

  backButton: {
    width: "100%",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,.12)",
    background: "transparent",
    color: "#fff",
    cursor: "pointer",
    fontSize: "15px",
  },
};

export default CreateRoom;