import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmationModal from '../confirmation-modal';

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('ConfirmationModal', () => {
  const defaultProps = {
    title: 'Delete Recipe',
    message: 'Are you sure you want to delete?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render title and message', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByText('Delete Recipe')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
  });

  it('should render confirm and cancel buttons with correct text', () => {
    render(<ConfirmationModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const onConfirm = vi.fn();
    render(<ConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<ConfirmationModal {...defaultProps} onCancel={onCancel} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should render with custom button text', () => {
    render(
      <ConfirmationModal
        {...defaultProps}
        confirmText="Yes, Remove"
        cancelText="Go Back"
      />,
    );

    expect(screen.getByRole('button', { name: /yes, remove/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });
});
