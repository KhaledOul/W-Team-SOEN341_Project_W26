import { createRecipe, updateRecipe, deleteRecipe, subscribeToRecipes } from '../recipe-service';

import { addDoc, updateDoc, deleteDoc, collection, doc, onSnapshot, query } from 'firebase/firestore';

describe('recipe-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collection.mockReturnValue('mock-collection-ref');
    doc.mockReturnValue('mock-doc-ref');
    addDoc.mockResolvedValue({ id: 'new-recipe-id' });
    updateDoc.mockResolvedValue(undefined);
    deleteDoc.mockResolvedValue(undefined);
  });

  describe('createRecipe', () => {
    it('should call addDoc with correct data including userId and timestamps', async () => {
      const recipeData = { title: 'Test Recipe', ingredients: 'Flour' };

      await createRecipe('user-123', 'Chef User', recipeData);

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callData = addDoc.mock.calls[0][1];
      expect(callData).toMatchObject({
        title: 'Test Recipe',
        ingredients: 'Flour',
        authorId: 'user-123',
        authorName: 'Chef User',
      });
    });

    it('should throw when user is not authenticated', async () => {
      await expect(createRecipe(null, 'Name', {})).rejects.toThrow('user is not authenticated');
    });

    it('should use "Anonymous" when author name is empty', async () => {
      await createRecipe('uid-1', '', { title: 'Test' });

      expect(addDoc).toHaveBeenCalledTimes(1);
      const callData = addDoc.mock.calls[0][1];
      expect(callData).toMatchObject({ authorName: 'Anonymous' });
    });

    it('should propagate Firestore errors', async () => {
      addDoc.mockRejectedValue(new Error('Firestore write failed'));

      await expect(createRecipe('uid', 'Name', {})).rejects.toThrow('Firestore write failed');
    });
  });

  describe('updateRecipe', () => {
    it('should call updateDoc with the correct fields', async () => {
      await updateRecipe('recipe-1', { title: 'Updated Title' });

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ title: 'Updated Title' })
      );
    });

    it('should propagate Firestore errors on update', async () => {
      updateDoc.mockRejectedValue(new Error('Update failed'));

      await expect(updateRecipe('recipe-1', {})).rejects.toThrow('Update failed');
    });
  });

  describe('deleteRecipe', () => {
    it('should call deleteDoc with the correct document reference', async () => {
      await deleteRecipe('recipe-1');

      expect(deleteDoc).toHaveBeenCalled();
    });

    it('should propagate Firestore errors on delete', async () => {
      deleteDoc.mockRejectedValue(new Error('Delete failed'));

      await expect(deleteRecipe('recipe-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('subscribeToRecipes', () => {
    beforeEach(() => {
      query.mockReturnValue('mock-query');
      onSnapshot.mockImplementation((q, onData, onError) => {
        return vi.fn(); // unsubscribe
      });
    });

    it('should call onSnapshot with a query', () => {
      const onData = vi.fn();
      const onError = vi.fn();

      subscribeToRecipes(onData, onError);

      expect(query).toHaveBeenCalled();
      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should return an unsubscribe function', () => {
      const unsubscribe = vi.fn();
      onSnapshot.mockReturnValue(unsubscribe);

      const result = subscribeToRecipes(vi.fn(), vi.fn());

      expect(result).toBe(unsubscribe);
    });

    it('should transform snapshot docs and call onData with sorted recipes', () => {
      const mockDocs = [
        {
          id: 'r1',
          data: () => ({ title: 'Recipe 1', createdAt: { toMillis: () => 1000 } }),
        },
        {
          id: 'r2',
          data: () => ({ title: 'Recipe 2', createdAt: { toMillis: () => 2000 } }),
        },
      ];
      const mockSnapshot = { docs: mockDocs };

      onSnapshot.mockImplementation((q, onSuccess) => {
        onSuccess(mockSnapshot);
        return vi.fn();
      });

      const onData = vi.fn();
      subscribeToRecipes(onData, vi.fn());

      expect(onData).toHaveBeenCalledWith([
        { id: 'r2', title: 'Recipe 2', createdAt: { toMillis: expect.any(Function) } },
        { id: 'r1', title: 'Recipe 1', createdAt: { toMillis: expect.any(Function) } },
      ]);
    });

    it('should call onError when snapshot fails', () => {
      const mockError = { code: 'permission-denied', message: 'Access denied' };

      onSnapshot.mockImplementation((q, onSuccess, onError) => {
        onError(mockError);
        return vi.fn();
      });

      const onError = vi.fn();
      subscribeToRecipes(vi.fn(), onError);

      expect(onError).toHaveBeenCalledWith(mockError);
    });

    it('should handle recipes without createdAt timestamp', () => {
      const mockDocs = [
        { id: 'r1', data: () => ({ title: 'Recipe 1' }) },
        { id: 'r2', data: () => ({ title: 'Recipe 2', createdAt: { toMillis: () => 1000 } }) },
      ];
      const mockSnapshot = { docs: mockDocs };

      onSnapshot.mockImplementation((q, onSuccess) => {
        onSuccess(mockSnapshot);
        return vi.fn();
      });

      const onData = vi.fn();
      subscribeToRecipes(onData, vi.fn());

      expect(onData).toHaveBeenCalled();
      const result = onData.mock.calls[0][0];
      expect(result).toHaveLength(2);
    });
  });
});
