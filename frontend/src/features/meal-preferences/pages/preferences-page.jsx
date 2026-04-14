import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/auth-context';
import * as preferencesService from '../services/preferences-service';
import './preferences-page.css';

const DIET_OPTIONS = ['Vegan', 'Halal', 'Kosher', 'Pescatarian', 'Keto', 'Vegetarian'];
const ALLERGY_OPTIONS = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish', 'Soy', 'Nuts'];

const PreferencesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [selectedDiet, setSelectedDiet] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const lastSavedDiet = useRef([]);
  const lastSavedAllergies = useRef([]);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setUserName(currentUser.displayName || currentUser.email?.split('@')[0] || 'User');

        // Seed the form from persisted preferences so returning users can edit in place.
        const data = await preferencesService.loadPreferences(currentUser.uid);

        if (data) {
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
        console.error('Error loading preferences:', error);
        setSaveStatus('load-error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser]);

  const handleDietToggle = (diet) => {
    setSelectedDiet((prev) =>
      prev.includes(diet) ? prev.filter((d) => d !== diet) : [...prev, diet]
    );
  };

  const handleAllergyToggle = (allergy) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
    );
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  const handleSave = () => {
    if (!currentUser) return;

    // Capture the current selections so failed saves can roll the UI back consistently.
    const dietSnapshot = [...selectedDiet];
    const allergySnapshot = [...selectedAllergies];

    setSaving(true);
    setSaveStatus(null);

    preferencesService
      .savePreferences(currentUser.uid, {
        diet: dietSnapshot,
        allergies: allergySnapshot,
      })
      .then(() => {
        lastSavedDiet.current = dietSnapshot;
        lastSavedAllergies.current = allergySnapshot;
        setSaveStatus('success');
      })
      .catch((error) => {
        console.error('Error saving preferences:', error);
        // Restore the last known persisted state instead of leaving unsaved UI selections visible.
        setSelectedDiet(lastSavedDiet.current);
        setSelectedAllergies(lastSavedAllergies.current);
        setSaveStatus('error');
      })
      .finally(() => {
        // Auto-dismiss transient save feedback after the snackbar has been visible briefly.
        setSaving(false);
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
      <button className="back-button" onClick={handleBackToHome}>
        ← Back to Home
      </button>
      <div className="preferences-card">
        <div className="user-greeting">Hello, {userName}!</div>

        <h1>Meal Preferences</h1>
        <p className="subtitle">Customize your experience</p>

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

        <button className="save-button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>

        {saveStatus === 'success' && (
          <div className="snackbar snackbar--success">
            <span className="material-icons" style={{ fontSize: '18px' }}>
              check_circle
            </span>{' '}
            Saved
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="snackbar snackbar--error">
            <span className="material-icons" style={{ fontSize: '18px' }}>
              error
            </span>{' '}
            Save failed. Changes reverted.
          </div>
        )}
        {saveStatus === 'load-error' && (
          <div className="snackbar snackbar--error">
            <span className="material-icons" style={{ fontSize: '18px' }}>
              error
            </span>{' '}
            Failed to load preferences. Please refresh.
          </div>
        )}
      </div>
    </div>
  );
};

export default PreferencesPage;
