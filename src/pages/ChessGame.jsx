
// import React, {
//   useCallback,
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import { Chess } from "chess.js";
// import { Chessboard } from "react-chessboard";
// import Navbar from "../../components/Navbar";
// import socket from "../../socket/socket";


// // ─── Sub-components ───────────────────────────────────────────────────────────

// function StatusBadge({ text, variant = "info" }) {
//   const colors = {
//     info: { bg: "#1e3a5f", border: "#3b82f6", text: "#93c5fd" },
//     warning: { bg: "#3b2800", border: "#f59e0b", text: "#fcd34d" },
//     danger: { bg: "#3b0000", border: "#ef4444", text: "#fca5a5" },
//     success: { bg: "#0a2e1a", border: "#22c55e", text: "#86efac" },
//     muted: { bg: "#1e2433", border: "#374151", text: "#9ca3af" },
//   };
//   const c = colors[variant] || colors.info;
//   return (
//     <span
//       style={{
//         background: c.bg,
//         border: `1px solid ${c.border}`,
//         color: c.text,
//         padding: "4px 14px",
//         borderRadius: 20,
//         fontSize: 13,
//         fontWeight: 600,
//         letterSpacing: 0.3,
//       }}
//     >
//       {text}
//     </span>
//   );
// }

// function MoveHistory({ moves }) {
//   const endRef = useRef(null);

//   useEffect(() => {
//     endRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [moves]);

//   const pairs = [];
//   for (let i = 0; i < moves.length; i += 2) {
//     pairs.push([moves[i], moves[i + 1]]);
//   }

//   return (
//     <div
//       style={{
//         background: "#0f172a",
//         border: "1px solid #1e3a5f",
//         borderRadius: 10,
//         padding: "10px 12px",
//         maxHeight: 220,
//         overflowY: "auto",
//         fontFamily: "'JetBrains Mono', 'Courier New', monospace",
//         fontSize: 13,
//       }}
//     >
//       <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
//         Move History
//       </div>
//       {pairs.length === 0 ? (
//         <div style={{ color: "#374151", fontStyle: "italic" }}>No moves yet</div>
//       ) : (
//         <table style={{ width: "100%", borderCollapse: "collapse" }}>
//           <tbody>
//             {pairs.map(([white, black], i) => (
//               <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
//                 <td style={{ color: "#4b5563", padding: "2px 4px", width: 28 }}>{i + 1}.</td>
//                 <td style={{ color: "#e2e8f0", padding: "2px 8px" }}>{white?.san || ""}</td>
//                 <td style={{ color: "#94a3b8", padding: "2px 8px" }}>{black?.san || ""}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       )}
//       <div ref={endRef} />
//     </div>
//   );
// }

// function PlayerCard({ username, color, isActive, isYou, capturedPieces = [] }) {
//   return (
//     <div
//       style={{
//         display: "flex",
//         alignItems: "center",
//         gap: 10,
//         padding: "8px 14px",
//         background: isActive ? (color === "white" ? "#1a2f4a" : "#2a1a1a") : "#0f172a",
//         border: `1px solid ${isActive ? (color === "white" ? "#3b82f6" : "#ef4444") : "#1e293b"}`,
//         borderRadius: 8,
//         transition: "all 0.3s ease",
//       }}
//     >
//       <span style={{ fontSize: 24 }}>{color === "white" ? "♔" : "♚"}</span>
//       <div>
//         <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14 }}>
//           {username || <span style={{ color: "#4b5563", fontStyle: "italic" }}>Waiting…</span>}
//           {isYou && <span style={{ color: "#64748b", fontWeight: 400, fontSize: 12 }}> (you)</span>}
//         </div>
//         <div style={{ color: "#475569", fontSize: 11, textTransform: "capitalize" }}>{color}</div>
//       </div>
//       {isActive && (
//         <div
//           style={{
//             marginLeft: "auto",
//             width: 8,
//             height: 8,
//             borderRadius: "50%",
//             background: color === "white" ? "#3b82f6" : "#ef4444",
//             boxShadow: `0 0 6px ${color === "white" ? "#3b82f6" : "#ef4444"}`,
//             animation: "pulse 1.2s infinite",
//           }}
//         />
//       )}
//     </div>
//   );
// }

// function GameOverModal({ winner, reason, myColor, onRematch, onLeave, rematchPending }) {
//   const isWin = winner === myColor;
//   const isDraw = winner === "draw";

//   const headings = {
//     win: "Victory! 🏆",
//     draw: "Draw 🤝",
//     loss: "Defeated 😔",
//   };

//   const reasonLabels = {
//     checkmate: "by checkmate",
//     resignation: "by resignation",
//     draw_agreement: "by mutual agreement",
//     abandonment: "by abandonment",
//     stalemate: "by stalemate",
//     threefold: "by threefold repetition",
//     insufficient: "insufficient material",
//   };

//   const heading = isDraw ? headings.draw : isWin ? headings.win : headings.loss;

//   return (
//     <div
//       style={{
//         position: "fixed",
//         inset: 0,
//         background: "rgba(0,0,0,0.75)",
//         backdropFilter: "blur(4px)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         zIndex: 1000,
//       }}
//     >
//       <div
//         style={{
//           background: "#0f172a",
//           border: "1px solid #1e3a5f",
//           borderRadius: 16,
//           padding: "36px 48px",
//           textAlign: "center",
//           maxWidth: 380,
//           width: "90%",
//           boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
//         }}
//       >
//         <div style={{ fontSize: 48, marginBottom: 8 }}>
//           {isDraw ? "⚖️" : isWin ? "🏆" : "💀"}
//         </div>
//         <h2 style={{ color: "#f1f5f9", fontSize: 28, margin: "0 0 6px" }}>{heading}</h2>
//         {reason && (
//           <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 28px" }}>
//             {reasonLabels[reason] || reason}
//           </p>
//         )}
//         <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
//           <button
//             onClick={onRematch}
//             style={{
//               padding: "10px 24px",
//               background: "#1d4ed8",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               cursor: "pointer",
//               fontWeight: 600,
//               fontSize: 14,
//               opacity: rematchPending ? 0.7 : 1,
//             }}
//           >
//             {rematchPending ? "Waiting…" : "Rematch"}
//           </button>
//           <button
//             onClick={onLeave}
//             style={{
//               padding: "10px 24px",
//               background: "#1e293b",
//               color: "#94a3b8",
//               border: "1px solid #334155",
//               borderRadius: 8,
//               cursor: "pointer",
//               fontWeight: 600,
//               fontSize: 14,
//             }}
//           >
//             Leave
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Main Component ────────────────────────────────────────────────────────────

// export default function ChessGame() {
//   const { roomId } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { username = "Guest", isHost = false } = location.state || {};

//   // ── State ──────────────────────────────────────────────────────────────────
//   const [game, setGame] = useState(new Chess());
//   const [fen, setFen] = useState("start");
//   const [moveHistory, setMoveHistory] = useState([]);

//   // myColor is TENTATIVE until server confirms via join_room ack
//   const [myColor, setMyColor] = useState(isHost ? "white" : null);

//   // Server-assigned names for each seat
//   const [whitePlayer, setWhitePlayer] = useState(null);
//   const [blackPlayer, setBlackPlayer] = useState(null);

//   const [gameStatus, setGameStatus] = useState("waiting"); // waiting | active | finished
//   const [winner, setWinner] = useState(null);
//   const [gameOverReason, setGameOverReason] = useState(null);
//   const [statusMessage, setStatusMessage] = useState("Connecting…");
//   const [statusVariant, setStatusVariant] = useState("muted");

//   const [drawOffer, setDrawOffer] = useState(null); // null | "white" | "black"
//   const [rematchPending, setRematchPending] = useState(false);
//   const [spectatorCount, setSpectatorCount] = useState(0);
//   const [connectionError, setConnectionError] = useState(null);

//   // Refs for callbacks that close over mutable state
//   const gameRef = useRef(game);
//   useEffect(() => { gameRef.current = game; }, [game]);
//   const myColorRef = useRef(myColor);
//   useEffect(() => { myColorRef.current = myColor; }, [myColor]);

//   // ── Derived ────────────────────────────────────────────────────────────────

//   const isMyTurn = useMemo(() => {
//     if (gameStatus !== "active" || !myColor) return false;
//     const turn = game.turn() === "w" ? "white" : "black";
//     return turn === myColor;
//   }, [game, myColor, gameStatus]);

//   const isSpectator = myColor === "spectator" || myColor === null;

//   // ── Apply server game state ────────────────────────────────────────────────

//   const applyGameState = useCallback((gs) => {
//     if (!gs) return;

//     // Rebuild chess from FEN
//     const newGame = new Chess(gs.fen);
//     setGame(newGame);
//     setFen(gs.fen);
//     setMoveHistory(gs.moveHistory || []);
//     setGameStatus(gs.status);
//     setWhitePlayer(gs.white);
//     setBlackPlayer(gs.black);
//     setSpectatorCount(gs.spectatorCount || 0);
//     setDrawOffer(gs.drawOffer || null);
//     setWinner(gs.winner);

//     // Compute status message
//     if (gs.status === "finished") {
//       if (gs.winner === "draw") {
//         setStatusMessage("Draw");
//         setStatusVariant("muted");
//       } else {
//         const winnerLabel = gs.winner === "white" ? "White" : "Black";
//         setStatusMessage(`${winnerLabel} wins`);
//         setStatusVariant(gs.winner === myColorRef.current ? "success" : "danger");
//       }
//       return;
//     }

//     if (gs.status === "waiting") {
//       setStatusMessage("Waiting for opponent…");
//       setStatusVariant("muted");
//       return;
//     }

//     if (gs.isCheckmate) {
//       setStatusMessage("Checkmate");
//       setStatusVariant("danger");
//       return;
//     }

//     const turnColor = gs.turn === "white" ? "White" : "Black";
//     if (gs.isCheck) {
//       setStatusMessage(`${turnColor} to move — Check!`);
//       setStatusVariant("warning");
//     } else {
//       setStatusMessage(`${turnColor} to move`);
//       setStatusVariant(gs.turn === myColorRef.current ? "info" : "muted");
//     }
//   }, []);

//   // ── Socket setup ───────────────────────────────────────────────────────────

//   useEffect(() => {
//     if (!socket.connected) socket.connect();

//     // Join room; server acks with color + initial game state
//     socket.emit("join_room", { roomId, username }, (ack) => {
//       if (ack?.error) {
//         setConnectionError(ack.error);
//         return;
//       }
//       if (ack?.color) {
//         setMyColor(ack.color);
//         myColorRef.current = ack.color;
//       }
//       if (ack?.gameState) {
//         applyGameState(ack.gameState);
//       }
//     });

//     // Start the game if host and not already started
//     if (isHost) {
//       setTimeout(() => {
//         socket.emit("start_game", { roomId }, (ack) => {
//           console.log("start_game response:", ack);
//         });
//       }, 500);
//     }

//     // ── Incoming events ──────────────────────────────────────────────────────

//     socket.on("game_start", ({ white, black }) => {
//       setWhitePlayer(white);
//       setBlackPlayer(black);
//       setGameStatus("active");
//       setStatusMessage("White to move");
//       setStatusVariant("muted");
//     });

//     socket.on("chess_move", ({ gameState }) => {
//       if (gameState) applyGameState(gameState);
//     });

//     socket.on("game_over", ({ reason, winner: w, gameState }) => {
//       setGameOverReason(reason);
//       setWinner(w);
//       setGameStatus("finished");
//       if (gameState) applyGameState(gameState);
//     });

//     socket.on("draw_offered", ({ by }) => {
//       setDrawOffer(by);
//     });

//     socket.on("draw_offer_cancelled", () => {
//       setDrawOffer(null);
//     });

//     socket.on("draw_offer_declined", () => {
//       setDrawOffer(null);
//     });

//     socket.on("rematch_requested", () => {
//       // Opponent asked for rematch — prompt or auto-accept UI
//     });

//     socket.on("rematch_started", ({ white, black, gameState }) => {
//       setRematchPending(false);
//       setGameOverReason(null);
//       setWinner(null);
//       setWhitePlayer(white);
//       setBlackPlayer(black);
//       // Color may have swapped — wait for server's next join_room confirmation
//       // or we can infer: if we were white before we are black now
//       setMyColor((prev) => {
//         if (prev === "white") return "black";
//         if (prev === "black") return "white";
//         return prev;
//       });
//       if (gameState) applyGameState(gameState);
//     });

//     socket.on("player_joined", ({ gameState }) => {
//       if (gameState) applyGameState(gameState);
//     });

//     socket.on("player_left", ({ color }) => {
//       if (color === "white") setWhitePlayer(null);
//       if (color === "black") setBlackPlayer(null);
//     });

//     socket.on("connect_error", () => {
//       setConnectionError("Could not connect to game server.");
//     });

//     return () => {
//       socket.off("game_start");
//       socket.off("chess_move");
//       socket.off("game_over");
//       socket.off("draw_offered");
//       socket.off("draw_offer_cancelled");
//       socket.off("draw_offer_declined");
//       socket.off("rematch_requested");
//       socket.off("rematch_started");
//       socket.off("player_joined");
//       socket.off("player_left");
//       socket.off("connect_error");
//     };
//   }, [roomId, username, isHost, applyGameState]);

//   // ── Handlers ───────────────────────────────────────────────────────────────

//   const onDrop = useCallback(
//     (sourceSquare, targetSquare, piece) => {
//       if (!isMyTurn || gameStatus !== "active") return false;
//       if (gameRef.current.isGameOver()) return false;

//       const move = {
//         from: sourceSquare,
//         to: targetSquare,
//         promotion: "q", // default; TODO: show promo picker
//       };

//       // Optimistic local move
//       const gameCopy = new Chess(gameRef.current.fen());
//       let result;
//       try {
//         result = gameCopy.move(move);
//       } catch {
//         return false;
//       }
//       if (!result) return false;

//       // Apply optimistically
//       setGame(gameCopy);
//       setFen(gameCopy.fen());

//       // Emit; if server rejects, it won't broadcast back and UI will resync
//       socket.emit("chess_move", { roomId, move }, (ack) => {
//         if (ack?.error) {
//           // Rollback
//           setGame(gameRef.current);
//           setFen(gameRef.current.fen());
//         }
//       });

//       return true;
//     },
//     [isMyTurn, gameStatus, roomId]
//   );

//   const handleResign = useCallback(() => {
//     if (isSpectator || gameStatus !== "active") return;
//     if (!window.confirm("Are you sure you want to resign?")) return;
//     socket.emit("resign", { roomId });
//   }, [isSpectator, gameStatus, roomId]);

//   const handleOfferDraw = useCallback(() => {
//     if (isSpectator || gameStatus !== "active" || drawOffer) return;
//     socket.emit("offer_draw", { roomId });
//   }, [isSpectator, gameStatus, drawOffer, roomId]);

//   const handleRespondDraw = useCallback(
//     (accept) => {
//       socket.emit("respond_draw", { roomId, accept });
//       setDrawOffer(null);
//     },
//     [roomId]
//   );

//   const handleRematch = useCallback(() => {
//     setRematchPending(true);
//     socket.emit("request_rematch", { roomId });
//   }, [roomId]);

//   const handleLeave = useCallback(() => {
//     navigate("/");
//   }, [navigate]);

//   // ── Render ─────────────────────────────────────────────────────────────────

//   if (connectionError) {
//     return (
//       <>
//         <Navbar />
//         <div style={{ textAlign: "center", color: "#ef4444", marginTop: 80, fontSize: 18 }}>
//           ⚠️ {connectionError}
//           <br />
//           <button
//             onClick={() => navigate("/")}
//             style={{ marginTop: 20, padding: "8px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}
//           >
//             Back to Lobby
//           </button>
//         </div>
//       </>
//     );
//   }

//   const currentTurn = game.turn() === "w" ? "white" : "black";

//   return (
//     <>
//       {/* Inject pulse keyframe */}
//       <style>{`
//         @keyframes pulse {
//           0%, 100% { opacity: 1; }
//           50% { opacity: 0.4; }
//         }
//       `}</style>

//       <Navbar />

//       <div
//         style={{
//           maxWidth: 900,
//           margin: "24px auto",
//           padding: "0 16px",
//           display: "flex",
//           gap: 24,
//           flexWrap: "wrap",
//           justifyContent: "center",
//         }}
//       >
//         {/* ── Board column ── */}
//         <div style={{ flex: "0 0 auto" }}>
//           {/* Opponent player card (top) */}
//           <div style={{ marginBottom: 8 }}>
//             <PlayerCard
//               username={myColor === "white" ? blackPlayer : whitePlayer}
//               color={myColor === "white" ? "black" : "white"}
//               isActive={gameStatus === "active" && currentTurn !== myColor}
//               isYou={false}
//             />
//           </div>

//           {/* Chessboard */}
//           <div style={{ width: "min(560px, 90vw)" }}>
//             <Chessboard
//               position={fen}
//               onPieceDrop={onDrop}
//               boardOrientation={myColor === "black" ? "black" : "white"}
//               arePiecesDraggable={
//                 !isSpectator && isMyTurn && gameStatus === "active"
//               }
//               customBoardStyle={{
//                 borderRadius: 8,
//                 boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
//               }}
//             />
//           </div>

//           {/* My player card (bottom) */}
//           <div style={{ marginTop: 8 }}>
//             <PlayerCard
//               username={myColor === "white" ? whitePlayer : blackPlayer}
//               color={myColor !== "spectator" ? myColor : "white"}
//               isActive={gameStatus === "active" && currentTurn === myColor}
//               isYou={!isSpectator}
//             />
//           </div>
//         </div>

//         {/* ── Sidebar column ── */}
//         <div
//           style={{
//             flex: "1 1 220px",
//             display: "flex",
//             flexDirection: "column",
//             gap: 14,
//             minWidth: 200,
//             maxWidth: 280,
//           }}
//         >
//           {/* Room info */}
//           <div
//             style={{
//               background: "#0f172a",
//               border: "1px solid #1e293b",
//               borderRadius: 10,
//               padding: "12px 16px",
//             }}
//           >
//             <div style={{ color: "#64748b", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
//               Room
//             </div>
//             <div style={{ color: "#cbd5e1", fontSize: 14, fontFamily: "monospace", marginBottom: 6 }}>{roomId}</div>
//             {spectatorCount > 0 && (
//               <div style={{ color: "#4b5563", fontSize: 12 }}>👁 {spectatorCount} spectator{spectatorCount > 1 ? "s" : ""}</div>
//             )}
//           </div>

//           {/* Status */}
//           <div style={{ textAlign: "center" }}>
//             <StatusBadge text={statusMessage} variant={statusVariant} />
//           </div>

//           {/* Draw offer banner */}
//           {drawOffer && drawOffer !== myColor && !isSpectator && (
//             <div
//               style={{
//                 background: "#1a2e1a",
//                 border: "1px solid #22c55e",
//                 borderRadius: 10,
//                 padding: "12px 14px",
//                 textAlign: "center",
//               }}
//             >
//               <div style={{ color: "#86efac", fontSize: 13, marginBottom: 10 }}>
//                 Opponent offers a draw
//               </div>
//               <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
//                 <button
//                   onClick={() => handleRespondDraw(true)}
//                   style={{ padding: "6px 16px", background: "#15803d", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
//                 >
//                   Accept
//                 </button>
//                 <button
//                   onClick={() => handleRespondDraw(false)}
//                   style={{ padding: "6px 16px", background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
//                 >
//                   Decline
//                 </button>
//               </div>
//             </div>
//           )}
//           {drawOffer && drawOffer === myColor && (
//             <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
//               Draw offer sent…
//             </div>
//           )}

//           {/* Action buttons */}
//           {!isSpectator && gameStatus === "active" && (
//             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//               <button
//                 onClick={handleOfferDraw}
//                 disabled={!!drawOffer}
//                 style={{
//                   padding: "9px 0",
//                   background: drawOffer ? "#1e293b" : "#1a3a2a",
//                   color: drawOffer ? "#4b5563" : "#86efac",
//                   border: `1px solid ${drawOffer ? "#334155" : "#22c55e"}`,
//                   borderRadius: 8,
//                   cursor: drawOffer ? "default" : "pointer",
//                   fontWeight: 600,
//                   fontSize: 13,
//                 }}
//               >
//                 🤝 Offer Draw
//               </button>
//               <button
//                 onClick={handleResign}
//                 style={{
//                   padding: "9px 0",
//                   background: "#2d0f0f",
//                   color: "#fca5a5",
//                   border: "1px solid #7f1d1d",
//                   borderRadius: 8,
//                   cursor: "pointer",
//                   fontWeight: 600,
//                   fontSize: 13,
//                 }}
//               >
//                 🏳 Resign
//               </button>
//             </div>
//           )}

//           {isSpectator && (
//             <div
//               style={{
//                 background: "#0f172a",
//                 border: "1px solid #1e293b",
//                 borderRadius: 10,
//                 padding: "12px 14px",
//                 textAlign: "center",
//                 color: "#64748b",
//                 fontSize: 13,
//               }}
//             >
//               👁 Spectating
//             </div>
//           )}

//           {/* Move history */}
//           <MoveHistory moves={moveHistory} />

//           {/* Copy room link */}
//           <button
//             onClick={() => {
//               navigator.clipboard.writeText(window.location.href);
//             }}
//             style={{
//               padding: "8px 0",
//               background: "#0f172a",
//               color: "#64748b",
//               border: "1px solid #1e293b",
//               borderRadius: 8,
//               cursor: "pointer",
//               fontSize: 12,
//             }}
//           >
//             📋 Copy Invite Link
//           </button>
//         </div>
//       </div>

//       {/* Game Over Modal */}
//       {gameStatus === "finished" && winner !== null && (
//         <GameOverModal
//           winner={winner}
//           reason={gameOverReason}
//           myColor={myColor}
//           onRematch={handleRematch}
//           onLeave={handleLeave}
//           rematchPending={rematchPending}
//         />
//       )}
//     </>
//   );
// }
