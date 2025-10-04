import React, { useState } from 'react';
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
  Button,
  Snackbar,
  Alert,
  TextField,
  Avatar,
  Stack,
} from '@mui/material';

export default function AnnulerTransaction() {
  // Exemple de transactions
  const [transactions, setTransactions] = useState([
    { id: 1, numero: 'TX1001', montant: 5000, status: 'Validée' },
    { id: 2, numero: 'TX1002', montant: 12000, status: 'Validée' },
    { id: 3, numero: 'TX1003', montant: 7500, status: 'Validée' },
    { id: 4, numero: 'TX1004', montant: 10000, status: 'Validée' },
  ]);

  const [search, setSearch] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleCancel = (id) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id ? { ...tx, status: 'Annulée' } : tx
      )
    );
    setSnackbar({ open: true, message: `Transaction ${id} annulée`, severity: 'success' });
  };

  // Filtrage en temps réel
  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.numero.toLowerCase().includes(search.toLowerCase()) ||
      tx.montant.toString().includes(search)
  );

  return (
    <Box p={4}>
      {/* Header avec titre et avatar */}
      
      

      {/* Barre de recherche */}
      <Box mb={3}>
        <TextField
          label="Rechercher une transaction"
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      {/* Tableau des transactions */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Numéro de transaction</TableCell>
              <TableCell>Montant</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.numero}</TableCell>
                <TableCell>{tx.montant} FCFA</TableCell>
                <TableCell>{tx.status}</TableCell>
                <TableCell>
                  {tx.status === 'Validée' ? (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => handleCancel(tx.id)}
                    >
                      Annuler
                    </Button>
                  ) : (
                    <Button variant="outlined" size="small" disabled>
                      Annulée
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Aucune transaction trouvée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Snackbar de confirmation */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
