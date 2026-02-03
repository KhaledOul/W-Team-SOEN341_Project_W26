import React, { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  doSignInWithEmailAndPassword,
  doSignInWithGoogle,
} from "../../../firebase/auth";
import { useAuth } from "../../../contexts/authContext";
import Header from "../../header";

import "./login.css";

const Login = () => {
  const authCtx = useAuth?.() || null;
  const userLoggedIn = authCtx?.userLoggedIn ?? false;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");

    try {
      await doSignInWithEmailAndPassword(email, password);
    } catch (err) {
      setErrorMessage(err?.message || "Failed to sign in.");
      setIsSigningIn(false);
    }
  };

  const onGoogleSignIn = async (e) => {
    e.preventDefault();
    if (isSigningIn) return;

    setIsSigningIn(true);
    setErrorMessage("");

    try {
      await doSignInWithGoogle();
    } catch (err) {
      setErrorMessage(err?.message || "Google sign-in failed.");
      setIsSigningIn(false);
    }
  };

  return (
    <div className="login-page">
      {userLoggedIn && <Navigate to="/home" replace />}

      <div className="login-card">
        <div className="login-header">
          <h3 className="login-title">Welcome Back</h3>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <div className="login-field">
            <label>Email</label>
            <input
              className="login-input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="login-field">
            <label>Password</label>
            <input
              className="login-input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {errorMessage && <div className="login-error">{errorMessage}</div>}

          <button
            type="submit"
            disabled={isSigningIn}
            className={`login-btn login-btn-primary ${
              isSigningIn ? "is-disabled" : ""
            }`}
          >
            {isSigningIn ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          Don't have an account?{" "}
          <Link to="/register">Sign up</Link>
        </div>

        <div className="login-divider">
          <div className="login-divider-line" />
          <div className="login-divider-text">OR</div>
          <div className="login-divider-line" />
        </div>

        <button
          disabled={isSigningIn}
          onClick={onGoogleSignIn}
          className={`login-btn login-btn-google ${
            isSigningIn ? "is-disabled" : ""
          }`}
        >
        <img
            src="/src/assets/google.png"   // 👈 replace with your actual PNG path
            alt="Google logo"
            className="google-icon"
        />

          {isSigningIn ? "Signing In..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
};

export default Login;