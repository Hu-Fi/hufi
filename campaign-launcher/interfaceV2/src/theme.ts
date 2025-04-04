import { createTheme, PaletteMode } from "@mui/material/styles";

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
							light: '#6309ff'
						},
						background: {
							default: '#100735',
						},
						text: {
							primary: '#d4cfff',
							secondary: 'rgba(212, 207, 255, 0.70)',
						},
						success: {
							main: '#0ad397'
						},
						error: {
							main: '#fa2a75'
						},
				  }
				: {
						primary: { 
							main: '#cdc7ff', 
							light: '#6309ff'
						},
						background: {
							default: '#100735',
						},
						text: {
							primary: '#d4cfff',
							secondary: 'rgba(212, 207, 255, 0.70)',
						},
						success: {
							main: '#0ad397'
						},
						error: {
							main: '#fa2a75'
						},
				  }),
		},
		typography: {
			fontFamily: 'Inter, sans-serif',
			caption: {
				fontSize: '12px',
				lineHeight: '1.25rem',
				fontWeight: 400,
				letterSpacing: '0.4px',
			},
		},
	});
};

export default createAppTheme;