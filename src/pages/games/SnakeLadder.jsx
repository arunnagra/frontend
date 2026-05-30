import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket/socket";
import { apiUrl } from "../../config/api";

const snakes = {
  99: 54,
  95: 72,
  70: 55,
  52: 42,
  25: 2,
};

const ladders = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  63: 81,
  71: 91,
};

export default function SnakeLadder() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    username = "",
    players = [],
    isHost = false,
  } = location.state || {};

  const [position, setPosition] = useState(1);
  const [dice, setDice] = useState(1);
  const [winner, setWinner] = useState("");
  const [positions, setPositions] = useState({});

  const recordSnakeLadderMatch = async (winnerName) => {
    try {
      if (players?.length >= 2) {
        const loser = players.find(p => p.username !== winnerName);
        if (loser && loser.username !== winnerName) {
          await axios.post(
            apiUrl("/api/match/record-match"),
            {
              roomId,
              winnerUsername: winnerName,
              loserUsername: loser.username,
              gameType: "snake-ladder",
            }
          );
        }
      }
    } catch (error) {
      console.log("Error recording snake & ladder match:", error);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit(
      "join_room",
      {
        roomId,
        username,
      },
      () => {}
    );

    socket.on("snake_roll", handleOpponentRoll);

    return () => {
      socket.off("snake_roll", handleOpponentRoll);
    };
  }, [roomId,username]);

  const handleOpponentRoll = (data) => {
    // payload: { roomId, dice, position, username }
    if (!data) return;
    if (data.username && data.position !== undefined) {
      setPositions((p) => ({ ...p, [data.username]: data.position }));
    }
    console.log("Opponent Dice:", data);
  };

  const rollDice = () => {
    if (winner) return;

    const rolled = Math.floor(Math.random() * 6) + 1;

    // compute new position first so we can emit accurate state
    let newPosition = position + rolled;

    if (newPosition > 100) {
      newPosition = position;
    }

    if (ladders[newPosition]) {
      newPosition =
        ladders[newPosition];
    }

    if (snakes[newPosition]) {
      newPosition =
        snakes[newPosition];
    }

    setDice(rolled);
    setPosition(newPosition);

    socket.emit("snake_roll", {
      roomId,
      dice: rolled,
      position: newPosition,
      username,
    });

    if (newPosition === 100) {
      recordSnakeLadderMatch(username);
      socket.emit("match_recorded", {
        roomId,
        winner: username,
        draw: false,
        gameType: "snake-ladder",
      });
      setWinner(username);
    }
  };

  const cells = [];

  for (let i = 100; i >= 1; i--) {
    cells.push(i);
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>🐍 Snake & Ladder</h1>

          <p>
            Room ID: {roomId}
          </p>

          <p>
            Player: {username} {isHost ? "(Host)" : "(Player)"}
          </p>
        </div>

        <button
          style={styles.exitBtn}
          onClick={() => navigate("/")}
        >
          Exit
        </button>
      </div>

      <div style={styles.infoBar}>
        <span>
          👥 Players:
          {" "}
          {players.length}
        </span>

        <span>
          🎲 Dice:
          {" "}
          {dice}
        </span>

        <span>
          📍 Position:
          {" "}
          {position}
        </span>
        <span>
          👀 Opponents:
          {" "}
          {Object.keys(positions).length === 0
            ? "-"
            : Object.entries(positions)
                .filter(([name]) => name !== username)
                .map(([name, pos]) => `${name}: ${pos}`)
                .join(" | ")}
        </span>
      </div>

      {winner && (
        <div style={styles.winnerBox}>
          🏆 {winner} Wins The Match!
        </div>
      )}

      <button
        style={styles.rollBtn}
        onClick={rollDice}
      >
        🎲 Roll Dice
      </button>

      <div style={styles.board}>
        {cells.map((cell) => (
          <div
            key={cell}
            style={{
              ...styles.cell,

              ...(snakes[cell]
                ? styles.snakeCell
                : {}),

              ...(ladders[cell]
                ? styles.ladderCell
                : {}),
            }}
          >
            <span>{cell}</span>

            {position === cell && (
              <div style={styles.player}>
                🎮
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.legend}>
        <span>
          🟢 Ladder Start
        </span>

        <span>
          🔴 Snake Head
        </span>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg,#0f172a,#111827)",
    color: "#fff",
    padding: "clamp(16px, 3vw, 20px)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "20px",
  },

  infoBar: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "25px",
    marginBottom: "20px",
    fontSize: "18px",
    fontWeight: "600",
  },

  rollBtn: {
    display: "block",
    margin: "0 auto 20px",
    width: "min(100%, 220px)",
    padding: "15px 30px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  board: {
    width: "min(100%, 700px)",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(10, minmax(0, 1fr))",
    gap: "2px",
  },

  cell: {
    width: "100%",
    aspectRatio: "1 / 1",
    background:
      "rgba(255,255,255,.08)",
    border:
      "1px solid rgba(255,255,255,.08)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    fontSize: "clamp(9px, 2.4vw, 12px)",
    fontWeight: "700",
  },

  snakeCell: {
    background:
      "rgba(239,68,68,.35)",
  },

  ladderCell: {
    background:
      "rgba(34,197,94,.35)",
  },

  player: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    fontSize: "clamp(14px, 3vw, 20px)",
  },

  exitBtn: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
  },

  winnerBox: {
    maxWidth: "450px",
    margin: "0 auto 20px",
    textAlign: "center",
    padding: "15px",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg,#f59e0b,#f97316)",
    fontSize: "24px",
    fontWeight: "700",
  },

  legend: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "30px",
    marginTop: "20px",
    fontWeight: "600",
  },
};