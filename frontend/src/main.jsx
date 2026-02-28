import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";
import "./styles/App.css";
import AppProviders from "./app/App.jsx";
import AppRouter from "./app/router.jsx";
import Header from "./shared/components/header/header.jsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found. Check your index.html.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <Header />
        <AppRouter />
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);
