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

function ModifierProfile() {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(""); // message d'erreur
  const [success, setSuccess] = useState(""); // message de succès

  const handleSubmit = (e) => {
    e.preventDefault();

    // Vérification des champs
    if (!prenom || !nom || !email) {
      setError("Veuillez remplir tous les champs !");
      setSuccess("");
      return;
    }

    // Vérification simple de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Veuillez saisir un email valide !");
      setSuccess("");
      return;
    }

    // Si tout est correct
    setError("");
    setSuccess(`Profil modifié avec succès:\nPrénom: ${prenom}\nNom: ${nom}\nEmail: ${email}`);
    
    // Ici, tu peux ajouter l'appel API pour sauvegarder les données
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f6fa",
      }}
    >
      <Card sx={{ width: 400, boxShadow: 3, borderRadius: 3, p: 2 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: "bold", textAlign: "center" }}
          >
            Modifier Profil
          </Typography>

          {/* Affichage des messages */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Prénom"
              variant="outlined"
              fullWidth
              margin="normal"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
            <TextField
              label="Nom"
              variant="outlined"
              fullWidth
              margin="normal"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, py: 1 }}
              type="submit"
            >
              Sauvegarder
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ModifierProfile;
