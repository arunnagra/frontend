import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useContext, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import { Toaster, toast } from "react-hot-toast";
import socket from "./socket/socket";


import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";


import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Lobby from "./pages/Lobby";


import TicTacToe from "./pages/games/TicTacToe";
// import ChessGame from "./pages/games/ChessGame";
import QuizBattle from "./pages/games/QuizBattle";
import MemoryMatch from "./pages/games/MemoryMatch";
import SnakeLadder from "./pages/games/SnakeLadder";

function App() {
  const { isAuth } = useContext(AuthContext);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleMatchRecorded = (payload) => {
      if (payload?.draw) {
        toast(
          payload.gameType
            ? `${payload.gameType} ended in a draw`
            : "Match ended in a draw",
          {
            style: {
              borderRadius: "16px",
              background: "linear-gradient(135deg,#0f172a,#1e293b)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
            },
            icon: "🤝",
          }
        );
        return;
      }

      toast.success(
        `${payload?.winner || "A player"} won the match`,
        {
          style: {
            borderRadius: "16px",
            background: "linear-gradient(135deg,#16a34a,#22c55e)",
            color: "#fff",
            fontWeight: "700",
            border: "1px solid rgba(255,255,255,0.12)",
          },
          icon: "🏆",
        }
      );
    };

    socket.on("match_recorded", handleMatchRecorded);

    return () => {
      socket.off("match_recorded", handleMatchRecorded);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
        }}
      />
      <Routes>

        {

}

        <Route
          path="/login"
          element={
            isAuth
              ? <Navigate to="/" />
              : <Login />
          }
        />

        <Route
          path="/register"
          element={
            isAuth
              ? <Navigate to="/" />
              : <Register />
          }
        />

        {

}

        <Route
          path="/"
          element={
            isAuth
              ? <Home />
              : <Navigate to="/login" />
          }
        />

        {

}

        <Route
          path="/create-room"
          element={
            isAuth
              ? <CreateRoom />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/join-room"
          element={
            isAuth
              ? <JoinRoom />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/lobby/:roomId"
          element={
            isAuth
              ? <Lobby />
              : <Navigate to="/login" />
          }
        />

        {

}

        {}
        <Route
          path="/game/:roomId"
          element={
            isAuth
              ? <TicTacToe />
              : <Navigate to="/login" />
          }
        />

        {}
        {/*
        <Route
          path="/chess/:roomId"
          element={
            isAuth
              ? <ChessGame />
              : <Navigate to="/login" />
          }
        />
        */}

        <Route
          path="/quiz/:roomId"
          element={
            isAuth
              ? <QuizBattle />
              : <Navigate to="/login" />
          }
        />

        {}
        <Route
          path="/memory/:roomId"
          element={
            isAuth
              ? <MemoryMatch />
              : <Navigate to="/login" />
          }
        />

        {}
        <Route
          path="/snake/:roomId"
          element={
            isAuth
              ? <SnakeLadder />
              : <Navigate to="/login" />
          }
        />

        {

}

        <Route
          path="/leaderboard"
          element={
            isAuth
              ? <Leaderboard />
              : <Navigate to="/login" />
          }
        />

        <Route
          path="/profile"
          element={
            isAuth
              ? <Profile />
              : <Navigate to="/login" />
          }
        />

        {}
        {/*
        <Route
          path="/chess"
          element={
            isAuth
              ? <ChessGame />
              : <Navigate to="/login" />
          }
        />
        */}

        {

}

        <Route
          path="*"
          element={<Navigate to="/" />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;