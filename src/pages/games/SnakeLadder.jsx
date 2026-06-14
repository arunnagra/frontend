import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../../socket/socket";
import HomeButton from "../../components/HomeButton";

const SNAKES = { 99: 54, 95: 72, 70: 55, 52: 42, 25: 2 };
const LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 63: 81, 71: 91 };


const buildBoard = () => {
  const cells = [];
  for (let row = 9; row >= 0; row--) {
    const start = row * 10 + 1;
    const rowCells = Array.from({ length: 10 }, (_, i) => start + i);
    if (row % 2 === 1) rowCells.reverse();
    cells.push(...rowCells);
  }
  return cells;
};
const BOARD = buildBoard();

const PLAYER_EMOJIS = ["🔴", "🔵"];

export default function SnakeLadder() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { username = "", players: initialPlayers = [] } = location.state || {};

  const [players, setPlayers] = useState(initialPlayers);
  const [positions, setPositions] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [dice, setDice] = useState(null);
  const [lastMove, setLastMove] = useState(null); // { username, from, to, event }
  const [gameOver, setGameOver] = useState(null); // { winner }
  const [replayState, setReplayState] = useState(null); // null | "waiting" | "invited" | "accepted"
  const [inviterName, setInviterName] = useState("");
  const [rolling, setRolling] = useState(false);

  const isMyTurn = currentPlayer === username && !gameOver;

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("join_room", { roomId, username }, (res) => {
      if (res?.players?.length) setPlayers(res.players);
    });

    socket.on("snake_game_start", (data) => {
      if (data?.players?.length) setPlayers(data.players);
      setPositions(data.positions || {});
      setCurrentPlayer(data.currentPlayer || "");
      setGameOver(null);
      setLastMove(null);
      setDice(null);
      setReplayState(null);
      setInviterName("");
      setRolling(false);
    });

    socket.on("snake_roll", (data) => {
      if (!data) return;
      setDice(data.dice);
      setPositions(data.positions || {});
      setCurrentPlayer(data.currentPlayer || "");
      setRolling(false);

      const fromPosition = data.from ?? Math.max((data.position || 1) - (data.dice || 0), 1);
      const rawPosition = data.rawPosition ?? data.position;
      const isSnakeHit = !!SNAKES[data.position];
      const isLadderHit = !!LADDERS[rawPosition];

      let event = null;
      if (isSnakeHit) {
        event = `🐍 Snake! ${data.username} slid from ${rawPosition} down to ${data.position}.`;
      } else if (isLadderHit) {
        event = `🪜 Ladder! ${data.username} climbed from ${rawPosition} up to ${data.position}.`;
      } else if (data.position === fromPosition) {
        event = `🎲 ${data.username} rolled ${data.dice} but stayed on square ${data.position}.`;
      } else {
        event = `🎲 ${data.username} rolled ${data.dice} and moved from ${fromPosition} to ${data.position}.`;
      }

      setLastMove({
        username: data.username,
        from: fromPosition,
        rawPosition,
        position: data.position,
        dice: data.dice,
        event,
      });
    });

    socket.on("snake_game_over", (data) => {
      setGameOver(data);
      if (data?.positions) setPositions(data.positions);
    });

    socket.on("room_update", (room) => {
      if (room?.players) setPlayers(room.players);
    });

    const handleReplayInvite = ({ invitedBy }) => {
      if (!invitedBy) return;
      setInviterName(invitedBy);
      if (invitedBy === username) {
        setReplayState("waiting");
      } else {
        setReplayState("invited");
      }
    };

    const handleReplayStarted = () => {
      setReplayState(null);
      setGameOver(null);
      setLastMove(null);
      setDice(null);
      setInviterName("");
      setRolling(false);
    };

    socket.on("replay_invite", handleReplayInvite);
    socket.on("snake_replay_invite", handleReplayInvite);
    socket.on("snake_replay_started", handleReplayStarted);
    socket.on("replay_started", handleReplayStarted);

    return () => {
      socket.off("snake_game_start");
      socket.off("snake_roll");
      socket.off("snake_game_over");
      socket.off("room_update");
      socket.off("replay_invite", handleReplayInvite);
      socket.off("snake_replay_invite", handleReplayInvite);
      socket.off("snake_replay_started", handleReplayStarted);
      socket.off("replay_started", handleReplayStarted);
    };
  }, [roomId, username]);

  const rollDice = () => {
    if (!isMyTurn || rolling) return;
    setRolling(true);

    const rolled = Math.floor(Math.random() * 6) + 1;
    const myPos = positions[username] ?? 1;
    let newPos = myPos + rolled;

    if (newPos > 100) newPos = myPos;
    const rawPosition = newPos;
    if (LADDERS[newPos]) newPos = LADDERS[newPos];
    if (SNAKES[newPos]) newPos = SNAKES[newPos];

    setDice(rolled);

    socket.emit("snake_roll", {
      roomId,
      dice: rolled,
      from: myPos,
      position: newPos,
      rawPosition,
      username,
    });
  };

  const handlePlayAgain = () => {
    if (replayState === "waiting") return;
    setReplayState("waiting");
    setInviterName(username);
    socket.emit("snake_replay_request", { roomId, username });
    socket.emit("replay_request", { roomId, username });
  };

  const handleAcceptPlayAgain = () => {
    if (replayState !== "invited") return;
    setReplayState("accepted");
    socket.emit("snake_replay_accept", { roomId });
    socket.emit("replay_accept", { roomId });
  };

  const getPlayerEmoji = (pUsername) => {
    const idx = players.findIndex((p) => p.username === pUsername);
    return PLAYER_EMOJIS[idx] ?? "⚪";
  };

  if (gameOver) {
    const iWon = gameOver.winner === username;
    return (
      <div style={s.page}>
        <HomeButton />
        <div style={s.resultCard}>
          <div style={s.resultIcon}>{iWon ? "🏆" : "🥈"}</div>
          <h1 style={s.resultTitle}>{iWon ? "You Win!" : `${gameOver.winner} Wins!`}</h1>
          <div style={s.finalPositions}>
            {Object.entries(gameOver.positions || {}).map(([name, pos]) => (
              <div key={name} style={s.finalRow}>
                {getPlayerEmoji(name)} {name}: square {pos}
              </div>
            ))}
          </div>

          {replayState === "invited" ? (
            <div style={s.replayInviteCard}>
              <div style={s.replayInviteText}>
                🎮 <strong>{inviterName}</strong> wants to play again.
              </div>
              <button style={s.replayBtn} onClick={handleAcceptPlayAgain}>
                Accept Play Again
              </button>
            </div>
          ) : replayState === "accepted" ? (
            <div style={s.replayInviteCard}>
              <div style={s.replayInviteText}>
                ✅ Rematch accepted! Starting the game…
              </div>
            </div>
          ) : replayState === "waiting" ? (
            <div style={s.replayInviteCard}>
              <div style={s.replayInviteText}>
                Waiting for your opponent to accept the rematch…
              </div>
            </div>
          ) : (
            <button style={s.replayBtn} onClick={handlePlayAgain}>
              🔄 Play Again
            </button>
          )}

          <button style={s.homeBtn} onClick={() => navigate("/")}>
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
        <h1 style={s.title}>🐍 Snake & Ladder</h1>
        <div style={s.roomTag}>Room: {roomId}</div>
      </div>

      {/* Players info */}
      <div style={s.playersBar}>
        {players.map((p, i) => {
          const isCurrent = currentPlayer === p.username;
          const pos = positions[p.username] ?? 1;
          return (
            <div key={i} style={{ ...s.playerBox, ...(isCurrent ? s.activeBox : {}) }}>
              <span style={s.pEmoji}>{PLAYER_EMOJIS[i] ?? "⚪"}</span>
              <div>
                <div style={s.pName}>
                  {p.username}
                  {p.username === username && <span style={s.youTag}> (you)</span>}
                </div>
                <div style={s.pPos}>Square {pos}</div>
              </div>
              {isCurrent && <div style={s.turnBadge}>🎯 Turn</div>}
            </div>
          );
        })}
      </div>

      {/* Status */}
      <div style={s.status}>
        {!currentPlayer
          ? "⏳ Waiting for game to start..."
          : isMyTurn
          ? "🎲 Your turn — roll the dice!"
          : `⏳ ${currentPlayer}'s turn`}
      </div>

      {/* Last move */}
      {lastMove && (
        <div style={s.lastMove}>
          {lastMove.event ?? `${lastMove.username} rolled ${lastMove.dice} and landed on square ${lastMove.position}.`}
        </div>
      )}

      {/* Dice + Roll button */}
      <div style={s.diceRow}>
        {dice !== null && <div style={s.diceBox}>{["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][dice]}</div>}
        <button
          style={{ ...s.rollBtn, opacity: isMyTurn && !rolling ? 1 : 0.45 }}
          onClick={rollDice}
          disabled={!isMyTurn || rolling}
        >
          {rolling ? "Rolling..." : "🎲 Roll Dice"}
        </button>
      </div>

      {/* Board */}
      <div style={s.boardWrap}>
        <div style={s.board}>
          {BOARD.map((cell) => {
            const isSnake = !!SNAKES[cell];
            const isLadder = !!LADDERS[cell];
            const playersHere = players.filter((p) => (positions[p.username] ?? 1) === cell);

            return (
              <div
                key={cell}
                style={{
                  ...s.cell,
                  ...(isSnake ? s.snakeCell : {}),
                  ...(isLadder ? s.ladderCell : {}),
                  ...(cell === 100 ? s.winCell : {}),
                }}
              >
                <span style={s.cellNum}>{cell}</span>
                {isSnake && (
                  <>
                    <span style={s.cellIcon}>🐍</span>
                    <span style={s.cellLabel}>to {SNAKES[cell]}</span>
                  </>
                )}
                {isLadder && (
                  <>
                    <span style={s.cellIcon}>🪜</span>
                    <span style={s.cellLabel}>to {LADDERS[cell]}</span>
                  </>
                )}
                {playersHere.length > 0 && (
                  <div style={s.piecesRow}>
                    {playersHere.map((p) => (
                      <span key={p.username}>{getPlayerEmoji(p.username)}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={s.legend}>
        <div style={s.legendGroup}>
          <div style={s.legendTitle}>🐍 Snakes</div>
          <div style={s.legendList}>
            {Object.entries(SNAKES).map(([start, end]) => (
              <span key={start} style={s.legendItem}>{start} → {end}</span>
            ))}
          </div>
        </div>
        <div style={s.legendGroup}>
          <div style={s.legendTitle}>🪜 Ladders</div>
          <div style={s.legendList}>
            {Object.entries(LADDERS).map(([start, end]) => (
              <span key={start} style={s.legendItem}>{start} → {end}</span>
            ))}
          </div>
        </div>
        <div style={s.legendGroup}>
          <div style={s.legendTitle}>Players</div>
          <div style={s.legendList}>
            {players.map((p, i) => (
              <span key={i} style={s.legendItem}>{PLAYER_EMOJIS[i]} {p.username}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg,#0f172a,#111827)",
    color: "#fff",
    padding: "clamp(16px,3vw,24px)",
    paddingTop: "clamp(64px,8vw,80px)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "10px",
  },
  title: { margin: 0, fontSize: "clamp(22px,4vw,30px)", fontWeight: 700 },
  roomTag: { fontSize: "13px", color: "#64748b", fontFamily: "monospace" },
  playersBar: {
    display: "flex",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  playerBox: {
    flex: "1 1 160px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "14px",
    background: "rgba(255,255,255,0.05)",
    border: "1.5px solid rgba(255,255,255,0.08)",
    transition: "0.2s",
  },
  activeBox: {
    background: "rgba(59,130,246,0.18)",
    border: "1.5px solid #3b82f6",
    boxShadow: "0 0 14px rgba(59,130,246,0.25)",
  },
  pEmoji: { fontSize: "28px" },
  pName: { fontSize: "14px", fontWeight: 700, color: "#e2e8f0" },
  pPos: { fontSize: "12px", color: "#64748b" },
  youTag: { fontSize: "11px", color: "#22c55e" },
  turnBadge: {
    marginLeft: "auto",
    fontSize: "12px",
    fontWeight: 700,
    color: "#22c55e",
    background: "rgba(34,197,94,0.15)",
    padding: "4px 10px",
    borderRadius: "999px",
  },
  status: {
    textAlign: "center",
    fontSize: "17px",
    fontWeight: 600,
    color: "#94a3b8",
    marginBottom: "10px",
  },
  lastMove: {
    textAlign: "center",
    fontSize: "14px",
    color: "#f59e0b",
    marginBottom: "12px",
    minHeight: "20px",
  },
  diceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  diceBox: {
    fontSize: "48px",
    lineHeight: 1,
  },
  rollBtn: {
    padding: "12px 32px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  boardWrap: {
    overflowX: "auto",
    marginBottom: "12px",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(10, minmax(0,1fr))",
    gap: "2px",
    width: "min(100%,660px)",
    margin: "0 auto",
  },
  cell: {
    aspectRatio: "1/1",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cellNum: {
    fontSize: "clamp(7px,1.8vw,11px)",
    fontWeight: 700,
    color: "#64748b",
    lineHeight: 1,
  },
  cellIcon: {
    fontSize: "clamp(12px,2.7vw,18px)",
    lineHeight: 1,
  },
  cellLabel: {
    marginTop: "4px",
    fontSize: "clamp(8px,1.8vw,11px)",
    color: "#f8fafc",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  snakeCell: { background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.3)" },
  ladderCell: { background: "rgba(34,197,94,0.22)", border: "1px solid rgba(34,197,94,0.3)" },
  winCell: { background: "rgba(250,204,21,0.25)", border: "1px solid rgba(250,204,21,0.4)" },
  piecesRow: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    fontSize: "clamp(10px,2.5vw,18px)",
    gap: "1px",
    lineHeight: 1,
  },
  legend: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
    gap: "12px",
    fontSize: "13px",
    color: "#cbd5e1",
    marginBottom: "20px",
    padding: "18px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
  },
  legendGroup: {
    display: "grid",
    gap: "8px",
  },
  legendTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#f8fafc",
  },
  legendList: {
    display: "grid",
    gap: "6px",
  },
  legendItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
    fontSize: "12px",
  },
  replayInviteCard: {
    marginBottom: "18px",
    padding: "18px 20px",
    background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.3)",
    borderRadius: "16px",
  },
  replayInviteText: {
    fontSize: "15px",
    fontWeight: 700,
    color: "#e2e8f0",
    marginBottom: "12px",
  },
  replayBtn: {
    marginBottom: "15px",
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "12px",
    background: "linear-gradient(135deg,#22c55e,#10b981)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  // Result
  resultCard: {
    width: "min(100%,400px)",
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
  finalPositions: { marginBottom: "28px" },
  finalRow: {
    fontSize: "16px",
    padding: "10px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    marginBottom: "8px",
  },
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
  },
};
