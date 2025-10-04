import React, { useContext, useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import ColorModeContext from "../theme/ColorModeContext";
import ProfileDialog from "./ProfileDialog";

export default function Header({ onMenuClick, drawerOpen }) {
  const { mode, toggleColorMode } = useContext(ColorModeContext);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("userProfile") || "{}");
      setAvatarUrl(saved.photo || "https://i.pravatar.cc/150?img=3");
    } catch {
      setAvatarUrl("https://i.pravatar.cc/150?img=3");
    }
  }, []);

  const handleProfileSaved = (updated) => {
    if (updated?.photo) setAvatarUrl(updated.photo);
  };

  return (
    <>
      {/* Header avec AppBar */}
      <AppBar
        position="static"
        sx={(theme) => ({
          ml: drawerOpen ? '240px' : 0,
          transition: theme.transitions.create(['margin-left', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        })}
      >
        <Toolbar>
          {/* Bouton menu pour ouvrir le drawer */}
          <IconButton edge="start" color="inherit" onClick={onMenuClick}>
            <MenuIcon />
          </IconButton>

          {/* Titre de l'application */}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Logo
          </Typography>

          {/* Bascule sombre/clair */}
          <IconButton color="inherit" onClick={toggleColorMode} sx={{ mr: 1 }} aria-label="Basculer le thème">
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>

          {/* Photo de profil à droite */}
          <IconButton color="inherit" onClick={() => setProfileOpen(true)}>
            <Avatar alt="Profil utilisateur" src={avatarUrl} />
          </IconButton>
        </Toolbar>
      </AppBar>

      <ProfileDialog
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSaved={handleProfileSaved}
      />
    </>
  );
}
