import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket/socket";

const Game = () => {
  const { roomId } = useParams();

  useEffect(() => {
    console.log("Game started in room:", roomId);
  }, [roomId]);

  return (
    <div>
      <h1>Game Started 🎮</h1>
      <p>Room ID: {roomId}</p>
    </div>
  );
};

export default Game;