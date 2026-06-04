import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import HomeButton from "../components/HomeButton";
import "../styles/joinroom.css";

const gameMap = {
  "tic-tac-toe": { id: "tic-tac-toe", name: "Tic Tac Toe", icon: "⭕" },
  chess: { id: "chess", name: "Chess", icon: "♟️" },
  "memory-match": { id: "memory-match", name: "Memory Match", icon: "🧠" },
  "quiz-battle": { id: "quiz-battle", name: "Quiz Battle", icon: "🎯" },
  "snake-ladder": { id: "snake-ladder", name: "Snake & Ladder", icon: "🐍" },
};

const JoinRoom = () => {
  const { user } = useContext(AuthContext);
  const [username, setUsername] = useState(user?.username || "");
  const [roomId, setRoomId] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);
  const [joining, setJoining] = useState(false);

  const navigate = useNavigate();

  const fetchAvailableRooms = async () => {
    setLoadingRooms(true);
    setRoomsError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(apiUrl("/api/rooms/available"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(res.data)) {
        setAvailableRooms(res.data);
      } else {
        setRoomsError("Could not load rooms. Please try refreshing.");
        setAvailableRooms([]);
      }
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || "Failed to load rooms";
      setRoomsError(msg);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchAvailableRooms();
  }, []);

  const doJoin = async (targetRoomId) => {
    const trimmedUsername = (username || user?.username || "").trim();
    const trimmedRoomId = targetRoomId.trim().toUpperCase();

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

    setJoining(true);
    try {
      const res = await axios.post(
        apiUrl("/api/rooms/join"),
        { roomId: trimmedRoomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const joinedRoom = res.data;

      if (!joinedRoom?.roomId) {
        alert("No response from server");
        return;
      }

      localStorage.setItem("gs_username", trimmedUsername);
      localStorage.setItem("gs_roomId", trimmedRoomId);

      navigate(`/lobby/${trimmedRoomId}`, {
        state: {
          roomId: trimmedRoomId,
          username: trimmedUsername,
          players: joinedRoom.players || [],
          isHost: false,
          selectedGame: gameMap[joinedRoom.game] || gameMap["tic-tac-toe"],
        },
      });
    } catch (error) {
      alert(error.response?.data?.msg || "Join room failed");
    } finally {
      setJoining(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    doJoin(roomId);
  };

  const handleRoomCardClick = (room) => {
    doJoin(room.roomId);
  };

  return (
    <div className="join-room-page">
      <HomeButton />
      <div className="join-room-layout">
        {/* Form card */}
        <form onSubmit={handleFormSubmit} className="join-room-card">
          <div>
            <h2 className="join-room-title">Join Room</h2>
            <p className="join-room-subtitle">
              Enter a room code below or pick one from the available rooms.
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

          <button type="submit" className="join-room-button" disabled={joining}>
            {joining ? "Joining..." : "Join Room"}
          </button>

          <p className="join-room-footer">
            Not sure of the room code? Pick one from the list below.
          </p>
        </form>

        {/* Available rooms */}
        <div className="available-rooms-section">
          <div className="available-rooms-header">
            <h3 className="available-rooms-title">Available Rooms</h3>
            <button
              className="refresh-btn"
              onClick={fetchAvailableRooms}
              type="button"
            >
              ↻ Refresh
            </button>
          </div>

          {loadingRooms ? (
            <div className="rooms-empty">Loading rooms...</div>
          ) : roomsError ? (
            <div className="rooms-error">{roomsError}</div>
          ) : availableRooms.length === 0 ? (
            <div className="rooms-empty">
              No rooms available right now. Create one!
            </div>
          ) : (
            <div className="rooms-list">
              {availableRooms.map((room) => {
                const game = gameMap[room.game] || gameMap["tic-tac-toe"];
                const host = room.players?.[0]?.username || "Unknown";
                return (
                  <div
                    key={room.roomId}
                    className="room-card"
                    onClick={() => handleRoomCardClick(room)}
                  >
                    <div className="room-card-icon">{game.icon}</div>
                    <div className="room-card-info">
                      <span className="room-card-game">{game.name}</span>
                      <span className="room-card-host">Host: {host}</span>
                    </div>
                    <div className="room-card-right">
                      <span className="room-card-id">{room.roomId}</span>
                      <span className="room-card-players">
                        {room.players?.length ?? 0}/2
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinRoom;
