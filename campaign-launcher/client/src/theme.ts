import { createTheme, type PaletteMode } from '@mui/material/styles';

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
    contrast?: string;
  }
  interface TypographyVariants {
    'h4-mobile': React.CSSProperties;
    'h6-mobile': React.CSSProperties;
    tooltip: React.CSSProperties;
    alert: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    'h4-mobile'?: React.CSSProperties;
    'h6-mobile'?: React.CSSProperties;
    tooltip?: React.CSSProperties;
    alert?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    'h4-mobile': true;
    'h6-mobile': true;
    tooltip: true;
    alert: true;
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
      body1: {
        fontSize: '1rem',
        fontWeight: 400,
        lineHeight: '150%',
        letterSpacing: '0.15px',
      },
      body2: {
        fontSize: '0.875rem',
        fontWeight: 400,
        lineHeight: '20px',
        letterSpacing: '0.17px',
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 600,
        lineHeight: '1.375rem',
        letterSpacing: '0.1px',
      },
      tooltip: {
        fontSize: 10,
        fontWeight: 500,
        lineHeight: '14px',
        letterSpacing: 0,
      },
      alert: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: 16,
        fontWeight: 500,
        lineHeight: '150%',
        letterSpacing: '0.15px',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            letterSpacing: '0.1px',
            textTransform: 'none',
          },
          sizeSmall: {
            padding: '4px 10px',
            fontSize: '13px',
            lineHeight: '22px',
          },
          sizeMedium: {
            padding: '6px 16px',
            fontSize: '14px',
            lineHeight: '24px',
          },
          sizeLarge: {
            padding: '8px 22px',
            fontSize: '15px',
            lineHeight: '26px',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrast,
          }),
          arrow: ({ theme }) => ({
            '&::before': {
              backgroundColor: theme.palette.primary.main,
            },
          }),
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: 'Roboto, sans-serif',
            fontSize: '16px',
            fontWeight: 400,
            lineHeight: '150%',
            letterSpacing: '0.15px',
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: {
            transform: 'scale(1,1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button':
              {
                WebkitAppearance: 'none',
                margin: 0,
              },
            '& input[type=number]': {
              MozAppearance: 'textfield',
            },
          },
        },
      },
    },
  });
};

export default createAppTheme;
