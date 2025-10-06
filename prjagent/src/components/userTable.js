import React, { useState, useEffect, useRef } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Menu, MenuItem, Typography, TextField, Paper, Box,
  Grid, FormControl, InputLabel, Select, Checkbox, Toolbar, Tooltip, Stack, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, List, ListItem, ListItemText,
  TablePagination
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import { getToken, setToken } from "../api/client";
import EditUserDialog from "./EditUserDialog";
import ScrollTopButton from "./ScrollTopButton";

// Use env-based API base URL for deployed environments (Vercel) with localhost fallback
const API_BASE = (
  (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL))
) || 'https://gestionagent.onrender.com';
const API_URL = `${API_BASE}/users`; // backend users endpoint
const TX_API = `${API_BASE}/transactions`;

const ActionMenu = ({ user, deleteUser, toggleBlock, onEdit, onShowHistory }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Button
        endIcon={<MoreVertIcon />}
        size="small"
        variant="outlined"
        onClick={handleClick}
        sx={{ bgcolor: '#ffffff', color: '#000000', '&:hover': { bgcolor: '#f0f0f0' } }}
      >
        Actions
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => { onEdit?.(user); handleClose(); }}>Modifier</MenuItem>
        <MenuItem onClick={() => { deleteUser(user._id); handleClose(); }}>Supprimer</MenuItem>
        <MenuItem onClick={() => { toggleBlock(user._id, !user.actif); handleClose(); }}>
          {user.actif ? "Bloquer" : "Activer"}
        </MenuItem>
        {(String(user.type || 'client').toLowerCase() === 'distributeur') && (
          <MenuItem onClick={() => { onShowHistory?.(user); handleClose(); }}>Historique</MenuItem>
        )}
      </Menu>
    </>
  );
};

function UserTable({ refreshKey = 0 }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | client | distributeur
  const [selected, setSelected] = useState([]); // array of user IDs
  const [error, setError] = useState("");
  const searchRef = useRef(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Confirmations suppression
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [confirmSingle, setConfirmSingle] = useState({ open: false, id: null, label: '' });

  // Transactions dialog state
  const [txOpen, setTxOpen] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [txList, setTxList] = useState([]);
  const [txAccount, setTxAccount] = useState("");
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setError("");
      const token = getToken();
      if (!token) {
        setError('Veuillez vous connecter pour voir la liste des utilisateurs');
        // Rediriger vers la page de connexion
        try { window.location.href = '/login'; } catch (_) {}
        return;
      }

      const res = await fetch(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        // Token invalide/expiré -> nettoyer et rediriger
        try { setToken(null); } catch (_) {}
        setError('Session expirée. Veuillez vous reconnecter.');
        try { window.location.href = '/login'; } catch (_) {}
        return;
      }
      if (!res.ok) throw new Error(data?.error || data?.message || 'Erreur lors du chargement des utilisateurs');
      setUsers(data.data); // Assumes response format: { data: [...] }
      setSelected([]);
      // Focus search after refresh to help immediate filtering
      try { setTimeout(() => searchRef.current && searchRef.current.focus && searchRef.current.focus(), 0); } catch (_) {}
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
    }
  };

  const openConfirmBulk = () => setConfirmBulkOpen(true);
  const doBulkDelete = async () => { await bulkDelete(); setConfirmBulkOpen(false); };
  const cancelBulkDelete = () => setConfirmBulkOpen(false);

  useEffect(() => {
    fetchUsers();
    const handler = () => fetchUsers();
    window.addEventListener('users:refresh', handler);
    return () => window.removeEventListener('users:refresh', handler);
  }, []);

  // Refetch when parent-provided refreshKey changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const deleteUser = async (id) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(prev => prev.filter(u => u._id !== id));
      setSelected(prev => prev.filter(x => x !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleBlock = async (id, block) => {
    try {
      const token = getToken();
      await fetch(`${API_URL}/block/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: block ? "block" : "unblock",
        }),
      });
      setUsers(prev =>
        prev.map(u =>
          u._id === id ? { ...u, actif: !block ? true : false } : u
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const term = searchTerm.toLowerCase();
  const filteredUsers = users
    .filter(u => {
      if (filterType === 'all') return true;
      return (u.type || 'client').toLowerCase() === filterType;
    })
    .filter(u =>
      u.nom.toLowerCase().includes(term) ||
      u.prenom.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.telephone.includes(searchTerm) ||
      (u.type || '').toLowerCase().includes(term) ||
      (u.accountNumber || '').toLowerCase().includes(term)
    );

  // Reset page when filters or data change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterType, users]);

  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(start, end);

  const showAccountCol = filteredUsers.some(u => (u.type || 'client').toLowerCase() === 'distributeur');

  // Bulk helpers and selection handlers
  const bulkDelete = async () => {
    if (!selected.length) return;
    try {
      const token = getToken();
      await fetch(`${API_URL}/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selected }),
      });
      setUsers(prev => prev.filter(u => !selected.includes(u._id)));
      setSelected([]);
    } catch (err) {
      console.error(err);
    }
  };

  const bulkBlock = async (block) => {
    if (!selected.length) return;
    try {
      const token = getToken();
      await fetch(`${API_URL}/bulk-block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selected, action: block ? 'block' : 'unblock' }),
      });
      setUsers(prev => prev.map(u => selected.includes(u._id) ? { ...u, actif: block ? false : true } : u));
      setSelected([]);
    } catch (err) {
      console.error(err);
    }
  };

  const isSelected = (id) => selected.includes(id);

  const toggleOne = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllVisible = () => {
    const visibleIds = paginatedUsers.map(u => u._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selected.includes(id));
    setSelected(allSelected ? selected.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...selected, ...visibleIds])));
  };

  const openHistory = async (u) => {
    try {
      setTxError("");
      setTxList([]);
      setTxLoading(true);
      const token = getToken();
      if (!token) {
        setError('Veuillez vous connecter');
        try { window.location.href = '/login'; } catch (_) {}
        return;
      }
      const acc = u.accountNumber || `ACCT-${u.email}`;
      setTxAccount(acc);
      const res = await fetch(`${TX_API}/account/${encodeURIComponent(acc)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        try { setToken(null); } catch (_) {}
        setError('Session expirée. Veuillez vous reconnecter.');
        try { window.location.href = '/login'; } catch (_) {}
        return;
      }
      if (!res.ok) throw new Error(data?.error || 'Erreur lors du chargement de l\'historique');
      setTxList(Array.isArray(data?.history) ? data.history : []);
      setTxOpen(true);
    } catch (e) {
      setTxError(e.message || 'Erreur');
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <TableContainer component={Paper} sx={{ p: 2 }}>
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
      <Typography variant="h6" gutterBottom>Liste utilisateur</Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={8}>
          <TextField
            label="Rechercher un utilisateur"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            inputRef={searchRef}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="filter-type-label">Type</InputLabel>
            <Select
              labelId="filter-type-label"
              label="Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="client">Client</MenuItem>
              <MenuItem value="distributeur">Distributeur</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Actions persistantes */}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mb: 1 }}>
        <Button
          variant="outlined"
          disabled={selected.length === 0}
          onClick={() => bulkBlock(true)}
          sx={{
            borderColor: (theme) => selected.length > 0 ? theme.palette.warning.main : 'rgba(0,0,0,0.23)',
            color: (theme) => selected.length > 0
              ? theme.palette.warning.main
              : (theme.palette.mode === 'dark' ? '#000000' : 'inherit'),
            '&:hover': (theme) => ({
              borderColor: selected.length > 0 ? theme.palette.warning.dark : 'rgba(0,0,0,0.23)',
              backgroundColor: selected.length > 0 ? theme.palette.warning.light + '22' : 'transparent',
            }),
          }}
        >
          Bloquer sélection
        </Button>

        <Button
          variant="outlined"
          disabled={selected.length === 0}
          onClick={() => bulkBlock(false)}
          sx={{
            borderColor: (theme) => selected.length > 0 ? theme.palette.success.main : 'rgba(0,0,0,0.23)',
            color: (theme) => selected.length > 0
              ? theme.palette.success.main
              : (theme.palette.mode === 'dark' ? '#000000' : 'inherit'),
            '&:hover': (theme) => ({
              borderColor: selected.length > 0 ? theme.palette.success.dark : 'rgba(0,0,0,0.23)',
              backgroundColor: selected.length > 0 ? theme.palette.success.light + '22' : 'transparent',
            }),
          }}
        >
          Activer sélection
        </Button>

        <Button
          variant="contained"
          disabled={selected.length === 0}
          onClick={openConfirmBulk}
          sx={{
            bgcolor: (theme) => selected.length > 0 ? theme.palette.error.main : '#000000',
            color: '#ffffff',
            '&:hover': (theme) => ({
              bgcolor: selected.length > 0 ? theme.palette.error.dark : '#111111',
            }),
          }}
        >
          Supprimer sélection
        </Button>
      </Stack>

      <Table>
        <TableHead>
          <TableRow
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : 'grey.200',
              '& th': {
                color: (theme) => theme.palette.mode === 'dark' ? '#000000' : 'inherit',
                fontWeight: 600,
              },
            }}
          >
            <TableCell padding="checkbox">
              <Checkbox
                color="default"
                indeterminate={paginatedUsers.some(u => selected.includes(u._id)) && !paginatedUsers.every(u => selected.includes(u._id))}
                checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selected.includes(u._id))}
                onChange={toggleAllVisible}
                sx={{
                  color: (theme) => theme.palette.mode === 'dark' ? '#000000' : '#000000',
                  '&.Mui-checked': { color: (theme) => theme.palette.mode === 'dark' ? '#000000' : '#000000' },
                  '&.MuiCheckbox-indeterminate': { color: (theme) => theme.palette.mode === 'dark' ? '#000000' : '#000000' },
                }}
              />
            </TableCell>
            <TableCell>Prénom</TableCell>
            <TableCell>Nom</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Téléphone</TableCell>
            <TableCell>Type</TableCell>
            {showAccountCol && <TableCell>N° Compte</TableCell>}
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedUsers.map(user => (
            <TableRow key={user._id}>
              <TableCell padding="checkbox">
                <Checkbox
                  color="default"
                  checked={isSelected(user._id)}
                  onChange={() => toggleOne(user._id)}
                  sx={{
                    color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                    '&.Mui-checked': { color: (theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000' },
                  }}
                />
              </TableCell>
              <TableCell>{user.prenom}</TableCell>
              <TableCell>{user.nom}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.telephone}</TableCell>
              <TableCell>{user.type || 'client'}</TableCell>
              {showAccountCol && (
                <TableCell>{(user.type || 'client') === 'distributeur' ? (user.accountNumber || (`ACCT-${user.email}`)) : ''}</TableCell>
              )}
              <TableCell align="center">
                <ActionMenu
                  user={user}
                  deleteUser={(id) => setConfirmSingle({ open: true, id, label: `${user.prenom} ${user.nom}`.trim() })}
                  toggleBlock={toggleBlock}
                  onEdit={(u) => { setEditUser(u); setEditOpen(true); }}
                  onShowHistory={(u) => openHistory(u)}
                />
              </TableCell>
            </TableRow>
          ))}
          {filteredUsers.length === 0 && (
            <TableRow>
              <TableCell colSpan={showAccountCol ? 8 : 7} align="center">Aucun utilisateur trouvé</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <TablePagination
          component="div"
          count={filteredUsers.length}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Lignes par page"
        />
      </div>

      {/* Confirm bulk delete dialog */}
      <Dialog open={confirmBulkOpen} onClose={cancelBulkDelete}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous supprimer {selected.length} élément(s) ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelBulkDelete}>Annuler</Button>
          <Button color="error" variant="contained" onClick={doBulkDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm single delete dialog */}
      <Dialog open={confirmSingle.open} onClose={() => setConfirmSingle({ open: false, id: null, label: '' })}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous supprimer {confirmSingle.label || 'cet utilisateur'} ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSingle({ open: false, id: null, label: '' })}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (confirmSingle.id) await deleteUser(confirmSingle.id);
              setConfirmSingle({ open: false, id: null, label: '' });
            }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk actions toolbar */}
      {selected.length > 0 && (
        <Toolbar sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2">{selected.length} sélectionné(s)</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Bloquer la sélection">
              <Button color="warning" variant="outlined" onClick={() => bulkBlock(true)}>Bloquer</Button>
            </Tooltip>
            <Tooltip title="Activer la sélection">
              <Button color="success" variant="outlined" onClick={() => bulkBlock(false)}>Activer</Button>
            </Tooltip>
            <Tooltip title="Supprimer la sélection">
              <Button color="error" variant="contained" onClick={bulkDelete}>Supprimer</Button>
            </Tooltip>
          </Stack>
        </Toolbar>
      )}

      {/* Edit dialog */}
      <EditUserDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        user={editUser}
        onSaved={(u) => {
          if (u && u._id) {
            setUsers(prev => prev.map(x => x._id === u._id ? { ...x, ...u } : x));
          }
          setEditOpen(false);
        }}
      />

      {/* Transactions history dialog */}
      <Dialog open={txOpen} onClose={() => setTxOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Historique de transactions {txAccount ? `(${txAccount})` : ''}</DialogTitle>
        <DialogContent>
          {txLoading && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 2 }}>
              <CircularProgress size={20} />
              <Typography>Chargement...</Typography>
            </Stack>
          )}
          {txError && (
            <Alert severity="error" sx={{ mb: 2 }}>{txError}</Alert>
          )}
          {!txLoading && !txError && (
            <List>
              {txList.length === 0 && (
                <Typography variant="body2" sx={{ py: 1 }}>Aucune transaction trouvée</Typography>
              )}
              {txList.map((t) => (
                <ListItem key={t._id} divider>
                  <ListItemText
                    primary={`${t.type?.toUpperCase?.() || 'TX'}  •  ${Number(t.amount || 0).toLocaleString()} FCFA`}
                    secondary={`${new Date(t.date || t.createdAt).toLocaleString()}  –  Par: ${t.byName || t.by || 'inconnu'}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTxOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
      <ScrollTopButton />
    </TableContainer>
  );
}

export default UserTable;
