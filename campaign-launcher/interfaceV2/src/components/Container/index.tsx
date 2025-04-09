import { FC, PropsWithChildren } from 'react';

import { Container as MuiContainer, SxProps } from '@mui/material';

type Props = {
  sx?: SxProps;
};

const Container: FC<PropsWithChildren<Props>> = ({ sx, children }) => {
  return (
    <MuiContainer
      maxWidth={false}
      sx={{
        width: '100%',
        px: { xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 7 },
        ...sx,
      }}
    >
      {children}
    </MuiContainer>
  );
};

export default Container;
