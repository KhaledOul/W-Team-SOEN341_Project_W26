import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/auth/context/auth-context';
import { doSignOut } from '../../../features/auth/services/auth-service';

const Header = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth();

  return (
    <nav className="global-nav" aria-label="Main navigation">
      {userLoggedIn ? (
        <>
          <Link to="/home" className="nav-link">
            Home
          </Link>
          <Link to="/mealpreferences" className="nav-link">
            Meal Preferences
          </Link>
          <Link to="/recipes" className="nav-link">
            Recipes
          </Link>
          <button
            onClick={() => {
              doSignOut();
              navigate('/login');
            }}
            className="nav-btn-logout"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login" className="nav-link">
            Login
          </Link>
          <Link to="/register" className="nav-link">
            Register
          </Link>
        </>
      )}
    </nav>
  );
};

export default Header;
