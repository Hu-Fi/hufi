import { FC, PropsWithChildren } from "react";
import { Container as MuiContainer, SxProps } from "@mui/material";

type Props = {
  sx?: SxProps;
}

const Container: FC<PropsWithChildren<Props>> = ({ sx, children }) => {
	return (
		<MuiContainer maxWidth="xxl" sx={{ maxWidth: "1920px", mx: "auto", px: { xs: 2, xl: 7 }, ...sx }}>
			{children}
		</MuiContainer>
	)
}

export default Container;   