import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
} from "@mui/material";
import { Alert } from "@mui/material";
import { apiPost, withAuth } from "../services/api";
import { getToken } from "../api/client";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function DepotForm() {
  const [account, setAccount] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [touched, setTouched] = React.useState({ account: false, amount: false });
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");
  const navigate = useNavigate();

  const MIN_AMOUNT = 500;
  const MAX_AMOUNT = 500000;

  const amountNum = Number(amount);
  const accountError = touched.account && account.trim() === "";
  const amountError =
    touched.amount && (isNaN(amountNum) || amountNum < MIN_AMOUNT || amountNum > MAX_AMOUNT);

  const handleAccountChange = (e) => setAccount(e.target.value);
  const handleAmountChange = (e) => {
    const v = e.target.value;
    // Keep empty string to allow clearing, otherwise constrain to integers
    if (v === "") {
      setAmount("");
      return;
    }
    const n = Math.max(0, Math.floor(Number(v)));
    setAmount(String(n));
  };

  const handleBlur = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ account: true, amount: true });
    setSuccess("");
    setError("");
    if (account.trim() === "" || isNaN(amountNum) || amountNum < MIN_AMOUNT || amountNum > MAX_AMOUNT) {
      return;
    }
    try {
      setLoading(true);
      const token = getToken();
      if (!token) throw new Error("Vous devez être connecté.");
      const data = await apiPost(
        "/transactions/deposit",
        { accountNumber: account.trim(), amount: amountNum },
        { headers: withAuth(token) }
      );
      setSuccess("Dépôt réussi");
      try { window.dispatchEvent(new Event('transactions:refresh')); } catch (_) {}
      // Optionnel: reset montant après succès
      setAmount("");
    } catch (err) {
      setError(err.message || "Erreur lors du dépôt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center", // centré horizontalement
        alignItems: "center", // centré verticalement
        height: "100vh", // prend toute la hauteur de l'écran
        backgroundColor: "#f5f6fa",
      }}
    >
      <Card
        sx={{
          width: 400,
          boxShadow: 3,
          borderRadius: 3,
          p: 2,
        }}
      >
        <CardContent>
          <Box sx={{ mb: 1 }}>
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
              fullWidth
            >
              Retour
            </Button>
          </Box>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: "bold", textAlign: "center" }}
          >
            Créditer un compte
          </Typography>

          <Box component="form" noValidate onSubmit={handleSubmit}>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              label="Numéro de compte"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={account}
              onChange={handleAccountChange}
              onBlur={handleBlur("account")}
              error={accountError}
              helperText={accountError ? "Le numéro de compte est requis." : " "}
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
              label={`Montant (FCFA)`}
              type="number"
              variant="outlined"
              fullWidth
              margin="normal"
              required
              value={amount}
              onChange={handleAmountChange}
              onBlur={handleBlur("amount")}
              inputProps={{ min: MIN_AMOUNT, max: MAX_AMOUNT, step: 1 }}
              error={amountError}
              helperText={
                amountError
                  ? `Le montant doit être entre ${MIN_AMOUNT} et ${MAX_AMOUNT} FCFA.`
                  : `Minimum ${MIN_AMOUNT} FCFA, maximum ${MAX_AMOUNT} FCFA.`
              }
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
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, py: 1 }}
              disabled={
                loading ||
                account.trim() === "" ||
                isNaN(amountNum) ||
                amountNum < MIN_AMOUNT ||
                amountNum > MAX_AMOUNT
              }
            >
              {loading ? "Traitement..." : "EFFECTUER LE DÉPÔT"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
