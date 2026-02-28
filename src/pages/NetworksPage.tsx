import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
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
import { Add, Edit, Delete, Check, Close } from '@mui/icons-material';
import HubIcon from '@mui/icons-material/Hub';
import { getNetworks, createNetwork, updateNetwork, deleteNetwork, getArticles } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog';
import type { Network, NetworkFormData, Article } from '../types';

// ── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  name:        z.string().min(1, 'Nom requis').max(100),
  slug:        z.string().max(100).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

// ── Network card ─────────────────────────────────────────────────────────────
interface NetworkCardProps {
  network:      Network;
  articleCount: number;
  onEdit:       (n: Network) => void;
  onDelete:     (n: Network) => void;
}
function NetworkCard({ network, articleCount, onEdit, onDelete }: NetworkCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
          <HubIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ flexGrow: 1 }}>
            {network.name}
          </Typography>
          <Chip
            label={articleCount}
            size="small"
            color="primary"
            title={`${articleCount} article(s)`}
          />
        </Stack>
        {network.slug && (
          <Typography variant="caption" color="text.secondary" fontFamily="monospace" display="block">
            /{network.slug}
          </Typography>
        )}
        {network.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            mt={0.5}
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {network.description}
          </Typography>
        )}
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', py: 0.5 }}>
        <Tooltip title="Modifier">
          <IconButton size="small" onClick={() => onEdit(network)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip
          title={
            articleCount > 0
              ? `Utilisé par ${articleCount} article(s) — suppression impossible`
              : 'Supprimer'
          }
        >
          <span>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(network)}
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
export default function NetworksPage() {
  const qc = useQueryClient();

  const { data: networks = [], isLoading } = useQuery({
    queryKey: ['networks'],
    queryFn:  getNetworks,
  });

  const { data: articles = [] } = useQuery({
    queryKey: ['articles', 'all'],
    queryFn:  () => getArticles({ limit: 2000 }),
  });

  // Compute article count per network
  const articleCountByNetwork = useMemo(() => {
    const map = new Map<string, number>();
    (articles as Article[]).forEach(a => {
      if (a.networkId != null) {
        const key = String(a.networkId);
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    });
    return map;
  }, [articles]);

  // ── Form state ──────────────────────────────────────────────────────
  const [formOpen,   setFormOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState<Network | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '', description: '' },
  });

  const openCreate = () => {
    setEditTarget(null);
    reset({ name: '', slug: '', description: '' });
    setFormOpen(true);
  };

  const openEdit = (net: Network) => {
    setEditTarget(net);
    reset({ name: net.name, slug: net.slug ?? '', description: net.description ?? '' });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  // ── Confirm delete ──────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<Network | null>(null);

  // ── Snackbar ────────────────────────────────────────────────────────
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' | 'warning' } | null>(null);

  // ── Mutations ───────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (data: NetworkFormData) => createNetwork(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['networks'] });
      setSnack({ msg: 'Réseau créé', sev: 'success' });
      closeForm();
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: NetworkFormData }) =>
      updateNetwork(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['networks'] });
      setSnack({ msg: 'Réseau modifié', sev: 'success' });
      closeForm();
    },
    onError: (e: Error) => setSnack({ msg: e.message, sev: 'error' }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string | number) => deleteNetwork(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['networks'] });
      setSnack({ msg: 'Réseau supprimé', sev: 'success' });
      setConfirmDelete(null);
    },
    onError: (e: Error & { status?: number }) => {
      setConfirmDelete(null);
      if (e.status === 409) {
        setSnack({ msg: 'Impossible de supprimer: réseau utilisé par des articles', sev: 'warning' });
      } else {
        setSnack({ msg: e.message, sev: 'error' });
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: NetworkFormData = {
      name:        values.name,
      slug:        values.slug || undefined,
      description: values.description || undefined,
    };
    if (editTarget) updateMut.mutate({ id: editTarget.id, data: payload });
    else            createMut.mutate(payload);
  };

  const handleDeleteRequest = (net: Network) => {
    const count = articleCountByNetwork.get(String(net.id)) ?? 0;
    if (count > 0) {
      setSnack({ msg: `Impossible: ${count} article(s) utilisent ce réseau`, sev: 'warning' });
      return;
    }
    setConfirmDelete(net);
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HubIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Réseaux
          </Typography>
          <Chip label={(networks as Network[]).length} size="small" color="primary" />
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Nouveau réseau
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
            {editTarget ? `Modifier "${editTarget.name}"` : 'Nouveau réseau'}
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
                label="Slug"
                fullWidth
                size="small"
                {...register('slug')}
                error={!!errors.slug}
                helperText={errors.slug?.message ?? 'Optionnel — généré automatiquement si vide'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                size="small"
                multiline
                rows={2}
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
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

      {/* ── Grid of network cards ────────────────────────────────────── */}
      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton height={120} variant="rounded" />
            </Grid>
          ))}
        </Grid>
      ) : (networks as Network[]).length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <HubIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1 }} />
          <Typography color="text.secondary">Aucun réseau</Typography>
          <Button startIcon={<Add />} onClick={openCreate} sx={{ mt: 1 }}>
            Créer un réseau
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {(networks as Network[]).map(net => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={net.id}>
              <NetworkCard
                network={net}
                articleCount={articleCountByNetwork.get(String(net.id)) ?? 0}
                onEdit={openEdit}
                onDelete={handleDeleteRequest}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Confirm delete dialog ────────────────────────────────────── */}
      <ConfirmDialog
        open={!!confirmDelete}
        title={`Supprimer "${confirmDelete?.name}" ?`}
        message="Ce réseau sera définitivement supprimé."
        loading={deleteMut.isPending}
        onConfirm={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
        onClose={() => setConfirmDelete(null)}
      />

      {/* ── Snackbar ────────────────────────────────────────────────── */}
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
