import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const { username, email, password } = formData;


  const [otpArray, setOtpArray] = useState(new Array(6).fill(""));

  
  
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  
  
  
  const handleOtpChange = (element, index) => {
    const value = element.value.replace(/\D/g, "");

    const newOtp = [...otpArray];
    newOtp[index] = value;

    setOtpArray(newOtp);

    if (value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (
      e.key === "Backspace" &&
      !otpArray[index] &&
      e.target.previousSibling
    ) {
      e.target.previousSibling.focus();
    }
  };

  
  const handlePaste = (e) => {
    e.preventDefault();

    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    const newOtp = [...otpArray];

    pastedData.split("").forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit;
      }
    });

    setOtpArray(newOtp);
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      toast.error("Please fill all fields");
      return;
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (password.length < 3) {
      toast.error("Password must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        apiUrl("/api/auth/register"),
        {
          username,
          email,
          password,
        }
      );

      toast.success(res.data.msg || "OTP sent successfully");
      setStep(2);
    } catch (error) {
      console.error("Register error:", error);

      const errorMsg = error.response?.data?.msg || error.message || "Registration Failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const otp = otpArray.join("");

    if (otp.length !== 6) {
      toast.error("Please enter full 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        apiUrl("/api/auth/verify-register-otp"),
        {
          email,
          otp,
        }
      );

      login(res.data.token, res.data.user);

      toast.success("Registration Successful!");

      navigate("/");
    } catch (error) {
      console.error("OTP verification error:", error);

      const errorMsg = error.response?.data?.msg || error.message || "Invalid OTP";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {step === 1 ? (
        <form
          className="auth-form"
          onSubmit={handleRegister}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleRegister(e);
            }
          }}
        >
          <h1>Join GameSphere</h1>

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={username}
            onChange={handleChange}
            required
            className="auth-input"
          />

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
            placeholder="Create Password"
            value={password}
            onChange={handleChange}
            required
            className="auth-input"
          />

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <p className="auth-link">
            Already have an account?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>
        </form>
      ) : (
        <form
          className="auth-form"
          onSubmit={handleVerifyOtp}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleVerifyOtp(e);
            }
          }}
        >
          <h1>Verify OTP</h1>

          <p className="otp-text">
            Enter the 6-digit code sent to
            <br />
            <strong>{email}</strong>
          </p>

          <div
            className="otp-container"
            onPaste={handlePaste}
          >
            {otpArray.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) =>
                  handleOtpChange(
                    e.target,
                    index
                  )
                }
                onKeyDown={(e) =>
                  handleKeyDown(
                    e,
                    index
                  )
                }
                className="otp-box"
              />
            ))}
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}
    </div>
  );
}

export default Register;