import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';
import type { ArticleStatus } from '../../types';

interface StatusChipProps extends Omit<ChipProps, 'color' | 'label'> {
  status: ArticleStatus;
}

const STATUS_MAP: Record<
  ArticleStatus,
  { label: string; color: string; bg: string }
> = {
  draft:     { label: 'Brouillon', color: '#FFB74D', bg: 'rgba(255,183,77,0.14)' },
  published: { label: 'Publié',    color: '#00E676', bg: 'rgba(0,230,118,0.13)' },
  archived:  { label: 'Archivé',   color: '#9090B8', bg: 'rgba(144,144,184,0.12)' },
};

export default function StatusChip({ status, sx, ...rest }: StatusChipProps) {
  const conf = STATUS_MAP[status] ?? { label: status, color: '#fff', bg: 'transparent' };

  return (
    <Chip
      {...rest}
      label={conf.label}
      size="small"
      sx={{
        color:           conf.color,
        backgroundColor: conf.bg,
        borderColor:     conf.color,
        border:          '1px solid',
        fontWeight:      700,
        fontSize:        '0.72rem',
        height:          22,
        ...sx,
      }}
    />
  );
}
