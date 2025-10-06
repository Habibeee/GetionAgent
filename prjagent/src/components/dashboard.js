import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Button,
  Checkbox,
} from "@mui/material";
import CreateUserDialog from "./CreateUserDialog";
import { Snackbar, Alert } from "@mui/material";
import { apiGet, apiPost, withAuth } from "../services/api";
import { getToken } from "../api/client";

// Helper to format the tiles from fetched stats
function formatStats(stats) {
  const { clients = 0, distributeurs = 0 } = stats || {};
  return [
    { key: 'clients', label: "Nombre total de clients", value: clients },
    { key: 'distributeurs', label: "Nombre total de distributeurs", value: distributeurs },
  ];
}

// Affichage des transactions récentes (chargées depuis l'API)

function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [createdOpen, setCreatedOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, clients: 0, distributeurs: 0, agents: 0 });
  const [statsError, setStatsError] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [txs, setTxs] = useState([]);
  const [txsError, setTxsError] = useState("");
  const [txsLoading, setTxsLoading] = useState(false);
  const [selected, setSelected] = useState([]); // selected transaction IDs

  const loadStats = async () => {
    try {
      setStatsError("");
      setStatsLoading(true);
      const token = getToken();
      if (!token) throw new Error('Veuillez vous connecter');
      const data = await apiGet('/users/stats', { headers: withAuth(token) });
      setStats({
        total: Number(data?.total || 0),
        clients: Number(data?.clients || 0),
        distributeurs: Number(data?.distributeurs || 0),
        agents: Number(data?.agents || 0),
      });
    } catch (e) {
      setStatsError(e.message || 'Erreur chargement statistiques');
    } finally {
      setStatsLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      setTxsError("");
      setTxsLoading(true);
      const token = getToken();
      if (!token) throw new Error('Veuillez vous connecter');
      const data = await apiGet('/transactions', { headers: withAuth(token) });
      // Backend renvoie { data: [...] }
      const list = Array.isArray(data?.data) ? data.data : [];
      setTxs(list);
    } catch (e) {
      setTxsError(e.message || 'Erreur chargement transactions');
    } finally {
      setTxsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadTransactions();
    const onRefresh = () => loadTransactions();
    window.addEventListener('transactions:refresh', onRefresh);
    return () => window.removeEventListener('transactions:refresh', onRefresh);
  }, []);

  const filteredTransactions = (txs || []).filter((t) => {
    const dateStr = (t.date || t.createdAt || '').toString();
    const typeStr = (t.type || '').toString();
    const amountStr = String(t.amount ?? '');
    const statusStr = (t.status || 'Validée').toString();
    const q = searchTerm.toLowerCase();
    return (
      dateStr.toLowerCase().includes(q) ||
      typeStr.toLowerCase().includes(q) ||
      amountStr.toLowerCase?.().includes(q) ||
      statusStr.toLowerCase().includes(q)
    );
  });

  // Selection helpers
  const isSelected = (id) => selected.includes(id);
  const toggleOne = (id) => setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => {
    const ids = filteredTransactions.map((t) => t._id || t.id).filter(Boolean);
    const allSelected = ids.length > 0 && ids.every((id) => selected.includes(id));
    setSelected(allSelected ? selected.filter((id) => !ids.includes(id)) : Array.from(new Set([...selected, ...ids])));
  };

  // Delete actions (cancel transactions)
  const cancelOne = async (id) => {
    try {
      const token = getToken();
      if (!token) throw new Error('Veuillez vous connecter');
      await apiPost('/transactions/cancel', { id }, { headers: withAuth(token) });
      setTxs((prev) => prev.map((x) => (x._id || x.id) === id ? { ...x, status: 'canceled' } : x));
      setSelected((prev) => prev.filter(x => x !== id));
    } catch (e) {
      setTxsError(e.message || "Erreur d'annulation");
    }
  };

  const bulkCancel = async () => {
    if (!selected.length) return;
    try {
      const token = getToken();
      if (!token) throw new Error('Veuillez vous connecter');
      await apiPost('/transactions/bulk-cancel', { ids: selected }, { headers: withAuth(token) });
      setTxs((prev) => prev.map((x) => selected.includes(x._id || x.id) ? { ...x, status: 'canceled' } : x));
      setSelected([]);
    } catch (e) {
      setTxsError(e.message || "Erreur d'annulation en masse");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Titre */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">
          Tableau de Bord
        </Typography>
        <Button variant="contained" onClick={() => setOpenCreate(true)}>
          Créer Client/Distributeur
        </Button>
      </Box>

      {/* Cartes statistiques rondes */}
      <Grid container spacing={3} justifyContent="center" sx={{ mb: 4 }}>
        {formatStats(stats).map((stat, index) => (
          <Grid item xs={12} sm={4} md={3} key={index}>
            <Card
              sx={{
                width: 140,
                height: 140,
                borderRadius: "50%", // cercle parfait
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: 3,
                textAlign: "center",
                mx: "auto", // centrer horizontalement
              }}
            >
              <Typography variant="subtitle1" align="center">{stat.label}</Typography>
              <Typography variant="h4" sx={{ color: "primary.main" }}>
                {statsLoading ? '...' : stat.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
      {statsError && (
        <Alert severity="error" sx={{ mb: 2 }}>{statsError}</Alert>
      )}

      {/* Champ de recherche */}
      <Box sx={{ mb: 3, maxWidth: 400 }}>
        <TextField
          fullWidth
          label="Rechercher une transaction"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#000000' : 'inherit',
              color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
              '& fieldset': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#444' : undefined,
              },
              '&:hover fieldset': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#666' : undefined,
              },
            },
            '& .MuiInputLabel-root': {
              color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
            },
          }}
        />
      </Box>

      {/* Actions and tableau des transactions */}
      <Typography variant="h6" gutterBottom>
        Transactions Récentes
      </Typography>
      {txsError && (<Alert severity="error" sx={{ mb: 2 }}>{txsError}</Alert>)}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          onClick={bulkCancel}
          disabled={selected.length === 0}
          variant="contained"
          sx={{
            bgcolor: (theme) => selected.length > 0 ? theme.palette.error.main : '#000000',
            color: '#ffffff',
            '&:hover': (theme) => ({ bgcolor: selected.length > 0 ? theme.palette.error.dark : '#111111' }),
          }}
        >
          Supprimer sélection
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#f5f5f5',
            '& th': {
              color: (theme) => theme.palette.mode === 'dark' ? '#000000' : 'inherit',
              fontWeight: 600,
            }
          }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="default"
                  indeterminate={filteredTransactions.some((t) => isSelected(t._id || t.id)) && !filteredTransactions.every((t) => isSelected(t._id || t.id))}
                  checked={filteredTransactions.length > 0 && filteredTransactions.every((t) => isSelected(t._id || t.id))}
                  onChange={toggleAll}
                  sx={{
                    color: '#000000',
                    '&.Mui-checked': { color: '#000000' },
                    '&.MuiCheckbox-indeterminate': { color: '#000000' },
                  }}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {txsLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Chargement...</TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>Aucune transaction récente</TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((row) => {
                const id = row._id || row.id;
                const date = row.date || row.createdAt;
                const type = row.type === 'deposit' ? 'Dépôt' : row.type;
                const montant = `${row.amount} FCFA`;
                const statut = row.status || 'Validée';
                return (
                  <TableRow key={id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="default"
                        checked={isSelected(id)}
                        onChange={() => toggleOne(id)}
                        sx={{
                          color: '#ffffff',
                          '&.Mui-checked': { color: '#ffffff' },
                        }}
                      />
                    </TableCell>
                    <TableCell>{id}</TableCell>
                    <TableCell>{new Date(date).toLocaleString()}</TableCell>
                    <TableCell>{type}</TableCell>
                    <TableCell>{montant}</TableCell>
                    <TableCell>
                      <Chip label={statut} color={statut === 'canceled' ? 'warning' : 'success'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => cancelOne(id)}
                        sx={{ bgcolor: '#000000', color: '#ffffff', '&:hover': { bgcolor: '#111111' } }}
                      >
                        Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de création d'utilisateur */}
      <CreateUserDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={() => {
          try { window.dispatchEvent(new CustomEvent('users:refresh')); } catch (_) {}
          setCreatedOpen(true);
        }}
      />


      <Snackbar
        open={createdOpen}
        autoHideDuration={3000}
        onClose={() => setCreatedOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCreatedOpen(false)} severity="success" sx={{ width: '100%' }}>
          Utilisateur créé avec succès
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Dashboard;
