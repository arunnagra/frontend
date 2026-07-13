import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaLock,
  FaKey,
} from "react-icons/fa";

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
  const [forgotFlow, setForgotFlow] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

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
      toast.error("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(apiUrl("/api/auth/login"), {
        email,
        password,
      });

      login(res.data.token, res.data.user);
      navigate("/");
    } catch (error) {
      console.error("Login request failed:", error);

      const serverMsg = error.response?.data || error.message || "Login Failed";
      console.error("Server response:", serverMsg);

      toast.error(
        (typeof serverMsg === "string" ? serverMsg : serverMsg.msg) ||
        "Login Failed"
      );
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!resetEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {
      await axios.post(apiUrl("/api/auth/forgot-password"), {
        email: resetEmail.trim().toLowerCase(),
      });

      toast.success("OTP sent to your email");
      setResetStep(2);
    } catch (error) {
      const errorMsg =
        error.response?.data?.msg || error.message || "Unable to send OTP";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    setLoading(true);

    try {
      await axios.post(apiUrl("/api/auth/reset-password"), {
        email: resetEmail.trim().toLowerCase(),
        otp,
        password: newPassword,
      });

      toast.success("Password reset successful. Please login again.");
      setForgotFlow(false);
      setResetStep(1);
      setResetEmail("");
      setOtp("");
      setNewPassword("");
    } catch (error) {
      const errorMsg =
        error.response?.data?.msg || error.message || "Unable to reset password";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setForgotFlow(false);
    setResetStep(1);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
  };

  return (
    <div className="auth-container">
      {forgotFlow ? (
        <form
          className="auth-form"
          onSubmit={resetStep === 1 ? handleForgotPassword : handleResetPassword}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              resetStep === 1 ? handleForgotPassword(e) : handleResetPassword(e);
            }
          }}
        >
          <h1>{resetStep === 1 ? "Reset Password" : "Verify OTP"}</h1>

          <p className="auth-subtitle">
            {resetStep === 1
              ? "Enter your email to receive a password reset OTP"
              : "Enter the OTP sent to your email and choose a new password"}
          </p>

          {resetStep === 1 ? (
            <>
              <div className="input-wrapper">
                <FaEnvelope className="input-icon" />

                <input
                  type="email"
                  name="resetEmail"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className="auth-input"
                />
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="input-wrapper">
                <FaKey className="input-icon" />

                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength="6"
                  required
                  className="auth-input"
                />
              </div>

              <div className="password-wrapper">
                <FaLock className="input-icon" />

                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="Create new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="auth-input"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </>
          )}

          <p className="auth-link">
            <button
              type="button"
              className="auth-link-button"
              onClick={handleBackToLogin}
            >
              Back to login
            </button>
          </p>
        </form>
      ) : (
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

          <div className="input-wrapper">
            <FaEnvelope className="input-icon" />

            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="password-wrapper">
            <FaLock className="input-icon" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter Password"
              value={password}
              onChange={handleChange}
              required
              className="auth-input"
            />

            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <div className="forgot-password-container">
            <button
              type="button"
              className="forgot-password-btn"
              onClick={() => {
                setForgotFlow(true);
                setResetStep(1);
              }}
            >
              <FaKey size={12} />
              <span>Forgot Password?</span>
            </button>
          </div>



          <button type="submit" className="auth-btn">
            Login
          </button>


          <p className="auth-link">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </form>
      )}
    </div>
  );
}

export default Login;