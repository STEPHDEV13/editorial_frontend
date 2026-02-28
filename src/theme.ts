import { createTheme, alpha } from '@mui/material/styles';

// ── Brand palette (aligned with logo gradient) ──────────────────────────────
export const BRAND = {
  blue:    '#2979FF',
  blueDark:'#1A52CC',
  purple:  '#7B2FBE',
  mid:     '#5040D8',
  // Gradient string reused everywhere
  gradient: 'linear-gradient(90deg, #2979FF 0%, #5040D8 55%, #7B2FBE 100%)',
  gradientDiag: 'linear-gradient(135deg, #2979FF 0%, #7B2FBE 100%)',
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0B0B10',
      paper:   '#12121A',
    },
    primary: {
      main:         BRAND.blue,
      dark:         BRAND.blueDark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main:         BRAND.purple,
      contrastText: '#FFFFFF',
    },
    error:   { main: '#FF4D6D' },
    warning: { main: '#FFB74D' },
    success: { main: '#00E676' },
    info:    { main: '#40C4FF' },
    divider: 'rgba(255,255,255,0.08)',
    text: {
      primary:   '#F0F0FF',
      secondary: '#9090B8',
    },
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.015em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { fontWeight: 600, textTransform: 'none' },
  },

  shape: { borderRadius: 12 },

  components: {
    // ── Card ──────────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#12121A',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: { root: { '&:last-child': { paddingBottom: 20 } } },
    },

    // ── Paper ─────────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#12121A',
        },
      },
    },

    // ── Button ────────────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          backgroundImage: BRAND.gradient,
          boxShadow: `0 0 18px ${alpha(BRAND.blue, 0.35)}`,
          '&:hover': {
            backgroundImage: BRAND.gradient,
            boxShadow: `0 0 24px ${alpha(BRAND.blue, 0.5)}`,
            filter: 'brightness(1.1)',
          },
        },
      },
    },

    // ── Chip ──────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' },
      },
    },

    // ── Table ─────────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#1A1A26',
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#9090B8',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: 'rgba(41,121,255,0.05)',
          },
          '& .MuiTableCell-body': {
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          },
        },
      },
    },

    // ── Input / TextField ─────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
          '&:hover fieldset': { borderColor: BRAND.blue },
          '&.Mui-focused fieldset': { borderColor: BRAND.blue },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { color: '#9090B8', '&.Mui-focused': { color: BRAND.blue } },
      },
    },

    // ── Drawer / Sidebar ──────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0E0E18',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        },
      },
    },

    // ── Dialog ────────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#16161F',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
        },
      },
    },

    // ── AppBar / Topbar ───────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0E0E18',
          backgroundImage: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'none',
        },
      },
    },

    // ── Tooltip ───────────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1E1E2E',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: '0.78rem',
        },
      },
    },

    // ── Skeleton ──────────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(255,255,255,0.06)' },
      },
    },
  },
});

export default theme;
