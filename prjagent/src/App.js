// App.js
import React, { useEffect, useRef, useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ColorModeContext from "./theme/ColorModeContext";
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
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('mode') || (prefersDarkMode ? 'dark' : 'light');
    } catch {
      return prefersDarkMode ? 'dark' : 'light';
    }
  });

  useEffect(() => {
    try { localStorage.setItem('mode', mode); } catch {}
  }, [mode]);

  const colorMode = useMemo(() => ({
    mode,
    toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
  }), [mode]);

  const theme = useMemo(() => createTheme({
    palette: { mode },
    components: {
      MuiButton: {
        styleOverrides: {
          root: mode === 'dark'
            ? { backgroundColor: '#ffffff', color: '#000000', '&:hover': { backgroundColor: '#f0f0f0' } }
            : { backgroundColor: '#000000', color: '#ffffff', '&:hover': { backgroundColor: '#111111' } },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: mode === 'dark'
            ? { color: '#000000', backgroundColor: '#ffffff1a' }
            : { color: '#ffffff', backgroundColor: '#0000001a' },
        },
      },
    },
  }), [mode]);
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
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
