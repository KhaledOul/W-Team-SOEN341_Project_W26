import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../services/firebase/firebase";
import { useAuth } from "../../context/authContext";
import "./mealpreferences.css";

const DIET_OPTIONS = ["Vegan", "Halal", "Kosher", "Pescatarian", "Keto", "Vegetarian"];
const ALLERGY_OPTIONS = ["Peanuts", "Dairy", "Gluten", "Shellfish", "Soy", "Nuts"];

const MealPreferences = () => {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState("User");
  const [selectedDiet, setSelectedDiet] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null

  // Keep a ref to the last-known-good state for rollback
  const lastSavedDiet = useRef([]);
  const lastSavedAllergies = useRef([]);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "User");

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();

          if (data.diet && Array.isArray(data.diet)) {
            setSelectedDiet(data.diet);
            lastSavedDiet.current = data.diet;
          }

          if (data.allergies && Array.isArray(data.allergies)) {
            setSelectedAllergies(data.allergies);
            lastSavedAllergies.current = data.allergies;
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        setSaveStatus("load-error");
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser]);

  const handleDietToggle = (diet) => {
    setSelectedDiet((prev) =>
      prev.includes(diet)
        ? prev.filter((d) => d !== diet)
        : [...prev, diet]
    );
  };

  const handleAllergyToggle = (allergy) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleSave = () => {
    if (!currentUser) return;

    // Optimistic: capture current state, mark as saving, fire DB write in background
    const dietSnapshot = [...selectedDiet];
    const allergySnapshot = [...selectedAllergies];

    setSaving(true);
    setSaveStatus(null);

    const userDocRef = doc(db, "users", currentUser.uid);

    setDoc(
      userDocRef,
      {
        diet: dietSnapshot,
        allergies: allergySnapshot,
      },
      { merge: true }
    )
      .then(() => {
        lastSavedDiet.current = dietSnapshot;
        lastSavedAllergies.current = allergySnapshot;
        setSaveStatus("success");
      })
      .catch((error) => {
        console.error("Error saving preferences:", error);
        // Rollback to last known good state
        setSelectedDiet(lastSavedDiet.current);
        setSelectedAllergies(lastSavedAllergies.current);
        setSaveStatus("error");
      })
      .finally(() => {
        setSaving(false);
        // Auto-clear status after 2s
        setTimeout(() => setSaveStatus(null), 2000);
      });
  };

  if (loading) {
    return (
      <div className="meal-preferences-container">
        <div className="preferences-card">
          <p>Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-preferences-container">
      <div className="preferences-card">
        <div className="user-greeting">Hello, {userName}!</div>

        <h1>Meal Preferences</h1>
        <p className="subtitle">Customize your experience</p>

        {/* Diet Options */}
        <div className="preference-section">
          <h3>Dietary Preferences</h3>
          <div className="options-group">
            {DIET_OPTIONS.map((diet) => (
              <div key={diet} className="option-item">
                <input
                  type="checkbox"
                  id={`diet-${diet}`}
                  checked={selectedDiet.includes(diet)}
                  onChange={() => handleDietToggle(diet)}
                />
                <label htmlFor={`diet-${diet}`}>{diet}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Allergy Options */}
        <div className="preference-section">
          <h3>Allergies</h3>
          <div className="options-group">
            {ALLERGY_OPTIONS.map((allergy) => (
              <div key={allergy} className="option-item">
                <input
                  type="checkbox"
                  id={`allergy-${allergy}`}
                  checked={selectedAllergies.includes(allergy)}
                  onChange={() => handleAllergyToggle(allergy)}
                />
                <label htmlFor={`allergy-${allergy}`}>{allergy}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          className="save-button"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>

        {/* Inline save status indicator */}
        {saveStatus === "success" && (
          <div className="snackbar snackbar--success">
            <span className="material-icons" style={{ fontSize: "18px" }}>check_circle</span>
            Saved
          </div>
        )}
        {saveStatus === "error" && (
          <div className="snackbar snackbar--error">
            <span className="material-icons" style={{ fontSize: "18px" }}>error</span>
            Save failed. Changes reverted.
          </div>
        )}
        {saveStatus === "load-error" && (
          <div className="snackbar snackbar--error">
            <span className="material-icons" style={{ fontSize: "18px" }}>error</span>
            Failed to load preferences. Please refresh.
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPreferences;