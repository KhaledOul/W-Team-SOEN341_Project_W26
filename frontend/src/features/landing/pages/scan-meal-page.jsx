import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/auth-context';
import { useRecipe } from '../../recipes/context/recipe-context';
import { analyzeImageAndGenerateRecipe } from '../../../services/geminiAIService';
import './scan-meal-page.css';

const ScanMealPage = () => {
  const { currentUser } = useAuth();
  const { createRecipe } = useRecipe();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);

  if (!currentUser) {
    return (
      <div className="scan-meal-page">
        <div className="scan-meal-card">
          <div className="scan-meal-logged-out">You are not logged in.</div>
          <div style={{ marginTop: 'var(--space-md)' }}>
            <Link to="/login" className="back-link">
              <span className="material-icons">arrow_back</span>
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setGeneratedRecipe(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setGeneratedRecipe(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const recipe = await analyzeImageAndGenerateRecipe(selectedFile);
      setGeneratedRecipe(recipe);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    if (!generatedRecipe) return;

    setLoading(true);
    try {
      await createRecipe({
        ...generatedRecipe,
        author: currentUser.displayName || currentUser.email || 'Anonymous',
      });
      navigate('/recipes');
    } catch (err) {
      console.error('Error saving recipe:', err);
      setError('Failed to save recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setGeneratedRecipe(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="scan-meal-page">
      <div className="scan-meal-wrapper">
        <div className="scan-meal-card">
          <h1 className="scan-meal-title">
            <span className="material-icons" style={{ marginRight: 'var(--space-sm)' }}>
              photo_camera
            </span>
            Scan Meal AI
          </h1>
          <p className="scan-meal-subtitle">
            Upload a photo of your meal and let AI generate a recipe for you
          </p>

          {!generatedRecipe ? (
            <>
              <div
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="material-icons upload-icon">cloud_upload</span>
                    <p>Click or drag an image here</p>
                    <p className="upload-hint">Supports JPEG, PNG, WebP (max 10MB)</p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {error && <div className="error-message">{error}</div>}

              <div className="scan-meal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => navigate('/home')}
                  disabled={loading}
                >
                  <span className="material-icons">arrow_back</span>
                  Back
                </button>
                <button
                  className="btn-primary"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                >
                  {loading ? (
                    <>
                      <span className="material-icons spinning">hourglass_empty</span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">auto_awesome</span>
                      Generate Recipe
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="recipe-preview">
              <h2 className="recipe-preview-title">{generatedRecipe.title}</h2>

              <div className="recipe-meta">
                <span>
                  <span className="material-icons">schedule</span>
                  {generatedRecipe.time} min
                </span>
                <span>
                  <span className="material-icons">attach_money</span>${generatedRecipe.cost}
                </span>
                <span>
                  <span className="material-icons">signal_cellular_alt</span>
                  {generatedRecipe.difficulty}
                </span>
              </div>

              <div className="recipe-section">
                <h3>Ingredients</h3>
                <pre className="recipe-content">{generatedRecipe.ingredients}</pre>
              </div>

              <div className="recipe-section">
                <h3>Steps</h3>
                <pre className="recipe-content">{generatedRecipe.steps}</pre>
              </div>

              {generatedRecipe.diet.length > 0 && (
                <div className="recipe-tags">
                  <strong>Diet:</strong> {generatedRecipe.diet.join(', ')}
                </div>
              )}

              {generatedRecipe.allergies.length > 0 && (
                <div className="recipe-tags warning">
                  <strong>Contains:</strong> {generatedRecipe.allergies.join(', ')}
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              <div className="scan-meal-actions">
                <button className="btn-secondary" onClick={handleReset} disabled={loading}>
                  <span className="material-icons">refresh</span>
                  Try Another
                </button>
                <button className="btn-primary" onClick={handleSaveRecipe} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="material-icons spinning">hourglass_empty</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">save</span>
                      Save Recipe
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanMealPage;
