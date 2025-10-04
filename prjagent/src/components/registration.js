import React, { useState } from 'react';
import { Box, Button, Container, Stack, TextField, Typography, Paper, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';

export default function Registration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    dateNaissance: '',
    numeroIdentite: '',
    email: '',
    password: '',
    photo: '',
    type: 'client',
    accountNumber: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      let next = { ...f, [name]: value };

      // If switching type
      if (name === 'type') {
        if (value === 'distributeur') {
          // Prefill account number if empty and email exists
          if (!f.accountNumber && f.email) {
            next.accountNumber = `ACCT-${f.email}`;
          }
        } else {
          // Clear account number for non-distributeur
          next.accountNumber = '';
        }
      }

      // If email changes while type is distributeur
      if (name === 'email') {
        if (f.type === 'distributeur') {
          const prevDefault = f.email ? `ACCT-${f.email}` : '';
          const usingDefault = !f.accountNumber || f.accountNumber === prevDefault;
          if (usingDefault) {
            next.accountNumber = value ? `ACCT-${value}` : '';
          }
        }
      }

      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiPost('/auth/register', form);
      // Inform other parts of the app (like UserTable) to refresh users list
      try { window.dispatchEvent(new Event('users:refresh')); } catch (_) {}
      navigate('/login');
    } catch (err) {
      setError(err.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Inscription
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Nom" name="nom" value={form.nom} onChange={onChange} fullWidth required />
              <TextField label="Prénom" name="prenom" value={form.prenom} onChange={onChange} fullWidth required />
            </Stack>
            <TextField label="Numéro de téléphone" name="telephone" value={form.telephone} onChange={onChange} fullWidth required />
            <TextField label="Date de naissance" name="dateNaissance" type="date" InputLabelProps={{ shrink: true }} value={form.dateNaissance} onChange={onChange} fullWidth required />
            <TextField label="Numéro d'identité" name="numeroIdentite" value={form.numeroIdentite} onChange={onChange} fullWidth required />
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select labelId="type-label" label="Type" name="type" value={form.type} onChange={onChange}>
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="distributeur">Distributeur</MenuItem>
              </Select>
            </FormControl>
            {form.type === 'distributeur' && (
              <TextField label="Numéro de compte (optionnel)" name="accountNumber" value={form.accountNumber} onChange={onChange} fullWidth />
            )}
            <TextField label="Email" name="email" type="email" value={form.email} onChange={onChange} fullWidth required />
            <TextField label="Mot de passe" name="password" type="password" value={form.password} onChange={onChange} fullWidth required />
            <TextField label="URL de la photo (optionnel)" name="photo" value={form.photo} onChange={onChange} fullWidth />
            <Button type="submit" variant="contained" disabled={loading}>{loading ? 'En cours...' : "S'inscrire"}</Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
