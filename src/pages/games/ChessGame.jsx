import React, { useEffect, useState, useCallback, useRef } from "react";

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
  const gameRef = useRef(game);

  const makeMove = useCallback((move) => {
    const gameCopy = new Chess(gameRef.current.fen());
    const result = gameCopy.move(move);

    if (result) {
      setGame(gameCopy);
      setFen(gameCopy.fen());
      return true;
    }

    return false;
  }, []);

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

        <Chessboard position={fen} onPieceDrop={onDrop} />
      </div>
    </>
  );
}

// styles removed (unused) — layout uses inline styles for the chessboard