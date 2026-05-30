import { useState, useEffect, useCallback, useRef } from "react";

import { Chess } from "chess.js";

import { Chessboard } from "react-chessboard";

import Navbar from "../components/Navbar";

import socket from "../socket/socket";

function ChessGame() {

  const [game, setGame] = useState(new Chess());

  const [fen, setFen] = useState(game.fen());

  const gameRef = useRef(game);

  const roomId = "chess-room";

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
    socket.emit("join_room", roomId);

    const handleChessMove = (move) => {
      makeMove(move);
    };

    socket.on("chess_move", handleChessMove);

    return () => {
      socket.off("chess_move", handleChessMove);
    };
  }, [roomId, makeMove]);

  const onDrop = (sourceSquare, targetSquare) => {
    const moveData = {
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    };

    const validMove = makeMove(moveData);

    
    if (validMove) {
      socket.emit("chess_move", {
        roomId,
        move: moveData,
      });
    }

    return validMove;
  };

  return (

    <>
      <Navbar />

      <div
        style={{
          width: "500px",
          margin: "30px auto",
        }}
      >

        <h1
          style={{
            color: "white",
            textAlign: "center",
          }}
        >
          Chess Game
        </h1>

        <Chessboard
          position={fen}
          onPieceDrop={onDrop}
        />

      </div>
    </>
  );
}

export default ChessGame;