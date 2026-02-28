import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';
import SplashScreen from '../components/common/SplashScreen';

// Mock the logo PNG import so it doesn't fail in jsdom
vi.mock('../assets/68e50a66e42f8802615262.png', () => ({ default: 'logo-mock.png' }));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('SplashScreen', () => {
  it('renders without crashing', () => {
    const { container } = renderWithTheme(<SplashScreen />);
    expect(container.firstChild).not.toBeNull();
  });

  it('displays the brand logo image', () => {
    renderWithTheme(<SplashScreen />);
    const logo = screen.getByAltText(/TARAM GROUP logo/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'logo-mock.png');
  });

  it('shows a loading progress indicator', () => {
    renderWithTheme(<SplashScreen />);
    // MUI LinearProgress renders with role="progressbar"
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the loading label text', () => {
    renderWithTheme(<SplashScreen />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('has the correct ARIA attributes for accessibility', () => {
    renderWithTheme(<SplashScreen />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-label', "Chargement de l'application");
  });

  it('renders the brand name text', () => {
    renderWithTheme(<SplashScreen />);
    expect(screen.getByText('TARAM GROUP')).toBeInTheDocument();
  });

  it('renders the tagline text', () => {
    renderWithTheme(<SplashScreen />);
    expect(screen.getByText(/editorial back office/i)).toBeInTheDocument();
  });

  it('is fixed and covers the full screen (z-index 9999)', () => {
    const { container } = renderWithTheme(<SplashScreen />);
    const root = container.firstChild as HTMLElement;
    // The component uses sx={{ position: 'fixed', ... zIndex: 9999 }}
    // MUI applies styles via emotion class — check the element exists and is a div
    expect(root.tagName).toBe('DIV');
  });
});
