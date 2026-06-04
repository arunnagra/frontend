import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../../socket/socket";
import { AuthContext } from "../../context/AuthContext";

const TicTacToe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId: routeRoomId = "" } = useParams();
  const { user } = useContext(AuthContext);

  const {
    roomId = "",
    username = "",
    players: initialPlayers = [],
  } = location.state || {};

  const effectiveRoomId = roomId || routeRoomId;
  const effectiveUsername =
    username ||
    user?.username ||
    (typeof window !== "undefined"
      ? localStorage.getItem("gs_username") || ""
      : "");
  const normalizedUsername = effectiveUsername
    .trim()
    .toLowerCase();

  const [board, setBoard] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState("");
  const [players, setPlayers] = useState(initialPlayers);
  const [playerSymbol, setPlayerSymbol] = useState("");

  const recordedRef = useRef(false);

  const currentPlayerIndex = players.findIndex((player) => {
    return (
      player.username?.trim().toLowerCase() ===
      normalizedUsername
    );
  });

  const inferredPlayerSymbol =
    currentPlayerIndex === 0 ? "X" : "O";

  const effectivePlayerSymbol =
    playerSymbol || inferredPlayerSymbol;

  // Determine whose turn it is
  const currentTurnPlayer = (() => {
    if (players.length === 0) return "Waiting...";

    if (players.length === 1) {
      return players[0].username;
    }

    return turn === "X"
      ? players[0]?.username
      : players[1]?.username;
  })();

  const handleRoomData = useCallback((data) => {
    setBoard(data.board || Array(9).fill(""));
    setTurn(data.turn || "X");

    if (data.players) {
      setPlayers(data.players);

      const foundIndex = data.players.findIndex((player) =>
        player.username?.trim().toLowerCase() ===
        normalizedUsername
      );

      if (foundIndex !== -1) {
        setPlayerSymbol(foundIndex === 0 ? "X" : "O");
      }
    }

    if (data.winner && data.winner !== "") {
      recordedRef.current = true;
    }

    setWinner(data.winner || "");
  }, [normalizedUsername]);

  useEffect(() => {
    if (!effectiveRoomId || !effectiveUsername) {
      return;
    }

    if (!socket.connected) {
      socket.connect();
    }

    socket.on("roomData", handleRoomData);
    socket.on("room_update", handleRoomData);

    socket.emit(
      "join_room",
      {
        roomId: effectiveRoomId,
        username: effectiveUsername,
      },
      (res) => {
        if (res?.players?.length) {
          setPlayers(res.players);
        }
        if (res?.symbol) {
          setPlayerSymbol(res.symbol);
        }
      }
    );

    return () => {
      socket.off("roomData", handleRoomData);
      socket.off("room_update", handleRoomData);
    };
  }, [effectiveRoomId, effectiveUsername, handleRoomData]);

  const makeMove = (index) => {
    if (!effectivePlayerSymbol) return;
    if (winner) return;
    if (board[index] !== "") return;
    if (turn !== effectivePlayerSymbol) return;

    socket.emit("makeMove", {
      roomId: effectiveRoomId,
      index,
      symbol: effectivePlayerSymbol,
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>
          ⭕ Tic Tac Toe
        </h1>

        <div style={styles.infoBar}>
          <div>
            <strong>Room:</strong> {effectiveRoomId}
          </div>

          <div>
            <strong>You:</strong> {effectiveUsername}
            {effectivePlayerSymbol && (
              <span> ({effectivePlayerSymbol})</span>
            )}
          </div>
        </div>

        <div style={styles.status}>
          {winner
            ? winner === "DRAW"
              ? "🤝 Match Draw"
              : `🏆 Winner: ${winner}`
            : `🎯 Turn: ${currentTurnPlayer} (${turn})`}
        </div>

        <div style={styles.board}>
          {board.map((cell, index) => (
            <button
              key={index}
              style={styles.cell}
              onClick={() => makeMove(index)}
            >
              {cell}
            </button>
          ))}
        </div>

        <div style={styles.bottom}>
          {/* <button
            style={styles.button}
            onClick={resetGame}
          >
            🔄 Restart
          </button> */}

          <button
            style={styles.button}
            onClick={() => navigate("/")}
          >
             Exit Game
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg,#0f172a,#111827,#1e293b)",
    padding: "20px",
  },

  card: {
    width: "100%",
    maxWidth: "650px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "30px",
    color: "#fff",
    textAlign: "center",
  },

  title: {
    marginBottom: "20px",
    fontSize: "36px",
  },

  infoBar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    color: "#cbd5e1",
    flexWrap: "wrap",
    gap: "10px",
  },

  status: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "25px",
    color: "#60a5fa",
  },

  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "12px",
    marginBottom: "25px",
    width: "100%",
    maxWidth: "420px",
    marginLeft: "auto",
    marginRight: "auto",
  },

  cell: {
    width: "100%",
    height: "100%",
    minWidth: 0,
    minHeight: 0,
    padding: 0,
    display: "grid",
    placeItems: "center",
    aspectRatio: "1",
    border: "none",
    borderRadius: "16px",
    fontSize: "clamp(2rem, 5vw, 3.5rem)",
    fontWeight: "bold",
    cursor: "pointer",
    userSelect: "none",
    touchAction: "manipulation",
    color: "#fff",
    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",
  },

  bottom: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    flexWrap: "wrap",
  },

  button: {
    padding: "14px 28px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    color: "#fff",
    fontWeight: "600",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
  },
};

export default TicTacToe;