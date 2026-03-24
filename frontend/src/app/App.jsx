import { AuthProvider } from '../features/auth/context/auth-context';
import { RecipeProvider } from '../features/recipes/context/recipe-context';
import ErrorBoundary from '../shared/components/error-boundary';

export default function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RecipeProvider>{children}</RecipeProvider>
      </AuthProvider>
      
    </ErrorBoundary>
  );
}
