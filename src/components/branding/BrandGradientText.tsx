import Typography, { TypographyProps } from '@mui/material/Typography';
import { BRAND } from '../../theme';

interface BrandGradientTextProps extends TypographyProps {
  children: React.ReactNode;
}

/** Typography that renders text with the brand blue→purple gradient fill. */
export default function BrandGradientText({
  children,
  sx,
  ...props
}: BrandGradientTextProps) {
  return (
    <Typography
      {...props}
      sx={{
        background: BRAND.gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: 700,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}
