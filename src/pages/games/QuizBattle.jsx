import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../../socket/socket";
import HomeButton from "../../components/HomeButton";

const QUESTIONS = [
  { question: "What is the capital of India?", options: ["Mumbai", "Delhi", "Pune", "Chennai"], answer: "Delhi" },
  { question: "Which planet is known as the Red Planet?", options: ["Earth", "Mars", "Venus", "Jupiter"], answer: "Mars" },
  { question: "React is developed by?", options: ["Google", "Facebook", "Amazon", "Microsoft"], answer: "Facebook" },
  { question: "HTML stands for?", options: ["Hyper Text Markup Language", "Home Tool Markup Language", "Hyper Transfer Machine Language", "Hyper Tool Multi Language"], answer: "Hyper Text Markup Language" },
  { question: "2 + 2 × 2 = ?", options: ["6", "8", "4", "2"], answer: "6" },
  { question: "Which language runs in a web browser?", options: ["Java", "C", "Python", "JavaScript"], answer: "JavaScript" },
  { question: "Who invented the telephone?", options: ["Edison", "Bell", "Tesla", "Marconi"], answer: "Bell" },
  { question: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Colorful Style Sheets"], answer: "Cascading Style Sheets" },
  { question: "Which data structure uses LIFO?", options: ["Queue", "Stack", "Array", "Tree"], answer: "Stack" },
  { question: "What is the output of typeof null in JavaScript?", options: ["null", "undefined", "object", "string"], answer: "object" },
];

export default function QuizBattle() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { username = "", players: initialPlayers = [] } = location.state || {};

  const [players, setPlayers] = useState(initialPlayers);
  const [currentQ, setCurrentQ] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentQ, setOpponentQ] = useState(0); // how many questions opponent answered
  const [selected, setSelected] = useState(null); // selected option
  const [finished, setFinished] = useState(false); // I finished
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [gameOver, setGameOver] = useState(null); // { winner, scores }
  const [timeLeft, setTimeLeft] = useState(15);
  const timerRef = useRef(null);
  const myFinalScore = useRef(0);

  const opponent = players.find((p) => p.username !== username);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(15);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const handleTimeout = () => {
    // Auto-submit wrong answer (empty)
    submitAnswer(null, true);
  };

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("join_room", { roomId, username }, (res) => {
      if (res?.players?.length) setPlayers(res.players);
    });

    socket.on("quiz_start", (data) => {
      if (data?.players?.length) setPlayers(data.players);
    });

    socket.on("quiz_answer", (data) => {
      if (!data || data.player === username) return;
      // Update opponent progress
      if (data.finalScore !== undefined) {
        setOpponentScore(data.finalScore);
        setOpponentFinished(true);
        setOpponentQ(QUESTIONS.length);
      } else {
        setOpponentQ((q) => Math.min(q + 1, QUESTIONS.length));
        if (data.score !== undefined) setOpponentScore(data.score);
      }
    });

    socket.on("quiz_game_over", (data) => {
      clearInterval(timerRef.current);
      setGameOver(data);
    });

    socket.on("room_update", (room) => {
      if (room?.players) setPlayers(room.players);
    });

    return () => {
      clearInterval(timerRef.current);
      socket.off("quiz_start");
      socket.off("quiz_answer");
      socket.off("quiz_game_over");
      socket.off("room_update");
    };
  }, [roomId, username]);

  // Start timer when question changes
  useEffect(() => {
    if (!finished) startTimer();
    return () => clearInterval(timerRef.current);
  }, [currentQ, finished]);

  const submitAnswer = (option, fromTimeout = false) => {
    if (selected !== null && !fromTimeout) return;
    if (finished) return;

    clearInterval(timerRef.current);

    const correct = option === QUESTIONS[currentQ].answer;
    const newScore = correct ? myScore + 1 : myScore;
    setSelected(option ?? "");
    if (correct) setMyScore(newScore);

    const isLast = currentQ === QUESTIONS.length - 1;

    // Broadcast answer
    socket.emit("quiz_answer", {
      roomId,
      player: username,
      answer: option,
      score: newScore,
      ...(isLast ? { finalScore: newScore } : {}),
    });

    if (isLast) {
      myFinalScore.current = newScore;
      setFinished(true);
    } else {
      setTimeout(() => {
        setCurrentQ((q) => q + 1);
        setSelected(null);
      }, 900);
    }
  };

  if (gameOver) {
    const iWon = gameOver.winner === username;
    const isDraw = gameOver.winner === "draw";
    return (
      <div style={s.page}>
        <HomeButton />
        <div style={s.resultCard}>
          <div style={s.resultIcon}>
            {isDraw ? "🤝" : iWon ? "🏆" : "🥈"}
          </div>
          <h1 style={s.resultTitle}>
            {isDraw ? "It's a Draw!" : iWon ? "You Win!" : `${gameOver.winner} Wins!`}
          </h1>
          <div style={s.scoreList}>
            {Object.entries(gameOver.scores).map(([name, sc]) => (
              <div key={name} style={{ ...s.scoreRow, ...(name === username ? s.myScoreRow : {}) }}>
                <span>{name} {name === username ? "(you)" : ""}</span>
                <span>{sc}/{QUESTIONS.length}</span>
              </div>
            ))}
          </div>
          <button style={s.homeBtn} onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div style={s.page}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        <HomeButton />
        <div style={s.waitCard}>
          <div style={s.waitIcon}>⏳</div>
          <h2>You finished!</h2>
          <p style={s.waitSub}>
            Your score: <strong>{myFinalScore.current}/{QUESTIONS.length}</strong>
          </p>
          <p style={s.waitSub}>
            {opponentFinished
              ? `${opponent?.username || "Opponent"} also finished.`
              : `Waiting for ${opponent?.username || "opponent"} to finish...`}
          </p>
          {!opponentFinished && <div style={s.spinner} />}
        </div>
      </div>
    );
  }

  const q = QUESTIONS[currentQ];
  const timerPct = (timeLeft / 15) * 100;

  return (
    <div style={s.page}>
      <HomeButton />

      {/* Players bar */}
      <div style={s.playersBar}>
        <div style={s.playerSide}>
          <div style={s.pName}>{username} <span style={s.youTag}>(you)</span></div>
          <div style={s.pScore}>{myScore} pts</div>
          <div style={s.pProgress}>{currentQ}/{QUESTIONS.length} answered</div>
        </div>
        <div style={s.vsTag}>VS</div>
        <div style={{ ...s.playerSide, textAlign: "right" }}>
          <div style={s.pName}>{opponent?.username || "Opponent"}</div>
          <div style={s.pScore}>{opponentScore} pts</div>
          <div style={s.pProgress}>{opponentQ}/{QUESTIONS.length} answered</div>
        </div>
      </div>

      {/* Timer bar */}
      <div style={s.timerTrack}>
        <div style={{
          ...s.timerFill,
          width: `${timerPct}%`,
          background: timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#22c55e",
        }} />
      </div>
      <div style={s.timerLabel}>{timeLeft}s</div>

      {/* Question */}
      <div style={s.quizCard}>
        <div style={s.qNum}>Question {currentQ + 1} of {QUESTIONS.length}</div>
        <h2 style={s.qText}>{q.question}</h2>
        <div style={s.options}>
          {q.options.map((opt, i) => {
            const isSelected = selected === opt;
            const isCorrect = opt === q.answer;
            const showResult = selected !== null;
            return (
              <button
                key={i}
                disabled={selected !== null}
                onClick={() => submitAnswer(opt)}
                style={{
                  ...s.optBtn,
                  ...(showResult && isCorrect ? s.optCorrect : {}),
                  ...(showResult && isSelected && !isCorrect ? s.optWrong : {}),
                }}
              >
                {opt}
              </button>
            );
          })}
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
    padding: "clamp(18px,3vw,32px)",
    paddingTop: "clamp(64px,8vw,80px)",
  },
  playersBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "18px 24px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  playerSide: { flex: 1, minWidth: "100px" },
  pName: { fontSize: "15px", fontWeight: 700, color: "#e2e8f0" },
  pScore: { fontSize: "24px", fontWeight: 800, color: "#60a5fa" },
  pProgress: { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  vsTag: { fontSize: "18px", fontWeight: 800, color: "#8b5cf6", padding: "0 8px" },
  youTag: { fontSize: "11px", color: "#22c55e" },
  timerTrack: {
    height: "6px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "3px",
    marginBottom: "4px",
    overflow: "hidden",
  },
  timerFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 1s linear, background 0.3s",
  },
  timerLabel: {
    textAlign: "right",
    fontSize: "13px",
    color: "#94a3b8",
    marginBottom: "20px",
  },
  quizCard: {
    width: "min(100%,720px)",
    margin: "0 auto",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "clamp(20px,4vw,36px)",
  },
  qNum: { fontSize: "13px", color: "#64748b", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" },
  qText: { fontSize: "clamp(18px,3vw,24px)", fontWeight: 700, marginBottom: "28px", lineHeight: 1.4 },
  options: { display: "grid", gap: "12px" },
  optBtn: {
    padding: "15px 20px",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
    background: "rgba(59,130,246,0.12)",
    color: "#fff",
    textAlign: "left",
    transition: "0.15s",
  },
  optCorrect: { background: "rgba(34,197,94,0.25)", border: "1.5px solid #22c55e", color: "#fff" },
  optWrong: { background: "rgba(239,68,68,0.25)", border: "1.5px solid #ef4444", color: "#fff" },
  // Waiting
  waitCard: {
    width: "min(100%,400px)",
    margin: "100px auto",
    textAlign: "center",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    padding: "48px 32px",
  },
  waitIcon: { fontSize: "56px", marginBottom: "16px" },
  waitSub: { color: "#94a3b8", marginTop: "8px", fontSize: "16px" },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTop: "4px solid #60a5fa",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "20px auto 0",
  },
  // Result
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
  myScoreRow: { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)" },
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
