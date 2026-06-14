import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../../socket/socket";
import HomeButton from "../../components/HomeButton";

const TOTAL_QUESTIONS = 10;

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
  { question: "Which HTML element is used to define the title of a document?", options: ["<meta>", "<title>", "<header>", "<head>"], answer: "<title>" },
  { question: "What does JSON stand for?", options: ["JavaScript Object Notation", "Java Simple Object Notation", "JavaScript Oriented Notation", "Java Serialized Object Notation"], answer: "JavaScript Object Notation" },
  { question: "Which company created the Vue.js framework?", options: ["Google", "Facebook", "Evan You", "Microsoft"], answer: "Evan You" },
  { question: "What is the value of 7 % 3 in JavaScript?", options: ["1", "2", "3", "0"], answer: "1" },
  { question: "Which CSS property controls the text size?", options: ["font-style", "font-size", "text-size", "font-weight"], answer: "font-size" },
  { question: "What is the primary purpose of Git?", options: ["Code formatting", "Version control", "Bug tracking", "Deployment"], answer: "Version control" },
  { question: "In JavaScript, what is a promise?", options: ["A synchronous function", "A callback wrapper", "An object representing a future value", "A style guide"], answer: "An object representing a future value" },
  { question: "Which of the following is not a JavaScript data type?", options: ["Boolean", "Undefined", "Character", "Symbol"], answer: "Character" },
  { question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Language", "Standard Question Language", "Sequential Query Language"], answer: "Structured Query Language" },
  { question: "What tag is used to create a hyperlink in HTML?", options: ["<a>", "<link>", "<href>", "<url>"], answer: "<a>" },
  { question: "What is the correct syntax to create an array in JavaScript?", options: ["var arr = {}", "var arr = []", "var arr = ()", "var arr = <>"], answer: "var arr = []" },
  { question: "Which HTTP method is used to update a resource?", options: ["GET", "POST", "PUT", "DELETE"], answer: "PUT" },
  { question: "Which keyword declares a constant in JavaScript?", options: ["let", "var", "const", "static"], answer: "const" },
  { question: "Which React hook is used for state management?", options: ["useEffect", "useState", "useContext", "useMemo"], answer: "useState" },
  { question: "Which of these is a primitive value in JavaScript?", options: ["Object", "Array", "String", "Date"], answer: "String" },
  { question: "Which HTML attribute is used to define inline styles?", options: ["class", "style", "id", "css"], answer: "style" },
  { question: "In CSS, how do you select an element with id 'main'?", options: ["#main", ".main", "main", "*main"], answer: "#main" },
  { question: "Which operator is used to assign a value in JavaScript?", options: ["==", "=", "===", ":="], answer: "=" },
  { question: "How do you write a comment in JavaScript?", options: ["<!-- comment -->", "// comment", "/* comment */", "Both B and C"], answer: "Both B and C" },
];

const shuffleQuestions = (list) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getRandomQuestions = (list, count) => shuffleQuestions(list).slice(0, count);

export default function QuizBattle() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { username = "", players: initialPlayers = [] } = location.state || {};

  const [players, setPlayers]               = useState(initialPlayers);
  const [questions, setQuestions]           = useState(() => getRandomQuestions(QUESTIONS, TOTAL_QUESTIONS));
  const [currentQ, setCurrentQ]             = useState(0);
  const [myScore, setMyScore]               = useState(0);
  const [opponentScore, setOpponentScore]   = useState(0);
  const [opponentQ, setOpponentQ]           = useState(0);
  const [selected, setSelected]             = useState(null);
  const [finished, setFinished]             = useState(false);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [gameOver, setGameOver]             = useState(null); // { winner, scores }
  const [replayState, setReplayState]       = useState(null); // null | "waiting" | "invited"
  const [inviterName, setInviterName]       = useState("");
  const [timeLeft, setTimeLeft]             = useState(15);
  const [transitioning, setTransitioning]   = useState(false); // brief fade between questions

  const timerRef     = useRef(null);
  const myFinalScore = useRef(0);

  const opponent = players.find((p) => p.username !== username);

  const resetGame = () => {
    setQuestions(getRandomQuestions(QUESTIONS, TOTAL_QUESTIONS));
    setCurrentQ(0);
    setMyScore(0);
    setOpponentScore(0);
    setOpponentQ(0);
    setSelected(null);
    setFinished(false);
    setOpponentFinished(false);
    setGameOver(null);
    setReplayState(null);
    setInviterName("");
    setTimeLeft(15);
    setTransitioning(false);
    myFinalScore.current = 0;
  };

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
    submitAnswer(null, true);
  };

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("join_room", { roomId, username }, (res) => {
      if (res?.players?.length) setPlayers(res.players);
    });

    socket.on("quiz_start", (data) => {
      if (data?.players?.length) setPlayers(data.players);
      resetGame();
    });

    socket.on("quiz_answer", (data) => {
      if (!data || data.player === username) return;
      if (data.finalScore !== undefined) {
        setOpponentScore(data.finalScore);
        setOpponentFinished(true);
        setOpponentQ(questions.length);
      } else {
        setOpponentQ((q) => Math.min(q + 1, questions.length));
        if (data.score !== undefined) setOpponentScore(data.score);
      }
    });

    socket.on("quiz_game_over", (data) => {
      clearInterval(timerRef.current);
      setGameOver(data);
    });

    socket.on("quiz_replay_invite", ({ invitedBy }) => {
      if (!invitedBy) return;
      if (invitedBy === username) {
        setReplayState("waiting");
        setInviterName(invitedBy);
      } else {
        setReplayState("invited");
        setInviterName(invitedBy);
      }
    });

    socket.on("room_update", (room) => {
      if (room?.players) setPlayers(room.players);
    });

    return () => {
      clearInterval(timerRef.current);
      socket.off("quiz_start");
      socket.off("quiz_answer");
      socket.off("quiz_game_over");
      socket.off("quiz_replay_invite");
      socket.off("room_update");
    };
  }, [roomId, username]);

  // Start timer when question changes, skip while transitioning
  useEffect(() => {
    if (!finished && !transitioning) startTimer();
    return () => clearInterval(timerRef.current);
  }, [currentQ, finished, transitioning]);

  const submitAnswer = (option, fromTimeout = false) => {
    if (selected !== null && !fromTimeout) return;
    if (finished) return;

    clearInterval(timerRef.current);

    const correct = option === questions[currentQ].answer;
    const newScore = correct ? myScore + 1 : myScore;
    setSelected(option ?? "");
    if (correct) setMyScore(newScore);

    const isLast = currentQ === questions.length - 1;

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
      // Show answer feedback for 900 ms, then fade out and advance
      setTimeout(() => {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentQ((q) => q + 1);
          setSelected(null);
          setTransitioning(false);
        }, 300);
      }, 900);
    }
  };

  const handlePlayAgain = () => {
    if (replayState === "waiting") return;
    setReplayState("waiting");
    console.log("[QuizBattle] emit quiz_replay_request", { roomId, username });
    socket.emit("quiz_replay_request", { roomId, username });
    // also emit generic replay_request as a fallback
    socket.emit("replay_request", { roomId, username });
  };

  const handleAcceptPlayAgain = () => {
    if (replayState !== "invited") return;
    setReplayState("waiting");
    console.log("[QuizBattle] emit quiz_replay_accept", { roomId });
    socket.emit("quiz_replay_accept", { roomId });
    // also emit generic replay_accept as fallback
    socket.emit("replay_accept", { roomId });
  };

  // ── Waiting for results ────────────────────────────────────────────────────
  if (finished && !gameOver) {
    const myPct  = Math.round((myFinalScore.current / questions.length) * 100);
    const oppPct = opponentFinished
      ? Math.round((opponentScore / questions.length) * 100)
      : null;

    return (
      <div style={s.page}>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
        <HomeButton />
        <div style={s.resultCard}>
          <div style={s.resultIcon}>⏳</div>
          <h1 style={s.resultTitle}>Waiting for results…</h1>

          <div style={s.waitRow}>
            <div style={s.waitPlayer}>
              <div style={s.waitName}>{username} <span style={s.youTag}>you</span></div>
              <div style={s.waitScore}>{myFinalScore.current}/{questions.length}</div>
              <div style={s.waitPct}>{myPct}% accuracy</div>
            </div>
            <div style={s.waitDivider}>VS</div>
            <div style={s.waitPlayer}>
              <div style={s.waitName}>{opponent?.username || "Opponent"}</div>
              {opponentFinished ? (
                <>
                  <div style={s.waitScore}>{opponentScore}/{questions.length}</div>
                  <div style={s.waitPct}>{oppPct}% accuracy</div>
                </>
              ) : (
                <div style={{ ...s.waitScore, animation: "pulse 1.2s ease infinite", color: "#64748b" }}>
                  answering…
                </div>
              )}
            </div>
          </div>

          <div style={s.spinner} />
        </div>
      </div>
    );
  }

  // ── Game over ──────────────────────────────────────────────────────────────
  if (gameOver) {
    const iWon  = gameOver.winner === username;
    const isDraw = gameOver.winner === "draw";

    const scores = Object.entries(gameOver.scores);
    const myFin  = gameOver.scores?.[username]            ?? 0;
    const oppFin = gameOver.scores?.[opponent?.username]  ?? 0;
    const myAcc  = Math.round((myFin  / questions.length) * 100);
    const oppAcc = Math.round((oppFin / questions.length) * 100);

    return (
      <div style={s.page}>
        <style>{`@keyframes pop{0%{transform:scale(0.7);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}`}</style>
        <HomeButton />
        <div style={s.resultCard}>
          {/* Winner banner */}
          <div style={{ ...s.resultIcon, animation: "pop 0.5s ease both" }}>
            {isDraw ? "🤝" : iWon ? "🏆" : "🥈"}
          </div>
          <h1 style={s.resultTitle}>
            {isDraw ? "It's a Draw!" : iWon ? "You Win!" : `${gameOver.winner} Wins!`}
          </h1>

          {/* Score rows */}
          <div style={s.scoreList}>
            {scores.map(([name, sc]) => (
              <div
                key={name}
                style={{ ...s.scoreRow, ...(name === username ? s.myScoreRow : {}) }}
              >
                <span style={{ fontWeight: 600 }}>
                  {name} {name === username ? <span style={s.youTag}>you</span> : ""}
                </span>
                <span style={{ fontWeight: 700 }}>
                  {sc}/{questions.length}
                </span>
              </div>
            ))}
          </div>

          {/* Accuracy comparison */}
          <div style={s.statBlock}>
            <div style={s.statRow}>
              <span style={{ color: "#60a5fa", fontWeight: 700 }}>{myAcc}%</span>
              <span style={s.statLabel}>Accuracy</span>
              <span style={{ color: "#f472b6", fontWeight: 700 }}>{oppAcc}%</span>
            </div>
            <div style={s.statRow}>
              <span style={{ color: "#60a5fa", fontWeight: 700 }}>{myFin}</span>
              <span style={s.statLabel}>Correct</span>
              <span style={{ color: "#f472b6", fontWeight: 700 }}>{oppFin}</span>
            </div>
          </div>

          {replayState === "invited" ? (
            <div style={s.replayInviteCard}>
              <div style={s.replayInviteText}>
                🎮 <strong>{inviterName}</strong> wants to play again.
              </div>
              <button style={s.replayBtn} onClick={handleAcceptPlayAgain}>
                Accept
              </button>
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

  // ── Active game ────────────────────────────────────────────────────────────
  const q        = questions[currentQ];
  const timerPct = (timeLeft / 15) * 100;

  return (
    <div style={s.page}>
      <HomeButton />

      {/* Players bar */}
      <div style={s.playersBar}>
        <div style={s.playerSide}>
          <div style={s.pName}>{username} <span style={s.youTag}>(you)</span></div>
          <div style={s.pScore}>{myScore} pts</div>
          <div style={s.pProgress}>{currentQ}/{questions.length} answered</div>
        </div>
        <div style={s.vsTag}>VS</div>
        <div style={{ ...s.playerSide, textAlign: "right" }}>
          <div style={s.pName}>{opponent?.username || "Opponent"}</div>
          <div style={s.pScore}>{opponentScore} pts</div>
          <div style={s.pProgress}>{opponentQ}/{questions.length} answered</div>
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

      {/* Question card */}
      <div style={{ ...s.quizCard, opacity: transitioning ? 0 : 1, transition: "opacity 0.3s ease" }}>
        <div style={s.qNum}>Question {currentQ + 1} of {questions.length}</div>
        <h2 style={s.qText}>{q.question}</h2>
        <div style={s.options}>
          {q.options.map((opt, i) => {
            const isSelected  = selected === opt;
            const isCorrect   = opt === q.answer;
            const showResult  = selected !== null;
            return (
              <button
                key={i}
                disabled={selected !== null}
                onClick={() => submitAnswer(opt)}
                style={{
                  ...s.optBtn,
                  ...(showResult && isCorrect            ? s.optCorrect : {}),
                  ...(showResult && isSelected && !isCorrect ? s.optWrong  : {}),
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

  // Players bar
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
  pName:      { fontSize: "15px", fontWeight: 700, color: "#e2e8f0" },
  pScore:     { fontSize: "24px", fontWeight: 800, color: "#60a5fa" },
  pProgress:  { fontSize: "12px", color: "#64748b", marginTop: "2px" },
  vsTag:      { fontSize: "18px", fontWeight: 800, color: "#8b5cf6", padding: "0 8px" },
  youTag:     { fontSize: "11px", color: "#22c55e", marginLeft: "4px" },

  // Timer
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

  // Quiz card
  quizCard: {
    width: "min(100%,720px)",
    margin: "0 auto",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "clamp(20px,4vw,36px)",
  },
  qNum:    { fontSize: "13px", color: "#64748b", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "1px" },
  qText:   { fontSize: "clamp(18px,3vw,24px)", fontWeight: 700, marginBottom: "28px", lineHeight: 1.4 },
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
  optCorrect: { background: "rgba(34,197,94,0.25)",  border: "1.5px solid #22c55e", color: "#fff" },
  optWrong:   { background: "rgba(239,68,68,0.25)",  border: "1.5px solid #ef4444", color: "#fff" },

  // Spinner (waiting screen)
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(255,255,255,0.1)",
    borderTop: "4px solid #60a5fa",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "20px auto 0",
  },

  // Result / waiting card
  resultCard: {
    width: "min(100%,440px)",
    margin: "60px auto",
    padding: "40px 36px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "24px",
    textAlign: "center",
    color: "#fff",
  },
  resultIcon:  { fontSize: "64px", marginBottom: "12px" },
  resultTitle: { fontSize: "28px", fontWeight: 800, marginBottom: "28px" },

  // Score list (game over)
  scoreList: { marginBottom: "20px" },
  scoreRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "16px",
    marginBottom: "8px",
    background: "rgba(255,255,255,0.05)",
  },
  myScoreRow: { background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)" },

  // Stat comparison block (game over)
  statBlock: {
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: "16px",
    marginBottom: "24px",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "8px",
    padding: "6px 0",
    fontSize: "15px",
  },
  statLabel: {
    fontSize: "11px",
    color: "#475569",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
  },

  // Waiting-for-results two-player row
  waitRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "8px",
  },
  waitPlayer: { flex: 1, textAlign: "center" },
  waitName:   { fontSize: "13px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" },
  waitScore:  { fontSize: "28px", fontWeight: 800, color: "#60a5fa" },
  waitPct:    { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  waitDivider: {
    fontSize: "14px",
    fontWeight: 800,
    color: "#8b5cf6",
    paddingTop: "28px",
    flexShrink: 0,
  },

  // Home button
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
  homeBtn: {
    // marginTop: "12px",
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
