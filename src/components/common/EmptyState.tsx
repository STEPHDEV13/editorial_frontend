import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import logoUrl from '../../assets/logo.svg';

interface EmptyStateProps {
  title:       string;
  description?: string;
  actionLabel?: string;
  onAction?:   () => void;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
      sx={{ minHeight: 280, textAlign: 'center', position: 'relative', py: 4 }}
    >
      {/* Logo filigrane */}
      <Box
        component="img"
        src={logoUrl}
        alt=""
        aria-hidden
        sx={{ width: 120, opacity: 0.07, mb: 1 }}
      />

      <Typography variant="h6" fontWeight={700} color="text.primary">
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" maxWidth={360}>
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            mt: 1,
            backgroundImage: 'linear-gradient(90deg, #2979FF 0%, #5040D8 55%, #7B2FBE 100%)',
          }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
