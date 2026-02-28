import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface ConfirmDialogProps {
  open:          boolean;
  title:         string;
  message:       string;
  loading?:      boolean;
  confirmLabel?: string;
  onConfirm:     () => void;
  onClose:       () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  loading = false,
  confirmLabel = 'Confirmer',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'text.secondary' }}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} variant="outlined" color="inherit" size="small">
          Annuler
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color="error"
          size="small"
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
