// import React, { useCallback, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import socket from "../../socket/socket";
// import HomeButton from "../../components/HomeButton";

// const TicTacToe = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const { roomId = "", username = "", players: initialPlayers = [] } = location.state || {};

//   const [board, setBoard] = useState(Array(9).fill(""));
//   const [turn, setTurn] = useState("X");
//   const [winner, setWinner] = useState("");
//   const [players, setPlayers] = useState(initialPlayers);

//   // Lock symbol once determined — prevents it from flipping if the players
//   // array is reordered after a disconnect/reconnect.
//   const [playerSymbol, setPlayerSymbol] = useState(() => {
//     if (initialPlayers?.length >= 2) {
//       return initialPlayers[0]?.username === username ? "X" : "O";
//     }
//     return null;
//   });

//   useEffect(() => {
//     if (!playerSymbol && players.length >= 2) {
//       setPlayerSymbol(players[0]?.username === username ? "X" : "O");
//     }
//   }, [players, username, playerSymbol]);

//   const symbolToName = (sym) =>
//     sym === "X"
//       ? players[0]?.username || "Player 1"
//       : players[1]?.username || "Player 2";

//   const isMyTurn = !!playerSymbol && turn === playerSymbol && players.length >= 2 && !winner;

//   const statusText = () => {
//     if (players.length < 2) return "⏳ Waiting for opponent to join...";
//     if (winner === "DRAW") return "🤝 It's a Draw!";
//     if (winner) return `🏆 ${symbolToName(winner)} Wins!`;
//     return isMyTurn ? "🎯 Your turn!" : `⏳ ${symbolToName(turn)}'s turn`;
//   };

//   const handleRoomData = useCallback((data) => {
//     setBoard(data.board || Array(9).fill(""));
//     setTurn(data.turn || "X");
//     if (data.players?.length) setPlayers(data.players);
//     setWinner(data.winner || "");
//   }, []);

//   useEffect(() => {
//     if (!socket.connected) socket.connect();

//     socket.emit("join_room", { roomId, username }, (res) => {
//       if (res?.players?.length) setPlayers(res.players);
//     });

//     const handleRoomUpdate = (room) => {
//       if (room?.players) setPlayers(room.players);
//     };

//     socket.on("roomData", handleRoomData);
//     socket.on("room_update", handleRoomUpdate);

//     return () => {
//       socket.off("roomData", handleRoomData);
//       socket.off("room_update", handleRoomUpdate);
//     };
//   }, [roomId, username, handleRoomData]);

//   const makeMove = (index) => {
//     if (!isMyTurn || !playerSymbol || board[index] !== "") return;
//     socket.emit("makeMove", { roomId, index, symbol: playerSymbol });
//   };

//   return (
//     <div style={s.page}>
//       <HomeButton />
//       <div style={s.card}>
//         <h1 style={s.title}>⭕ Tic Tac Toe</h1>

//         {/* Players row */}
//         <div style={s.playersRow}>
//           {[0, 1].map((i) => {
//             const p = players[i];
//             const sym = i === 0 ? "✖" : "⭕";
//             const active = (i === 0 ? turn === "X" : turn === "O") && !winner && players.length >= 2;
//             return (
//               <div key={i} style={{ ...s.playerChip, ...(active ? s.activeChip : {}) }}>
//                 {sym} {p ? p.username : "Waiting..."}
//                 {p?.username === username && <span style={s.youTag}> (you)</span>}
//               </div>
//             );
//           })}
//         </div>

//         <div style={{ ...s.status, ...(winner ? s.statusWin : {}) }}>{statusText()}</div>

//         <div style={s.board}>
//           {board.map((cell, i) => (
//             <button
//               key={i}
//               style={{
//                 ...s.cell,
//                 ...(cell === "X" ? s.cellX : {}),
//                 ...(cell === "O" ? s.cellO : {}),
//                 cursor: isMyTurn && !cell ? "pointer" : "default",
//                 opacity: !cell && !isMyTurn && !winner ? 0.6 : 1,
//               }}
//               onClick={() => makeMove(i)}
//             >
//               {cell}
//             </button>
//           ))}
//         </div>

//         <div style={s.footer}>
//           <span style={s.roomTag}>Room: {roomId}</span>
//           <span style={s.youSymbol}>You: {username} ({playerSymbol})</span>
//           {winner && (
//             <button style={s.homeBtn} onClick={() => navigate("/")}>
//               Back to Home
//             </button>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// const s = {
//   page: {
//     minHeight: "100vh",
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     background: "linear-gradient(135deg,#0f172a,#111827,#1e293b)",
//     padding: "20px",
//   },
//   card: {
//     width: "100%",
//     maxWidth: "520px",
//     background: "rgba(255,255,255,0.05)",
//     border: "1px solid rgba(255,255,255,0.1)",
//     backdropFilter: "blur(20px)",
//     borderRadius: "24px",
//     padding: "32px 28px",
//     color: "#fff",
//     textAlign: "center",
//   },
//   title: { marginBottom: "20px", fontSize: "32px", fontWeight: 700 },
//   playersRow: {
//     display: "flex",
//     justifyContent: "center",
//     gap: "16px",
//     marginBottom: "20px",
//     flexWrap: "wrap",
//   },
//   playerChip: {
//     padding: "8px 18px",
//     borderRadius: "999px",
//     background: "rgba(255,255,255,0.07)",
//     border: "1.5px solid rgba(255,255,255,0.15)",
//     fontSize: "14px",
//     fontWeight: 600,
//     color: "#94a3b8",
//     transition: "0.2s",
//   },
//   activeChip: {
//     background: "rgba(59,130,246,0.2)",
//     border: "1.5px solid #3b82f6",
//     color: "#fff",
//     boxShadow: "0 0 12px rgba(59,130,246,0.35)",
//   },
//   youTag: { color: "#22c55e", fontSize: "12px" },
//   status: {
//     fontSize: "20px",
//     fontWeight: 700,
//     marginBottom: "24px",
//     color: "#60a5fa",
//     minHeight: "30px",
//   },
//   statusWin: { color: "#22c55e", fontSize: "24px" },
//   board: {
//     display: "grid",
//     gridTemplateColumns: "repeat(3,1fr)",
//     gap: "10px",
//     marginBottom: "24px",
//   },
//   cell: {
//     aspectRatio: "1",
//     border: "none",
//     borderRadius: "14px",
//     fontSize: "48px",
//     fontWeight: "bold",
//     color: "#fff",
//     background: "rgba(255,255,255,0.08)",
//     border: "1px solid rgba(255,255,255,0.1)",
//     transition: "0.15s",
//   },
//   cellX: { background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none" },
//   cellO: { background: "linear-gradient(135deg,#3b82f6,#2563eb)", border: "none" },
//   footer: {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     flexWrap: "wrap",
//     gap: "10px",
//     fontSize: "13px",
//     color: "#64748b",
//   },
//   roomTag: { fontFamily: "monospace", letterSpacing: "0.05em" },
//   youSymbol: { color: "#94a3b8" },
//   homeBtn: {
//     padding: "10px 22px",
//     border: "none",
//     borderRadius: "10px",
//     background: "linear-gradient(135deg,#22c55e,#16a34a)",
//     color: "#fff",
//     fontWeight: 700,
//     cursor: "pointer",
//     fontSize: "14px",
//   },
// };

// export default TicTacToe;


import React, { useCallback, useEffect, useMemo, useState } from "react"; // useMemo kept for winningLine
import { useLocation, useParams } from "react-router-dom";
import socket from "../../socket/socket";
import HomeButton from "../../components/HomeButton";
import RoomChat from "../../components/RoomChat";

const winningPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const getWinningLine = (board) => {
  for (const [a, b, c] of winningPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [a, b, c];
    }
  }
  return [];
};

const findBestMove = (board, symbol) => {
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === "") {
      const nextBoard = [...board];
      nextBoard[i] = symbol;
      if (getWinningLine(nextBoard).length) {
        return i;
      }
    }
  }
  return null;
};

const getAIMove = (board, aiSymbol, playerSymbol) => {
  const winMove = findBestMove(board, aiSymbol);
  if (winMove !== null) return winMove;

  const blockMove = findBestMove(board, playerSymbol);
  if (blockMove !== null) return blockMove;

  if (board[4] === "") return 4;

  const corners = [0, 2, 6, 8].filter((index) => board[index] === "");
  if (corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  const edges = [1, 3, 5, 7].filter((index) => board[index] === "");
  if (edges.length) {
    return edges[Math.floor(Math.random() * edges.length)];
  }

  return board.findIndex((cell) => cell === "");
};

const TicTacToe = () => {
  const location = useLocation();
  const { roomId: pathRoomId = "" } = useParams();

  const roomId = location.state?.roomId || pathRoomId || "";
  const initialUsername =
    location.state?.username || localStorage.getItem("gs_username") || "You";
  const username = initialUsername;
  const initialPlayers = location.state?.players || [];

  const isSinglePlayer =
    roomId === "AI" || location.state?.singlePlayer === true;

  const [board, setBoard] = useState(Array(9).fill(""));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState("");
  const [players, setPlayers] = useState(() => {
    if (isSinglePlayer) {
      return [
        { username: initialUsername },
        { username: "Computer" },
      ];
    }
    return initialPlayers;
  });
  const [chat, setChat] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [replayState, setReplayState] = useState(null); // null | "waiting" | "invited"
  const [inviterName, setInviterName] = useState("");
  // Initialise from location.state as best-guess; overwritten by server callback.
  const [playerSymbol, setPlayerSymbol] = useState(() => {
    if (location.state?.playerSymbol) return location.state.playerSymbol;
    if (isSinglePlayer) return "X";
    if (!initialPlayers.length) return null;
    const idx = initialPlayers.findIndex((p) => p.username === username);
    return idx === 0 ? "X" : "O";
  });

  const aiSymbol = useMemo(
    () => (playerSymbol === "X" ? "O" : "X"),
    [playerSymbol]
  );

  const symbolToName = useCallback(
    (sym) =>
      sym === "X"
        ? players[0]?.username || "Player 1"
        : players[1]?.username || "Player 2",
    [players]
  );

  const isMyTurn =
    !!playerSymbol && turn === playerSymbol && players.length >= 2 && !winner;

  const statusText = () => {
    if (!isSinglePlayer && players.length < 2) return "⏳ Waiting for opponent to join...";
    if (winner === "DRAW") return "🤝 It's a Draw!";
    if (winner) return `🏆 ${symbolToName(winner)} Wins!`;
    if (isSinglePlayer) {
      return turn === playerSymbol ? "🎯 Your turn!" : "🤖 Computer is thinking...";
    }
    return isMyTurn ? "🎯 Your turn!" : `⏳ ${symbolToName(turn)}'s turn`;
  };

  const handleRoomData = useCallback((data) => {
    setBoard(data.board || Array(9).fill(""));
    setTurn(data.turn || "X");
    if (data.players?.length) setPlayers(data.players);
    if (Array.isArray(data.chat)) setChat(data.chat.slice(-50));
    setWinner(data.winner || "");
    if (!data.winner && data.board?.every((c) => c === "")) {
      setReplayState(null);
      setInviterName("");
    }
  }, []);

  const addChatMessage = useCallback((message) => {
    setChat((prev) => [...prev, message].slice(-50));
  }, []);

  useEffect(() => {
    if (!roomId || isSinglePlayer) return;

    const joinRoom = () => {
      socket.emit("join_room", { roomId, username }, (res) => {
        if (res?.error) return;
        if (res?.players?.length >= 2) setPlayers(res.players);
        if (res?.symbol) setPlayerSymbol(res.symbol);
      });
    };

    const handleRoomUpdate = (room) => {
      if (room?.players?.length >= 2) setPlayers(room.players);
      if (room?.chat) setChat(room.chat);
    };

    const handleChatUpdate = (payload) => {
      if (Array.isArray(payload?.chat)) {
        setChat((prev) => {
          const merged = [...prev, ...payload.chat].slice(-50);
          const unique = [];
          const seen = new Set();
          merged.forEach((item) => {
            const key = item?.id || `${item?.sender}-${item?.timestamp}-${item?.text}`;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(item);
            }
          });
          return unique.slice(-50);
        });
      }
    };

    const handleTyping = ({ username: typingName }) => {
      if (!typingName || typingName === username) return;
      setTypingUsers((prev) => {
        if (prev.includes(typingName)) return prev;
        return [...prev, typingName];
      });
    };

    const handleStopTyping = ({ username: typingName }) => {
      if (!typingName) return;
      setTypingUsers((prev) => prev.filter((name) => name !== typingName));
    };

    const handleReplayInvite = ({ invitedBy }) => {
      if (invitedBy === username) {
        setReplayState("waiting");
      } else {
        setInviterName(invitedBy);
        setReplayState("invited");
      }
    };

    if (!socket.connected) socket.connect();

    joinRoom();

    socket.on("connect", joinRoom);
    socket.on("roomData", handleRoomData);
    socket.on("room_update", handleRoomUpdate);
    socket.on("chat_update", handleChatUpdate);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("replay_invite", handleReplayInvite);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("roomData", handleRoomData);
      socket.off("room_update", handleRoomUpdate);
      socket.off("chat_update", handleChatUpdate);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("replay_invite", handleReplayInvite);
    };
  }, [roomId, username, handleRoomData]);

  const makeMove = (index) => {
    if (board[index] !== "" || winner) return;
    if (isSinglePlayer) {
      if (turn !== playerSymbol) return;
      setBoard((prev) => {
        const next = [...prev];
        next[index] = playerSymbol;
        return next;
      });
      setTurn(aiSymbol);
      return;
    }
    if (!isMyTurn) return;
    socket.emit("makeMove", { roomId, index, symbol: playerSymbol });
  };

  const sendChatMessage = (text) => {
    const trimmedText = text?.trim();
    if (!trimmedText) return;

    const optimisticMessage = {
      id: `local-${Date.now()}`,
      type: "user",
      sender: username,
      text: trimmedText,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(optimisticMessage);

    socket.emit("send_chat_message", { roomId, username, text: trimmedText }, (ack) => {
      if (ack?.error) {
        setChat((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
        console.warn("Chat send failed:", ack.error);
      }
    });
  };

  const startTyping = () => {
    socket.emit("typing", { roomId, username });
  };

  const stopTyping = () => {
    socket.emit("stop_typing", { roomId, username });
  };

  const handlePlayAgain = () => {
    if (isSinglePlayer) {
      setBoard(Array(9).fill(""));
      setTurn(playerSymbol === "X" ? "X" : aiSymbol);
      setWinner("");
      setReplayState(null);
      return;
    }
    socket.emit("replay_request", { roomId, username });
  };

  const handleAcceptReplay = () => {
    socket.emit("replay_accept", { roomId });
  };

  const evaluateBoardWinner = useCallback((boardState) => {
    for (const [a, b, c] of winningPatterns) {
      if (
        boardState[a] &&
        boardState[a] === boardState[b] &&
        boardState[a] === boardState[c]
      ) {
        return boardState[a];
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (winner) return;

    const result = evaluateBoardWinner(board);
    if (result) {
      setWinner(result);
      return;
    }

    if (board.every((cell) => cell !== "")) {
      setWinner("DRAW");
    }
  }, [board, winner, evaluateBoardWinner]);

  useEffect(() => {
    if (!isSinglePlayer || winner || turn !== aiSymbol) return;

    const timer = window.setTimeout(() => {
      const move = getAIMove(board, aiSymbol, playerSymbol);
      if (move === null || move === undefined || move < 0) return;

      setBoard((prev) => {
        const next = [...prev];
        next[move] = aiSymbol;
        return next;
      });
      setTurn(playerSymbol);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [board, isSinglePlayer, winner, turn, aiSymbol, playerSymbol]);

  const winningLine = useMemo(() => {
    const patterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of patterns) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return [a, b, c];
      }
    }
    return [];
  }, [board]);

  return (
    <div style={s.page}>
      <HomeButton />
      <div style={s.card}>
        <h1 style={s.title}>⭕ Tic Tac Toe</h1>

        <div style={s.playersRow}>
          {[0, 1].map((i) => {
            const p = players[i];
            const sym = i === 0 ? "✖" : "⭕";
            const active =
              (i === 0 ? turn === "X" : turn === "O") &&
              !winner &&
              players.length >= 2;
            return (
              <div
                key={i}
                style={{
                  ...s.playerChip,
                  ...(active ? s.activeChip : {}),
                }}
              >
                {sym} {p ? p.username : "Waiting..."}
                {p?.username === username && (
                  <span style={s.youTag}> (you)</span>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            ...s.status,
            ...(winner ? s.statusWin : {}),
          }}
        >
          {statusText()}
        </div>

        <div style={s.board}>
          {board.map((cell, i) => {
            const isWinCell = winningLine.includes(i);
            return (
              <button
                key={i}
                style={{
                  ...s.cell,
                  ...(cell === "X" ? s.cellX : {}),
                  ...(cell === "O" ? s.cellO : {}),
                  ...(isWinCell ? s.cellWin : {}),
                  cursor:
                    isMyTurn && !cell && !winner ? "pointer" : "default",
                  opacity:
                    !cell && !isMyTurn && !winner ? 0.6 : 1,
                }}
                onClick={() => makeMove(i)}
                disabled={!!winner || !!cell || !isMyTurn}
              >
                {cell}
              </button>
            );
          })}
        </div>

        {winner && replayState === "invited" && (
          <div style={s.inviteBanner}>
            🎮 <strong>{inviterName}</strong> wants to play again!
            <button style={s.acceptBtn} onClick={handleAcceptReplay}>
              ✅ Accept
            </button>
          </div>
        )}

        <div style={s.footer}>
          <span style={s.roomTag}>Room: {roomId}</span>
          <span style={s.youSymbol}>
            You: {username} ({playerSymbol})
          </span>
          {winner && replayState === null && (
            <button style={s.replayBtn} onClick={handlePlayAgain}>
              🔄 Play Again
            </button>
          )}
          {winner && replayState === "waiting" && (
            <span style={s.waitingText}>⏳ Waiting for opponent to accept…</span>
          )}
        </div>
      </div>

      {!isSinglePlayer && (
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
    </div>
  );
};

const s = {
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
    maxWidth: "520px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "32px 28px",
    color: "#fff",
    textAlign: "center",
  },
  title: {
    marginBottom: "20px",
    fontSize: "32px",
    fontWeight: 700,
  },
  playersRow: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  playerChip: {
    padding: "8px 18px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.07)",
    border: "1.5px solid rgba(255,255,255,0.15)",
    fontSize: "14px",
    fontWeight: 600,
    color: "#94a3b8",
    transition: "0.2s",
  },
  activeChip: {
    background: "rgba(59,130,246,0.2)",
    border: "1.5px solid #3b82f6",
    color: "#fff",
    boxShadow: "0 0 12px rgba(59,130,246,0.35)",
  },
  youTag: {
    color: "#22c55e",
    fontSize: "12px",
  },
  status: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "24px",
    color: "#60a5fa",
    minHeight: "30px",
  },
  statusWin: {
    color: "#22c55e",
    fontSize: "24px",
  },
  board: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: "10px",
    marginBottom: "24px",
  },
  cell: {
    aspectRatio: "1",
    borderRadius: "14px",
    fontSize: "48px",
    fontWeight: "bold",
    color: "#fff",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
    transition: "transform 0.1s, box-shadow 0.1s",
  },
  cellX: {
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    border: "none",
  },
  cellO: {
    background: "linear-gradient(135deg,#3b82f6,#2563eb)",
    border: "none",
  },
  cellWin: {
    boxShadow: "0 0 18px 4px rgba(250,204,21,0.55)",
    border: "2px solid #facc15",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    fontSize: "13px",
    color: "#64748b",
  },
  roomTag: {
    fontFamily: "monospace",
    letterSpacing: "0.05em",
  },
  youSymbol: {
    color: "#94a3b8",
  },
  replayBtn: {
    padding: "10px 22px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  inviteBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "16px",
    padding: "14px 20px",
    borderRadius: "14px",
    background: "rgba(139,92,246,0.15)",
    border: "1.5px solid rgba(139,92,246,0.5)",
    color: "#c4b5fd",
    fontSize: "15px",
    flexWrap: "wrap",
  },
  acceptBtn: {
    padding: "9px 20px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg,#22c55e,#16a34a)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  waitingText: {
    color: "#94a3b8",
    fontSize: "13px",
    fontStyle: "italic",
  },
};

export default TicTacToe;