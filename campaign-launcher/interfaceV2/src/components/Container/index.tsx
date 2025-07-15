import { FC, PropsWithChildren } from 'react';

import { Container as MuiContainer, ContainerProps } from '@mui/material';

const Container: FC<PropsWithChildren<ContainerProps>> = ({ sx, children }) => {
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
