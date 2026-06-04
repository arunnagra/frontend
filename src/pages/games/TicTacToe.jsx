import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import socket from "../../socket/socket";

const TicTacToe = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    roomId = "",
    username = "",
    players: initialPlayers = [],
  } = location.state || {};

  const [board, setBoard] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState("");
  const [players, setPlayers] = useState(initialPlayers);

  useEffect(() => {
    if (!roomId || !username) {
      navigate("/");
    }
  }, [roomId, username, navigate]);

  const playerSymbol =
    players.length > 0 && players[0]?.username === username
      ? "X"
      : players.length > 1
      ? "O"
      : "";

  const currentTurnPlayer = (() => {
    if (players.length === 0) return "Waiting...";

    if (players.length === 1) {
      return players[0]?.username || "Waiting...";
    }

    return turn === "X"
      ? players[0]?.username
      : players[1]?.username;
  })();

  const handleRoomData = useCallback((data) => {
    setBoard(data.board || Array(9).fill(""));
    setTurn(data.turn || "X");
    setWinner(data.winner || "");

    if (data.players) {
      setPlayers(data.players);
    }
  }, []);

  useEffect(() => {
    if (!roomId || !username) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "join_room",
      {
        roomId,
        username,
      },
      (res) => {
        if (res?.players?.length) {
          setPlayers(res.players);
        }
      }
    );

    socket.on("roomData", handleRoomData);

    return () => {
      socket.emit("leave_room", {
        roomId,
        username,
      });

      socket.off("roomData", handleRoomData);
    };
  }, [roomId, username, handleRoomData]);

  const makeMove = (index) => {
    if (players.length < 2) return;

    if (winner) return;

    if (board[index] !== "") return;

    if (turn !== playerSymbol) return;

    socket.emit("makeMove", {
      roomId,
      index,
      symbol: playerSymbol,
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>⭕ Tic Tac Toe</h1>

        <div style={styles.infoBar}>
          <div>
            <strong>Room:</strong> {roomId}
          </div>

          <div>
            <strong>You:</strong> {username}
          </div>
        </div>

        <div style={styles.status}>
          {winner ? (
            winner === "DRAW" ? (
              "🤝 Match Draw"
            ) : (
              `🏆 Winner: ${winner}`
            )
          ) : players.length < 2 ? (
            "⏳ Waiting for second player..."
          ) : (
            `🎯 Turn: ${currentTurnPlayer} (${turn})`
          )}
        </div>

        <div style={styles.board}>
          {board.map((cell, index) => (
            <button
              key={index}
              style={{
                ...styles.cell,
                opacity:
                  winner ||
                  cell !== "" ||
                  turn !== playerSymbol ||
                  players.length < 2
                    ? 0.8
                    : 1,
                cursor:
                  winner ||
                  cell !== "" ||
                  turn !== playerSymbol ||
                  players.length < 2
                    ? "not-allowed"
                    : "pointer",
              }}
              disabled={
                !!winner ||
                cell !== "" ||
                turn !== playerSymbol ||
                players.length < 2
              }
              onClick={() => makeMove(index)}
            >
              {cell}
            </button>
          ))}
        </div>

        <div style={styles.bottom}>
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
  },

  cell: {
    aspectRatio: "1",
    border: "none",
    borderRadius: "16px",
    fontSize: "50px",
    fontWeight: "bold",
    color: "#fff",
    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    transition: "0.2s",
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