import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doSignOut } from "../../../features/auth/services/auth-service";

const ProfileDropdown = () => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();

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

    const handleHome = () => {
        setOpen(false);
        navigate("/home");
    };

    return (
        <div className="profile-wrap" ref={wrapperRef}>
            <button
                className="profile-btn"
                onClick={() => setOpen((prev) => !prev)}
                type="button"
                aria-label="Profile menu"
                title="Profile"
            >
                <span className="material-icons" style={{ fontSize: "28px", color: "var(--dusty-olive)" }}>
                    account_circle
                </span>
            </button>

            {open && (
                <nav className="profile-menu" aria-label="Profile navigation">
                    <button className="profile-item" onClick={handleHome}>
                        <span className="material-icons" style={{ fontSize: "18px", marginRight: "var(--space-sm)" }}>home</span>
                        Home
                    </button>

                    <button className="profile-item" onClick={handleMealPreferences}>
                        <span className="material-icons" style={{ fontSize: "18px", marginRight: "var(--space-sm)" }}>restaurant_menu</span>
                        Meal preferences
                    </button>

                    <div className="profile-divider" />

                    <button className="profile-item danger" onClick={handleLogout}>
                        <span className="material-icons" style={{ fontSize: "18px", marginRight: "var(--space-sm)" }}>logout</span>
                        Log out
                    </button>
                </nav>
            )}
        </div>
    );
};

export default ProfileDropdown;
