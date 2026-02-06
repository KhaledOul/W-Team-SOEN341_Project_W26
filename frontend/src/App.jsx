

import { useRoutes } from "react-router-dom";
import { AuthProvider } from "./contexts/authContext";

import Landing from "./components/landing";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import Home from "./components/home";
import MealPreferences from "./components/mealpreferences";

export default function App() {
  const routesElement = useRoutes([
    { path: "/", element: <Landing /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <Home /> },
    { path: "/mealpreferences", element: <MealPreferences /> },

  

    { path: "*", element: <Landing /> },
  ]);

  return <AuthProvider>{routesElement}</AuthProvider>;
}