import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  TableSortLabel,
  Checkbox,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Skeleton,
  Autocomplete,
  Divider,
} from '@mui/material';
import {
  Search,
  Add,
  Edit,
  Delete,
  Archive,
  Star,
  StarBorder,
  Notifications,
  CheckCircle,
  FilterList,
} from '@mui/icons-material';
import {
  getArticles,
  getCategories,
  getNetworks,
  deleteArticle,
  patchArticleStatus,
  notifyArticle,
  updateArticle,
} from '../services/api';
import StatusChip from '../components/common/StatusChip';
import ConfirmDialog from '../components/common/ConfirmDialog';
import type { Article, ArticleStatus, Category, Network } from '../types';

type SortDir = 'asc' | 'desc';
type SortCol = 'title' | 'createdAt' | 'status' | 'networkId';

const PAGE_SIZE = 20;

function buildCategoryMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map(c => [String(c.id), c]));
}

function resolveCategory(article: Article, catMap: Map<string, Category>): Category | null {
  const ids = article.categoryIds?.map(String) ?? [];
  if (ids.length > 0) return catMap.get(ids[0]) ?? null;
  if (article.categoryId != null) return catMap.get(String(article.categoryId)) ?? null;
  return null;
}

export default function ArticlesPage() {
  const navigate   = useNavigate();
  const qc         = useQueryClient();

  // ── Filter/sort state ──────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [searchInput,   setSearchInput]   = useState('');
  const [statusFilter,  setStatusFilter]  = useState<ArticleStatus | ''>('');
  const [selectedCats,  setSelectedCats]  = useState<Category[]>([]);
  const [networkFilter, setNetworkFilter] = useState<string>('');
  const [featuredOnly,  setFeaturedOnly]  = useState(false);
  const [sortCol,       setSortCol]       = useState<SortCol>('createdAt');
  const [sortDir,       setSortDir]       = useState<SortDir>('desc');
  const [page,          setPage]          = useState(0);

  // Debounce search
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [statusFilter, selectedCats, networkFilter, featuredOnly, sortCol, sortDir]);

  // ── Data queries ───────────────────────────────────────────────────────
  const { data: allArticles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['articles', 'all'],
    queryFn: () => getArticles({ limit: 100 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: networks = [] } = useQuery({
    queryKey: ['networks'],
    queryFn: getNetworks,
  });

  const catMap = useMemo(() => buildCategoryMap(categories), [categories]);

  // ── Client-side filtering + sorting ───────────────────────────────────
  const filtered = useMemo(() => {
    let list = allArticles as Article[];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        (a.content?.toLowerCase().includes(q))
      );
    }
    if (statusFilter) {
      list = list.filter(a => a.status === statusFilter);
    }
    if (selectedCats.length > 0) {
      const ids = new Set(selectedCats.map(c => String(c.id)));
      list = list.filter(a => {
        const artIds = (a.categoryIds?.map(String) ?? []);
        if (artIds.length > 0) return artIds.some(id => ids.has(id));
        if (a.categoryId != null) return ids.has(String(a.categoryId));
        return false;
      });
    }
    if (networkFilter) {
      list = list.filter(a => String(a.networkId) === networkFilter);
    }
    if (featuredOnly) {
      list = list.filter(a => a.featured);
    }

    // Sort
    list = [...list].sort((a, b) => {
      let av: string, bv: string;
      switch (sortCol) {
        case 'title':     av = a.title;              bv = b.title; break;
        case 'status':    av = a.status;             bv = b.status; break;
        case 'networkId': av = String(a.networkId ?? ''); bv = String(b.networkId ?? ''); break;
        default:          av = a.createdAt ?? '';    bv = b.createdAt ?? '';
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });

    return list;
  }, [allArticles, search, statusFilter, selectedCats, networkFilter, featuredOnly, sortCol, sortDir]);

  // Pagination (client-side)
  const paginated = useMemo(() =>
    filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filtered, page]
  );

  // ── Selection (bulk actions) ──────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const allPageIds  = paginated.map(a => String(a.id));
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selected.has(id));
  const someSelected = allPageIds.some(id => selected.has(id)) && !allSelected;

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allSelected) allPageIds.forEach(id => next.delete(id));
      else allPageIds.forEach(id => next.add(id));
      return next;
    });
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Confirm dialog ────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Snackbar ──────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────────
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteArticle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      setSnack({ msg: 'Article supprimé', sev: 'success' });
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ArticleStatus }) =>
      patchArticleStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      setSnack({ msg: 'Statut mis à jour', sev: 'success' });
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const notifyMut = useMutation({
    mutationFn: (id: string) => notifyArticle(id),
    onSuccess: () => setSnack({ msg: 'Notification envoyée', sev: 'success' }),
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const featuredMut = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      updateArticle(id, { featured }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  // Bulk status change
  const [bulkStatus, setBulkStatus] = useState<ArticleStatus | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const applyBulkStatus = useCallback(async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map(id => patchArticleStatus(id, bulkStatus as ArticleStatus))
      );
      qc.invalidateQueries({ queryKey: ['articles'] });
      setSelected(new Set());
      setBulkStatus('');
      setSnack({ msg: `${selected.size} articles mis à jour`, sev: 'success' });
    } catch (e: any) {
      setSnack({ msg: e.message, sev: 'error' });
    } finally {
      setBulkLoading(false);
    }
  }, [bulkStatus, selected, qc]);

  // ── Sort handler ──────────────────────────────────────────────────────
  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const networkMap = useMemo(() => {
    const m = new Map<string, Network>();
    (networks as Network[]).forEach(n => m.set(String(n.id), n));
    return m;
  }, [networks]);

  return (
    <Box>
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '12px !important' }}>
          {/* Row 1: search + add */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mb={1.5} alignItems="flex-start">
            <TextField
              size="small"
              placeholder="Rechercher titre / contenu…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/articles/new')}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Nouvel article
            </Button>
          </Stack>

          {/* Row 2: filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={e => setStatusFilter(e.target.value as ArticleStatus | '')}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="published">Publié</MenuItem>
                <MenuItem value="archived">Archivé</MenuItem>
              </Select>
            </FormControl>

            <Autocomplete
              multiple
              size="small"
              options={categories as Category[]}
              getOptionLabel={o => o.name}
              value={selectedCats}
              onChange={(_, v) => setSelectedCats(v)}
              sx={{ minWidth: 200, flexGrow: 1 }}
              renderInput={params => (
                <TextField {...params} label="Catégories" placeholder="Filtrer…" />
              )}
              renderTags={(vals, getTagProps) =>
                vals.map((c, i) => {
                  const tagProps = getTagProps({ index: i });
                  return (
                    <Chip
                      {...tagProps}
                      key={tagProps.key}
                      label={c.name}
                      size="small"
                      sx={{ bgcolor: c.color ?? 'primary.main', color: '#fff' }}
                    />
                  );
                })
              }
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Réseau</InputLabel>
              <Select
                value={networkFilter}
                label="Réseau"
                onChange={e => setNetworkFilter(e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {(networks as Network[]).map(n => (
                  <MenuItem key={n.id} value={String(n.id)}>{n.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={featuredOnly}
                  onChange={e => setFeaturedOnly(e.target.checked)}
                  size="small"
                />
              }
              label={<Typography variant="body2">Mis en avant</Typography>}
              sx={{ ml: 0 }}
            />
          </Stack>

          {/* Row 3: bulk actions (when selection active) */}
          {selected.size > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  {selected.size} sélectionné(s) —
                </Typography>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Changer statut</InputLabel>
                  <Select
                    value={bulkStatus}
                    label="Changer statut"
                    onChange={e => setBulkStatus(e.target.value as ArticleStatus | '')}
                  >
                    <MenuItem value="">—</MenuItem>
                    <MenuItem value="draft">Brouillon</MenuItem>
                    <MenuItem value="published">Publié</MenuItem>
                    <MenuItem value="archived">Archivé</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!bulkStatus || bulkLoading}
                  onClick={applyBulkStatus}
                  startIcon={bulkLoading ? <CircularProgress size={14} /> : <CheckCircle />}
                >
                  Appliquer
                </Button>
                <Button size="small" onClick={() => setSelected(new Set())}>
                  Annuler sélection
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <Card>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={someSelected}
                    checked={allSelected}
                    onChange={toggleAll}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortCol === 'title'}
                    direction={sortCol === 'title' ? sortDir : 'asc'}
                    onClick={() => handleSort('title')}
                  >
                    Titre
                  </TableSortLabel>
                </TableCell>
                <TableCell>Catégories</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortCol === 'status'}
                    direction={sortCol === 'status' ? sortDir : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Statut
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortCol === 'networkId'}
                    direction={sortCol === 'networkId' ? sortDir : 'asc'}
                    onClick={() => handleSort('networkId')}
                  >
                    Réseau
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortCol === 'createdAt'}
                    direction={sortCol === 'createdAt' ? sortDir : 'asc'}
                    onClick={() => handleSort('createdAt')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingArticles ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <FilterList sx={{ opacity: 0.3, fontSize: 40 }} />
                      <Typography color="text.secondary">Aucun article trouvé</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((article: Article) => {
                  const isSelected = selected.has(String(article.id));
                  const cat        = resolveCategory(article, catMap);
                  const allCatIds  = article.categoryIds?.map(String) ?? (article.categoryId ? [String(article.categoryId)] : []);
                  const network    = article.network ?? (article.networkId ? networkMap.get(String(article.networkId)) : null);

                  return (
                    <TableRow
                      key={article.id}
                      selected={isSelected}
                      hover
                      sx={{ '&.Mui-selected': { bgcolor: 'action.selected' } }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleOne(String(article.id))}
                          size="small"
                        />
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          {article.featured && (
                            <Star sx={{ color: '#FFD700', fontSize: 16 }} />
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 260 }}>
                              {article.title}
                            </Typography>
                            {article.summary && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260, display: 'block' }}>
                                {article.summary}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {allCatIds.length > 0 ? (
                            allCatIds.slice(0, 2).map(cid => {
                              const c = catMap.get(cid);
                              return c ? (
                                <Chip
                                  key={cid}
                                  label={c.name}
                                  size="small"
                                  sx={{ bgcolor: c.color ?? 'primary.main', color: '#fff', fontSize: 11 }}
                                />
                              ) : null;
                            })
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                          {allCatIds.length > 2 && (
                            <Chip label={`+${allCatIds.length - 2}`} size="small" />
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <StatusChip status={article.status} />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {network?.name ?? '—'}
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
                        <Stack direction="row" spacing={0} justifyContent="flex-end">
                          {/* Featured toggle */}
                          <Tooltip title={article.featured ? 'Retirer de la une' : 'Mettre en avant'}>
                            <IconButton
                              size="small"
                              onClick={() => featuredMut.mutate({ id: String(article.id), featured: !article.featured })}
                            >
                              {article.featured ? <Star sx={{ color: '#FFD700' }} fontSize="small" /> : <StarBorder fontSize="small" />}
                            </IconButton>
                          </Tooltip>

                          {/* Publish */}
                          {article.status === 'draft' && (
                            <Tooltip title="Publier">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => statusMut.mutate({ id: String(article.id), status: 'published' })}
                              >
                                <CheckCircle fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Archive */}
                          {article.status === 'published' && (
                            <Tooltip title="Archiver">
                              <IconButton
                                size="small"
                                onClick={() => statusMut.mutate({ id: String(article.id), status: 'archived' })}
                              >
                                <Archive fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Notify */}
                          {article.status === 'published' && (
                            <Tooltip title="Notifier">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/notifications?articleId=${article.id}`)}
                              >
                                <Notifications fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Edit */}
                          <Tooltip title="Éditer">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/articles/${article.id}/edit`)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip title="Supprimer">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setConfirmDelete(String(article.id))}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
        />
      </Card>

      {/* ── Confirm delete dialog ──────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Supprimer l'article ?"
        message="Cette action est irréversible."
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (confirmDelete) {
            deleteMut.mutate(confirmDelete, { onSettled: () => setConfirmDelete(null) });
          }
        }}
        onClose={() => setConfirmDelete(null)}
      />

      {/* ── Snackbar ───────────────────────────────────────────────────── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={3000}
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
