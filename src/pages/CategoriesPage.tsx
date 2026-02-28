import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { BRAND } from '../theme';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import BrandGradientText from '../components/branding/BrandGradientText';
import type { Category } from '../types';

// ── Palette of preset colors ───────────────────────────────────────────────
const PRESET_COLORS = [
  '#2979FF', '#7B2FBE', '#00E676', '#FFB74D',
  '#FF4D6D', '#40C4FF', '#F06292', '#A5D6A7',
  '#CE93D8', '#80DEEA',
];

// ── Validation ────────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Nom requis').max(100),
  color:       z.string().optional(),
  description: z.string().max(300).optional(),
});
type FormValues = z.infer<typeof schema>;

// ── Category card ─────────────────────────────────────────────────────────
function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit:   (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const color = category.color ?? BRAND.purple;
  return (
    <Card
      sx={{
        border: `1px solid ${alpha(color, 0.35)}`,
        transition: 'border-color 0.2s',
        '&:hover': { borderColor: alpha(color, 0.7) },
      }}
    >
      <CardContent sx={{ p: 2.5, pb: '16px !important' }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          {/* Color dot */}
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: color,
              flexShrink: 0,
              boxShadow: `0 0 8px ${alpha(color, 0.5)}`,
            }}
          />
          <Typography variant="subtitle2" fontWeight={700} noWrap flex={1}>
            {category.name}
          </Typography>
          <Box display="flex" gap={0.5}>
            <Tooltip title="Modifier">
              <IconButton
                size="small"
                onClick={() => onEdit(category)}
                sx={{ color: 'text.secondary', '&:hover': { color: BRAND.blue } }}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Supprimer">
              <IconButton
                size="small"
                onClick={() => onDelete(category)}
                sx={{ color: 'text.secondary', '&:hover': { color: '#FF4D6D' } }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {category.slug && (
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>
            /{category.slug}
          </Typography>
        )}
        {category.description && (
          <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ fontSize: '0.8rem' }} noWrap>
            {category.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const queryClient = useQueryClient();

  const [editTarget,   setEditTarget]   = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  });

  const {
    control, handleSubmit, reset, setValue, watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', color: BRAND.blue, description: '' },
  });
  const watchColor = watch('color');

  // Open form for new category
  const openNew = () => {
    setEditTarget(null);
    reset({ name: '', color: BRAND.blue, description: '' });
    setShowForm(true);
  };

  // Open form for editing
  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    reset({ name: cat.name, color: cat.color ?? BRAND.blue, description: cat.description ?? '' });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditTarget(null);
    reset();
  };

  // ── Mutations ──
  const saveMut = useMutation({
    mutationFn: (values: FormValues) =>
      editTarget
        ? updateCategory(editTarget.id, values)
        : createCategory(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSnack({ msg: editTarget ? 'Catégorie mise à jour.' : 'Catégorie créée.', severity: 'success' });
      cancelForm();
    },
    onError: (e: Error) => {
      const is409 = e.message.toLowerCase().includes('409') || e.message.toLowerCase().includes('exist');
      setSnack({
        msg: is409 ? 'Cette catégorie existe déjà.' : e.message,
        severity: 'error',
      });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number | string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSnack({ msg: 'Catégorie supprimée.', severity: 'success' });
      setDeleteTarget(null);
    },
    onError: (e: Error) => setSnack({ msg: e.message, severity: 'error' }),
  });

  if (isLoading) return <LoadingState />;

  return (
    <Box>
      {/* ── Header ── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <BrandGradientText variant="h5">
          {categories.length} Catégorie{categories.length !== 1 ? 's' : ''}
        </BrandGradientText>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openNew}
          sx={{ backgroundImage: BRAND.gradient }}
        >
          Nouvelle catégorie
        </Button>
      </Box>

      {/* ── Inline form ── */}
      {showForm && (
        <Card sx={{ mb: 3, border: `1px solid ${alpha(BRAND.blue, 0.4)}` }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              {editTarget ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </Typography>
            <form onSubmit={handleSubmit((v) => saveMut.mutate(v))} noValidate>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} sm={4}>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Nom *"
                        fullWidth
                        size="small"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        autoFocus
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Description"
                        fullWidth
                        size="small"
                        error={!!errors.description}
                        helperText={errors.description?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Color picker */}
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.8}>
                    Couleur
                  </Typography>
                  <Box display="flex" gap={0.8} flexWrap="wrap" alignItems="center">
                    {PRESET_COLORS.map((c) => (
                      <Box
                        key={c}
                        onClick={() => setValue('color', c)}
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: c,
                          cursor: 'pointer',
                          border: watchColor === c ? `2px solid white` : '2px solid transparent',
                          boxShadow: watchColor === c ? `0 0 8px ${alpha(c, 0.7)}` : undefined,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform 0.15s',
                          '&:hover': { transform: 'scale(1.2)' },
                        }}
                      >
                        {watchColor === c && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
                      </Box>
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ mb: 1 }} />
                  <Box display="flex" gap={1.5}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      startIcon={
                        saveMut.isPending
                          ? <CircularProgress size={14} color="inherit" />
                          : <CheckIcon />
                      }
                      disabled={saveMut.isPending}
                      sx={{ backgroundImage: BRAND.gradient }}
                    >
                      {saveMut.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<CloseIcon />}
                      onClick={cancelForm}
                      sx={{ borderColor: 'divider', color: 'text.secondary' }}
                    >
                      Annuler
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Categories grid ── */}
      {categories.length === 0 ? (
        <EmptyState
          title="Aucune catégorie"
          description="Créez votre première catégorie pour organiser vos articles."
          actionLabel="Créer une catégorie"
          onAction={openNew}
        />
      ) : (
        <Grid container spacing={2}>
          {categories.map((cat) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
              <CategoryCard
                category={cat}
                onEdit={openEdit}
                onDelete={(c) => setDeleteTarget(c)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer la catégorie"
        message={`Supprimer « ${deleteTarget?.name} » ? Les articles associés ne seront pas supprimés mais perdront cette catégorie.`}
        loading={deleteMut.isPending}
        confirmLabel="Supprimer"
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />

      {/* ── Snackbar ── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={5000}
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
