import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Stack,
  Chip,
  Divider,
  Snackbar,
  Alert,
  Skeleton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  CircularProgress,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import {
  Send,
  Close,
  Visibility,
  Notifications as NotifIcon,
  Article as ArticleIcon,
  History,
  Email,
  CheckCircle,
  ErrorOutline,
  HourglassEmpty,
} from '@mui/icons-material';
import { getNotifications, getArticles, notifyArticle } from '../services/api';
import type { Article, Notification, NotifyPayload } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── HTML Preview Dialog ──────────────────────────────────────────────────────
function HtmlPreviewDialog({
  html,
  onClose,
}: {
  html: string;
  onClose: () => void;
}) {
  return (
    <Dialog open maxWidth="md" fullWidth onClose={onClose}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          Prévisualisation email
          <IconButton size="small" onClick={onClose}><Close /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, height: 480 }}>
        <iframe
          srcDoc={html}
          style={{ width: '100%', height: '100%', border: 'none' }}
          sandbox="allow-same-origin"
          title="Email preview"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Simple email template preview (front-side) ────────────────────────────────
function buildPreviewHtml(article: Article, subject: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:sans-serif;background:#f4f4f4;margin:0;padding:20px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden">
    ${article.imageUrl ? `<img src="${article.imageUrl}" style="width:100%;height:200px;object-fit:cover" alt="">` : ''}
    <div style="padding:24px">
      <h1 style="color:#2979FF;margin:0 0 8px">${article.title}</h1>
      ${article.summary ? `<p style="color:#666;margin:0 0 16px">${article.summary}</p>` : ''}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0">
      <p style="color:#333;white-space:pre-wrap">${article.content?.slice(0, 300)}…</p>
      <a href="#" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#2979FF;color:#fff;border-radius:4px;text-decoration:none">
        Lire l'article complet
      </a>
    </div>
    <div style="padding:12px 24px;background:#f8f8f8;color:#999;font-size:12px">
      TARAM GROUP — Editorial Back Office
    </div>
  </div>
</body>
</html>`;
}

// ── Notification history item ────────────────────────────────────────────────
function NotifHistoryItem({
  notif,
  articleTitle,
  onPreview,
}: {
  notif: Notification;
  articleTitle?: string;
  onPreview: (html: string) => void;
}) {
  const recipientCount = notif.recipientCount ?? notif.recipients?.length ?? 0;
  const date = notif.sentAt ?? notif.createdAt;

  return (
    <ListItem
      divider
      alignItems="flex-start"
      secondaryAction={
        notif.html ? (
          <Tooltip title="Voir l'email HTML">
            <IconButton size="small" onClick={() => onPreview(notif.html!)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : undefined
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.dark', width: 36, height: 36 }}>
          <Email fontSize="small" />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {articleTitle && (
              <Chip
                icon={<ArticleIcon sx={{ fontSize: 12 }} />}
                label={articleTitle}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ maxWidth: 200 }}
              />
            )}
            {notif.subject && (
              <Typography variant="body2" fontWeight={600} noWrap>
                {notif.subject}
              </Typography>
            )}
          </Stack>
        }
        secondary={
          <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap">
            {recipientCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {recipientCount} destinataire(s)
              </Typography>
            )}
            {date && (
              <Typography variant="caption" color="text.secondary">
                · {new Date(date).toLocaleString('fr-FR')}
              </Typography>
            )}
            {notif.status && (
              <Chip
                label={notif.status}
                size="small"
                color={notif.status === 'sent' ? 'success' : notif.status === 'failed' ? 'error' : 'default'}
              />
            )}
          </Stack>
        }
      />
    </ListItem>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedArticleId = searchParams.get('articleId');

  // ── Data ──────────────────────────────────────────────────────────────
  const { data: notifications = [], isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn:  getNotifications,
  });

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['articles', 'all'],
    queryFn:  () => getArticles({ status: 'published', limit: 500 }),
  });

  // ── Form state ────────────────────────────────────────────────────────
  const [selectedArticleId, setSelectedArticleId] = useState<string>(preselectedArticleId ?? '');
  const [recipientsInput,   setRecipientsInput]   = useState('');
  const [subjectInput,      setSubjectInput]       = useState('');

  const selectedArticle = useMemo(
    () => (articles as Article[]).find(a => String(a.id) === selectedArticleId) ?? null,
    [articles, selectedArticleId]
  );

  // Pre-fill subject when article changes
  useEffect(() => {
    if (selectedArticle) {
      setSubjectInput(`Nouvel article : ${selectedArticle.title}`);
    }
  }, [selectedArticle]);

  // ── HTML preview states ────────────────────────────────────────────────
  const [showFrontPreview, setShowFrontPreview] = useState(false);
  const [apiHtml,          setApiHtml]          = useState<string | null>(null);

  const frontPreviewHtml = useMemo(() => {
    if (!selectedArticle) return null;
    return buildPreviewHtml(selectedArticle, subjectInput || selectedArticle.title);
  }, [selectedArticle, subjectInput]);

  // ── Send mutation ──────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const sendMut = useMutation({
    mutationFn: () => {
      const recipients = recipientsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const payload: NotifyPayload = { recipients, subject: subjectInput || undefined };
      return notifyArticle(selectedArticleId, payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      setSnack({ msg: 'Notification envoyée avec succès', sev: 'success' });
      if (res.html) setApiHtml(res.html);
      setRecipientsInput('');
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  // ── Sorted notifications ───────────────────────────────────────────────
  const sortedNotifs = useMemo(() =>
    [...notifications].sort((a: Notification, b: Notification) => {
      const da = a.sentAt ?? a.createdAt ?? '';
      const db = b.sentAt ?? b.createdAt ?? '';
      return db.localeCompare(da);
    }),
    [notifications]
  );

  const articleTitleMap = useMemo(() => {
    const m = new Map<string, string>();
    (articles as Article[]).forEach(a => m.set(String(a.id), a.title));
    return m;
  }, [articles]);

  // ── Recipients & validation ────────────────────────────────────────────
  const recipientsList = recipientsInput
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const invalidEmails = recipientsList.filter(e => !EMAIL_RE.test(e));

  const canSend =
    !!selectedArticleId &&
    recipientsList.length > 0 &&
    invalidEmails.length === 0 &&
    !sendMut.isPending;

  // ── History stats ──────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');

  const historyStats = useMemo(() => ({
    total:   sortedNotifs.length,
    sent:    sortedNotifs.filter(n => n.status === 'sent').length,
    failed:  sortedNotifs.filter(n => n.status === 'failed').length,
    pending: sortedNotifs.filter(n => n.status === 'pending').length,
  }), [sortedNotifs]);

  const filteredNotifs = useMemo(() =>
    statusFilter === 'all'
      ? sortedNotifs
      : sortedNotifs.filter((n: Notification) => n.status === statusFilter),
    [sortedNotifs, statusFilter]
  );

  return (
    <Box>
      <Grid container spacing={3}>
        {/* ── Send form ──────────────────────────────────────────────── */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <Send color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Envoyer une notification
                </Typography>
              </Stack>

              <Stack spacing={2}>
                {/* Article selection */}
                <FormControl fullWidth size="small">
                  <InputLabel>Article *</InputLabel>
                  <Select
                    value={selectedArticleId}
                    label="Article *"
                    onChange={e => setSelectedArticleId(e.target.value)}
                  >
                    <MenuItem value=""><em>Sélectionner un article publié</em></MenuItem>
                    {loadingArticles ? (
                      <MenuItem disabled><CircularProgress size={16} /></MenuItem>
                    ) : (
                      (articles as Article[]).map(a => (
                        <MenuItem key={a.id} value={String(a.id)}>
                          {a.title}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* Subject */}
                <TextField
                  label="Sujet de l'email"
                  fullWidth
                  size="small"
                  value={subjectInput}
                  onChange={e => setSubjectInput(e.target.value)}
                  placeholder="Sujet automatique si vide"
                />

                {/* Recipients */}
                <TextField
                  label="Destinataires *"
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                  value={recipientsInput}
                  onChange={e => setRecipientsInput(e.target.value)}
                  placeholder="email1@ex.com, email2@ex.com, …"
                  error={invalidEmails.length > 0}
                  helperText={
                    invalidEmails.length > 0
                      ? `Adresse(s) invalide(s) : ${invalidEmails.slice(0, 3).join(', ')}${invalidEmails.length > 3 ? ` +${invalidEmails.length - 3}` : ''}`
                      : recipientsList.length > 0
                        ? `${recipientsList.length} destinataire(s) détecté(s)`
                        : 'Séparer les adresses par des virgules'
                  }
                />

                {/* Recipient chips preview */}
                {recipientsList.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {recipientsList.slice(0, 8).map(r => (
                      <Chip key={r} label={r} size="small" variant="outlined" />
                    ))}
                    {recipientsList.length > 8 && (
                      <Chip label={`+${recipientsList.length - 8}`} size="small" />
                    )}
                  </Stack>
                )}

                <Stack direction="row" spacing={1}>
                  {/* Front preview */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Visibility />}
                    disabled={!selectedArticle}
                    onClick={() => setShowFrontPreview(true)}
                  >
                    Prévisualiser
                  </Button>

                  {/* Send */}
                  <Button
                    variant="contained"
                    startIcon={sendMut.isPending ? <CircularProgress size={16} color="inherit" /> : <Send />}
                    disabled={!canSend}
                    onClick={() => sendMut.mutate()}
                    sx={{ flexGrow: 1 }}
                  >
                    Envoyer
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ── History ────────────────────────────────────────────────── */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <History color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Historique
                </Typography>
                <Chip label={historyStats.total} size="small" color="primary" />
              </Stack>

              {/* Stats summary */}
              {historyStats.total > 0 && (
                <Stack direction="row" spacing={1} mb={1.5} flexWrap="wrap">
                  <Chip
                    icon={<CheckCircle sx={{ fontSize: 14 }} />}
                    label={`${historyStats.sent} envoyé(s)`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                  {historyStats.failed > 0 && (
                    <Chip
                      icon={<ErrorOutline sx={{ fontSize: 14 }} />}
                      label={`${historyStats.failed} échoué(s)`}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                  {historyStats.pending > 0 && (
                    <Chip
                      icon={<HourglassEmpty sx={{ fontSize: 14 }} />}
                      label={`${historyStats.pending} en attente`}
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  )}
                </Stack>
              )}

              {/* Status filter */}
              {historyStats.total > 0 && (
                <Stack direction="row" spacing={0.5} mb={1} flexWrap="wrap">
                  {(['all', 'sent', 'failed', 'pending'] as const).map(f => (
                    <Chip
                      key={f}
                      label={f === 'all' ? 'Tous' : f === 'sent' ? 'Envoyés' : f === 'failed' ? 'Échoués' : 'En attente'}
                      size="small"
                      variant={statusFilter === f ? 'filled' : 'outlined'}
                      color={statusFilter === f ? 'primary' : 'default'}
                      onClick={() => setStatusFilter(f)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Stack>
              )}

              <Divider sx={{ mb: 1 }} />

              {loadingNotifs ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={64} sx={{ mb: 1 }} />
                ))
              ) : filteredNotifs.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', borderRadius: 2, mt: 1 }}>
                  <NotifIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
                  <Typography color="text.secondary">
                    {sortedNotifs.length === 0
                      ? 'Aucune notification envoyée'
                      : 'Aucune notification pour ce filtre'}
                  </Typography>
                </Paper>
              ) : (
                <List dense disablePadding sx={{ maxHeight: 480, overflowY: 'auto' }}>
                  {filteredNotifs.map((n: Notification) => (
                    <NotifHistoryItem
                      key={n.id}
                      notif={n}
                      articleTitle={
                        n.article?.title
                          ?? (n.articleId ? articleTitleMap.get(String(n.articleId)) : undefined)
                      }
                      onPreview={html => setApiHtml(html)}
                    />
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Front-side preview dialog ──────────────────────────────────── */}
      {showFrontPreview && frontPreviewHtml && (
        <HtmlPreviewDialog html={frontPreviewHtml} onClose={() => setShowFrontPreview(false)} />
      )}

      {/* ── API response HTML preview dialog ──────────────────────────── */}
      {apiHtml && (
        <HtmlPreviewDialog html={apiHtml} onClose={() => setApiHtml(null)} />
      )}

      {/* ── Snackbar ──────────────────────────────────────────────────── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.sev} onClose={() => setSnack(null)} variant="filled">
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
