import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import "../styles/joinroom.css";

const JoinRoom = () => {
  const { user } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.username || "");
  const [roomId, setRoomId] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
  }, []);

  const gameMap = {
    "tic-tac-toe": {
      id: "tic-tac-toe",
      name: "Tic Tac Toe",
      icon: "⭕",
    },

    chess: {
      id: "chess",
      name: "Chess",
      icon: "♟️",
    },

    "memory-match": {
      id: "memory-match",
      name: "Memory Match",
      icon: "🧠",
    },

    "quiz-battle": {
      id: "quiz-battle",
      name: "Quiz Battle",
      icon: "🎯",
    },

    "snake-ladder": {
      id: "snake-ladder",
      name: "Snake & Ladder",
      icon: "🐍",
    },
  };

  const joinRoom = (e) => {
    e.preventDefault();

    console.log("===== JOIN BUTTON CLICKED =====");

    const trimmedUsername =
      (username || user?.username || "").trim();
    const trimmedRoomId = roomId.trim().toUpperCase();

    console.log("Username:", trimmedUsername);
    console.log("Room ID:", trimmedRoomId);

    if (!trimmedUsername) {
      alert("Enter Username");
      return;
    }

    if (!trimmedRoomId) {
      alert("Enter Room ID");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please log in again");
      return;
    }

    axios
      .post(
        apiUrl("/api/rooms/join"),
        {
          roomId: trimmedRoomId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        const joinedRoom = res.data;

        if (!joinedRoom?.roomId) {
          alert("No response from server");
          return;
        }

        try {
          localStorage.setItem("gs_username", trimmedUsername);
          localStorage.setItem("gs_roomId", trimmedRoomId);
        } catch (e) {}

        navigate(`/lobby/${trimmedRoomId}`, {
          state: {
            roomId: trimmedRoomId,
            username: trimmedUsername,
            players: joinedRoom.players || [],
            isHost: false,
            selectedGame:
              gameMap[joinedRoom.game] || gameMap["tic-tac-toe"],
          },
        });
      })
      .catch((error) => {
        alert(error.response?.data?.msg || "Join room failed");
      });
  };
  return (
    <div className="join-room-page">
      <form onSubmit={joinRoom} className="join-room-card">
        <div>
          <h2 className="join-room-title">Join Room</h2>
          <p className="join-room-subtitle">
            Enter the username and room code provided by the host to join the game.
          </p>
        </div>

        <input
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="join-room-input"
          autoComplete="off"
        />

        <input
          id="roomId"
          name="roomId"
          type="text"
          placeholder="Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="join-room-input"
          autoComplete="off"
        />

        <button type="submit" className="join-room-button">
          Join Room
        </button>

        <p className="join-room-footer">
          Not sure of the room code? Ask the room host to resend it.
        </p>
      </form>
    </div>
  );
};

export default JoinRoom;