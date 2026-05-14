import { createTheme } from '@mui/material/styles';

/** Restrained desk palette (matches former `blotter.css` institutional look). */
const headerBg = '#0f172a';
const headerText = '#f8fafc';
const headerBorder = '#1e293b';
const headerMuted = '#94a3b8';
const pageBg = '#f1f5f9';
const ink = '#0f172a';
const slateMuted = '#64748b';
const primaryBlue = '#2563eb';
const primaryBlueHover = '#1d4ed8';
const toolbarLine = '#e2e8f0';

export const blotterTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryBlue,
      dark: primaryBlueHover,
      light: '#3b82f6',
      contrastText: '#ffffff',
    },
    background: {
      default: pageBg,
      paper: '#ffffff',
    },
    text: {
      primary: ink,
      secondary: slateMuted,
    },
    divider: toolbarLine,
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'].join(','),
    h6: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      fontSize: '1.125rem',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: pageBg,
          color: ink,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'transparent',
      },
      styleOverrides: {
        root: {
          backgroundColor: headerBg,
          color: headerText,
          backgroundImage: 'none',
          boxShadow: 'none',
          borderBottom: `1px solid ${headerBorder}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        dense: {
          minHeight: 52,
          paddingLeft: 20,
          paddingRight: 20,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        caption: {
          fontSize: '0.75rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
        outlined: {
          fontWeight: 500,
          fontSize: '0.8125rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        elevation0: {
          backgroundImage: 'none',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
        },
        bar1: {
          backgroundColor: primaryBlue,
        },
      },
    },
  },
});

export const blotterChrome = {
  headerBg,
  headerText,
  headerBorder,
  headerMuted,
  headerGhostText: '#e2e8f0',
  headerGhostBorder: '#475569',
  headerGhostHoverBg: '#1e293b',
  headerGhostHoverBorder: '#64748b',
  /** Primary action on dark AppBar — high contrast, not theme primary blue */
  headerCtaBg: '#f8fafc',
  headerCtaHoverBg: '#ffffff',
  headerCtaText: ink,
} as const;
