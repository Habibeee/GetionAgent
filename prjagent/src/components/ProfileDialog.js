import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';

export default function ProfileDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ telephone: '', email: '', photo: '', password: '' });

  useEffect(() => {
    if (open) {
      try {
        const saved = JSON.parse(localStorage.getItem('userProfile') || '{}');
        setForm({
          telephone: saved.telephone || '',
          email: saved.email || '',
          photo: saved.photo || '',
          password: saved.password || '',
        });
      } catch {}
    }
  }, [open]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = () => {
    const saved = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const updated = { ...saved, ...form };
    localStorage.setItem('userProfile', JSON.stringify(updated));
    onSaved?.(updated);
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Modifier le profil</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Numéro de téléphone" name="telephone" value={form.telephone} onChange={onChange} fullWidth />
          <TextField label="Email" name="email" type="email" value={form.email} onChange={onChange} fullWidth />
          <TextField label="URL de la photo" name="photo" value={form.photo} onChange={onChange} fullWidth />
          <TextField label="Nouveau mot de passe" name="password" type="password" value={form.password} onChange={onChange} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSave}>Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
}
