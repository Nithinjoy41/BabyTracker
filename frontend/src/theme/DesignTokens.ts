export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    surface: string;
    accent: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  roundness: number;
}

export const LightTheme: Theme = {
  colors: {
    primary: '#6C63FF',
    secondary: '#4ECDC4',
    background: '#F5F5FF',
    card: '#FFFFFF',
    text: '#333333',
    textSecondary: '#888888',
    border: '#E0E0E0',
    success: '#4CAF50',
    error: '#FF6B6B',
    warning: '#FBC02D',
    surface: 'rgba(255, 255, 255, 0.8)',
    accent: '#FF6B6B',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  roundness: 24,
};

export const DarkTheme: Theme = {
  colors: {
    primary: '#8B84FF',
    secondary: '#5EEAD4',
    background: '#0F0F1A',
    card: '#1A1A2E',
    text: '#F5F5F5',
    textSecondary: '#A0A0B0',
    border: '#2A2A3E',
    success: '#81C784',
    error: '#FF8A80',
    warning: '#FFF176',
    surface: 'rgba(26, 26, 46, 0.8)',
    accent: '#FF8A80',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  roundness: 24,
};
