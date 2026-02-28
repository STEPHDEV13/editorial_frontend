import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import BrandLogo from '../branding/BrandLogo';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_W } from './Sidebar';

interface TopbarProps {
  sidebarOpen:    boolean;
  onMobileMenu:   () => void;
  title:          string;
  actions?:       React.ReactNode;
}

export default function Topbar({
  sidebarOpen,
  onMobileMenu,
  title,
  actions,
}: TopbarProps) {
  const sidebarW = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_W;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${sidebarW}px)` },
        ml:    { md: `${sidebarW}px` },
        transition: 'width 0.25s ease, margin-left 0.25s ease',
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 } }}>
        {/* Mobile hamburger */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMobileMenu}
          sx={{ display: { md: 'none' }, mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Mini logo (mobile only) */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
          <BrandLogo variant="compact" logoHeight={28} />
        </Box>

        {/* Page title */}
        <Typography
          variant="h6"
          component="h1"
          noWrap
          sx={{ fontWeight: 700, flex: 1, color: 'text.primary', fontSize: '1rem' }}
        >
          {title}
        </Typography>

        {/* Contextual actions slot */}
        {actions && <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>{actions}</Box>}
      </Toolbar>
    </AppBar>
  );
}
