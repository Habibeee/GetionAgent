import React, { useEffect, useState } from "react";
import { Fab, Zoom } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      try {
        setVisible((window.scrollY || document.documentElement.scrollTop || 0) > 200);
      } catch (_) {}
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (_) {
      window.scrollTo(0, 0);
    }
  };

  return (
    <Zoom in={visible}>
      <Fab
        size="small"
        onClick={toTop}
        aria-label="scroll back to top"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          bgcolor: (theme) => theme.palette.mode === "dark" ? "#000000" : theme.palette.primary.main,
          color: (theme) => theme.palette.mode === "dark" ? "#ffffff" : theme.palette.primary.contrastText,
          '&:hover': {
            bgcolor: (theme) => theme.palette.mode === "dark" ? "#111111" : theme.palette.primary.dark,
          },
          zIndex: (theme) => theme.zIndex.tooltip + 1,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
}
