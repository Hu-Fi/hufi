import { FC, PropsWithChildren, useMemo, useState } from "react";

import { CssBaseline, PaletteMode } from "@mui/material";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

import createAppTheme from "../theme";

const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
	const [mode, setMode] = useState<PaletteMode>('dark');
	
	const toggleColorMode = () => setMode((prevMode) => prevMode === 'light' ? 'dark' : 'light');
	
	const theme = useMemo(() => createAppTheme(mode), [mode]);
	
	const extendedTheme = useMemo(() => ({
		...theme,
		toggleColorMode
	}), [theme, toggleColorMode]);

	return (
		<MuiThemeProvider theme={extendedTheme}>
			<CssBaseline />
			{children}
		</MuiThemeProvider>
	);
};

export default ThemeProvider;