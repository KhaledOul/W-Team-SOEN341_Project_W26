
import React from "react"; 
import { useRoutes } from "react-router-dom";
import { AuthProvider } from "./context/authContext";


import Landing from "./pages/Landing";
import Login from "./features/auth/login";
import Register from "./features/auth/register";
import Home from "./pages/Home";
import MealPreferences from "./pages/MealPreferences";

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