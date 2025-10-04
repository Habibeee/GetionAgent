import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Chip,
  Alert,
  Checkbox,
  Toolbar,
  Stack,
  Button,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { apiGet, apiPost, withAuth } from "../services/api";
import ScrollTopButton from "./ScrollTopButton";
import { getToken } from "../api/client";

export default function Historique() {
  const [searchTerm, setSearchTerm] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]); // ids
  const [accountFilter, setAccountFilter] = useState("");
  const navigate = useNavigate();

  const loadAll = async () => {
    try {
      setError("");
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error('Veuillez vous connecter');
      const data = await apiGet('/transactions', { headers: withAuth(token) });
      setHistory(Array.isArray(data?.data) ? data.data : []);
      setSelected([]);
    } catch (e) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const acc = accountFilter.trim().toLowerCase();
    return history.filter((h) => {
      const dateStr = new Date(h.date || h.createdAt).toLocaleString();
      const action = (h.type === 'deposit' ? 'Dépôt' : (h.type || '')).toLowerCase();
      const montant = String(h.amount ?? '').toLowerCase();
      const utilisateur = (h.byName || h.by || '').toLowerCase();
      const statut = (h.status || 'completed').toLowerCase();
      const accNum = String(h.accountNumber || '').toLowerCase();
      const matchesText = !q || dateStr.toLowerCase().includes(q) || action.includes(q) || montant.includes(q) || utilisateur.includes(q) || statut.includes(q) || accNum.includes(q);
      const matchesAcc = !acc || accNum.includes(acc);
      return matchesText && matchesAcc;
    });
  }, [history, searchTerm, accountFilter]);

  const isSelected = (id) => selected.includes(id);
  const toggleOne = (id) => setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => {
    const ids = filtered.map((x) => x._id);
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected(allSelected ? selected.filter((id) => !ids.includes(id)) : Array.from(new Set([...selected, ...ids])));
  };

  const cancelOne = async (id) => {
    try {
      const token = getToken();
      if (!token) throw new Error('Veuillez vous connecter');
      await apiPost('/transactions/cancel', { id }, { headers: withAuth(token) });
      setHistory((prev) => prev.map((x) => x._id === id ? { ...x, status: 'canceled', canceledAt: new Date().toISOString() } : x));
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'annulation');
    }
  };

  const bulkCancel = async () => {
    if (!selected.length) return;
    try {
      const token = getToken();
      if (!token) throw new Error('Veuillez vous connecter');
      await apiPost('/transactions/bulk-cancel', { ids: selected }, { headers: withAuth(token) });
      setHistory((prev) => prev.map((x) => selected.includes(x._id) ? { ...x, status: 'canceled', canceledAt: new Date().toISOString() } : x));
      setSelected([]);
    } catch (e) {
      setError(e.message || 'Erreur lors de l\'annulation en masse');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000000' : 'grey.300',
            color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#111111' : 'grey.400',
            },
          }}
        >
          Retour
        </Button>
      </Box>
      <Typography variant="h5" gutterBottom>
        Historique des transactions
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <TextField
          label="Filtrer par compte"
          placeholder="ACCT-email@example.com"
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000000' : 'inherit',
              color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
              '& fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? '#444' : undefined },
              '&:hover fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? '#666' : undefined },
            },
            '& .MuiInputLabel-root': { color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' },
          }}
        />
        <TextField
          label="Rechercher"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000000' : 'inherit',
              color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
              '& fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? '#444' : undefined },
              '&:hover fieldset': { borderColor: (theme) => theme.palette.mode === 'dark' ? '#666' : undefined },
            },
            '& .MuiInputLabel-root': { color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' },
          }}
        />
        <Button
          variant="contained"
          onClick={loadAll}
          sx={{
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000000' : undefined,
            color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : undefined,
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#111111' : undefined,
            },
          }}
        >
          Rafraîchir
        </Button>

        {/* Persistent bulk cancel button */}
        <Button
          onClick={bulkCancel}
          disabled={selected.length === 0}
          color="error"
          variant="contained"
          sx={{
            // Dark mode: white when no selection, red when has selection
            bgcolor: (theme) => theme.palette.mode === 'dark'
              ? (selected.length > 0 ? theme.palette.error.main : '#ffffff')
              : undefined,
            color: (theme) => theme.palette.mode === 'dark'
              ? (selected.length > 0 ? theme.palette.error.contrastText : '#000000')
              : undefined,
            '&:hover': {
              bgcolor: (theme) => theme.palette.mode === 'dark'
                ? (selected.length > 0 ? theme.palette.error.dark : '#f0f0f0')
                : undefined,
            },
          }}
        >
          Annuler sélection
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Removed conditional toolbar; bulk button is now persistent above */}

      <TableContainer component={Paper}>
        <Table>
          <TableHead
            sx={{
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#f5f5f5',
              '& th': {
                color: (theme) => theme.palette.mode === 'dark' ? '#000000' : 'inherit',
                fontWeight: 600,
              },
            }}
          >
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={filtered.some((x) => selected.includes(x._id)) && !filtered.every((x) => selected.includes(x._id))}
                  checked={filtered.length > 0 && filtered.every((x) => selected.includes(x._id))}
                  onChange={toggleAll}
                  color="default"
                  sx={{
                    color: (theme) => theme.palette.mode === 'dark' ? '#000000' : theme.palette.primary.main,
                    '&.Mui-checked': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#000000' : theme.palette.primary.main,
                    },
                    '&.MuiCheckbox-indeterminate': {
                      color: (theme) => theme.palette.mode === 'dark' ? '#000000' : theme.palette.primary.main,
                    },
                  }}
                />
              </TableCell>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Montant (FCFA)</TableCell>
              <TableCell>Compte</TableCell>
              <TableCell>Par</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9}>Chargement...</TableCell></TableRow>
            ) : filtered.length > 0 ? (
              filtered.map((row, idx) => {
                const dateStr = new Date(row.date || row.createdAt).toLocaleString();
                const typeLabel = row.type === 'deposit' ? 'Dépôt' : row.type;
                const statut = row.status || 'completed';
                const statutChip = statut === 'canceled'
                  ? <Chip label="Annulée" color="default" size="small" />
                  : <Chip label="Validée" color="success" size="small" />;
                return (
                  <TableRow key={row._id || row.id || idx} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="default"
                        checked={isSelected(row._id)}
                        onChange={() => toggleOne(row._id)}
                        sx={{
                          color: (theme) => theme.palette.mode === 'dark' ? '#000000' : theme.palette.primary.main,
                          '&.Mui-checked': {
                            color: (theme) => theme.palette.mode === 'dark' ? '#000000' : theme.palette.primary.main,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>{typeLabel}</TableCell>
                    <TableCell>{Number(row.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{row.accountNumber}</TableCell>
                    <TableCell>{row.byName || row.by || ''}</TableCell>
                    <TableCell>{statutChip}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={row.status === 'canceled'}
                        onClick={() => cancelOne(row._id)}
                        sx={{
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[500],
                          color: '#ffffff',
                          '&:hover': (theme) => ({
                            bgcolor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[600],
                          }),
                        }}
                      >Annuler</Button>
                    </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={9} align="center">Aucune transaction trouvée</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </TableContainer>
  <ScrollTopButton />
    </Box>
  );
}
