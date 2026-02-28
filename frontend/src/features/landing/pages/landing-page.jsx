import "./landing-page.css";
import { Link } from "react-router-dom";
import React from "react";

export default function LandingPage() {
    return (
        <div>
            <div className="landing-container">
                <div className="landing-card">
                    <h1 className="landing-title">Welcome</h1>
                    <p className="landing-subtitle">
                        Start your journey with W team by logging in or creating an account.
                    </p>

                    <div className="landing-buttons">
                        <Link to="/login">
                            <button className="btn-login">Login</button>
                        </Link>

                        <Link to="/register">
                            <button className="btn-register">Register</button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
