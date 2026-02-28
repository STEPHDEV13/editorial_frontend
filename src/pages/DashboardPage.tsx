import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Article as ArticleIcon,
  CheckCircle,
  Drafts,
  Archive,
  Star,
  Notifications as NotifIcon,
  Wifi,
  Category as CategoryIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getArticles, getCategories, getNotifications } from '../services/api';
import type { Article, Category, Notification } from '../types';

// ── Brand palette for pie slices ────────────────────────────────────────────
const BRAND_COLORS = [
  '#2979FF', '#7B2FBE', '#5040D8', '#00BCD4', '#E91E63',
  '#4CAF50', '#FF9800', '#9C27B0', '#03A9F4', '#8BC34A',
];

// ── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  loading?: boolean;
}
function StatCard({ label, value, icon, color, onClick, loading }: StatCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 6 } : {},
        height: '100%',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
          <Box>
            {loading ? (
              <>
                <Skeleton width={60} height={36} />
                <Skeleton width={80} />
              </>
            ) : (
              <>
                <Typography variant="h4" fontWeight={700} lineHeight={1}>
                  {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
              </>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Helper: resolve category ids from article ────────────────────────────────
function getArticleCategoryIds(article: Article): Array<number | string> {
  if (article.categoryIds && article.categoryIds.length > 0) return article.categoryIds;
  if (article.categoryId != null) return [article.categoryId];
  return [];
}

// ── Main dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['articles', 'all'],
    queryFn: () => getArticles({ limit: 1000, page: 1 }),
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { data: notifications = [], isLoading: loadingNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  // ── Computed stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total     = articles.length;
    const published = articles.filter((a: Article) => a.status === 'published').length;
    const draft     = articles.filter((a: Article) => a.status === 'draft').length;
    const archived  = articles.filter((a: Article) => a.status === 'archived').length;
    const featured  = articles.filter((a: Article) => a.featured).length;

    // Articles by network
    const networkMap = new Map<string, number>();
    articles.forEach((a: Article) => {
      const name = a.network?.name ?? (a.networkId ? `Réseau #${a.networkId}` : null);
      if (name) networkMap.set(name, (networkMap.get(name) ?? 0) + 1);
    });
    const byNetwork = Array.from(networkMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Articles by category for pie chart
    const catCountMap = new Map<string, number>();
    articles.forEach((a: Article) => {
      getArticleCategoryIds(a).forEach(cid => {
        const key = String(cid);
        catCountMap.set(key, (catCountMap.get(key) ?? 0) + 1);
      });
    });

    const categoryById = new Map<string, Category>(
      categories.map((c: Category) => [String(c.id), c])
    );

    const pieData = Array.from(catCountMap.entries())
      .map(([cid, count], i) => {
        const cat = categoryById.get(cid);
        return {
          name:  cat?.name ?? `Catégorie #${cid}`,
          value: count,
          color: cat?.color ?? BRAND_COLORS[i % BRAND_COLORS.length],
        };
      })
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);

    return { total, published, draft, archived, featured, byNetwork, pieData };
  }, [articles, categories]);

  // ── 5 derniers articles publiés ──────────────────────────────────────────
  const recentPublished = useMemo(() =>
    [...articles]
      .filter((a: Article) => a.status === 'published')
      .sort((a: Article, b: Article) => {
        const da = a.publishedAt ?? a.createdAt ?? '';
        const db = b.publishedAt ?? b.createdAt ?? '';
        return db.localeCompare(da);
      })
      .slice(0, 5),
    [articles]
  );

  // ── 5 dernières notifications ────────────────────────────────────────────
  const recentNotifs = useMemo(() =>
    [...notifications]
      .sort((a: Notification, b: Notification) => {
        const da = a.sentAt ?? a.createdAt ?? '';
        const db = b.sentAt ?? b.createdAt ?? '';
        return db.localeCompare(da);
      })
      .slice(0, 5),
    [notifications]
  );

  const articleTitleMap = useMemo(() => {
    const m = new Map<string, string>();
    articles.forEach((a: Article) => m.set(String(a.id), a.title));
    return m;
  }, [articles]);

  const loading = loadingArticles || loadingCategories;

  return (
    <Box>
      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Total articles"
            value={stats.total}
            icon={<ArticleIcon />}
            color="#2979FF"
            onClick={() => navigate('/articles')}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Publiés"
            value={stats.published}
            icon={<CheckCircle />}
            color="#4CAF50"
            onClick={() => navigate('/articles')}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Brouillons"
            value={stats.draft}
            icon={<Drafts />}
            color="#FF9800"
            onClick={() => navigate('/articles')}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Archivés"
            value={stats.archived}
            icon={<Archive />}
            color="#9E9E9E"
            onClick={() => navigate('/articles')}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Mis en avant"
            value={stats.featured}
            icon={<Star />}
            color="#FFD700"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            label="Notifications"
            value={notifications.length}
            icon={<NotifIcon />}
            color="#7B2FBE"
            onClick={() => navigate('/notifications')}
            loading={loadingNotifs}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ── Pie chart: répartition par catégorie ──────────────────────── */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <CategoryIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Répartition par catégorie
                </Typography>
              </Stack>
              {loading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
              ) : stats.pieData.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  Aucune donnée
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      labelLine={false}
                    >
                      {stats.pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <ReTooltip
                      contentStyle={{
                        background: '#1e1e2e',
                        border: '1px solid #333',
                        borderRadius: 8,
                        color: '#fff',
                      }}
                    />
                    <Legend
                      formatter={(value) => (
                        <span style={{ color: '#ccc', fontSize: 12 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Articles par réseau ────────────────────────────────────────── */}
        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Wifi color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Par réseau
                </Typography>
              </Stack>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} height={36} sx={{ mb: 1 }} />
                ))
              ) : stats.byNetwork.length === 0 ? (
                <Typography color="text.secondary">Aucun réseau</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {stats.byNetwork.map(([name, count]) => (
                    <Stack key={name} direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                        {name}
                      </Typography>
                      <Chip label={count} size="small" color="primary" />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── 5 derniers articles publiés ────────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ArticleIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Derniers articles publiés
                </Typography>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              {loadingArticles ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={56} sx={{ mb: 0.5 }} />
                ))
              ) : recentPublished.length === 0 ? (
                <Typography color="text.secondary" py={2} textAlign="center">
                  Aucun article publié
                </Typography>
              ) : (
                <List dense disablePadding>
                  {recentPublished.map((a: Article) => (
                    <ListItem
                      key={a.id}
                      disableGutters
                      onClick={() => navigate(`/articles/${a.id}/edit`)}
                      sx={{
                        borderRadius: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32, height: 32, fontSize: 12,
                            background: 'linear-gradient(135deg, #2979FF, #7B2FBE)',
                          }}
                        >
                          {a.title[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {a.title}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" spacing={0.5} alignItems="center" mt={0.25} flexWrap="wrap">
                            {a.network?.name && (
                              <Typography variant="caption" color="text.secondary">
                                {a.network.name}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {a.publishedAt
                                ? new Date(a.publishedAt).toLocaleDateString('fr-FR')
                                : '—'}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Dernières notifications ────────────────────────────────────── */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <NotifIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Dernières notifications envoyées
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              {loadingNotifs ? (
                <Grid container spacing={2}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <Skeleton height={72} />
                    </Grid>
                  ))}
                </Grid>
              ) : recentNotifs.length === 0 ? (
                <Typography color="text.secondary" py={2} textAlign="center">
                  Aucune notification
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {recentNotifs.map((n: Notification) => {
                    const articleTitle = n.article?.title
                      ?? (n.articleId ? articleTitleMap.get(String(n.articleId)) : undefined)
                      ?? null;
                    const recipientCount = n.recipientCount ?? n.recipients?.length ?? 0;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={n.id}>
                        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                          <Stack spacing={0.5}>
                            {articleTitle && (
                              <Typography variant="caption" color="primary.main" fontWeight={600} noWrap>
                                {articleTitle}
                              </Typography>
                            )}
                            {(n.subject || n.title) && (
                              <Typography variant="body2" fontWeight={500} noWrap>
                                {n.subject ?? n.title}
                              </Typography>
                            )}
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                              {recipientCount > 0 && (
                                <Chip label={`${recipientCount} dest.`} size="small" />
                              )}
                              <Typography variant="caption" color="text.secondary">
                                {n.sentAt
                                  ? new Date(n.sentAt).toLocaleString('fr-FR')
                                  : n.createdAt
                                    ? new Date(n.createdAt).toLocaleString('fr-FR')
                                    : '—'}
                              </Typography>
                              {n.status && (
                                <Chip
                                  label={n.status}
                                  size="small"
                                  color={
                                    n.status === 'sent' ? 'success'
                                    : n.status === 'failed' ? 'error'
                                    : 'default'
                                  }
                                />
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
