import React from "react";
import { useAuth } from "../../auth/context/auth-context";
import { useNavigate, Link } from "react-router-dom";
import "./home-page.css";

const HomePage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    if (!currentUser) {
        return (
            <div className="home-page">
                <div className="home-card">
                    <div className="home-logged-out">
                        You are not logged in.
                    </div>
                    <div style={{ marginTop: "var(--space-md)" }}>
                        <Link to="/login" className="back-link">
                            <span className="material-icons">arrow_back</span>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const name = currentUser.displayName || currentUser.email;

    return (
        <div className="home-page">
            <div className="home-wrapper">
                <div className="home-card">
                    <h1 className="home-title">
                        Hello, {name}
                    </h1>

                    <p className="home-message">
                        Welcome to <strong>W Team Meal Preps</strong>
                    </p>
                </div>

                <div className="home-options-outside">
                    <button
                        className="home-btn meal"
                        onClick={() => navigate("/mealpreferences")}
                    >
                        <span className="material-icons" style={{ fontSize: "24px", marginRight: "var(--space-sm)", verticalAlign: "middle" }}>restaurant_menu</span>
                        Meal Preferences
                    </button>
                    <button
                        className="home-btn recipes"
                        onClick={() => navigate("/recipes")}
                    >
                        <span className="material-icons" style={{ fontSize: "24px", marginRight: "var(--space-sm)", verticalAlign: "middle" }}>menu_book</span>
                        Recipes
                    </button>
                    <button className="home-btn shopping">
                        <span className="material-icons" style={{ fontSize: "24px", marginRight: "var(--space-sm)", verticalAlign: "middle" }}>calendar_today</span>
                        Week Planner
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
