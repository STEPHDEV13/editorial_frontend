import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_W } from './Sidebar';
import Topbar from './Topbar';

/** Map route prefix → human-readable page title */
function usePageTitle(): string {
  const { pathname } = useLocation();
  if (pathname === '/')                   return 'Dashboard';
  if (pathname.startsWith('/articles'))   return 'Articles';
  if (pathname.startsWith('/categories')) return 'Catégories';
  if (pathname.startsWith('/notifications')) return 'Notifications';
  if (pathname.startsWith('/import'))     return 'Import';
  return 'Back Office';
}

export default function AppShell() {
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const title = usePageTitle();

  const sidebarW = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_W;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ── Sidebar ── */}
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((p) => !p)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          // Shift right on desktop to avoid overlap with sidebar
          // ml: { md: `${sidebarW}px` },
          transition: 'margin-left 0.25s ease',
        }}
      >
        {/* ── Topbar ── */}
        <Topbar
          sidebarOpen={sidebarOpen}
          onMobileMenu={() => setMobileOpen(true)}
          title={title}
        />

        {/* Spacer so content starts below the fixed AppBar */}
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />

        {/* ── Page content ── */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: 1400, width: '100%', mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
