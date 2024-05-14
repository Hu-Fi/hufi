import { ChainId, NETWORKS } from '@human-protocol/sdk';
import {
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectProps,
} from '@mui/material';

import { SUPPORTED_CHAIN_IDS } from '../../constants';
import { CHAIN_ICONS } from '../icons/chains';

export type NetworkSelectProps<T> = SelectProps<T> & {
  showAllNetwork?: boolean;
  supportedChainIds?: ChainId[];
  width?: number | string;
};

export function NetworkSelect<T>({
  width,
  supportedChainIds,
  showAllNetwork,
  ...props
}: NetworkSelectProps<T>) {
  return (
    <FormControl
      variant="standard"
      sx={{ m: { xs: 0, md: 1 }, minWidth: 220, width }}
    >
      <InputLabel id="newtork-select-label">Network</InputLabel>
      <Select
        labelId="network-select-label"
        id="network-select"
        label="Network"
        sx={{
          '.MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            paddingTop: '8px',
            paddingBottom: '8px',
            minWidth: '300px',
            '.MuiListItemIcon-root': {
              minWidth: '36px',
            },
          },
        }}
        {...props}
      >
        {showAllNetwork && (
          <MenuItem value={ChainId.ALL}>
            <ListItemIcon sx={{ color: '#320a8d', fontSize: '0.8rem' }}>
              {CHAIN_ICONS[ChainId.ALL]}
            </ListItemIcon>
            All Networks
          </MenuItem>
        )}
        {(supportedChainIds ?? SUPPORTED_CHAIN_IDS).map((chainId) => {
          const IconComponent = CHAIN_ICONS[chainId];
          return (
            <MenuItem value={chainId} key={chainId}>
              {IconComponent && (
                <ListItemIcon sx={{ color: '#320a8d' }}>
                  {IconComponent}
                </ListItemIcon>
              )}
              {NETWORKS[chainId]?.title}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
