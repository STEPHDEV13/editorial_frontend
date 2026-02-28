import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import ArticleIcon from '@mui/icons-material/Article';
import CategoryIcon from '@mui/icons-material/Category';
import NotificationsIcon from '@mui/icons-material/Notifications';
import StarIcon from '@mui/icons-material/Star';
import { alpha } from '@mui/material/styles';
import BrandLogo from '../components/branding/BrandLogo';
import BrandGradientText from '../components/branding/BrandGradientText';
import StatusChip from '../components/common/StatusChip';
import { getArticles, getCategories, getNotifications } from '../services/api';
import { BRAND } from '../theme';
import type { Article, Notification } from '../types';

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon:    React.ReactNode;
  label:   string;
  value:   number | string;
  color:   string;
  onClick?: () => void;
}) {
  const inner = (
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="h3" fontWeight={800} mt={0.5} sx={{ color: 'text.primary' }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            background: alpha(color, 0.15),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  );

  return (
    <Card sx={{ height: '100%', borderLeft: `3px solid ${color}` }}>
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>{inner}</CardActionArea>
      ) : (
        inner
      )}
    </Card>
  );
}

// ── Recent article row ─────────────────────────────────────────────────────
function RecentArticleRow({ article }: { article: Article }) {
  const navigate = useNavigate();
  return (
    <Box
      onClick={() => navigate(`/articles/${article.id}/edit`)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        py: 1.2,
        px: 1,
        borderRadius: 2,
        cursor: 'pointer',
        '&:hover': { bgcolor: alpha(BRAND.blue, 0.06) },
      }}
    >
      {article.featured && (
        <StarIcon sx={{ fontSize: 14, color: '#FFB74D', flexShrink: 0 }} />
      )}
      <Typography variant="body2" noWrap flex={1} color="text.primary" fontWeight={500}>
        {article.title}
      </Typography>
      <StatusChip status={article.status} />
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['articles'],
    queryFn:  getArticles,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn:  getCategories,
  });

  const { data: notifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn:  getNotifications,
  });

  const published = articles.filter((a) => a.status === 'published').length;
  const drafts    = articles.filter((a) => a.status === 'draft').length;
  const featured  = articles.filter((a) => a.featured).length;

  const recentArticles      = [...articles].slice(0, 6);
  const recentNotifications = [...notifications].slice(0, 5) as Notification[];

  return (
    <Box>
      {/* ── Hero header ── */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          background: `linear-gradient(135deg, ${alpha(BRAND.blue, 0.18)} 0%, ${alpha(BRAND.purple, 0.18)} 100%)`,
          border: `1px solid ${alpha(BRAND.blue, 0.2)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          flexWrap: 'wrap',
        }}
      >
        <BrandLogo variant="full" logoHeight={52} showTagline />
        <Box>
          <BrandGradientText variant="h4" sx={{ lineHeight: 1.1 }}>
            Editorial Back Office
          </BrandGradientText>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Gérez vos articles, catégories et notifications depuis un seul endroit.
          </Typography>
        </Box>
      </Box>

      {/* ── Stats ── */}
      <Grid container spacing={2.5} mb={4}>
        {[
          {
            icon:  <ArticleIcon />,
            label: 'Articles total',
            value: loadingArticles ? '…' : articles.length,
            color: BRAND.blue,
            path:  '/articles',
          },
          {
            icon:  <ArticleIcon />,
            label: 'Publiés',
            value: loadingArticles ? '…' : published,
            color: '#00E676',
            path:  '/articles',
          },
          {
            icon:  <ArticleIcon />,
            label: 'Brouillons',
            value: loadingArticles ? '…' : drafts,
            color: '#FFB74D',
            path:  '/articles',
          },
          {
            icon:  <CategoryIcon />,
            label: 'Catégories',
            value: loadingCategories ? '…' : categories.length,
            color: BRAND.purple,
            path:  '/categories',
          },
          {
            icon:  <StarIcon />,
            label: 'À la une',
            value: loadingArticles ? '…' : featured,
            color: '#FFB74D',
          },
          {
            icon:  <NotificationsIcon />,
            label: 'Notifications',
            value: loadingNotifications ? '…' : notifications.length,
            color: '#40C4FF',
            path:  '/notifications',
          },
        ].map((s) => (
          <Grid item xs={6} sm={4} md={2} key={s.label}>
            <StatCard {...s} onClick={s.path ? () => navigate(s.path!) : undefined} />
          </Grid>
        ))}
      </Grid>

      {/* ── Recent panels ── */}
      <Grid container spacing={3}>
        {/* Recent articles */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>
                  Articles récents
                </Typography>
                <Chip
                  label="Voir tous"
                  size="small"
                  onClick={() => navigate('/articles')}
                  sx={{ cursor: 'pointer', fontSize: '0.72rem' }}
                />
              </Box>
              <Divider sx={{ mb: 1 }} />
              {loadingArticles
                ? Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />
                  ))
                : recentArticles.length === 0
                ? (
                    <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                      Aucun article pour l'instant.
                    </Typography>
                  )
                : recentArticles.map((a) => <RecentArticleRow key={a.id} article={a} />)}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent notifications */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ pb: '16px !important' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6" fontWeight={700}>
                  Notifications récentes
                </Typography>
                <Chip
                  label="Voir toutes"
                  size="small"
                  onClick={() => navigate('/notifications')}
                  sx={{ cursor: 'pointer', fontSize: '0.72rem' }}
                />
              </Box>
              <Divider sx={{ mb: 1 }} />
              {loadingNotifications
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />
                  ))
                : recentNotifications.length === 0
                ? (
                    <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                      Aucune notification envoyée.
                    </Typography>
                  )
                : recentNotifications.map((n) => (
                    <Box key={n.id} sx={{ py: 1.2, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="body2" fontWeight={600} noWrap color="text.primary">
                        {n.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {n.body}
                      </Typography>
                    </Box>
                  ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
