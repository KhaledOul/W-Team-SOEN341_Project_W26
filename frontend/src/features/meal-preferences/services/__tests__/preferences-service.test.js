import { loadPreferences, savePreferences } from '../preferences-service';
import { doc, getDoc, setDoc } from 'firebase/firestore';

describe('preferences-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    doc.mockReturnValue('mock-doc-ref');
  });

  describe('loadPreferences', () => {
    it('should return user data when document exists', async () => {
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ diet: ['Vegan'], allergies: ['Nuts'] }),
      });

      const result = await loadPreferences('user-1');

      expect(doc).toHaveBeenCalled();
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref');
      expect(result).toEqual({ diet: ['Vegan'], allergies: ['Nuts'] });
    });

    it('should return null when document does not exist', async () => {
      getDoc.mockResolvedValue({
        exists: () => false,
      });

      const result = await loadPreferences('user-1');

      expect(result).toBeNull();
    });
  });

  describe('savePreferences', () => {
    it('should call setDoc with the correct user preferences', async () => {
      setDoc.mockResolvedValue(undefined);

      await savePreferences('user-1', {
        diet: ['Keto'],
        allergies: ['Dairy'],
      });

      expect(doc).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        { diet: ['Keto'], allergies: ['Dairy'] },
        { merge: true },
      );
    });
  });
});
