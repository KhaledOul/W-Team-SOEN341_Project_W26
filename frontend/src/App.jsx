

import { useRoutes } from "react-router-dom";
import { AuthProvider } from "./contexts/authContext";

import Landing from "./components/landing";
import Login from "./components/auth/login";
import Register from "./components/auth/register";
import Home from "./components/home";
import Profile from "./components/profile";

export default function App() {
  const routesElement = useRoutes([
    { path: "/", element: <Landing /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/home", element: <Home /> },
    { path: "/profile", element: <Profile /> },

    // TEMP DEBUG: if you get redirected to /home, you'll see this
    //{ path: "/home", element: <div style={{ fontSize: 30 }}>HOME ROUTE HIT ✅</div> },

    { path: "*", element: <Landing /> },
  ]);

  return <AuthProvider>{routesElement}</AuthProvider>;
}