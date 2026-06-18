import { createTheme, type PaletteMode } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation'; // needed for the date pickers customization

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
  interface Palette {
    accent: PaletteColor;
    neutral: PaletteColor;
    border: PaletteColor;
  }
  interface PaletteColor {
    '100'?: string;
    '200'?: string;
    '300'?: string;
    '400'?: string;
    '500'?: string;
    strong?: string;
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

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    accent: true;
  }
}

declare module '@mui/material/Radio' {
  interface RadioPropsColorOverrides {
    accent: true;
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
              '100': '#100735',
              '200': '#251d47',
            },
            secondary: {
              main: '#5d0Ce9',
              '100': '#6b6490',
              '200': '#d4cfff',
              '300': '#2d284e',
              '400': '#a29dca',
            },
            accent: {
              main: '#fa2a75',
              dark: '#af1d51',
              contrastText: '#ffffff',
            },
            neutral: {
              '100': '#ffffff',
              '200': '#43ba96',
              '300': '#ffbb00',
              '400': '#ff6262',
              '500': '#a0a0a0',
            },
            border: {
              main: 'rgba(255, 255, 255, 0.07)',
              strong: '#3a2e6f',
            },
            text: {
              primary: '#d4cfff',
              secondary: 'rgba(212, 207, 255, 0.70)',
            },
            success: {
              main: '#43ba96',
              dark: '#43ba96cc',
              contrastText: '#ffffff',
            },
            warning: {
              main: '#ffbb00',
              dark: '#ffbb00cc',
              contrastText: '#ffffff',
            },
            error: {
              main: '#ff6262',
              dark: '#ff6262cc',
              contrastText: '#ffffff',
            },
          }
        : {
            primary: {
              main: '#cdc7ff',
              '100': '#100735',
              '200': '#251d47',
            },
            secondary: {
              main: '#5d0Ce9',
              '100': '#6b6490',
              '200': '#d4cfff',
              '300': '#2d284e',
              '400': '#a29dca',
            },
            accent: {
              main: '#fa2a75',
              dark: '#af1d51',
              contrastText: '#ffffff',
            },
            neutral: {
              '100': '#ffffff',
              '200': '#43ba96',
              '300': '#ffbb00',
              '400': '#ff6262',
              '500': '#a0a0a0',
            },
            border: {
              main: 'rgba(255, 255, 255, 0.07)',
              strong: '#3a2e6f',
            },
            text: {
              primary: '#d4cfff',
              secondary: 'rgba(212, 207, 255, 0.70)',
            },
            success: {
              main: '#43ba96',
              dark: '#43ba96cc',
              contrastText: '#ffffff',
            },
            warning: {
              main: '#ffbb00',
              dark: '#ffbb00cc',
              contrastText: '#ffffff',
            },
            error: {
              main: '#ff6262',
              dark: '#ff6262cc',
              contrastText: '#ffffff',
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
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          sizeSmall: {
            padding: '4px 10px',
            fontSize: '10px',
            lineHeight: '16px',
          },
          sizeMedium: {
            padding: '6px 16px',
            fontSize: '12px',
            lineHeight: '20px',
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
            backgroundColor: theme.palette.secondary['200'],
            color: theme.palette.primary['100'],
          }),
          arrow: ({ theme }) => ({
            '&::before': {
              backgroundColor: theme.palette.secondary['200'],
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
      MuiSelect: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-input': {
              padding: '16px 14px',
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          input: ({ theme }) => ({
            color: theme.palette.neutral['100'],
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#433679',
            },
          },
        },
      },
      MuiPickersOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.neutral['100'],
            '& .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: theme.palette.border['strong'],
            },
          }),
        },
      },
    },
  });
};

export default createAppTheme;
