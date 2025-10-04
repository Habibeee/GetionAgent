import React from 'react';

// Contexte global pour gérer le mode couleur ("light" | "dark")
const ColorModeContext = React.createContext({
  mode: 'dark',
  toggleColorMode: () => {},
});

export default ColorModeContext;
