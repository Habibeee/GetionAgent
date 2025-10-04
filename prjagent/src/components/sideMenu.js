import React, { useContext } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

// Icônes
import DashboardIcon from "@mui/icons-material/Dashboard";
import PersonIcon from "@mui/icons-material/Person";
import InventoryIcon from "@mui/icons-material/Inventory";
import CancelIcon from "@mui/icons-material/Cancel";
import HistoryIcon from "@mui/icons-material/History";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import LogoutIcon from "@mui/icons-material/Logout";
import ColorModeContext from "../theme/ColorModeContext";

export default function SideMenu({ open, toggleDrawer }) {
  const navigate = useNavigate();
  const { mode, toggleColorMode } = useContext(ColorModeContext);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
    toggleDrawer(false)();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={toggleDrawer(false)}
      variant="persistent"
      sx={{ "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box" } }}
    >
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => { navigate("/dashboard"); toggleDrawer(false)(); }}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Tableau de bord" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { navigate("/utilisateur"); toggleDrawer(false)(); }}>
            <ListItemIcon><PersonIcon /></ListItemIcon>
            <ListItemText primary="Utilisateur" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { navigate("/depot"); toggleDrawer(false)(); }}>
            <ListItemIcon><InventoryIcon /></ListItemIcon>
            <ListItemText primary="Dépôt" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { navigate("/annuler"); toggleDrawer(false)(); }}>
            <ListItemIcon><CancelIcon /></ListItemIcon>
            <ListItemText primary="Annuler" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => { navigate("/historique"); toggleDrawer(false)(); }}>
            <ListItemIcon><HistoryIcon /></ListItemIcon>
            <ListItemText primary="Historique" />
          </ListItemButton>
        </ListItem>

        <Divider />

        {/* Mode sombre */}
        <ListItem>
          <ListItemIcon><Brightness4Icon /></ListItemIcon>
          <Switch
            checked={mode === 'dark'}
            onChange={toggleColorMode}
          />
          <ListItemText primary="Mode sombre" />
        </ListItem>

        {/* Déconnexion */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Se déconnecter" />
          </ListItemButton>
        </ListItem>
      </List>
    </Drawer>
  );
}
