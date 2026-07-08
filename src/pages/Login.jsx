import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import "../styles/auth.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(
        apiUrl("/api/auth/login"),
        {
          email,
          password,
        }
      );

      login(
        res.data.token,
        res.data.user
      );

      navigate("/");
    } catch (error) {
      console.error("Login request failed:", error);

      // Show server-provided message when available for easier debugging
      const serverMsg = error.response?.data || error.message || "Login Failed";
      console.error("Server response:", serverMsg);

      alert(
        (typeof serverMsg === "string" ? serverMsg : serverMsg.msg) ||
          "Login Failed"
      );
    }
  };

  return (
    <div className="auth-container">
      <form
        className="auth-form"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      >
        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Login to continue your GameSphere journey
        </p>

        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          value={email}
          onChange={handleChange}
          required
          className="auth-input"
        />

        <input
          type="password"
          name="password"
          placeholder="Enter Password"
          value={password}
          onChange={handleChange}
          required
          className="auth-input"
        />

        <button
          type="submit"
          className="auth-btn"
        >
          Login
        </button>

        <p className="auth-link">
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;