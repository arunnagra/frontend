import React, { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import socket from "../socket/socket";

const gameMap = {
  "tic-tac-toe": {
    id: "tic-tac-toe",
    name: "Tic Tac Toe",
    icon: "⭕",
  },

  chess: {
    id: "chess",
    name: "Chess",
    icon: "♟️",
  },

  "memory-match": {
    id: "memory-match",
    name: "Memory Match",
    icon: "🧠",
  },

  "quiz-battle": {
    id: "quiz-battle",
    name: "Quiz Battle",
    icon: "🎯",
  },

  "snake-ladder": {
    id: "snake-ladder",
    name: "Snake & Ladder",
    icon: "🐍",
  },
};

const Lobby = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const {
    isHost = false,
    username = user?.username || "",
    roomId = "",
    players: initialPlayers = [],
    selectedGame = gameMap["tic-tac-toe"],
  } = location.state || {};

  const [players, setPlayers] = useState(initialPlayers);
  const [selectedGameState, setSelectedGameState] = useState(selectedGame);
  const [roomStatus, setRoomStatus] = useState("waiting");

  const redirectedRef = useRef(false);

  const spinStyle = `
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
`;

  useEffect(() => {
    if (!roomId) return;

    let storedUsername = username || user?.username || "";
    let storedRoomId = roomId;
    try {
      if (!storedUsername) storedUsername = localStorage.getItem("gs_username") || "";
      if (!storedRoomId) storedRoomId = localStorage.getItem("gs_roomId") || "";
    } catch (e) {}

    const token = localStorage.getItem("token");

    const goToGame = (gameId, currentRoomId, roomPlayers) => {
      if (redirectedRef.current) {
        return;
      }

      redirectedRef.current = true;

      const activeGame = gameMap[gameId] || selectedGame;
      const gameState = {
        roomId: currentRoomId,
        players: roomPlayers,
        username: username || user?.username || "",
        isHost,
        selectedGame: activeGame,
      };

      switch (activeGame.id) {
        case "chess":
          alert("Chess is temporarily disabled.");
          navigate("/");
          break;
        case "quiz-battle":
          navigate(`/quiz/${currentRoomId}`, { state: gameState });
          break;
        case "memory-match":
          navigate(`/memory/${currentRoomId}`, { state: gameState });
          break;
        case "snake-ladder":
          navigate(`/snake/${currentRoomId}`, { state: gameState });
          break;
        default:
          navigate(`/game/${currentRoomId}`, { state: gameState });
      }
    };

    const fetchRoom = async () => {
      if (!token || !storedRoomId) {
        return;
      }

      try {
        const res = await axios.get(apiUrl(`/api/rooms/${storedRoomId}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const room = res.data;

        if (!room) {
          return;
        }

        setPlayers(room.players || []);
        setSelectedGameState(gameMap[room.game] || selectedGame);
        setRoomStatus(room.status || "waiting");

        if (room.status === "playing") {
          goToGame(room.game, storedRoomId, room.players || []);
        }
      } catch (error) {
        console.error("Failed to load room:", error);
      }
    };

    fetchRoom();

    const intervalId = setInterval(fetchRoom, 2500);

    return () => {
      clearInterval(intervalId);
    };
  }, [roomId, username, isHost, navigate, user?.username, selectedGame]);

  const startGame = () => {
    if (players.length < 2) {
      alert("At least 2 players are required");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in again");
      return;
    }

    axios
      .post(
        apiUrl(`/api/rooms/${roomId}/start`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        setRoomStatus("playing");

        if (!socket.connected) {
          socket.connect();
        }

        socket.emit("start_game", { roomId }, (ack) => {
          if (ack?.error) {
            console.error("Socket start_game error:", ack.error);
          } else {
            console.log("Socket start_game ack:", ack);
          }
        });

        const activeGame = selectedGameState;

        switch (activeGame.id) {
          case "chess":
            alert("Chess is temporarily disabled.");
            navigate("/");
            return;
          case "quiz-battle":
            navigate(`/quiz/${roomId}`, {
              state: {
                roomId,
                players,
                username: username || user?.username || "",
                isHost,
                selectedGame: activeGame,
              },
            });
            break;
          case "memory-match":
            navigate(`/memory/${roomId}`, {
              state: {
                roomId,
                players,
                username: username || user?.username || "",
                isHost,
                selectedGame: activeGame,
              },
            });
            break;
          case "snake-ladder":
            navigate(`/snake/${roomId}`, {
              state: {
                roomId,
                players,
                username: username || user?.username || "",
                isHost,
                selectedGame: activeGame,
              },
            });
            break;
          default:
            navigate(`/game/${roomId}`, {
              state: {
                roomId,
                players,
                username: username || user?.username || "",
                isHost,
                selectedGame: activeGame,
              },
            });
        }
      })
      .catch((error) => {
        alert(error.response?.data?.msg || "Failed to start match");
      });
  };

  if (!roomId) {
    return (
      <div style={styles.errorContainer}>
        <h2>Invalid Room</h2>

        <button
          style={styles.homeBtn}
          onClick={() => navigate("/")}
        >
          Back Home
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{spinStyle}</style>
      <div style={styles.container}>

        {}
        <div style={styles.leftPanel}>
          <h1 style={styles.logo}>
            🎮 GameSphere Lobby
          </h1>

          {}
          <div style={styles.infoCard}>
            <h3>Room ID</h3>

            <div style={styles.roomCode}>
              {roomId}
            </div>
          </div>

          {}
          <div style={styles.infoCard}>
            <h3>Selected Game</h3>

            <div style={styles.selectedGameCard}>

              <div style={styles.selectedGameIcon}>
                {selectedGameState.icon}
              </div>

              <div style={styles.selectedGameContent}>

                <span style={styles.selectedGameLabel}>
                  SELECTED GAME
                </span>

                <h3 style={styles.selectedGameTitle}>
                  {selectedGameState.name}
                </h3>

                <span style={styles.selectedGameStatus}>
                  {roomStatus === "playing"
                    ? "In Progress"
                    : "Ready To Launch"}
                </span>

              </div>

              <div style={styles.selectedGameBadge}>
                ACTIVE
              </div>

            </div>
          </div>

          {}
          <div style={styles.infoCard}>
            <h3>Your Username</h3>

            <div style={styles.username}>
              {username}
            </div>
          </div>

          <h2 style={styles.playerTitle}>
            Players ({players.length}/2)
          </h2>

          <div style={styles.playerList}>
            {players.map((player, index) => (
              <div
                key={index}
                style={styles.playerCard}
              >
                <div style={styles.avatar}>
                  {player.username
                    ?.charAt(0)
                    ?.toUpperCase()}
                </div>

                <div>
                  <h4 style={{ margin: 0 }}>
                    {player.username}
                  </h4>

                  <small>
                    {index === 0
                      ? "👑 Host"
                      : "🎮 Player"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {}
        <div style={styles.rightPanel}>
          {isHost ? (
            <>
              <h2>👑 Host Panel</h2>

              <p>
                Share this Room ID with your friend.
              </p>

              <div style={styles.bigCode}>
                {roomId}
              </div>

              <p>
                Connected Players: {players.length}/2
              </p>

              <button
                style={styles.startBtn}
                onClick={startGame}
              >
                🚀 Start Match
              </button>
            </>
          ) : (
            <>
              <h2>⏳ Waiting Room</h2>

              <p>
                Successfully joined room
              </p>

              <p>
                Waiting for host to start the match...
              </p>

              <div style={styles.loader}></div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
const styles = {
  container: {
    display: "flex",
    flexWrap: "wrap",
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0f172a,#111827)",
    color: "#fff",
  },

  leftPanel: {
    flex: "2 1 560px",
    minWidth: "0",
    padding: "clamp(24px, 4vw, 40px)",
  },

  rightPanel: {
    flex: "1 1 340px",
    minWidth: "320px",
    background: "rgba(255,255,255,0.04)",
    borderLeft:
      "1px solid rgba(255,255,255,0.08)",
    padding: "clamp(24px, 4vw, 40px)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },

  logo: {
    marginBottom: "30px",
    fontSize: "clamp(28px, 4vw, 38px)",
  },

  infoCard: {
    background: "rgba(255,255,255,.05)",
    border:
      "1px solid rgba(255,255,255,.08)",
    borderRadius: "15px",
    padding: "20px",
    marginBottom: "20px",
  },

  roomCode: {
    fontSize: "clamp(20px, 4vw, 26px)",
    fontWeight: "bold",
    color: "#60a5fa",
    letterSpacing: "4px",
    overflowWrap: "anywhere",
  },

  username: {
    fontSize: "20px",
    color: "#22c55e",
    fontWeight: "600",
  },

  playerTitle: {
    marginTop: "30px",
    marginBottom: "20px",
  },

  playerList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  playerCard: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    background: "rgba(255,255,255,.05)",
    padding: "15px",
    borderRadius: "12px",
  },

  avatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background:
      "linear-gradient(135deg,#8b5cf6,#06b6d4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontWeight: "bold",
    fontSize: "20px",
  },

  bigCode: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#60a5fa",
    margin: "20px 0",
    letterSpacing: "5px",
  },

  startBtn: {
    marginTop: "20px",
    padding: "15px 35px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontSize: "17px",
    cursor: "pointer",
  },

  loader: {
    width: "60px",
    height: "60px",
    marginTop: "20px",
    border: "6px solid rgba(255,255,255,.15)",
    borderTop: "6px solid #60a5fa",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  homeBtn: {
    marginTop: "15px",
    padding: "10px 20px",
    cursor: "pointer",
  },

  selectedGameCard: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "18px",
    flexWrap: "wrap",
    padding: "20px",
    marginTop: "15px",

    background:
      "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))",

    border:
      "1px solid rgba(255,255,255,0.12)",

    borderRadius: "18px",

    backdropFilter: "blur(20px)",

    boxShadow:
      "0 10px 30px rgba(0,0,0,0.25)",

    overflow: "hidden",
  },

  selectedGameIcon: {
    width: "70px",
    height: "70px",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: "36px",

    borderRadius: "18px",

    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",

    boxShadow:
      "0 8px 20px rgba(59,130,246,0.35)",

    flexShrink: 0,
  },

  selectedGameContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  selectedGameLabel: {
    fontSize: "11px",
    letterSpacing: "2px",
    color: "#94a3b8",
    fontWeight: "700",
  },

  selectedGameTitle: {
    margin: "6px 0",
    fontSize: "clamp(18px, 3.5vw, 22px)",
    fontWeight: "700",
    color: "#ffffff",
  },

  selectedGameStatus: {
    color: "#22c55e",
    fontSize: "clamp(24px, 5vw, 32px)",
    fontWeight: "600",
  },

  selectedGameBadge: {
    overflowWrap: "anywhere",
    padding: "8px 14px",

    borderRadius: "999px",

    background:
      "rgba(34,197,94,0.15)",

    border:
      "1px solid rgba(34,197,94,0.4)",

    color: "#22c55e",

    fontSize: "12px",
    fontWeight: "700",

    letterSpacing: "1px",
  },
};
export default Lobby;