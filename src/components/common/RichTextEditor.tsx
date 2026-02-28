import { useRef, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  error?: boolean;
  helperText?: string;
  label?: string;
  minHeight?: number;
  placeholder?: string;
  disabled?: boolean;
}

interface ToolbarButton {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

type ToolbarItem = ToolbarButton | null;

export default function RichTextEditor({
  value,
  onChange,
  error = false,
  helperText,
  label,
  minHeight = 300,
  placeholder = 'Écrivez votre contenu ici…',
  disabled = false,
}: RichTextEditorProps) {
  const editorRef   = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string>(value);

  // Set initial content on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
      lastValueRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editorRef.current) return;
    if (value === lastValueRef.current) return;
    editorRef.current.innerHTML = value;
    lastValueRef.current = value;
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const newValue = editorRef.current.innerHTML;
    lastValueRef.current = newValue;
    onChange(newValue);
  }, [onChange]);

  const execCmd = useCallback(
    (command: string, argument?: string) => {
      editorRef.current?.focus();
      // execCommand is deprecated but still universally supported and appropriate here
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).execCommand(command, false, argument ?? null);
      handleInput();
    },
    [handleInput],
  );

  const handleLink = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      // unlink if cursor is in a link
      execCmd('unlink');
      return;
    }
    // eslint-disable-next-line no-alert
    const url = window.prompt('URL du lien :');
    if (url) execCmd('createLink', url);
  }, [execCmd]);

  const toolbarItems: ToolbarItem[] = [
    { label: 'Gras',              icon: <FormatBoldIcon />,          action: () => execCmd('bold') },
    { label: 'Italique',          icon: <FormatItalicIcon />,        action: () => execCmd('italic') },
    { label: 'Souligné',          icon: <FormatUnderlinedIcon />,    action: () => execCmd('underline') },
    null,
    { label: 'Liste à puces',     icon: <FormatListBulletedIcon />,  action: () => execCmd('insertUnorderedList') },
    { label: 'Liste numérotée',   icon: <FormatListNumberedIcon />,  action: () => execCmd('insertOrderedList') },
    { label: 'Citation',          icon: <FormatQuoteIcon />,         action: () => execCmd('formatBlock', 'blockquote') },
    null,
    { label: 'Insérer un lien',   icon: <LinkIcon />,                action: handleLink },
    { label: 'Supprimer le lien', icon: <LinkOffIcon />,             action: () => execCmd('unlink') },
  ];

  const borderColor      = error ? 'error.main'   : 'rgba(255,255,255,0.12)';
  const hoverBorderColor = error ? 'error.main'   : 'primary.main';

  return (
    <Box>
      {label && (
        <Typography
          variant="caption"
          sx={{
            color: error ? 'error.main' : 'text.secondary',
            mb: 0.5,
            display: 'block',
            ml: 0.25,
          }}
        >
          {label}
        </Typography>
      )}

      <Paper
        variant="outlined"
        sx={{
          border: '1px solid',
          borderColor,
          borderRadius: 1,
          overflow: 'hidden',
          opacity: disabled ? 0.5 : 1,
          pointerEvents: disabled ? 'none' : undefined,
          transition: 'border-color 0.2s',
          '&:focus-within': {
            borderColor: hoverBorderColor,
            boxShadow: error
              ? '0 0 0 1px #FF4D6D'
              : '0 0 0 1px #2979FF',
          },
        }}
      >
        {/* ── Toolbar ──────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 0.25,
            p: 0.75,
            bgcolor: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {toolbarItems.map((item, i) =>
            item === null ? (
              <Divider key={i} orientation="vertical" flexItem sx={{ mx: 0.25, my: 0.25 }} />
            ) : (
              <Tooltip key={item.label} title={item.label} placement="top">
                <IconButton
                  size="small"
                  aria-label={item.label}
                  onMouseDown={e => {
                    // Prevent losing focus from editor
                    e.preventDefault();
                    item.action();
                  }}
                  sx={{ borderRadius: 1 }}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            ),
          )}
        </Box>

        {/* ── Editable area ────────────────────────────────────── */}
        <Box
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder={placeholder}
          role="textbox"
          aria-multiline="true"
          aria-label={label ?? 'Éditeur de texte'}
          sx={{
            minHeight,
            p: 2,
            outline: 'none',
            fontSize: '0.9rem',
            lineHeight: 1.75,
            color: 'text.primary',
            overflowY: 'auto',
            // Placeholder via CSS pseudo-element
            '&:empty:before': {
              content: 'attr(data-placeholder)',
              color: 'text.disabled',
              pointerEvents: 'none',
              display: 'block',
            },
            // Rich text styles
            '& h2': { fontSize: '1.3rem', fontWeight: 700, mt: 2, mb: 1 },
            '& h3': { fontSize: '1.1rem', fontWeight: 600, mt: 1.5, mb: 0.75 },
            '& p':  { mt: 0, mb: 1 },
            '& blockquote': {
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              pl: 2,
              ml: 0,
              color: 'text.secondary',
              fontStyle: 'italic',
              my: 1,
            },
            '& ul, & ol': { pl: 3, my: 1 },
            '& li': { mb: 0.5 },
            '& a':  { color: 'primary.main', textDecoration: 'underline' },
          }}
        />
      </Paper>

      {helperText && (
        <Typography
          variant="caption"
          sx={{
            color: error ? 'error.main' : 'text.secondary',
            mt: 0.5,
            display: 'block',
            ml: 1.75,
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
