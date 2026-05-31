import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";

import { useLocation, useParams } from "react-router-dom";

import { Chess } from "chess.js";

import { Chessboard } from "react-chessboard";

import Navbar from "../../components/Navbar";

import socket from "../../socket/socket";

export default function ChessGame() {
  const { roomId } = useParams();
  const location = useLocation();
  const { username = "", isHost = false } = location.state || {};

  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [status, setStatus] = useState("White to move");
  const gameRef = useRef(game);

  const myColor = useMemo(() => (isHost ? "white" : "black"), [isHost]);

  const syncStatus = useCallback((gameState) => {
    if (gameState.isCheckmate()) {
      const winner = gameState.turn() === "w" ? "Black" : "White";
      setStatus(`Checkmate. ${winner} wins.`);
      return;
    }

    if (gameState.isDraw()) {
      setStatus("Draw.");
      return;
    }

    if (gameState.isStalemate()) {
      setStatus("Stalemate.");
      return;
    }

    if (gameState.isThreefoldRepetition()) {
      setStatus("Draw by threefold repetition.");
      return;
    }

    if (gameState.isInsufficientMaterial()) {
      setStatus("Draw by insufficient material.");
      return;
    }

    if (gameState.isCheck()) {
      setStatus(`${gameState.turn() === "w" ? "White" : "Black"} to move - check`);
      return;
    }

    setStatus(gameState.turn() === "w" ? "White to move" : "Black to move");
  }, []);

  const makeMove = useCallback((move) => {
    const gameCopy = new Chess(gameRef.current.fen());
    const result = gameCopy.move(move);

    if (result) {
      setGame(gameCopy);
      setFen(gameCopy.fen());
      syncStatus(gameCopy);
      return true;
    }

    return false;
  }, [syncStatus]);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.emit("join_room", { roomId, username }, () => {});

    const handleChessMove = (payload) => {
      const move = payload?.move || payload;
      if (move) makeMove(move);
    };

    socket.on("chess_move", handleChessMove);

    return () => {
      socket.off("chess_move", handleChessMove);
    };
  }, [roomId, username, makeMove]);

  const onDrop = (sourceSquare, targetSquare) => {
    if (gameRef.current.isGameOver()) {
      return false;
    }

    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };

    const validMove = makeMove(moveData);

    if (validMove) {
      socket.emit("chess_move", { roomId, move: moveData });
    }

    return validMove;
  };

  return (
    <>
      <Navbar />

      <div style={{ width: "min(720px, 90%)", margin: "30px auto" }}>
        <h1 style={{ color: "white", textAlign: "center" }}>Chess Game</h1>
        <p style={{ color: "#cbd5e1", textAlign: "center", marginBottom: 12 }}>
          You are viewing from <strong>{myColor}</strong> side.
        </p>
        <p style={{ color: "#93c5fd", textAlign: "center", marginBottom: 16, minHeight: 24 }}>
          {status}
        </p>

        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={myColor}
          arePiecesDraggable={!game.isGameOver()}
        />
      </div>
    </>
  );
}

// styles removed (unused) — layout uses inline styles for the chessboard