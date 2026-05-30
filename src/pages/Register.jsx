import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiUrl } from "../config/api";
import "../styles/auth.css";

function Register() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [step, setStep] = useState(1);

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
      alert("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(
        apiUrl("/api/auth/register"),
        {
          username,
          email,
          password,
        }
      );

      alert(res.data.msg);
      setStep(2);
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.msg ||
          "Registration Failed"
      );
    }
  };
  
  
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const otp = otpArray.join("");

    if (otp.length !== 6) {
      alert("Please enter full 6-digit OTP");
      return;
    }

    try {
      const res = await axios.post(
        apiUrl("/api/auth/verify-register-otp"),
        {
          email,
          otp,
        }
      );

      login(res.data.token, res.data.user);

      alert("Registration Successful");

      navigate("/");
    } catch (error) {
      console.log(error);

      alert(
        error.response?.data?.msg ||
          "Invalid OTP"
      );
    }
  };

  return (
    <div className="auth-container">
      {step === 1 ? (
        <form
          className="auth-form"
          onSubmit={handleRegister}
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
          >
            Send OTP
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
          >
            Verify OTP
          </button>
        </form>
      )}
    </div>
  );
}

export default Register;