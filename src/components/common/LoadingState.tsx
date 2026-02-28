import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import logoUrl from '../../assets/logo.svg';
import { BRAND } from '../../theme';

interface LoadingStateProps {
  message?: string;
  /** Fill parent height when true (default false → 300px) */
  fullHeight?: boolean;
}

export default function LoadingState({
  message = 'Chargement…',
  fullHeight = false,
}: LoadingStateProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={{ minHeight: fullHeight ? '60vh' : 260, position: 'relative' }}
    >
      {/* Watermark logo */}
      <Box
        component="img"
        src={logoUrl}
        alt=""
        aria-hidden
        sx={{
          position: 'absolute',
          width: 160,
          opacity: 0.05,
          pointerEvents: 'none',
        }}
      />

      {/* Spinner with brand colour */}
      <CircularProgress
        size={48}
        thickness={3}
        sx={{ color: BRAND.blue, position: 'relative', zIndex: 1 }}
      />

      <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', zIndex: 1 }}>
        {message}
      </Typography>
    </Box>
  );
}
