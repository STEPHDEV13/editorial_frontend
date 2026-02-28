import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Typography,
  Chip,
  Stack,
  Divider,
  Snackbar,
  Alert,
  Skeleton,
  Autocomplete,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  CircularProgress,
  Tooltip,
  Paper,
  Badge,
} from '@mui/material';
import {
  Save,
  Publish,
  Archive,
  Notifications,
  ArrowBack,
  Star,
  StarBorder,
  CloudDone,
  CloudOff,
  HourglassBottom,
} from '@mui/icons-material';
import {
  getArticle,
  createArticle,
  updateArticle,
  patchArticleStatus,
  notifyArticle,
  getCategories,
  getNetworks,
} from '../services/api';
import StatusChip from '../components/common/StatusChip';
import type { ArticleFormData, Category, Network, Article } from '../types';

// ── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  title:      z.string().min(5, 'Titre minimum 5 caractères').max(255),
  content:    z.string().min(50, 'Contenu minimum 50 caractères'),
  summary:    z.string().max(500).optional().or(z.literal('')),
  slug:       z.string().max(255).optional().or(z.literal('')),
  imageUrl:   z.string().url('URL invalide').optional().or(z.literal('')),
  featured:   z.boolean(),
  categoryIds: z.array(z.any()).min(1, 'Au moins une catégorie requise'),
  networkId:   z.union([z.string(), z.number()]).nullable().refine(
    v => v !== null && v !== '',
    { message: 'Réseau obligatoire' }
  ),
});

type FormValues = z.infer<typeof schema>;

// ── Auto-save indicator ──────────────────────────────────────────────────────
type SaveState = 'idle' | 'saving' | 'saved' | 'unsaved';
function AutoSaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { icon: React.ReactNode; label: string; color: string }> = {
    idle:    { icon: null,                             label: '',               color: 'text.disabled' },
    saving:  { icon: <HourglassBottom fontSize="small" />, label: 'Sauvegarde…',  color: 'info.main' },
    saved:   { icon: <CloudDone fontSize="small" />,       label: 'Brouillon sauvegardé', color: 'success.main' },
    unsaved: { icon: <CloudOff fontSize="small" />,        label: 'Non sauvegardé', color: 'warning.main' },
  };
  const { icon, label, color } = map[state];
  if (!label) return null;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color }}>
      {icon}
      <Typography variant="caption" color={color}>{label}</Typography>
    </Stack>
  );
}

// ── Main form page ────────────────────────────────────────────────────────────
export default function ArticleFormPage() {
  const { id }     = useParams<{ id?: string }>();
  const isEdit     = !!id;
  const navigate   = useNavigate();
  const qc         = useQueryClient();

  const [snack,     setSnack]    = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Data queries ──────────────────────────────────────────────────────
  const { data: article, isLoading: loadingArticle } = useQuery({
    queryKey: ['article', id],
    queryFn:  () => getArticle(id!),
    enabled:  isEdit,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  });

  const { data: networks = [] } = useQuery({
    queryKey: ['networks'],
    queryFn:  getNetworks,
  });

  // ── Form ──────────────────────────────────────────────────────────────
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:       '',
      content:     '',
      summary:     '',
      slug:        '',
      imageUrl:    '',
      featured:    false,
      categoryIds: [],
      networkId:   null,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (!article) return;
    const catIds = article.categoryIds?.map(String) ?? (article.categoryId ? [String(article.categoryId)] : []);
    const selectedCats = catIds
      .map(id => (categories as Category[]).find(c => String(c.id) === id))
      .filter(Boolean) as Category[];

    reset({
      title:       article.title,
      content:     article.content,
      summary:     article.summary ?? '',
      slug:        article.slug ?? '',
      imageUrl:    article.imageUrl ?? '',
      featured:    article.featured,
      categoryIds: selectedCats,
      networkId:   article.networkId ? String(article.networkId) : null,
    });
  }, [article, categories, reset]);

  // Mark unsaved when form changes
  useEffect(() => {
    if (isDirty && isEdit) setSaveState('unsaved');
  }, [isDirty, isEdit]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (data: ArticleFormData) => createArticle(data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      setSnack({ msg: 'Article créé', sev: 'success' });
      navigate(`/articles/${created.id}/edit`, { replace: true });
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const updateMut = useMutation({
    mutationFn: (data: ArticleFormData) => updateArticle(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['article', id] });
      setSaveState('saved');
      setSnack({ msg: 'Article sauvegardé', sev: 'success' });
    },
    onError: (e: Error) => {
      setSaveState('unsaved');
      setSnack({ msg: e.message, sev: 'error' });
    },
  });

  const statusMut = useMutation({
    mutationFn: (status: 'published' | 'archived') => patchArticleStatus(id!, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['articles'] });
      qc.invalidateQueries({ queryKey: ['article', id] });
      setSnack({ msg: 'Statut mis à jour', sev: 'success' });
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const notifyMut = useMutation({
    mutationFn: () => notifyArticle(id!),
    onSuccess: () => setSnack({ msg: 'Notification envoyée', sev: 'success' }),
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  // ── Build API payload ─────────────────────────────────────────────────
  const buildPayload = useCallback((values: FormValues): ArticleFormData => ({
    title:       values.title,
    content:     values.content,
    summary:     values.summary || undefined,
    slug:        values.slug    || undefined,
    imageUrl:    values.imageUrl || undefined,
    featured:    values.featured,
    categoryIds: (values.categoryIds as Category[]).map(c => c.id),
    networkId:   values.networkId,
  }), []);

  // ── Auto-save every 30s (draft only) ──────────────────────────────────
  const formValues = watch();
  const doAutoSave = useCallback(() => {
    if (!isEdit) return;
    if (article?.status !== 'draft') return;
    setSaveState('saving');
    try {
      const payload = buildPayload(formValues as FormValues);
      updateArticle(id!, payload)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('unsaved'));
    } catch {
      setSaveState('unsaved');
    }
  }, [isEdit, article, formValues, id, buildPayload]);

  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setInterval(doAutoSave, 30_000);
    return () => clearInterval(autoSaveTimer.current as any);
  }, [doAutoSave]);

  // ── Submit ────────────────────────────────────────────────────────────
  const onSubmit = (values: FormValues) => {
    const payload = buildPayload(values);
    if (isEdit) updateMut.mutate(payload);
    else        createMut.mutate(payload);
  };

  // ── Preview values ────────────────────────────────────────────────────
  const watchTitle    = watch('title');
  const watchSummary  = watch('summary');
  const watchImageUrl = watch('imageUrl');
  const watchFeatured = watch('featured');
  const watchCatIds   = watch('categoryIds') as Category[];
  const watchStatus   = article?.status ?? 'draft';
  const watchNetwork  = (networks as Network[]).find(n => String(n.id) === String(watch('networkId')));

  if (loadingArticle) {
    return (
      <Box>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} height={56} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      {/* ── Header bar ───────────────────────────────────────────────── */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2} flexWrap="wrap">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/articles')}
          size="small"
        >
          Articles
        </Button>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          {isEdit ? 'Modifier l\'article' : 'Nouvel article'}
        </Typography>

        {isEdit && <AutoSaveIndicator state={saveState} />}

        {/* Status actions */}
        {isEdit && article && (
          <Stack direction="row" spacing={1}>
            {article.status === 'draft' && (
              <Button
                variant="outlined"
                color="success"
                size="small"
                startIcon={<Publish />}
                onClick={() => statusMut.mutate('published')}
                disabled={statusMut.isPending}
              >
                Publier
              </Button>
            )}
            {article.status === 'published' && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Archive />}
                  onClick={() => statusMut.mutate('archived')}
                  disabled={statusMut.isPending}
                >
                  Archiver
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<Notifications />}
                  onClick={() => notifyMut.mutate()}
                  disabled={notifyMut.isPending}
                >
                  Notifier
                </Button>
              </>
            )}
          </Stack>
        )}

        <Button
          type="submit"
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          disabled={isSaving}
        >
          Sauvegarder
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {/* ── Left panel: form ────────────────────────────────────────── */}
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <TextField
                    label="Titre *"
                    fullWidth
                    {...register('title')}
                    error={!!errors.title}
                    helperText={errors.title?.message ?? 'Minimum 5 caractères'}
                  />
                  <TextField
                    label="Slug"
                    fullWidth
                    {...register('slug')}
                    error={!!errors.slug}
                    helperText={errors.slug?.message}
                  />
                  <TextField
                    label="Résumé"
                    fullWidth
                    multiline
                    rows={2}
                    {...register('summary')}
                    error={!!errors.summary}
                    helperText={errors.summary?.message ?? 'Max 500 caractères'}
                  />
                  <TextField
                    label="Contenu *"
                    fullWidth
                    multiline
                    rows={12}
                    {...register('content')}
                    error={!!errors.content}
                    helperText={errors.content?.message ?? 'Minimum 50 caractères'}
                  />
                  <TextField
                    label="URL image de couverture"
                    fullWidth
                    {...register('imageUrl')}
                    error={!!errors.imageUrl}
                    helperText={errors.imageUrl?.message}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>
                  Classification
                </Typography>
                <Stack spacing={2}>
                  {/* Multi-category */}
                  <Controller
                    name="categoryIds"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        multiple
                        options={categories as Category[]}
                        getOptionLabel={o => o.name}
                        value={field.value as Category[]}
                        onChange={(_, v) => field.onChange(v)}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label="Catégories *"
                            error={!!errors.categoryIds}
                            helperText={errors.categoryIds?.message ?? 'Sélectionner au moins une catégorie'}
                          />
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
                    )}
                  />

                  {/* Network */}
                  <Controller
                    name="networkId"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.networkId}>
                        <InputLabel>Réseau *</InputLabel>
                        <Select
                          {...field}
                          value={field.value ?? ''}
                          label="Réseau *"
                        >
                          <MenuItem value=""><em>Sélectionner</em></MenuItem>
                          {(networks as Network[]).map(n => (
                            <MenuItem key={n.id} value={String(n.id)}>{n.name}</MenuItem>
                          ))}
                        </Select>
                        {errors.networkId && (
                          <FormHelperText>{errors.networkId.message as string}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />

                  {/* Featured */}
                  <Controller
                    name="featured"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value}
                            onChange={e => field.onChange(e.target.checked)}
                            color="warning"
                          />
                        }
                        label={
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {field.value ? <Star sx={{ color: '#FFD700' }} /> : <StarBorder />}
                            <Typography>Mis en avant</Typography>
                          </Stack>
                        }
                      />
                    )}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* ── Right panel: preview ─────────────────────────────────────── */}
        <Grid item xs={12} md={5}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} mb={2} color="text.secondary">
                PRÉVISUALISATION
              </Typography>

              {watchImageUrl && (
                <CardMedia
                  component="img"
                  image={watchImageUrl}
                  alt="cover"
                  sx={{ borderRadius: 1, mb: 2, maxHeight: 180, objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}

              <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
                <StatusChip status={watchStatus} />
                {watchFeatured && (
                  <Chip
                    icon={<Star sx={{ fontSize: 14, color: '#FFD700 !important' }} />}
                    label="Mis en avant"
                    size="small"
                    sx={{ bgcolor: 'rgba(255,215,0,0.15)' }}
                  />
                )}
                {watchNetwork && (
                  <Chip label={watchNetwork.name} size="small" variant="outlined" />
                )}
              </Stack>

              <Typography variant="h6" fontWeight={700} mb={1} sx={{ wordBreak: 'break-word' }}>
                {watchTitle || <span style={{ opacity: 0.3 }}>Titre de l'article…</span>}
              </Typography>

              {watchSummary && (
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                  {watchSummary}
                </Typography>
              )}

              {watchCatIds.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1.5}>
                  {watchCatIds.map((c: Category) => (
                    <Chip
                      key={c.id}
                      label={c.name}
                      size="small"
                      sx={{ bgcolor: c.color ?? 'primary.main', color: '#fff' }}
                    />
                  ))}
                </Stack>
              )}

              <Divider sx={{ my: 1.5 }} />

              {article?.publishedAt && (
                <Typography variant="caption" color="text.secondary">
                  Publié le {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                </Typography>
              )}

              {isEdit && saveState !== 'idle' && (
                <Box mt={1.5}>
                  <AutoSaveIndicator state={saveState} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Snackbar ──────────────────────────────────────────────────── */}
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
