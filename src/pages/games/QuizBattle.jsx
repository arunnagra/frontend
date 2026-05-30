import React, { useEffect, useRef,useCallback, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import socket from "../../socket/socket";
import { apiUrl } from "../../config/api";

const questions = [
  {
    question: "What is the capital of India?",
    options: [
      "Mumbai",
      "Delhi",
      "Pune",
      "Chennai",
    ],
    answer: "Delhi",
  },
  {
    question: "Which planet is known as Red Planet?",
    options: [
      "Earth",
      "Mars",
      "Venus",
      "Jupiter",
    ],
    answer: "Mars",
  },
  {
    question: "React is developed by?",
    options: [
      "Google",
      "Facebook",
      "Amazon",
      "Microsoft",
    ],
    answer: "Facebook",
  },
  {
    question: "HTML stands for?",
    options: [
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyper Transfer Machine Language",
      "Hyper Tool Multi Language",
    ],
    answer:
      "Hyper Text Markup Language",
  },
  {
    question: "2 + 2 × 2 = ?",
    options: [
      "6",
      "8",
      "4",
      "2",
    ],
    answer: "6",
  },
];

export default function QuizBattle() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    username = "",
    players: initialPlayers = [],
    isHost = false,
  } = location.state || {};

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [score, setScore] = useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState("");

  const [showResult, setShowResult] =
    useState(false);

  const [opponentScore, setOpponentScore] = useState(null);
  const [players, setPlayers] = useState(initialPlayers);
  const recordedRef = useRef(false);

  const recordQuizMatch = useCallback(async (finalScore, otherScore) => {
    try {
      if (players?.length >= 2) {
        const player1 = players[0];
        const player2 = players[1];

        if (finalScore === otherScore) {
          await axios.post(
            apiUrl("/api/match/record-draw"),
            {
              roomId,
              player1Username: player1.username,
              player2Username: player2.username,
              gameType: "quiz-battle",
            }
          );

          socket.emit("match_recorded", {
            roomId,
            draw: true,
            gameType: "quiz-battle",
          });
          return;
        }

        const winner = finalScore > otherScore ? player1 : player2;
        const loser = finalScore > otherScore ? player2 : player1;

        if (winner?.username && loser?.username) {
          await axios.post(
            apiUrl("/api/match/record-match"),
            {
              roomId,
              winnerUsername: winner.username,
              loserUsername: loser.username,
              gameType: "quiz-battle",
            }
          );

          socket.emit("match_recorded", {
            roomId,
            winner: winner.username,
            draw: false,
            gameType: "quiz-battle",
          });
        }
      }
    } catch (error) {
      console.log("Error recording quiz match:", error);
    }},[]);
  const handleOpponentAnswer = useCallback((data) => {
    console.log(
      "Opponent Answer:",
      data
    );
    
    if (data.finalScore !== undefined && data.player !== username) {
      setOpponentScore(data.finalScore);
    }
  },[roomId,username]);

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
      (res) => {
        if (res?.players?.length) {
          setPlayers(res.players);
        }
      }
    );

    socket.on(
      "quiz_answer",
      handleOpponentAnswer
    );

    return () => {
      socket.off(
        "quiz_answer",
        handleOpponentAnswer
      );
    };
  }, [handleOpponentAnswer,roomId,username,recordQuizMatch]);


  const submitAnswer = (option) => {
    if (selectedAnswer) return;

    setSelectedAnswer(option);

    socket.emit("quiz_answer", {
      roomId,
      answer: option,
      player: username,
    });

    if (
      option ===
      questions[currentQuestion].answer
    ) {
      setScore((prev) => prev + 1);
    }

    setTimeout(() => {
      if (
        currentQuestion <
        questions.length - 1
      ) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer("");
      } else {
        
        const finalScore = option === questions[currentQuestion].answer
          ? score + 1
          : score;
        setScore(finalScore);
        setShowResult(true);

        socket.emit("quiz_answer", {
          roomId,
          answer: option,
          player: username,
          finalScore,
        });
      }
    }, 1000);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (
      showResult &&
      opponentScore !== null &&
      !recordedRef.current &&
      (isHost || username === players[0]?.username)
    ) {
      recordedRef.current = true;
      recordQuizMatch(score, opponentScore);
    }
  }, [showResult, opponentScore, score, isHost, players, username],recordQuizMatch);

  const restartGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer("");
    setShowResult(false);
    setOpponentScore(null);
    recordedRef.current = false;
  };

  if (showResult) {
    return (
      <div style={styles.page}>
        <div style={styles.resultCard}>
          <h1>🏆 Quiz Finished</h1>

          <h2>
            Your Score: {score}/
            {questions.length}
          </h2>

          <p>
            Accuracy:
            {" "}
            {Math.round(
              (score /
                questions.length) *
                100
            )}
            %
          </p>

          <button
            style={styles.playAgainBtn}
            onClick={restartGame}
          >
            Play Again
          </button>

          <button
            style={styles.homeBtn}
            onClick={() => navigate("/")}
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  const question =
    questions[currentQuestion];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>🎯 Quiz Battle</h1>

          <p>
            Room ID: {roomId}
          </p>

          <p>
            Player: {username}
          </p>
        </div>

        <button
          style={styles.exitBtn}
          onClick={() => navigate("/")}
        >
          Exit
        </button>
      </div>

      <div style={styles.stats}>
        <span>
          👥 Players:
          {" "}
          {players.length}
        </span>

        <span>
          ⭐ Score:
          {" "}
          {score}
        </span>

        <span>
          📖 Question
          {" "}
          {currentQuestion + 1}
          /
          {questions.length}
        </span>
      </div>

      <div style={styles.quizCard}>
        <h2 style={styles.question}>
          {question.question}
        </h2>

        <div style={styles.options}>
          {question.options.map(
            (option, index) => (
              <button
                key={index}
                onClick={() =>
                  submitAnswer(option)
                }
                disabled={
                  selectedAnswer !== ""
                }
                style={{
                  ...styles.optionBtn,

                  ...(selectedAnswer ===
                    option &&
                  option ===
                    question.answer
                    ? styles.correct
                    : {}),

                  ...(selectedAnswer ===
                    option &&
                  option !==
                    question.answer
                    ? styles.wrong
                    : {}),
                }}
              >
                {option}
              </button>
            )
          )}
        </div>
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
  },

  stats: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "25px",
    marginTop: "25px",
    marginBottom: "30px",
    fontSize: "18px",
    fontWeight: "600",
  },

  quizCard: {
    width: "min(100%, 800px)",
    margin: "0 auto",
    background:
      "rgba(255,255,255,.05)",
    border:
      "1px solid rgba(255,255,255,.08)",
    borderRadius: "20px",
    padding: "30px",
  },

  question: {
    textAlign: "center",
    marginBottom: "30px",
  },

  options: {
    display: "grid",
    gap: "15px",
  },

  optionBtn: {
    padding: "16px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "600",
    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    color: "#fff",
  },

  correct: {
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
  },

  wrong: {
    background:
      "linear-gradient(135deg,#ef4444,#dc2626)",
  },

  exitBtn: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    background: "#ef4444",
    color: "#fff",
  },

  resultCard: {
    width: "min(100%, 500px)",
    margin: "clamp(48px, 10vw, 100px) auto",
    padding: "clamp(24px, 5vw, 40px)",
    textAlign: "center",
    background:
      "rgba(255,255,255,.06)",
    borderRadius: "20px",
    border:
      "1px solid rgba(255,255,255,.08)",
  },

  playAgainBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "20px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    background:
      "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
  },

  homeBtn: {
    width: "100%",
    padding: "15px",
    marginTop: "12px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    background:
      "linear-gradient(135deg,#3b82f6,#8b5cf6)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
  },
};