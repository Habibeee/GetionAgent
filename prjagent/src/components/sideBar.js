import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Box,
} from "@mui/material";

// Icônes
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import InventoryIcon from "@mui/icons-material/Inventory";
import CancelIcon from "@mui/icons-material/Cancel";
import HistoryIcon from "@mui/icons-material/History";

// Menu items
const menuItems = [
  { text: "Utilisateur", icon: <PersonIcon /> },
  { text: "Dépôt", icon: <InventoryIcon /> },
  { text: "Annuler", icon: <CancelIcon /> },
  { text: "Historique", icon: <HistoryIcon /> },
];

function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open);
  };

  return (
    <>
      {/* AppBar */}
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar>
          {/* Bouton menu */}
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Titre */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Logo
          </Typography>

          {/* Avatar profil */}
          <Box>
            <Avatar
              alt="Profil"
              src="https://i.pravatar.cc/300"
              sx={{ width: 40, height: 40 }}
            />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{ "& .MuiDrawer-paper": { width: 240, boxSizing: "border-box" } }}
      >
        <List>
          {/* Remplacer flèche de retour par icône hamburger */}
          <ListItem disablePadding>
            <ListItemButton onClick={toggleDrawer(false)}>
              <ListItemIcon>
                <MenuIcon /> {/* Ici, le menu hamburger */}
              </ListItemIcon>
              <ListItemText primary="Menu" />
            </ListItemButton>
          </ListItem>

          {/* Menu Items */}
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
    </>
  );
}

export default Header;
