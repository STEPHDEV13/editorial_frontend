import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ArchiveIcon from '@mui/icons-material/Archive';
import StarIcon from '@mui/icons-material/Star';
import { alpha } from '@mui/material/styles';
import {
  getArticle, createArticle, updateArticle,
  patchArticleStatus, notifyArticle,
  getCategories, getNetworks,
} from '../services/api';
import { BRAND } from '../theme';
import BrandGradientText from '../components/branding/BrandGradientText';
import StatusChip from '../components/common/StatusChip';
import LoadingState from '../components/common/LoadingState';

// ── Validation schema ──────────────────────────────────────────────────────
const schema = z.object({
  title:      z.string().min(1, 'Le titre est requis').max(255),
  content:    z.string().min(1, 'Le contenu est requis'),
  summary:    z.string().max(500).optional(),
  slug:       z.string().max(255).optional(),
  imageUrl:   z.string().url('URL invalide').or(z.literal('')).optional(),
  featured:   z.boolean(),
  categoryId: z.union([z.string(), z.number()]).nullable().optional(),
  networkId:  z.union([z.string(), z.number()]).nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ArticleFormPage() {
  const { id }      = useParams<{ id: string }>();
  const isEdit      = !!id;
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  // ── Remote data ──
  const { data: article, isLoading: loadingArticle } = useQuery({
    queryKey: ['article', id],
    queryFn:  () => getArticle(id!),
    enabled:  isEdit,
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: networks   = [] } = useQuery({ queryKey: ['networks'],   queryFn: getNetworks   });

  // ── Form ──
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title:      '',
      content:    '',
      summary:    '',
      slug:       '',
      imageUrl:   '',
      featured:   false,
      categoryId: null,
      networkId:  null,
    },
  });

  // Populate form when article loaded
  useEffect(() => {
    if (article) {
      reset({
        title:      article.title,
        content:    article.content,
        summary:    article.summary ?? '',
        slug:       article.slug ?? '',
        imageUrl:   article.imageUrl ?? '',
        featured:   article.featured,
        categoryId: article.categoryId ?? null,
        networkId:  article.networkId  ?? null,
      });
    }
  }, [article, reset]);

  // Live preview values
  const watchTitle    = watch('title');
  const watchSummary  = watch('summary');
  const watchImageUrl = watch('imageUrl');
  const watchFeatured = watch('featured');
  const watchCatId    = watch('categoryId');
  const previewCat    = categories.find((c) => String(c.id) === String(watchCatId));

  // ── Mutations ──
  const saveMut = useMutation({
    mutationFn: (values: FormValues) =>
      isEdit
        ? updateArticle(id!, values)
        : createArticle(values as Parameters<typeof createArticle>[0]),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      setSnack({ msg: isEdit ? 'Article mis à jour.' : 'Article créé.', severity: 'success' });
      if (!isEdit) navigate(`/articles/${saved.id}/edit`, { replace: true });
    },
    onError: (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  const statusMut = useMutation({
    mutationFn: (status: 'published' | 'archived') =>
      patchArticleStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['article', id] });
      setSnack({ msg: 'Statut mis à jour.', severity: 'success' });
    },
    onError: (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  const notifyMut = useMutation({
    mutationFn: () => notifyArticle(id!),
    onSuccess:  () => setSnack({ msg: 'Notification envoyée !', severity: 'success' }),
    onError:    (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  if (isEdit && loadingArticle) return <LoadingState />;

  const currentStatus = article?.status ?? 'draft';

  return (
    <Box>
      {/* ── Page header ── */}
      <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
        <Button
          variant="outlined"
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/articles')}
          sx={{ borderColor: 'divider', color: 'text.secondary' }}
        >
          Retour
        </Button>
        <BrandGradientText variant="h5" sx={{ flex: 1 }}>
          {isEdit ? "Modifier l'article" : "Nouvel article"}
        </BrandGradientText>
        {isEdit && <StatusChip status={currentStatus} />}
      </Box>

      <Grid container spacing={3}>
        {/* ── Left: Form ── */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} noValidate>
                <Grid container spacing={2.5}>
                  {/* Title */}
                  <Grid item xs={12}>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Titre *"
                          fullWidth
                          error={!!errors.title}
                          helperText={errors.title?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Slug */}
                  <Grid item xs={12}>
                    <Controller
                      name="slug"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Slug (URL)"
                          fullWidth
                          size="small"
                          placeholder="auto-généré si vide"
                          error={!!errors.slug}
                          helperText={errors.slug?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Summary */}
                  <Grid item xs={12}>
                    <Controller
                      name="summary"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Résumé"
                          fullWidth
                          multiline
                          rows={2}
                          error={!!errors.summary}
                          helperText={errors.summary?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Content */}
                  <Grid item xs={12}>
                    <Controller
                      name="content"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Contenu *"
                          fullWidth
                          multiline
                          rows={10}
                          error={!!errors.content}
                          helperText={errors.content?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Image URL */}
                  <Grid item xs={12}>
                    <Controller
                      name="imageUrl"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="URL de l'image"
                          fullWidth
                          size="small"
                          placeholder="https://..."
                          error={!!errors.imageUrl}
                          helperText={errors.imageUrl?.message}
                        />
                      )}
                    />
                  </Grid>

                  {/* Category + Network */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Catégorie"
                          fullWidth
                          size="small"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        >
                          <MenuItem value="">Aucune</MenuItem>
                          {categories.map((c) => (
                            <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="networkId"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          label="Réseau"
                          fullWidth
                          size="small"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        >
                          <MenuItem value="">Aucun</MenuItem>
                          {networks.map((n) => (
                            <MenuItem key={n.id} value={String(n.id)}>{n.name}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>

                  {/* Featured */}
                  <Grid item xs={12}>
                    <Controller
                      name="featured"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              checked={field.value}
                              onChange={field.onChange}
                              sx={{
                                '& .MuiSwitch-thumb': { bgcolor: field.value ? BRAND.blue : undefined },
                                '& .Mui-checked + .MuiSwitch-track': { bgcolor: alpha(BRAND.blue, 0.5) },
                              }}
                            />
                          }
                          label={
                            <Box display="flex" alignItems="center" gap={0.8}>
                              <StarIcon sx={{ fontSize: 16, color: '#FFB74D' }} />
                              <span>Article à la une</span>
                            </Box>
                          }
                        />
                      )}
                    />
                  </Grid>

                  {/* Action buttons */}
                  <Grid item xs={12}>
                    <Divider sx={{ mb: 2 }} />
                    <Box display="flex" gap={1.5} flexWrap="wrap">
                      {/* Primary save */}
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={
                          saveMut.isPending
                            ? <CircularProgress size={16} color="inherit" />
                            : <SaveIcon />
                        }
                        disabled={saveMut.isPending}
                        sx={{ backgroundImage: BRAND.gradient, minWidth: 160 }}
                      >
                        {saveMut.isPending ? 'Enregistrement…' : 'Enregistrer'}
                      </Button>

                      {/* Status actions (only in edit mode) */}
                      {isEdit && currentStatus === 'draft' && (
                        <Button
                          variant="outlined"
                          startIcon={<PublishIcon />}
                          onClick={() => statusMut.mutate('published')}
                          disabled={statusMut.isPending}
                          sx={{ borderColor: '#00E676', color: '#00E676' }}
                        >
                          Publier
                        </Button>
                      )}
                      {isEdit && currentStatus === 'published' && (
                        <>
                          <Button
                            variant="outlined"
                            startIcon={<ArchiveIcon />}
                            onClick={() => statusMut.mutate('archived')}
                            disabled={statusMut.isPending}
                            sx={{ borderColor: '#9090B8', color: '#9090B8' }}
                          >
                            Archiver
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => notifyMut.mutate()}
                            disabled={notifyMut.isPending}
                            sx={{ borderColor: '#40C4FF', color: '#40C4FF' }}
                          >
                            Notifier
                          </Button>
                        </>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right: Preview ── */}
        <Grid item xs={12} md={5}>
          <Card sx={{ position: { md: 'sticky' }, top: { md: 80 } }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                Aperçu
              </Typography>

              {/* Cover image */}
              {watchImageUrl && (
                <Box
                  component="img"
                  src={watchImageUrl}
                  alt="cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  sx={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: 2,
                    mt: 1.5,
                    mb: 2,
                  }}
                />
              )}

              {/* Featured badge */}
              {watchFeatured && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: 13 }} />}
                  label="À la une"
                  size="small"
                  sx={{ mb: 1.5, bgcolor: alpha('#FFB74D', 0.15), color: '#FFB74D', fontWeight: 700, fontSize: '0.7rem' }}
                />
              )}

              {/* Category */}
              {previewCat && (
                <Chip
                  label={previewCat.name}
                  size="small"
                  sx={{
                    mb: 1.5,
                    ml: 0.5,
                    bgcolor: previewCat.color ? alpha(previewCat.color, 0.18) : alpha(BRAND.purple, 0.14),
                    color: previewCat.color ?? BRAND.purple,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              )}

              <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1, lineHeight: 1.3 }}>
                {watchTitle || <span style={{ opacity: 0.35 }}>Titre de l'article…</span>}
              </Typography>

              {watchSummary ? (
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {watchSummary}
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.35 }}>
                  Résumé de l'article…
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {isEdit && (
                <Box display="flex" gap={1} flexWrap="wrap">
                  <StatusChip status={currentStatus} />
                  {article?.publishedAt && (
                    <Typography variant="caption" color="text.secondary">
                      Publié le {new Date(article.publishedAt).toLocaleDateString('fr-FR')}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
