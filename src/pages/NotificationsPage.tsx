import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HtmlIcon from '@mui/icons-material/Code';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import { getNotifications, getArticles, notifyArticle } from '../services/api';
import { BRAND } from '../theme';
import EmptyState from '../components/common/EmptyState';
import BrandGradientText from '../components/branding/BrandGradientText';
import type { Notification } from '../types';

// ── Notification row ───────────────────────────────────────────────────────
function NotifRow({
  notif,
  onViewHtml,
}: {
  notif:      Notification;
  onViewHtml: (html: string, title: string) => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        alignItems: 'flex-start',
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: 2,
          bgcolor: alpha(BRAND.blue, 0.12),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <NotificationsIcon sx={{ fontSize: 18, color: BRAND.blue }} />
      </Box>

      <Box flex={1} minWidth={0}>
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {notif.title}
          </Typography>
          {notif.article && (
            <Chip
              label={notif.article.title}
              size="small"
              sx={{ fontSize: '0.68rem', bgcolor: alpha(BRAND.purple, 0.12), color: BRAND.purple, maxWidth: 180 }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" mt={0.3} noWrap>
          {notif.body}
        </Typography>
        {notif.sentAt && (
          <Typography variant="caption" color="text.secondary" mt={0.3} display="block">
            Envoyée le {new Date(notif.sentAt).toLocaleString('fr-FR')}
          </Typography>
        )}
      </Box>

      {/* HTML preview button */}
      {notif.html && (
        <Tooltip title="Voir le HTML rendu">
          <IconButton
            size="small"
            onClick={() => onViewHtml(notif.html!, notif.title)}
            sx={{ color: 'text.secondary', '&:hover': { color: BRAND.blue }, flexShrink: 0 }}
          >
            <HtmlIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const [htmlDialog, setHtmlDialog] = useState<{ html: string; title: string } | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn:  getNotifications,
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles'],
    queryFn:  getArticles,
  });

  const publishedArticles = articles.filter((a) => a.status === 'published');

  const notifyMut = useMutation({
    mutationFn: (id: string) => notifyArticle(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSnack({ msg: 'Notification envoyée avec succès !', severity: 'success' });
      setSelectedArticleId('');
      if (data.html) setHtmlDialog({ html: data.html, title: 'Notification envoyée' });
    },
    onError: (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  return (
    <Box>
      {/* ── Send panel ── */}
      <Card sx={{ mb: 3, border: `1px solid ${alpha(BRAND.blue, 0.2)}` }}>
        <CardContent sx={{ p: 3 }}>
          <BrandGradientText variant="h6" sx={{ mb: 2 }}>
            Envoyer une notification
          </BrandGradientText>

          <Box display="flex" gap={2} alignItems="flex-end" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 300, flex: 1 }}>
              <InputLabel>Article publié</InputLabel>
              <Select
                value={selectedArticleId}
                label="Article publié"
                onChange={(e) => setSelectedArticleId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Sélectionner un article…</em>
                </MenuItem>
                {publishedArticles.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    {a.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={
                notifyMut.isPending
                  ? <CircularProgress size={16} color="inherit" />
                  : <SendIcon />
              }
              disabled={!selectedArticleId || notifyMut.isPending}
              onClick={() => notifyMut.mutate(selectedArticleId)}
              sx={{ backgroundImage: BRAND.gradient, whiteSpace: 'nowrap', minWidth: 180 }}
            >
              {notifyMut.isPending ? 'Envoi…' : 'Envoyer la notification'}
            </Button>
          </Box>

          {publishedArticles.length === 0 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Aucun article publié disponible. Publiez un article pour pouvoir envoyer une notification.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* ── History ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Historique ({notifications.length})
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3, pb: '24px !important' }}>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} display="flex" gap={2} py={2}>
                <Skeleton variant="rounded" width={38} height={38} />
                <Box flex={1}>
                  <Skeleton height={20} width="60%" />
                  <Skeleton height={16} width="80%" sx={{ mt: 0.5 }} />
                </Box>
              </Box>
            ))
          ) : notifications.length === 0 ? (
            <EmptyState
              title="Aucune notification"
              description="Les notifications envoyées apparaîtront ici."
            />
          ) : (
            notifications.map((n) => (
              <NotifRow
                key={n.id}
                notif={n}
                onViewHtml={(html, title) => setHtmlDialog({ html, title })}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* ── HTML preview dialog ── */}
      <Dialog
        open={!!htmlDialog}
        onClose={() => setHtmlDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          {htmlDialog?.title ?? 'Aperçu HTML'}
          <IconButton size="small" onClick={() => setHtmlDialog(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          {htmlDialog && (
            <Box
              component="iframe"
              srcDoc={htmlDialog.html}
              title="notification-html"
              sx={{
                width: '100%',
                minHeight: 480,
                border: 'none',
                bgcolor: '#fff',
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setHtmlDialog(null)} variant="outlined" size="small" color="inherit">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack?.severity} onClose={() => setSnack(null)} variant="filled">
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
