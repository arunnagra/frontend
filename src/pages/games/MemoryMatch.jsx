import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../../socket/socket";
import HomeButton from "../../components/HomeButton";
import RoomChat from "../../components/RoomChat";

const createShuffledCards = () => {
  const icons = ["🍎", "🍌", "🍒", "🍇", "🍉", "🍓", "🥝", "🍍"];
  const cards = icons.flatMap((icon, i) => [
    { id: `${icon}-${i}-1`, icon },
    { id: `${icon}-${i}-2`, icon },
  ]);
  return cards.sort(() => Math.random() - 0.5);
};

export default function MemoryMatch() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { username: locUsername = "", players: initialPlayers = [] } = location.state || {};
  const username = locUsername || localStorage.getItem("gs_username") || "";
  const isSinglePlayer = roomId === "SINGLE" || location.state?.singlePlayer === true;
  const isAIGame = roomId === "AI" || location.state?.ai === true;
  const isLocalMode = isSinglePlayer || isAIGame;

  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState([]);
  const [scores, setScores] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [players, setPlayers] = useState(() => {
    if (isAIGame) {
      return [{ username }, { username: "Computer" }];
    }
    if (isSinglePlayer) {
      return [{ username }];
    }
    return initialPlayers;
  });
  const [chat, setChat] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [replayState, setReplayState] = useState(null);
  const [inviterName, setInviterName] = useState("");
  const [replayHover, setReplayHover] = useState(false);
  const [homeHover, setHomeHover] = useState(false);
  const [aiThinking, setAIThinking] = useState(false);

  const isMyTurn = currentPlayer === username && !gameOver;

  const initializeLocalGame = useCallback(() => {
    const newCards = createShuffledCards();
    setCards(newCards);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setScores(isAIGame ? { [username]: 0, Computer: 0 } : { [username]: 0 });
    setCurrentPlayer(username);
    setPlayers(isAIGame ? [{ username }, { username: "Computer" }] : [{ username }]);
    setGameOver(null);
    setReplayState(null);
    setInviterName("");
    setIsWaiting(false);
    setAIThinking(false);
  }, [isAIGame, username]);

  useEffect(() => {
    if (isLocalMode) {
      initializeLocalGame();
      return;
    }

    if (!socket.connected) socket.connect();

    socket.emit("join_room", { roomId, username }, (res) => {
      if (res?.players?.length) setPlayers(res.players);
    });

    socket.on("memory_game_start", (data) => {
      setCards(data.cards || []);
      setCurrentPlayer(data.currentPlayer || "");
      setScores(data.scores || {});
      if (data.players?.length) setPlayers(data.players);
      setMatchedIndices(data.matched || []);
      setFlippedIndices([]);
      setGameOver(null);
      setReplayState(null);
      setInviterName("");
    });

    socket.on("memory_flip", (data) => {
      setFlippedIndices((prev) => {
        if (prev.includes(data.index)) return prev;
        const next = [...prev, data.index];
        if (next.length === 2) setIsWaiting(true);
        return next;
      });
    });

    socket.on("memory_match_found", (data) => {
      setMatchedIndices((prev) => [...prev, ...data.indices]);
      setFlippedIndices([]);
      setIsWaiting(false);
      if (data.scores) {
        setScores(data.scores);
      } else if (data.username && data.score !== undefined) {
        setScores((prev) => ({ ...prev, [data.username]: data.score }));
      }
    });

    socket.on("memory_no_match", (data) => {
      setTimeout(() => {
        setFlippedIndices([]);
        setIsWaiting(false);
      }, 700);
    });

    socket.on("memory_turn_update", (data) => {
      setCurrentPlayer(data.currentPlayer || "");
      if (data.scores) setScores(data.scores);
    });

    socket.on("memory_game_over", (data) => {
      setGameOver(data);
    });

    const handleReplayInvite = ({ invitedBy }) => {
      if (invitedBy === username) {
        setReplayState("waiting");
      } else {
        setInviterName(invitedBy);
        setReplayState("invited");
      }
    };

    const handleChatUpdate = (payload) => {
      if (payload?.chat) setChat(payload.chat);
    };

    const handleTyping = ({ username: typingName }) => {
      if (!typingName || typingName === username) return;
      setTypingUsers((prev) => (prev.includes(typingName) ? prev : [...prev, typingName]));
    };

    const handleStopTyping = ({ username: typingName }) => {
      if (!typingName) return;
      setTypingUsers((prev) => prev.filter((name) => name !== typingName));
    };

    socket.on("room_update", (room) => {
      if (room?.players) setPlayers(room.players);
      if (room?.chat) setChat(room.chat);
    });
    socket.on("chat_update", handleChatUpdate);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("memory_replay_invite", handleReplayInvite);

    return () => {
      socket.off("memory_game_start");
      socket.off("memory_flip");
      socket.off("memory_match_found");
      socket.off("memory_no_match");
      socket.off("memory_turn_update");
      socket.off("memory_game_over");
      socket.off("room_update");
      socket.off("chat_update", handleChatUpdate);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("memory_replay_invite", handleReplayInvite);
    };
  }, [roomId, username, isLocalMode, initializeLocalGame]);

  const handleLocalFlip = (index) => {
    if (isWaiting || gameOver) return;
    if (flippedIndices.includes(index)) return;
    if (matchedIndices.includes(index)) return;
    if (flippedIndices.length >= 2) return;

    setFlippedIndices((prev) => [...prev, index]);
  };

  const handleCardClick = (index) => {
    if (!isMyTurn) return;
    if (isWaiting) return;
    if (flippedIndices.includes(index)) return;
    if (matchedIndices.includes(index)) return;
    if (flippedIndices.length >= 2) return;

    if (isLocalMode) {
      return handleLocalFlip(index);
    }

    socket.emit("memory_flip", { roomId, card: { index }, username });
  };

  const sendChatMessage = (text) => {
    socket.emit("send_chat_message", { roomId, username, text }, (ack) => {
      if (ack?.error) console.warn("Chat failed:", ack.error);
    });
  };

  const startTyping = () => {
    socket.emit("typing", { roomId, username });
  };

  const stopTyping = () => {
    socket.emit("stop_typing", { roomId, username });
  };

  const handlePlayAgain = () => {
    if (isLocalMode) {
      initializeLocalGame();
      return;
    }

    setReplayState("waiting");
    console.log("[MemoryMatch] emit memory_replay_request", { roomId, username });
    socket.emit("memory_replay_request", { roomId, username });
  };

  const handleAcceptReplay = () => {
    console.log("[MemoryMatch] emit memory_replay_accept", { roomId });
    socket.emit("memory_replay_accept", { roomId });
  };

  const isCardVisible = (index) =>
    flippedIndices.includes(index) || matchedIndices.includes(index);

  const isMatched = (index) => matchedIndices.includes(index);

  useEffect(() => {
    if (!isLocalMode) return;
    if (flippedIndices.length !== 2) return;

    setIsWaiting(true);
    const [first, second] = flippedIndices;
    const firstCard = cards[first];
    const secondCard = cards[second];
    const didMatch = firstCard?.icon && firstCard?.icon === secondCard?.icon;

    const timer = window.setTimeout(() => {
      if (didMatch) {
        setMatchedIndices((prev) => [...prev, first, second]);
        setScores((prev) => ({
          ...prev,
          [currentPlayer]: (prev[currentPlayer] || 0) + 1,
        }));
      }

      setFlippedIndices([]);
      setIsWaiting(false);

      const nextPlayer = isAIGame
        ? didMatch
          ? currentPlayer
          : currentPlayer === username
          ? "Computer"
          : username
        : username;
      setCurrentPlayer(nextPlayer);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [flippedIndices, isLocalMode, cards, currentPlayer, isAIGame, username]);

  useEffect(() => {
    if (!isLocalMode) return;
    if (!cards.length) return;
    if (matchedIndices.length !== cards.length) return;

    const winnerName = Object.keys(scores).reduce((winnerKey, key) => {
      if (winnerKey === "") return key;
      return scores[key] > scores[winnerKey] ? key : winnerKey;
    }, "");

    setGameOver({
      winner: winnerName || "DRAW",
      scores,
    });
  }, [matchedIndices, cards.length, scores, isLocalMode]);

  useEffect(() => {
    if (!isAIGame || gameOver || currentPlayer !== "Computer") return;
    if (flippedIndices.length > 0 || isWaiting) return;

    const available = cards
      .map((_, i) => i)
      .filter((i) => !matchedIndices.includes(i));

    if (available.length < 2) {
      setAIThinking(false);
      return;
    }

    setAIThinking(true);

    const firstIndex = available[Math.floor(Math.random() * available.length)];
    const remaining = available.filter((i) => i !== firstIndex);
    const secondIndex = remaining[Math.floor(Math.random() * remaining.length)];

    const aiTimer = window.setTimeout(() => {
      setFlippedIndices([firstIndex, secondIndex]);
      setAIThinking(false);
    }, 900);

    return () => {
      window.clearTimeout(aiTimer);
      setAIThinking(false);
    };
  }, [isAIGame, gameOver, currentPlayer, flippedIndices.length, isWaiting, cards, matchedIndices]);

  if (gameOver) {
    const isDraw = !gameOver.winner || gameOver.winner === "DRAW";
    const winnerName = gameOver.winner;
    const iWon = winnerName === username;
    return (
      <div style={s.page}>
        <HomeButton />
        <div style={s.resultCard}>
          <div style={s.resultIcon}>{isDraw ? "🤝" : iWon ? "🏆" : "🥈"}</div>
          <h1 style={s.resultTitle}>
            {isDraw ? "It's a tie!" : iWon ? "You Win!" : `${winnerName} Wins!`}
          </h1>
          <div style={s.scoreList}>
            {Object.entries(gameOver.scores).map(([name, sc]) => (
              <div key={name} style={{ ...s.scoreRow, ...(name === username ? s.myScore : {}) }}>
                <span>{name}</span>
                <span>{sc} pairs</span>
              </div>
            ))}
          </div>
          <div style={s.resultFooter}>
            {replayState === "invited" ? (
              <>
                <div style={s.inviteText}>
                  Replay requested by {inviterName || "your opponent"}
                </div>
                <button 
                  type="button"
                  style={{
                    ...s.replayBtn,
                    ...(replayHover && { transform: "scale(1.02)", boxShadow: "0 6px 16px rgba(34, 197, 94, 0.5)" })
                  }}
                  onClick={handleAcceptReplay}
                  onMouseEnter={() => setReplayHover(true)}
                  onMouseLeave={() => setReplayHover(false)}
                >
                  ✅ Accept Replay
                </button>
              </>
            ) : replayState === "waiting" ? (
              <span style={s.waitingText}>⏳ Waiting for opponent to accept…</span>
            ) : (
              <button 
                type="button"
                style={{
                  ...s.replayBtn,
                  ...(replayHover && { transform: "scale(1.02)", boxShadow: "0 6px 16px rgba(34, 197, 94, 0.5)" })
                }}
                onClick={handlePlayAgain}
                onMouseEnter={() => setReplayHover(true)}
                onMouseLeave={() => setReplayHover(false)}
              >
                🔄 Play Again
              </button>
            )}
          </div>
          <button 
            type="button"
            style={{
              ...s.homeBtn,
              ...(homeHover && { transform: "scale(1.02)", boxShadow: "0 6px 16px rgba(59, 130, 246, 0.5)" })
            }}
            onClick={() => navigate("/")}
            onMouseEnter={() => setHomeHover(true)}
            onMouseLeave={() => setHomeHover(false)}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <HomeButton />

      {/* Header */}
      <div style={s.header}>
        <h1 style={s.title}>🧠 Memory Match</h1>
        <div style={s.roomTag}>Room: {roomId}</div>
      </div>

      {/* Scoreboard */}
      <div style={s.scoreboard}>
        {players.map((p, i) => {
          // FIX: Safely parse pName so it doesn't return undefined if 'p' is sent as a string by the server. 
          const pName = p?.username || p; 
          const isCurrent = currentPlayer === pName;
          
          return (
            <div key={i} style={{ ...s.scoreBox, ...(isCurrent ? s.activeScore : {}) }}>
              <div style={s.scoreName}>
                {pName}
                {pName === username && <span style={s.youTag}> (you)</span>}
              </div>
              {/* Now correctly looks up the user's score using the safely parsed name */}
              <div style={s.scoreNum}>{scores[pName] ?? 0} pairs</div>
              {isCurrent && <div style={s.turnDot} />}
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div style={s.status}>
        {cards.length === 0
          ? "⏳ Waiting for game to start..."
          : isAIGame && currentPlayer === "Computer"
          ? aiThinking
            ? "🤖 Computer is thinking..."
            : "⏳ Computer's turn"
          : isMyTurn
          ? "🎯 Your turn — pick a card!"
          : `⏳ ${currentPlayer}'s turn`}
      </div>

      {/* Cards */}
      {cards.length > 0 && (
        <div style={s.grid}>
          {cards.map((card, index) => {
            const visible = isCardVisible(index);
            const matched = isMatched(index);
            return (
              <div
                key={card.id}
                style={{
                  ...s.card,
                  ...(visible ? (matched ? s.cardMatched : s.cardFlipped) : {}),
                  cursor: isMyTurn && !visible && !isWaiting ? "pointer" : "default",
                }}
                onClick={() => handleCardClick(index)}
              >
                {visible ? card.icon : "❓"}
              </div>
            );
          })}
        </div>
      )}

      {!isLocalMode && (
        <RoomChat
          roomId={roomId}
          username={username}
          chat={chat}
          onSendMessage={sendChatMessage}
          onTyping={startTyping}
          onStopTyping={stopTyping}
          typingUsers={typingUsers}
        />
      )}

      {/* Progress */}
      <div style={s.progress}>
        {matchedIndices.length / 2} / {cards.length / 2} pairs matched
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0f172a,#111827)",
    color: "#fff",
    padding: "clamp(18px,3vw,32px)",
    paddingTop: "clamp(64px,8vw,80px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  title: { margin: 0, fontSize: "clamp(22px,4vw,32px)", fontWeight: 700 },
  roomTag: {
    fontSize: "13px",
    color: "#64748b",
    fontFamily: "monospace",
  },
  scoreboard: {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  scoreBox: {
    position: "relative",
    padding: "14px 24px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    textAlign: "center",
    minWidth: "120px",
    transition: "0.2s",
  },
  activeScore: {
    background: "rgba(59,130,246,0.18)",
    border: "1.5px solid #3b82f6",
    boxShadow: "0 0 14px rgba(59,130,246,0.3)",
  },
  scoreName: { fontSize: "14px", fontWeight: 700, color: "#e2e8f0" },
  scoreNum: { fontSize: "22px", fontWeight: 800, color: "#60a5fa", marginTop: "4px" },
  youTag: { fontSize: "11px", color: "#22c55e" },
  turnDot: {
    position: "absolute",
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#22c55e",
  },
  status: {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: "20px",
    minHeight: "28px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,minmax(64px,1fr))",
    gap: "10px",
    width: "min(100%,520px)",
    margin: "0 auto",
  },
  card: {
    width: "100%",
    aspectRatio: "1/1",
    borderRadius: "14px",
    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "clamp(22px,5vw,36px)",
    userSelect: "none",
    transition: "0.2s",
    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
  },
  cardFlipped: {
    background: "linear-gradient(135deg,#f59e0b,#d97706)",
  },
  cardMatched: {
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
  },
  progress: {
    textAlign: "center",
    marginTop: "18px",
    fontSize: "15px",
    color: "#64748b",
  },
  resultCard: {
    width: "min(100%,420px)",
    margin: "80px auto",
    padding: "40px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    textAlign: "center",
    color: "#fff",
  },
  resultIcon: { fontSize: "64px", marginBottom: "12px" },
  resultTitle: { fontSize: "30px", fontWeight: 800, marginBottom: "24px" },
  scoreList: { marginBottom: "28px" },
  scoreRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "16px",
    marginBottom: "8px",
    background: "rgba(255,255,255,0.05)",
  },
  myScore: { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)" },
  homeBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s ease",
    transform: "scale(1)",
  },
  replayBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#22c55e,#10b981)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: "12px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
    transform: "scale(1)",
  },
  waitingText: {
    display: "block",
    color: "#facc15",
    fontWeight: 700,
    marginBottom: "12px",
  },
  resultFooter: {
    marginBottom: "20px",
  },
};