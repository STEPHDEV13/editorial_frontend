import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ArticleIcon from '@mui/icons-material/Article';
import { alpha } from '@mui/material/styles';
import { importArticles } from '../services/api';
import { BRAND } from '../theme';
import BrandGradientText from '../components/branding/BrandGradientText';
import type { ImportResult } from '../types';

export default function ImportPage() {
  const queryClient  = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result,       setResult]       = useState<ImportResult | null>(null);
  const [dragOver,     setDragOver]     = useState(false);

  const importMut = useMutation({
    mutationFn: (file: File) => importArticles(file),
    onSuccess:  (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.json')) return;
    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const successRate =
    result && result.total > 0 ? Math.round((result.success / result.total) * 100) : null;

  return (
    <Box maxWidth={720} mx="auto">
      <BrandGradientText variant="h5" sx={{ mb: 3 }}>
        Import d'articles
      </BrandGradientText>

      {/* ── Drop zone ── */}
      <Card
        sx={{
          mb: 3,
          border: `2px dashed ${dragOver ? BRAND.blue : alpha(BRAND.blue, 0.25)}`,
          transition: 'border-color 0.2s, background-color 0.2s',
          bgcolor: dragOver ? alpha(BRAND.blue, 0.07) : 'transparent',
          cursor: 'pointer',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <CardContent sx={{ p: 5, textAlign: 'center' }}>
          <UploadFileIcon
            sx={{
              fontSize: 56,
              color: dragOver ? BRAND.blue : alpha(BRAND.blue, 0.4),
              mb: 2,
              transition: 'color 0.2s',
            }}
          />
          <Typography variant="h6" fontWeight={700} gutterBottom>
            {selectedFile ? selectedFile.name : 'Glisser-déposer votre fichier JSON'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedFile
              ? `${(selectedFile.size / 1024).toFixed(1)} Ko — Cliquez pour changer de fichier`
              : 'ou cliquez pour sélectionner un fichier .json'}
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleInput}
            onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
          />
        </CardContent>
      </Card>

      {/* ── Format hint ── */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Format attendu
          </Typography>
          <Box
            component="pre"
            sx={{
              mt: 1.5,
              p: 2,
              bgcolor: '#0B0B10',
              borderRadius: 2,
              fontSize: '0.78rem',
              color: '#9090B8',
              overflow: 'auto',
              fontFamily: 'monospace',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
{`[
  {
    "title":      "Mon article",
    "content":    "Contenu de l'article…",
    "summary":    "Résumé optionnel",
    "slug":       "mon-article",
    "featured":   false,
    "categoryId": "cat-001",
    "networkId":  "net-001",
    "imageUrl":   "https://example.com/img.jpg"
  }
]`}
          </Box>
        </CardContent>
      </Card>

      {/* ── Action button ── */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={!selectedFile || importMut.isPending}
        onClick={() => selectedFile && importMut.mutate(selectedFile)}
        startIcon={
          importMut.isPending
            ? <CircularProgress size={20} color="inherit" />
            : <UploadFileIcon />
        }
        sx={{
          backgroundImage: selectedFile ? BRAND.gradient : undefined,
          mb: 3,
          py: 1.6,
          fontSize: '1rem',
        }}
      >
        {importMut.isPending ? 'Import en cours…' : "Lancer l'import"}
      </Button>

      {/* ── Error from mutation ── */}
      {importMut.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(importMut.error as Error)?.message ?? 'Erreur lors de l\'import.'}
        </Alert>
      )}

      {/* ── Result ── */}
      {result && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Résultats de l'import
            </Typography>

            {/* Progress bar */}
            {successRate !== null && (
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">Taux de succès</Typography>
                  <Typography variant="caption" fontWeight={700} color={successRate === 100 ? '#00E676' : '#FFB74D'}>
                    {successRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={successRate}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: alpha('#fff', 0.08),
                    '& .MuiLinearProgress-bar': {
                      backgroundImage: successRate === 100 ? 'linear-gradient(90deg,#00E676,#00BFA5)' : BRAND.gradient,
                      borderRadius: 3,
                    },
                  }}
                />
              </Box>
            )}

            {/* Stat chips */}
            <Box display="flex" gap={1.5} flexWrap="wrap" mb={3}>
              <Chip
                icon={<ArticleIcon sx={{ fontSize: 16 }} />}
                label={`${result.total} total`}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                label={`${result.success} importés`}
                size="small"
                sx={{ bgcolor: alpha('#00E676', 0.13), color: '#00E676', fontWeight: 700 }}
              />
              {result.errors.length > 0 && (
                <Chip
                  icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                  label={`${result.errors.length} erreurs`}
                  size="small"
                  sx={{ bgcolor: alpha('#FF4D6D', 0.13), color: '#FF4D6D', fontWeight: 700 }}
                />
              )}
            </Box>

            {/* Error list */}
            {result.errors.length > 0 && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} color="error" mb={1}>
                  Détails des erreurs
                </Typography>
                <List dense disablePadding>
                  {result.errors.map((err, i) => (
                    <ListItem
                      key={i}
                      disableGutters
                      sx={{
                        py: 0.8,
                        px: 1.5,
                        mb: 0.5,
                        borderRadius: 2,
                        bgcolor: alpha('#FF4D6D', 0.08),
                        alignItems: 'flex-start',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 28, mt: 0.3 }}>
                        <ErrorIcon sx={{ fontSize: 16, color: '#FF4D6D' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600}>
                            Ligne {err.index + 1}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {err.error}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {result.errors.length === 0 && (
              <Alert severity="success" icon={<CheckCircleIcon />}>
                Tous les articles ont été importés avec succès !
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
