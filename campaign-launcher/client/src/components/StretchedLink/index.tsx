import type { FC } from 'react';

import { Link as MuiLink, type LinkProps } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

type StretchedLinkProps = LinkProps & Record<string, unknown>;

const StretchedLink: FC<StretchedLinkProps> = ({ sx, ...props }) => {
  return (
    <MuiLink
      component={RouterLink}
      {...props}
      sx={{
        ...sx,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
        },
      }}
    />
  );
};

export default StretchedLink;
