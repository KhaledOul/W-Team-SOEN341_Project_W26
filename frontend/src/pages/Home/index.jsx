import React from "react";
import { useAuth } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import ProfileDropdown from "../Profile";
import "./home.css";
import Header from "../../components/header";
const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
        <div className="home-top-right"> 
        <ProfileDropdown />              
      </div>
      <div className="home-wrapper">
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
      
          
          {/* Options buttons */}
        <div className="home-options-outside">
          <button 
          className="home-btn meal"
          onClick={() => navigate("/mealpreferences")}
          >
            Meal Preferences
          </button>
          <button 
          className="home-btn recipes"
          onClick={() => navigate("/recipes")}
          >
            Recipes
          </button>
          <button className="home-btn shopping">Week Planner</button>
        </div>
      </div>
    </div>
  );
};

export default Home;