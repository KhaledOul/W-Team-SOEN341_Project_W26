import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecipeCard from '../recipe-card';
import { mockRecipe } from '../../../../test/mockData';

/* ── helpers ───────────────────────────────────────────────────────────────── */

function renderCard(overrides = {}, handlers = {}) {
  const recipe = { ...mockRecipe, ...overrides };
  const onEdit = handlers.onEdit ?? vi.fn();
  const onDelete = handlers.onDelete ?? vi.fn();

  return {
    ...render(<RecipeCard recipe={recipe} onEdit={onEdit} onDelete={onDelete} />),
    onEdit,
    onDelete,
  };
}

/* ── tests ─────────────────────────────────────────────────────────────────── */

describe('RecipeCard', () => {
  it('should render recipe title, prep time, and cost', () => {
    renderCard();

    expect(screen.getByText('Spaghetti Bolognese')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('$12.50')).toBeInTheDocument();
  });

  it('should render dietary tags when present', () => {
    renderCard({ diet: ['Vegan', 'Keto'] });

    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Keto')).toBeInTheDocument();
  });

  it('should not crash when optional fields are undefined', () => {
    const recipe = {
      id: 'r-minimal',
      title: 'Minimal Recipe',
      ingredients: '',
      steps: '',
    };

    expect(() =>
      render(<RecipeCard recipe={recipe} onEdit={vi.fn()} onDelete={vi.fn()} />)
    ).not.toThrow();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const { onEdit } = renderCard();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /edit recipe/i }));

    expect(onEdit).toHaveBeenCalledWith('recipe-1');
  });

  it('should call onDelete when delete button is clicked', async () => {
    const { onDelete } = renderCard();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /delete recipe/i }));

    expect(onDelete).toHaveBeenCalledWith('recipe-1');
  });

  it('should render a difficulty badge with the correct level', () => {
    renderCard({ difficulty: 'Hard' });

    const badge = screen.getByText('Hard');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('hard');
  });
});
