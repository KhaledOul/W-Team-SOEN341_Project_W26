import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doSignOut } from "../../firebase/auth";

const ProfileDropdown = () => {
  const [open, setOpen] = useState(false); // ✅ added: dropdown open/close state
  const wrapperRef = useRef(null);         // ✅ added: ref for click-outside detection
  const navigate = useNavigate();          // ✅ added: programmatic navigation

  useEffect(() => {
    const handleClickOutside = (e) => {
      // ✅ added: close dropdown when clicking outside
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside); // ✅ added
    return () =>
      document.removeEventListener("mousedown", handleClickOutside); // ✅ added
  }, []);

  const handleLogout = async () => {
    await doSignOut();                      // ✅ added: Firebase logout
    navigate("/", { replace: true });       // ✅ added: redirect to landing page
  };

  const handleMealPreferences = () => {
    setOpen(false);                         // ✅ added: close dropdown
    navigate("/mealpreferences");           // ✅ added: route to preferences
  };

  return (
    <div className="profile-wrap" ref={wrapperRef}> {/* ✅ added wrapper */}
      <button
        className="profile-btn"             
        onClick={() => setOpen((prev) => !prev)} // ✅ added toggle logic
        type="button"
        title="Profile"
      >
        <img
          src="/src/assets/profile.png"     // ✅ added: PNG icon (replace path)
          alt="Profile"
          className="profile-icon"          // ✅ added styling hook
        />
      </button>

      {open && (                               // ✅ added conditional dropdown
        <div className="profile-menu">
          <button
            className="profile-item"
            onClick={handleMealPreferences}    // ✅ added navigation
          >
            Meal preferences
          </button>

          <div className="profile-divider" /> {/* ✅ added divider */}

          <button
            className="profile-item danger"
            onClick={handleLogout}             // ✅ added logout handler
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;