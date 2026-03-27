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

  it('should render allergy tags when present', () => {
    renderCard({ allergies: ['Peanuts', 'Dairy'] });

    expect(screen.getByText('Peanuts')).toBeInTheDocument();
    expect(screen.getByText('Dairy')).toBeInTheDocument();
  });

  it('should call onEdit when "View Full Recipe" button is clicked', async () => {
    const { onEdit } = renderCard();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /view full recipe/i }));

    expect(onEdit).toHaveBeenCalledWith('recipe-1');
  });

  it('should show "+X more" when ingredients exceed 3 items', () => {
    renderCard({ ingredients: 'Item 1\nItem 2\nItem 3\nItem 4\nItem 5' });

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should show "No steps added" when steps are empty', () => {
    renderCard({ steps: '' });

    expect(screen.getByText('No steps added')).toBeInTheDocument();
  });

  it('should render "-" when author is not provided', () => {
    renderCard({ author: undefined, authorName: undefined });

    const metaValues = screen.getAllByText('-');
    expect(metaValues.length).toBeGreaterThan(0);
  });

  it('should apply correct difficulty class for easy level', () => {
    renderCard({ difficulty: 'Easy' });

    const badge = screen.getByText('Easy');
    expect(badge).toHaveClass('easy');
  });

  it('should apply correct difficulty class for medium level', () => {
    renderCard({ difficulty: 'Medium' });

    const badge = screen.getByText('Medium');
    expect(badge).toHaveClass('medium');
  });
});
