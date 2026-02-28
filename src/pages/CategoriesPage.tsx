import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Skeleton,
  Collapse,
  Divider,
  Paper,
} from '@mui/material';
import { Add, Edit, Delete, Check, Close, Category as CategoryIcon } from '@mui/icons-material';
import { getCategories, createCategory, updateCategory, deleteCategory, getArticles } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog';
import type { Category, CategoryFormData, Article } from '../types';

// ── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Nom requis').max(100),
  color:       z.string().optional(),
  description: z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

// ── Preset colors ────────────────────────────────────────────────────────────
const PRESET_COLORS = [
  '#2979FF', '#7B2FBE', '#4CAF50', '#FF9800', '#F44336',
  '#00BCD4', '#E91E63', '#8BC34A', '#9C27B0', '#03A9F4',
];

function ColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (c: string) => void;
}) {
  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap">
      {PRESET_COLORS.map(c => (
        <Box
          key={c}
          onClick={() => onChange(c)}
          sx={{
            width: 28, height: 28, borderRadius: '50%',
            bgcolor: c,
            cursor: 'pointer',
            border: value === c ? '3px solid white' : '3px solid transparent',
            boxShadow: value === c ? `0 0 0 2px ${c}` : 'none',
            transition: 'box-shadow 0.15s',
            '&:hover': { boxShadow: `0 0 0 2px ${c}` },
          }}
        />
      ))}
    </Stack>
  );
}

// ── Category card ────────────────────────────────────────────────────────────
interface CategoryCardProps {
  category:     Category;
  articleCount: number;
  onEdit:       (c: Category) => void;
  onDelete:     (c: Category) => void;
}
function CategoryCard({ category, articleCount, onEdit, onDelete }: CategoryCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 16, height: 16, borderRadius: '50%', mt: 0.5,
              bgcolor: category.color ?? '#2979FF',
              flexShrink: 0,
              boxShadow: `0 0 8px ${category.color ?? '#2979FF'}88`,
            }}
          />
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {category.name}
              </Typography>
              <Chip
                label={articleCount}
                size="small"
                color="primary"
                title={`${articleCount} article(s)`}
              />
            </Stack>
            {category.slug && (
              <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                /{category.slug}
              </Typography>
            )}
            {category.description && (
              <Typography variant="body2" color="text.secondary" mt={0.5} sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {category.description}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', py: 0.5 }}>
        <Tooltip title="Modifier">
          <IconButton size="small" onClick={() => onEdit(category)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={articleCount > 0 ? `Utilisée par ${articleCount} article(s) — suppression impossible` : 'Supprimer'}>
          <span>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(category)}
              disabled={articleCount > 0}
            >
              <Delete fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CategoriesPage() {
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles', 'all'],
    queryFn:  () => getArticles({ limit: 2000 }),
  });

  // Compute article count per category
  const articleCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    (articles as Article[]).forEach(a => {
      const ids = a.categoryIds?.map(String) ?? (a.categoryId ? [String(a.categoryId)] : []);
      ids.forEach(id => map.set(id, (map.get(id) ?? 0) + 1));
    });
    return map;
  }, [articles]);

  // ── Form state ──────────────────────────────────────────────────────
  const [formOpen,  setFormOpen]  = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', color: PRESET_COLORS[0], description: '' },
  });

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: '', color: PRESET_COLORS[0], description: '' });
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    reset({ name: cat.name, color: cat.color ?? PRESET_COLORS[0], description: cat.description ?? '' });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  // ── Confirm delete ──────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<Category | null>(null);

  // ── Snackbar ──────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' | 'warning' } | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (data: CategoryFormData) => createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setSnack({ msg: 'Catégorie créée', sev: 'success' });
      closeForm();
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: CategoryFormData }) =>
      updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setSnack({ msg: 'Catégorie modifiée', sev: 'success' });
      closeForm();
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string | number) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setSnack({ msg: 'Catégorie supprimée', sev: 'success' });
      setConfirmDelete(null);
    },
    onError: (e: Error & { status?: number }) => {
      setConfirmDelete(null);
      if (e.status === 409) {
        setSnack({ msg: 'Impossible de supprimer: catégorie utilisée par des articles', sev: 'warning' });
      } else {
        setSnack({ msg: e.message, sev: 'error' });
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: CategoryFormData = {
      name:        values.name,
      color:       values.color,
      description: values.description || undefined,
    };
    if (editTarget) updateMut.mutate({ id: editTarget.id, data: payload });
    else            createMut.mutate(payload);
  };

  const handleDeleteRequest = (cat: Category) => {
    const count = articleCountByCategory.get(String(cat.id)) ?? 0;
    if (count > 0) {
      setSnack({ msg: `Impossible: ${count} article(s) utilisent cette catégorie`, sev: 'warning' });
      return;
    }
    setConfirmDelete(cat);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CategoryIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Catégories
          </Typography>
          <Chip label={(categories as Category[]).length} size="small" color="primary" />
        </Stack>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreate}
        >
          Nouvelle catégorie
        </Button>
      </Stack>

      {/* ── Inline form ─────────────────────────────────────────────── */}
      <Collapse in={formOpen} unmountOnExit>
        <Paper
          variant="outlined"
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ p: 2, mb: 3, borderRadius: 2 }}
        >
          <Typography variant="subtitle1" fontWeight={700} mb={2}>
            {editTarget ? `Modifier "${editTarget.name}"` : 'Nouvelle catégorie'}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom *"
                fullWidth
                size="small"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Description"
                fullWidth
                size="small"
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Couleur
              </Typography>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <ColorPicker value={field.value} onChange={field.onChange} />
                )}
              />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} mt={2} justifyContent="flex-end">
            <Button size="small" startIcon={<Close />} onClick={closeForm}>
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              size="small"
              startIcon={<Check />}
              disabled={isSaving}
            >
              {editTarget ? 'Enregistrer' : 'Créer'}
            </Button>
          </Stack>
        </Paper>
      </Collapse>

      {/* ── Grid of category cards ────────────────────────────────────── */}
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton height={120} variant="rounded" />
            </Grid>
          ))}
        </Grid>
      ) : (categories as Category[]).length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <CategoryIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
          <Typography color="text.secondary">Aucune catégorie</Typography>
          <Button startIcon={<Add />} onClick={openCreate} sx={{ mt: 1 }}>
            Créer une catégorie
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {(categories as Category[]).map(cat => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
              <CategoryCard
                category={cat}
                articleCount={articleCountByCategory.get(String(cat.id)) ?? 0}
                onEdit={openEdit}
                onDelete={handleDeleteRequest}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Confirm delete dialog ──────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Supprimer "${confirmDelete?.name}" ?`}
        message="Cette catégorie sera définitivement supprimée."
        loading={deleteMut.isPending}
        onConfirm={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />

      {/* ── Snackbar ──────────────────────────────────────────────── */}
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
