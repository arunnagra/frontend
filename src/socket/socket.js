import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/api";

const socket = io(BACKEND_URL, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  timeout: 10000,
});

socket.on("connect", () => {
  console.log("🟢 Socket Connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("🔴 Socket Disconnected");
});

socket.on("connect_error", (error) => {
  console.error("Socket connect error:", error?.message || error);
});

export default socket;