import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import { alpha } from '@mui/material/styles';
import StatusChip from '../components/common/StatusChip';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getArticles, deleteArticle, patchArticleStatus, notifyArticle, getCategories } from '../services/api';
import { BRAND } from '../theme';
import type { Article, ArticleStatus } from '../types';

export default function ArticlesPage() {
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  // Filters
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [page,       setPage]       = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // UI state
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  // ── Data ──
  const { data: articles = [], isLoading, isError } = useQuery({
    queryKey: ['articles'],
    queryFn:  getArticles,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  });

  const categoryMap = Object.fromEntries(categories.map((c) => [String(c.id), c]));

  // ── Mutations ──
  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setSnack({ msg: 'Article supprimé.', severity: 'success' });
      setDeleteTarget(null);
    },
    onError: (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: ArticleStatus }) =>
      patchArticleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setSnack({ msg: 'Statut mis à jour.', severity: 'success' });
    },
    onError: (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  const notifyMut = useMutation({
    mutationFn: (id: number | string) => notifyArticle(id),
    onSuccess: () => setSnack({ msg: 'Notification envoyée.', severity: 'success' }),
    onError:   (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  // ── Filtered / paginated data ──
  const filtered = articles.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (isLoading) return <LoadingState />;
  if (isError)   return (
    <EmptyState
      title="Erreur de chargement"
      description="Impossible de récupérer les articles. Vérifiez que le backend est démarré."
      actionLabel="Réessayer"
      onAction={() => queryClient.invalidateQueries({ queryKey: ['articles'] })}
    />
  );

  return (
    <Box>
      {/* ── Toolbar ── */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
        <TextField
          size="small"
          placeholder="Rechercher un article…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ minWidth: 240, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Statut</InputLabel>
          <Select
            value={statusFilter}
            label="Statut"
            onChange={(e) => { setStatusFilter(e.target.value as ArticleStatus | 'all'); setPage(0); }}
          >
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="draft">Brouillon</MenuItem>
            <MenuItem value="published">Publié</MenuItem>
            <MenuItem value="archived">Archivé</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/articles/new')}
          sx={{ backgroundImage: BRAND.gradient, whiteSpace: 'nowrap' }}
        >
          Nouvel article
        </Button>
      </Box>

      {/* ── Table ── */}
      {paginated.length === 0 ? (
        <EmptyState
          title="Aucun article trouvé"
          description={search || statusFilter !== 'all' ? 'Essayez de modifier vos filtres.' : 'Créez votre premier article.'}
          actionLabel={!search && statusFilter === 'all' ? 'Créer un article' : undefined}
          onAction={() => navigate('/articles/new')}
        />
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 32 }}></TableCell>
                  <TableCell>Titre</TableCell>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Réseau</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map((article) => (
                  <TableRow key={article.id} hover>
                    {/* Featured star */}
                    <TableCell padding="checkbox">
                      {article.featured
                        ? <StarIcon sx={{ fontSize: 16, color: '#FFB74D' }} />
                        : <StarBorderIcon sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.4 }} />
                      }
                    </TableCell>

                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ cursor: 'pointer', '&:hover': { color: BRAND.blue } }}
                        onClick={() => navigate(`/articles/${article.id}/edit`)}
                        noWrap
                        maxWidth={280}
                      >
                        {article.title}
                      </Typography>
                      {article.summary && (
                        <Typography variant="caption" color="text.secondary" noWrap display="block" maxWidth={280}>
                          {article.summary}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const firstId = article.categoryIds?.[0] ?? (article.categoryId ? String(article.categoryId) : undefined);
                        const cat = firstId ? categoryMap[firstId] : null;
                        return cat ? (
                          <Chip
                            label={cat.name}
                            size="small"
                            sx={{
                              fontSize: '0.72rem',
                              bgcolor: cat.color
                                ? alpha(cat.color, 0.18)
                                : alpha(BRAND.purple, 0.14),
                              color: cat.color ?? BRAND.purple,
                              fontWeight: 600,
                            }}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        );
                      })()}
                    </TableCell>

                    <TableCell>
                      <StatusChip status={article.status} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {article.network?.name ?? '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {article.createdAt
                          ? new Date(article.createdAt).toLocaleDateString('fr-FR')
                          : '—'}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        {/* Status quick actions */}
                        {article.status === 'draft' && (
                          <Tooltip title="Publier">
                            <IconButton
                              size="small"
                              onClick={() => statusMut.mutate({ id: article.id, status: 'published' })}
                              sx={{ color: '#00E676' }}
                            >
                              <NotificationsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {article.status === 'published' && (
                          <Tooltip title="Envoyer notification">
                            <IconButton
                              size="small"
                              onClick={() => notifyMut.mutate(article.id)}
                              sx={{ color: '#40C4FF' }}
                            >
                              <NotificationsIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Modifier">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/articles/${article.id}/edit`)}
                            sx={{ color: 'text.secondary', '&:hover': { color: BRAND.blue } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Supprimer">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTarget(article)}
                            sx={{ color: 'text.secondary', '&:hover': { color: '#FF4D6D' } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Lignes par page"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
          />
        </Card>
      )}

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer « ${deleteTarget?.title} » ? Cette action est irréversible.`}
        loading={deleteMut.isPending}
        confirmLabel="Supprimer"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />

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
