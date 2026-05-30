import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket/socket";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";

import "../styles/game.css";
import Navbar from "../components/Navbar";

function GameRoom() {

  const { roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [symbol, setSymbol] = useState("");
  const [resultHandled, setResultHandled] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("joinRoom", {
      roomId,
      user,
    });

    socket.on("playerAssigned", (playerSymbol) => {
      setSymbol(playerSymbol);
    });

    socket.on("roomData", (data) => {
      setRoom(data);

      
      if (data && data.winner && !resultHandled) {
        setResultHandled(true);
        (async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await axios.get(apiUrl("/api/profile"), {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (res.data) {
              const profile = {
                ...res.data,
                matchesPlayed: res.data.matchesPlayed || res.data.matches?.length || 0,
              };

              login(localStorage.getItem("token"), profile);
            }
          } catch (err) {
            console.error("Failed to refresh profile after match:", err);
          }
        })();
      }
    });

    return () => {
      socket.off("playerAssigned");
      socket.off("roomData");
    };

  }, [roomId, user]);

  const handleMove = (index) => {

    if (!room) return;
    if (room.winner) return;

    if (room.turn !== symbol) {
      alert("Not your turn");
      return;
    }

    if (room.board[index] !== "") return;

    socket.emit("makeMove", {
      roomId,
      index,
      symbol,
    });

  };

  return (

    <>
      {}
      <Navbar />

      <div className="container">

        <h1>Game Room</h1>

        <h2>Room ID: {roomId}</h2>
        <h2>Your Symbol: {symbol}</h2>

        {room && (
          <>
            <h3>Turn: {room.turn}</h3>

            {room.winner && (
              <h2>
                {room.winner === "DRAW"
                  ? "Draw Match"
                  : `${room.winner} Wins`}
              </h2>
            )}

            <div className="board">

              {room.board.map((cell, index) => (
                <button
                  key={index}
                  className="cell"
                  onClick={() => handleMove(index)}
                  disabled={cell !== ""}
                >
                  {cell}
                </button>
              ))}

            </div>
          </>
        )}

      </div>
    </>

  );
}

export default GameRoom;