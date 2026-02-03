import React from "react";
import { useAuth } from "../../contexts/authContext";
import "./home.css";
import Header from "../header";

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
    <div>
      <Header></Header>

      

      <div className="home-page">
        <div>
          <h1 className="home-title">
            Hello, {name} 👋
          </h1>
        </div>

        
      </div>
    </div>
  );
};

export default Home;