import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";

const container = document.getElementById("root");
const root = ReactDOM.createRoot(container);

root.render(
  <AuthProvider>
    <App />
  </AuthProvider>
);