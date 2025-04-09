import { createTheme, PaletteMode } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    toggleColorMode: () => void;
  }
  interface ThemeOptions {
    toggleColorMode?: () => void;
  }
  interface BreakpointOverrides {
    xxl: true;
  }
  interface SimplePaletteColorOptions {
    contrast?: string;
  }
}

const createAppTheme = (mode: PaletteMode) => {
  return createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
        xxl: 1920,
      },
    },
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: {
              main: '#cdc7ff',
              light: '#6309ff',
              contrast: 'rgba(0, 0, 0, 0.87)',
            },
            background: {
              default: '#100735',
            },
            text: {
              primary: '#d4cfff',
              secondary: 'rgba(212, 207, 255, 0.70)',
            },
            success: {
              main: '#0ad397',
            },
            error: {
              main: '#fa2a75',
            },
          }
        : {
            primary: {
              main: '#cdc7ff',
              light: '#320a8d',
              contrast: 'rgba(0, 0, 0, 0.87)',
            },
            background: {
              default: '#100735',
            },
            text: {
              primary: '#d4cfff',
              secondary: 'rgba(212, 207, 255, 0.70)',
              disabled: 'rgba(212, 207, 255, 0.50)',
            },
            success: {
              main: '#0ad397',
            },
            error: {
              main: '#fa2a75',
            },
          }),
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      h3: {
        fontSize: '3rem',
        fontWeight: 400,
        lineHeight: '3.5rem',
        letterSpacing: '0.15px',
      },
      h5: {
        fontSize: '1.5rem',
        fontWeight: 400,
        lineHeight: '2.25rem',
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: '1.25rem',
        letterSpacing: '0.4px',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
          },
        },
      },
    },
  });
};

export default createAppTheme;
