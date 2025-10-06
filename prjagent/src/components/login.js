import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { setToken } from "../api/client";

const API_BASE =
  process.env.REACT_APP_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (import.meta?.env?.VITE_API_URL) ||
  'https://gestion-agent-arjxkqthw-habibeees-projects.vercel.app/';

export default function LoginPage() {
  const [email, setEmail] = useState("diallo23@gmail.com");
  const [password, setPassword] = useState("passer1234");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/agent/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Email ou mot de passe incorrect !");
      }

      const token = data?.token;
      if (!token) throw new Error("Token non reçu");

      setToken(token);
      localStorage.setItem("isLoggedIn", "true");
      try { window.dispatchEvent(new Event('auth:login')); } catch (_) {}
      navigate("/dashboard");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box
      sx={{
        display: "flex", justifyContent: "center", alignItems: "center",
        height: "100vh", backgroundColor: "#f5f6fa"
      }}
    >
      <Card sx={{ width: 400, p: 2, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" textAlign="center" gutterBottom>
            Connexion Agent
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <TextField
            label="Mot de passe"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleLogin}
          >
            Se connecter
          </Button>

          <Button
            variant="text"
            color="inherit"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => navigate('/inscription')}
          >
            S'inscrire
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
