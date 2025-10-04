import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
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

export default function EditUserDialog({ open, onClose, user, onSaved }) {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', numeroIdentite: '', dateNaissance: '', type: 'client', photo: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const maxBirthDate = "2020-12-31";

  useEffect(() => {
    if (open && user) {
      setForm({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        telephone: user.telephone || '',
        numeroIdentite: user.numeroIdentite || '',
        dateNaissance: (user.dateNaissance || '').slice(0, 10),
        type: user.type || 'client',
        photo: user.photo || '',
      });
      setPhotoFile(null);
      setError('');
    }
  }, [open, user]);

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    try {
      setError('');
      // basic validations
      if (!form.nom || !form.prenom || !form.email) {
        setError("Veuillez renseigner au minimum nom, prénom et email.");
        return;
      }
      if (form.dateNaissance && form.dateNaissance > maxBirthDate) {
        setError("La date de naissance ne doit pas être postérieure à 2020-12-31.");
        return;
      }

      setLoading(true);
      let photo = form.photo || '';
      if (photoFile) {
        try { photo = await toBase64(photoFile); } catch (_) {}
      }

      const payload = {
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone,
        numeroIdentite: form.numeroIdentite,
        dateNaissance: form.dateNaissance,
        type: form.type,
        photo,
      };

      const token = localStorage.getItem('agent_token');
      const res = await fetch(`${API_BASE}/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.message || 'Erreur lors de la modification');

      onSaved?.(data?.user || null);
    } catch (e) {
      setError(e.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Modifier l'utilisateur</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label="Prénom" fullWidth value={form.prenom} onChange={handleChange('prenom')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Nom" fullWidth value={form.nom} onChange={handleChange('nom')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Email" type="email" fullWidth value={form.email} onChange={handleChange('email')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Téléphone" fullWidth value={form.telephone} onChange={handleChange('telephone')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="CNI" fullWidth value={form.numeroIdentite} onChange={handleChange('numeroIdentite')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Date de naissance"
              type="date"
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: maxBirthDate }}
              fullWidth
              value={form.dateNaissance}
              onChange={handleChange('dateNaissance')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Type" fullWidth value={form.type} onChange={handleChange('type')}>
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="distributeur">Distributeur</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" component="label">
              Changer la photo
              <input hidden type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </Button>
            {photoFile && <span style={{ marginLeft: 8 }}>{photoFile.name}</span>}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Annuler</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
