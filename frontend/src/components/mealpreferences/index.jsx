import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../../contexts/authContext";
import "./mealpreferences.css";
import ProfileDropdown from "../profile";

const DIET_OPTIONS = ["Vegan", "Halal", "Kosher", "Pescatarian", "Keto", "Vegetarian"];
const ALLERGY_OPTIONS = ["Peanuts", "Dairy", "Gluten", "Shellfish", "Soy", "Nuts"];

const MealPreferences = () => {
  const { currentUser } = useAuth();
  const [userName, setUserName] = useState("User");
  const [selectedDiet, setSelectedDiet] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Set user name from Firebase Auth
        setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "User");

        // Load preferences from Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          
          // Load diet preferences (array format based on your screenshot)
          if (data.diet && Array.isArray(data.diet)) {
            setSelectedDiet(data.diet);
          }

          // Load allergies (array format based on your screenshot)
          if (data.allergies && Array.isArray(data.allergies)) {
            setSelectedAllergies(data.allergies);
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        alert("Failed to load preferences. Please try again.");
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

  const handleSave = async () => {
    if (!currentUser) {
      alert("You must be logged in to save preferences.");
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      
      // Save to Firestore with the same structure as your screenshot
      await setDoc(
        userDocRef,
        {
          diet: selectedDiet,
          allergies: selectedAllergies,
        },
        { merge: true } // This will update only these fields without overwriting other data
      );

      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setSaving(false);
    }
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
      <div className="profile-dropdown-wrapper">
        <ProfileDropdown />
      </div>
      
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
      </div>
    </div>
  );
};

export default MealPreferences;