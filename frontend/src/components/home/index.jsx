import React from "react";
import { useAuth } from "../../contexts/authContext";
import "./home.css";

const Home = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="home-page">
        <div className="home-card">
          <div className="home-logged-out">
            You are not logged in.
          </div>
        </div>
      </div>
    );
  }

  const name = currentUser.displayName || currentUser.email;

  return (
    <div className="home-page">
      <div className="home-card">
        {/* Big text */}
        <h1 className="home-title">
          Hello, {name} 👋
        </h1>

        {/* Small text */}
        <p className="home-message">
          Welcome to <strong>W Team Meal Preps</strong>
        </p>
      </div>
    </div>
  );
};

export default Home;