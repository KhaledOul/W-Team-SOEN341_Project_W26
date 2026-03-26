export const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  providerData: [{ providerId: 'password' }],
};

export const mockRecipe = {
  id: 'recipe-1',
  title: 'Spaghetti Bolognese',
  author: 'Test User',
  authorId: 'test-uid',
  authorName: 'Test User',
  ingredients: '200g spaghetti\n300g ground beef\n1 can tomato sauce',
  steps: 'Boil water and cook spaghetti.\nBrown the ground beef in a pan.\nMix with tomato sauce.',
  time: 30,
  cost: 12.5,
  difficulty: 'Medium',
  diet: ['Italian'],
  allergies: [],
  createdAt: { toMillis: () => new Date('2025-01-01').getTime() },
  updatedAt: { toMillis: () => new Date('2025-01-01').getTime() },
};

export const mockRecipes = [
  mockRecipe,
  {
    ...mockRecipe,
    id: 'recipe-2',
    title: 'Chicken Salad',
    diet: ['Healthy', 'Gluten-Free'],
    difficulty: 'Easy',
    cost: 8.0,
  },
  {
    ...mockRecipe,
    id: 'recipe-3',
    title: 'Vegan Curry',
    diet: ['Vegan', 'Spicy'],
    difficulty: 'Hard',
    cost: 10.0,
  },
];

export const mockProfile = {
  uid: 'test-uid',
  diet: ['Vegetarian'],
  allergies: ['Nuts', 'Dairy'],
};
