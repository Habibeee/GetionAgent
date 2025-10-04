// App.js
import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "./components/header";
import LoginPage from "./components/login";
import SideMenu from "./components/sideMenu";
import Registration from "./components/registration";
import { getToken, setToken } from "./api/client";

// Pages fictnaires
import Dashboard from "./components/dashboard";
import AnnulerTransaction from "./components/annulerTransaction";
import Historique from "./components/historique";
import DepotForm from "./components/depot";
import UserTable from "./components/userTable";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return localStorage.getItem("isLoggedIn") === "true" && !!getToken();
    } catch (_) {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => () => setDrawerOpen(open);

  // Auto-logout after 2 minutes (120000 ms) of inactivity
  const inactivityTimerRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
    const EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    const logout = () => {
      try { setToken(null); } catch (_) {}
      try { localStorage.removeItem("isLoggedIn"); } catch (_) {}
      try { window.dispatchEvent(new Event("auth:logout")); } catch (_) {}
      // Force navigation to login
      window.location.href = "/login";
    };

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(logout, TIMEOUT_MS);
    };

    EVENTS.forEach((ev) => window.addEventListener(ev, resetTimer));
    // Start timer on mount
    resetTimer();

    return () => {
      EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [isLoggedIn]);

  // Keep isLoggedIn in sync with storage and custom auth events
  useEffect(() => {
    const syncAuth = () => {
      try {
        const next = localStorage.getItem("isLoggedIn") === "true" && !!getToken();
        setIsLoggedIn(next);
      } catch (_) {
        setIsLoggedIn(false);
      }
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth:login", syncAuth);
    window.addEventListener("auth:logout", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth:login", syncAuth);
      window.removeEventListener("auth:logout", syncAuth);
    };
  }, []);

  return (
    <Router>
      {isLoggedIn && (
        <>
          <Header onMenuClick={() => setDrawerOpen((prev) => !prev)} drawerOpen={drawerOpen} />
          <SideMenu open={drawerOpen} toggleDrawer={toggleDrawer} />
        </>
      )}
      <Box
        component="main"
        sx={{
          ml: isLoggedIn ? (drawerOpen ? "240px" : 0) : 0,
          transition: (theme) =>
            theme.transitions.create(["margin-left"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          p: 2,
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inscription" element={<Registration />} />
          <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/utilisateur" element={isLoggedIn ? <UserTable /> : <Navigate to="/login" />} />
          <Route path="/depot" element={isLoggedIn ? <DepotForm /> : <Navigate to="/login" />} />
          <Route path="/annuler" element={isLoggedIn ? <AnnulerTransaction /> : <Navigate to="/login" />} />
          <Route path="/historique" element={isLoggedIn ? <Historique /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
