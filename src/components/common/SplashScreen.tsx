import { keyframes } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import BrandLogo from '../branding/BrandLogo';
import { BRAND } from '../../theme';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.75; transform: scale(0.97); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export default function SplashScreen() {
  return (
    <Box
      role="status"
      aria-label="Chargement de l'application"
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        zIndex: 9999,
        animation: `${fadeIn} 0.4s ease-out both`,
        gap: 4,
      }}
    >
      {/* Radial glow behind logo */}
      <Box
        sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${BRAND.blue}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Logo block with pulse animation */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: `${pulse} 2.4s ease-in-out infinite`,
          position: 'relative',
        }}
      >
        <BrandLogo variant="full" logoHeight={80} showTagline />
      </Box>

      {/* Animated progress bar */}
      <Box sx={{ width: 160 }}>
        <LinearProgress
          sx={{
            height: 3,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.07)',
            '& .MuiLinearProgress-bar': {
              background: BRAND.gradient,
              borderRadius: 2,
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mt: 1.5,
            color: 'text.secondary',
            letterSpacing: '0.08em',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
          }}
        >
          Chargement…
        </Typography>
      </Box>
    </Box>
  );
}
