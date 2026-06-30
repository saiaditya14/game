import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('theme-arcade');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-champagne', 'theme-pink', 'theme-arcade', 'theme-cozy');
    // Add the active theme
    root.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
