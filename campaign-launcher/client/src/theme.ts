import { createTheme, type PaletteColorOptions } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation'; // needed for the date pickers customization

declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xxl: true;
  }
  interface Palette {
    accent: PaletteColor;
    neutral: PaletteColor;
    border: PaletteColor;
  }
  interface PaletteOptions {
    accent?: PaletteColorOptions;
    neutral?: PaletteColorOptions;
    border?: PaletteColorOptions;
  }
  interface TypeBackground {
    subtle: string;
  }
  interface PaletteColor {
    '100'?: string;
    '200'?: string;
    '300'?: string;
    '400'?: string;
    '500'?: string;
    strong?: string;
  }
  interface SimplePaletteColorOptions {
    '100'?: string;
    '200'?: string;
    '300'?: string;
    '400'?: string;
    '500'?: string;
    strong?: string;
  }
  interface TypographyVariants {
    body3: React.CSSProperties;
    body4: React.CSSProperties;
    subtitle3: React.CSSProperties;
    subtitle4: React.CSSProperties;
    subtitle5: React.CSSProperties;
    tooltip: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    body3?: React.CSSProperties;
    body4?: React.CSSProperties;
    subtitle3?: React.CSSProperties;
    subtitle4?: React.CSSProperties;
    subtitle5?: React.CSSProperties;
    tooltip?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    body3: true;
    body4: true;
    subtitle3: true;
    subtitle4: true;
    subtitle5: true;
    tooltip: true;
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

const theme = createTheme({
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
    mode: 'dark',
    primary: {
      main: '#d4cfff',
      contrastText: 'rgba(0, 0, 0, 0.87)',
    },
    secondary: {
      main: '#5d0Ce9',
      '100': '#6b6490',
      '200': '#a29dca',
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
    background: {
      default: '#100735',
      paper: '#251d47',
      subtle: '#2d284e',
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
      contrastText: '#100735',
    },
    error: {
      main: '#ff6262',
      dark: '#ff6262cc',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',

    // Title EB
    h3: {
      fontSize: '2rem',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '0px',
    },

    // Title EB2
    h4: {
      fontSize: '1.5rem',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '0px',
    },

    // Title SB
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0px',
    },

    // Title EB3
    h6: {
      fontSize: '1.125rem',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '0px',
    },

    //Label SB
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '1.5px',
    },

    //Label SB2
    subtitle2: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '1.5px',
    },

    //Label SB3
    subtitle3: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: 'normal',
    },

    //Label R
    subtitle4: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: 'normal',
    },

    //Label B
    subtitle5: {
      fontSize: '0.625rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '1px',
    },

    // Body M
    body1: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: 'normal',
    },

    // Body SB
    body2: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: 'normal',
    },

    // Body M2
    body3: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: 'normal',
    },

    // Body B
    body4: {
      fontSize: '1rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: 'normal',
    },

    tooltip: {
      fontSize: '0.625rem',
      fontWeight: 500,
      lineHeight: '0.875rem',
      letterSpacing: 0,
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
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
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
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: 'normal',
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
          ...theme.typography.body3,
          color: theme.palette.neutral['100'],
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.border.strong,
          },
        }),
      },
    },
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...theme.typography.body3,
          color: theme.palette.neutral['100'],
          '& .MuiPickersOutlinedInput-notchedOutline': {
            borderColor: theme.palette.border.strong,
          },
        }),
      },
    },
  },
});

export default theme;
