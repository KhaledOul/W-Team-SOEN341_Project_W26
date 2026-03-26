import { lazy, Suspense } from 'react';
import { useRoutes } from 'react-router-dom';

const LandingPage = lazy(() => import('../features/landing/pages/landing-page'));
const LoginPage = lazy(() => import('../features/auth/pages/login-page'));
const RegisterPage = lazy(() => import('../features/auth/pages/register-page'));
const HomePage = lazy(() => import('../features/landing/pages/home-page'));
const PreferencesPage = lazy(() => import('../features/meal-preferences/pages/preferences-page'));
const RecipesPage = lazy(() => import('../features/recipes/pages/recipes-page'));
const WeekPlannerPage = lazy(() => import('../features/recipes/week_planner/pages/week-planner'));
const WeekPlannerRedirect = lazy(
  () => import('../features/recipes/week_planner/pages/week-planner-redirect')
);

const fallback = (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--muted-olive-2)',
    }}
  >
    <span className="material-icons spinning" style={{ fontSize: '36px' }}>
      hourglass_empty
    </span>
  </div>
);

export default function AppRouter() {
  const routes = useRoutes([
    { path: '/', element: <LandingPage /> },
    { path: '/login', element: <LoginPage /> },
    { path: '/register', element: <RegisterPage /> },
    { path: '/home', element: <HomePage /> },
    { path: '/mealpreferences', element: <PreferencesPage /> },
    { path: '/recipes', element: <RecipesPage /> },
    { path: '/week-planner', element: <WeekPlannerRedirect /> },
    { path: '/week-planner/:week', element: <WeekPlannerPage /> },
    { path: '*', element: <LandingPage /> },
  ]);

  return <Suspense fallback={fallback}>{routes}</Suspense>;
}
