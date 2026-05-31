import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket/socket";
import { apiUrl } from "../../config/api";

const cardIcons = [
  "🎮",
  "🎯",
  "🚀",
  "⚽",
  "🏆",
  "🎲",
  "🧠",
  "🔥",
];

export default function MemoryMatch() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    username = "",
    players: initialPlayers = [],
    isHost = false,
  } = location.state || {};

  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [completedAt, setCompletedAt] = useState(null);
  const [players, setPlayers] = useState(initialPlayers);
  const recordedRef = useRef(false);

  const recordMemoryMatchResult = useCallback(async () => {
    try {
      if (!isHost && username !== players[0]?.username) {
        return;
      }

      if (players?.length >= 2 && !completedAt) {
        await axios.post(
          apiUrl("/api/match/record-match"),
          {
            roomId,
            winnerUsername: username,
            loserUsername: players.find(p => p.username !== username)?.username || players[1]?.username,
            gameType: "memory-match",
          }
        );

        socket.emit("match_recorded", {
          roomId,
          winner: username,
          draw: false,
          gameType: "memory-match",
        });

        setCompletedAt(Date.now());
      }
    } catch (error) {
      console.log("Error recording memory match:", error);
    }
  }, [isHost, username, players, roomId, completedAt]);

  const initializeGame = useCallback(() => {
    const gameCards = [...cardIcons, ...cardIcons]
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
      }));

    setCards(gameCards);
  }, []);

  const flipCard = useCallback((index, emit = true) => {
    if (
      flipped.includes(index) ||
      matched.includes(index) ||
      flipped.length === 2
    ) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (emit) {
      socket.emit("memory_flip", {
        roomId,
        card: {
          index,
        },
      });
    }

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);

      const firstCard = cards[newFlipped[0]];
      const secondCard = cards[newFlipped[1]];

      if (firstCard.icon === secondCard.icon) {
        setMatched((prev) => [
          ...prev,
          newFlipped[0],
          newFlipped[1],
        ]);

        setTimeout(() => {
          setFlipped([]);
        }, 600);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 1000);
      }
    }
  }, [cards, flipped, matched, roomId]);

  const handleRemoteFlip = useCallback((data) => {
    flipCard(data.index, false);
  }, [flipCard]);

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
      (res) => {
        if (res?.players?.length) {
          setPlayers(res.players);
        }
      }
    );

    initializeGame();

    return () => {
    };
  }, [roomId, username, initializeGame]);

  useEffect(() => {
    const gameCompleted =
      matched.length === cards.length &&
      cards.length > 0;

    if (gameCompleted && !completedAt && !recordedRef.current) {
      recordedRef.current = true;
      recordMemoryMatchResult(moves);
    }
  }, [matched, cards, moves, completedAt, recordMemoryMatchResult]);

  // listen for remote flips once
  useEffect(() => {
    socket.on("memory_flip", handleRemoteFlip);

    return () => {
      socket.off("memory_flip", handleRemoteFlip);
    };
  }, [handleRemoteFlip]);

  const gameCompleted =
    matched.length === cards.length &&
    cards.length > 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>🧠 Memory Match</h1>

          <p>
            Room ID: {roomId}
          </p>

          <p>
            Player: {username}
          </p>
        </div>

        <button
          style={styles.leaveBtn}
          onClick={() => navigate("/")}
        >
          Exit Game
        </button>
      </div>

      <div style={styles.infoBar}>
        <div>
          👥 Players:
          {" "}
          {players.length}
        </div>

        <div>
          🎯 Moves:
          {" "}
          {moves}
        </div>

        <div>
          ✅ Matches:
          {" "}
          {matched.length / 2}
          {" / "}
          8
        </div>
      </div>

      {gameCompleted && (
        <div style={styles.winBox}>
          🎉 All Pairs Matched!
        </div>
      )}

      <div style={styles.grid}>
        {cards.map((card, index) => {
          const isFlipped =
            flipped.includes(index) ||
            matched.includes(index);

          return (
            <div
              key={card.id}
              style={{
                ...styles.card,
                ...(isFlipped
                  ? styles.cardOpen
                  : {}),
              }}
              onClick={() =>
                flipCard(index)
              }
            >
              {isFlipped
                ? card.icon
                : "❓"}
            </div>
          );
        })}
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
    padding: "clamp(18px, 3vw, 30px)",
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
    marginBottom: "25px",
    fontSize: "18px",
    fontWeight: "600",
  },

  leaveBtn: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(72px, 1fr))",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px",
    width: "min(100%, 560px)",
    marginInline: "auto",
  },

  card: {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "clamp(24px, 6vw, 40px)",
    cursor: "pointer",
    userSelect: "none",
    transition: "0.3s",
    boxShadow:
      "0 8px 20px rgba(0,0,0,.3)",
  },

  cardOpen: {
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
  },

  winBox: {
    maxWidth: "400px",
    margin: "0 auto 20px",
    padding: "15px",
    borderRadius: "12px",
    textAlign: "center",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    fontSize: "22px",
    fontWeight: "700",
  },
};