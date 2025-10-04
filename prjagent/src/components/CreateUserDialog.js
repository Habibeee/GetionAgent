import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Grid,
  Alert,
} from "@mui/material";

const API_BASE =
  (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL))
  || (import.meta?.env?.VITE_API_URL)
  || 'http://localhost:5000';

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export default function CreateUserDialog({ open, onClose, onCreated }) {
  const [type, setType] = useState("client"); // client | agent
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [cni, setCni] = useState(""); // numeroIdentite
  const [dateNaissance, setDateNaissance] = useState("");
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const maxBirthDate = "2020-12-31";

  const reset = () => {
    setType("client");
    setNom("");
    setPrenom("");
    setEmail("");
    setCni("");
    setDateNaissance("");
    setTelephone("");
    setPassword("");
    setPhotoFile(null);
    setError("");
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose?.();
    }
  };

  const handleSubmit = async () => {
    try {
      setError("");
      // Basic validations
      if (!nom || !prenom || !email) {
        setError("Veuillez renseigner au minimum nom, prénom et email.");
        return;
      }

      if (type === 'client' || type === 'distributeur') {
        if (!cni || !dateNaissance || !telephone) {
          setError("Pour un client, CNI, date de naissance et téléphone sont requis.");
          return;
        }
        if (!password) {
          setError("Veuillez définir un mot de passe pour le client.");
          return;
        }
        if (dateNaissance > maxBirthDate) {
          setError("La date de naissance ne doit pas être postérieure à 2020-12-31.");
          return;
        }
      }

      setLoading(true);

      let photo = "";
      if (photoFile) {
        try {
          photo = await toBase64(photoFile);
        } catch (_) {
          // ignore photo conversion errors
        }
      }

      if (type === 'client' || type === 'distributeur') {
        const payload = {
          nom,
          prenom,
          telephone,
          dateNaissance,
          numeroIdentite: cni,
          email,
          password,
          photo,
          type,
        };
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.message || 'Erreur lors de la création du client');
      }

      onCreated?.();
      try {
        window.dispatchEvent(new CustomEvent('users:refresh'));
      } catch (_) {
        // ignore if window not available
      }
      handleClose();
    } catch (e) {
      setError(e.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Créer un utilisateur</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Type d'utilisateur"
              fullWidth
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="distributeur">Distributeur</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Prénom" fullWidth value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Nom" fullWidth value={nom} onChange={(e) => setNom(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" type="email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} />
          </Grid>

          {(type === 'client' || type === 'distributeur') && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField label="CNI" fullWidth value={cni} onChange={(e) => setCni(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date de naissance"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: maxBirthDate }}
                  fullWidth
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Téléphone" fullWidth value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6}>
            <TextField label="Mot de passe" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <Button variant="outlined" component="label">
              Importer une photo
              <input hidden type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </Button>
            {photoFile && (
              <span style={{ marginLeft: 8 }}>{photoFile.name}</span>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
