import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import CategoryIcon from '@mui/icons-material/Category';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HubIcon from '@mui/icons-material/Hub';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import { alpha } from '@mui/material/styles';
import BrandLogo from '../branding/BrandLogo';
import { BRAND } from '../../theme';

export const SIDEBAR_WIDTH        = 240;
export const SIDEBAR_COLLAPSED_W  = 64;

interface NavItem {
  label: string;
  path:  string;
  icon:  React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',     path: '/',              icon: <DashboardIcon /> },
  { label: 'Articles',      path: '/articles',      icon: <ArticleIcon /> },
  { label: 'Catégories',    path: '/categories',    icon: <CategoryIcon /> },
  { label: 'Réseaux',       path: '/networks',      icon: <HubIcon /> },
  { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon /> },
  { label: 'Import',        path: '/import',        icon: <UploadFileIcon /> },
];

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  /** Controlled from parent for responsive mobile overlay */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  open,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ── Logo header ── */}
      <Box
        sx={{
          px: open ? 2.5 : 1,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          minHeight: 64,
        }}
      >
        {open ? (
          <>
            <BrandLogo variant="full" logoHeight={34} />
            <IconButton onClick={onToggle} size="small" sx={{ color: 'text.secondary' }}>
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <Tooltip title="Développer" placement="right">
            <IconButton onClick={onToggle} size="small" sx={{ color: 'text.secondary' }}>
              <BrandLogo variant="compact" logoHeight={28} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ borderColor: 'divider', mx: 1.5 }} />

      {/* ── Navigation ── */}
      <List sx={{ flex: 1, pt: 1, px: open ? 1 : 0.5 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Tooltip
              key={item.path}
              title={!open ? item.label : ''}
              placement="right"
            >
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  px: open ? 2 : 1.5,
                  py: 1.1,
                  justifyContent: open ? 'flex-start' : 'center',
                  minHeight: 44,
                  position: 'relative',
                  backgroundColor: active
                    ? alpha(BRAND.blue, 0.14)
                    : 'transparent',
                  '&:hover': {
                    backgroundColor: alpha(BRAND.blue, 0.09),
                  },
                  // Left accent bar for active item
                  '&::before': active
                    ? {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: '20%',
                        height: '60%',
                        width: 3,
                        borderRadius: '0 3px 3px 0',
                        background: BRAND.gradient,
                      }
                    : {},
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: open ? 36 : 'auto',
                    color: active ? BRAND.blue : 'text.secondary',
                    transition: 'color 0.2s',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.875rem',
                      color: active ? 'text.primary' : 'text.secondary',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* ── Bottom toggle (desktop collapsed) ── */}
      {!open && (
        <>
          <Divider sx={{ borderColor: 'divider', mx: 1 }} />
          <Box sx={{ py: 1.5, display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="Menu" placement="right">
              <IconButton onClick={onToggle} size="small" sx={{ color: 'text.secondary' }}>
                <MenuIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );

  return (
    <>
      {/* Desktop persistent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_W,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_W,
            transition: 'width 0.25s ease',
            overflowX: 'hidden',
            boxSizing: 'border-box',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* Mobile temporary overlay */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
