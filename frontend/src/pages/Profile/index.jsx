import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doSignOut } from "../../services/firebase/auth";

const ProfileDropdown = () => {
  const [open, setOpen] = useState(false); // dropdown open/close state
  const wrapperRef = useRef(null);         //  ref for click-outside detection
  const navigate = useNavigate();          //   programmatic navigation

  useEffect(() => {
    const handleClickOutside = (e) => {
      
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside); 
    return () =>
      document.removeEventListener("mousedown", handleClickOutside); 
  }, []);

  const handleLogout = async () => {
    await doSignOut();                     
    navigate("/", { replace: true });      
  };

  const handleMealPreferences = () => {
    setOpen(false);                        
    navigate("/mealpreferences");           
  };

  return (
    <div className="profile-wrap" ref={wrapperRef}> {/* added wrapper */}
      <button
        className="profile-btn"             
        onClick={() => setOpen((prev) => !prev)} //  added toggle logic
        type="button"
        title="Profile"
      >
        <img
          src="/src/assets/profile.png"     //  PNG icon (replace path)
          alt="Profile"
          className="profile-icon"          
        />
      </button>

      {open && (                               
        <div className="profile-menu">
          <button
            className="profile-item"
            onClick={handleMealPreferences}    //  added navigation
          >
            Meal preferences
          </button>

          <div className="profile-divider" /> {/*  added divider */}

          <button
            className="profile-item danger"
            onClick={handleLogout}             //  added logout handler
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;