import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { BRAND } from '../../theme';

// The SVG is inline so it works without a server (no CORS issue during local dev)
// Replace src/assets/logo.svg content to swap the brand icon.
import logoUrl from '../../assets/logo.svg';

interface BrandLogoProps {
  /** 'full'    = logo + "TARAM GROUP" text (sidebar expanded, dashboard header)
   *  'compact' = logo icon only (sidebar collapsed, topbar mini)
   */
  variant?: 'full' | 'compact';
  /** Override logo height in px. Keeps aspect ratio. */
  logoHeight?: number;
  /** Hide the sub-label "Editorial Back Office" (shown only in dashboard hero) */
  showTagline?: boolean;
}

export default function BrandLogo({
  variant = 'full',
  logoHeight = 40,
  showTagline = false,
}: BrandLogoProps) {
  const isCompact = variant === 'compact';

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={isCompact ? 0 : 1.5}
      sx={{ userSelect: 'none' }}
    >
      {/* ── Logo image ── */}
      <Box
        component="img"
        src={logoUrl}
        alt="TARAM GROUP logo"
        sx={{
          height: logoHeight,
          width: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
          // Subtle glow that echoes the gradient
          filter: `drop-shadow(0 0 8px ${BRAND.blue}55)`,
        }}
      />

      {/* ── Text block (hidden in compact mode) ── */}
      {!isCompact && (
        <Box>
          <Typography
            variant="subtitle1"
            component="span"
            sx={{
              display: 'block',
              fontWeight: 800,
              fontSize: '1rem',
              lineHeight: 1.1,
              background: BRAND.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.04em',
            }}
          >
            TARAM GROUP
          </Typography>

          {showTagline && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                fontSize: '0.68rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                mt: 0.2,
              }}
            >
              Editorial Back Office
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
