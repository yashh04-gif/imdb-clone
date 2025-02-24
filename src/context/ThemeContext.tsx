import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: {
    background: string;
    text: string;
    cardBg: string;
    cardText: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    input: string;
    buttonText: string;
  };
}

const lightTheme = {
  background: 'bg-gray-100',
  text: 'text-gray-900',
  cardBg: 'bg-white',
  cardText: 'text-gray-800',
  primary: 'bg-yellow-500',
  secondary: 'text-gray-600',
  accent: 'text-yellow-600',
  border: 'border-gray-200',
  input: 'bg-white text-gray-900',
  buttonText: 'text-gray-900'
};

const darkTheme = {
  background: 'bg-gray-900',
  text: 'text-white',
  cardBg: 'bg-gray-800',
  cardText: 'text-white',
  primary: 'bg-yellow-500',
  secondary: 'text-gray-300',
  accent: 'text-yellow-400',
  border: 'border-gray-700',
  input: 'bg-gray-700 text-white placeholder-gray-400',
  buttonText: 'text-black font-medium'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [theme, setTheme] = useState(darkTheme);

  useEffect(() => {
    setTheme(isDarkMode ? darkTheme : lightTheme);
    
    const baseClasses = isDarkMode 
      ? 'bg-gray-900 text-white selection:bg-yellow-500 selection:text-white' 
      : 'bg-gray-100 text-gray-900 selection:bg-yellow-500 selection:text-gray-900';
    document.body.className = baseClasses;
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
