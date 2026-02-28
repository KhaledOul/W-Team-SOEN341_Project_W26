import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../../../context/authContext";
import { doCreateUserWithEmailAndPassword } from "../../../services/firebase/auth";

import "./register.css";

const Register = () => {
  const authCtx = useAuth?.() || null;
  const userLoggedIn = authCtx?.userLoggedIn ?? false;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isRegistering) return;

    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsRegistering(true);

    try {
      await doCreateUserWithEmailAndPassword(email, password);
    } catch (err) {
      setErrorMessage(err?.message || "Failed to create account.");
      setIsRegistering(false);
    }
  };

  return (
    <div className="register-page">
      {userLoggedIn && <Navigate to="/home" replace />}

      <div className="register-card">
        <div className="register-header">
          <h3 className="register-title">Create a New Account</h3>
        </div>

        <form onSubmit={onSubmit} className="register-form">
          <div className="register-field">
            <label>Email</label>
            <input
              className="register-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="register-field">
            <label>Password</label>
            <input
              className="register-input"
              type="password"
              autoComplete="new-password"
              required
              disabled={isRegistering}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="register-field">
            <label>Confirm Password</label>
            <input
              className="register-input"
              type="password"
              autoComplete="off"
              required
              disabled={isRegistering}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {errorMessage && (
            <div className="register-error">{errorMessage}</div>
          )}

          <button
            type="submit"
            disabled={isRegistering}
            className={`register-btn register-btn-primary ${isRegistering ? "is-disabled" : ""
              }`}
          >
            {isRegistering ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <div className="register-footer">
          Already have an account? <Link to="/login">Continue</Link>
        </div>

        <div className="register-back">
          <Link to="/">
            <span className="material-icons" style={{ fontSize: "14px", verticalAlign: "middle", marginRight: "4px" }}>arrow_back</span>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;