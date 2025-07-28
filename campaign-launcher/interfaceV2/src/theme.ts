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
    violet?: string;
  }
  interface PaletteColor {
    violet?: string;
  }
  interface TypographyVariants {
    'h4-mobile': React.CSSProperties;
    'h6-mobile': React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    'h4-mobile'?: React.CSSProperties;
    'h6-mobile'?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    'h4-mobile': true;
    'h6-mobile': true;
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
              violet: '#6309ff',
              contrast: 'rgba(0, 0, 0, 0.87)',
            },
            secondary: {
              main: '#5d0Ce9',
              contrast: 'rgba(255, 255, 255, 0.87)',
            },
            background: {
              default: '#100735',
            },
            text: {
              primary: '#d4cfff',
              secondary: '#858ec6',
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
      h4: {
        fontSize: '34px',
        fontWeight: 600,
        lineHeight: '42px',
        letterSpacing: '0.25px',
      },
      'h4-mobile': {
        fontSize: '28px',
        fontWeight: 600,
        lineHeight: '34.5px',
        letterSpacing: '0.25px',
      },
      h5: {
        fontSize: '1.5rem',
        fontWeight: 400,
        lineHeight: '2.25rem',
      },
      h6: {
        fontSize: '1.25rem',
        fontWeight: 500,
        lineHeight: '160%',
        letterSpacing: '0.15px',
      },
      'h6-mobile': {
        fontSize: '20px',
        fontWeight: 500,
        lineHeight: '160%',
        letterSpacing: '0.15px',
      },
      caption: {
        fontSize: '0.75rem',
        fontWeight: 400,
        lineHeight: '1.25rem',
        letterSpacing: '0.4px',
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: '1.375rem',
        letterSpacing: '0.1px',
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
