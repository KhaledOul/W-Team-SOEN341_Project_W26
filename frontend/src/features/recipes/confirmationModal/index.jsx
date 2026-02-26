import React from "react";
import "./confirmationModal.css";

export default function ConfirmationModal({ 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Delete",
  cancelText = "Cancel"
}) {
  return (
    <div className="confirmation-overlay">
      <div className="confirmation-modal">
        <div className="confirmation-header">
          <h2>{title}</h2>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-actions">
          <button 
            className="btn-confirm-cancel" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className="btn-confirm-delete" 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
