import { type ChangeEvent, type FC } from 'react';

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';

import { TOKENS } from '@/constants/tokens';
import { AutojoinLabelIcon, LightningIcon } from '@/icons';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { CampaignType, type Preferences } from '@/types';

import {
  CheckboxCheckedIcon,
  CheckboxIcon,
  FormControlLabelStyled,
  Row,
  SwitchStyled,
} from './components';

const CAMPAIGN_TYPES = [
  {
    label: 'Market Making',
    value: CampaignType.MARKET_MAKING,
  },
  {
    label: 'Holding',
    value: CampaignType.HOLDING,
  },
];

const TOKEN_OPTIONS = TOKENS.filter(({ name }) =>
  ['hmt', 'xin', 'ccd'].includes(name)
).map((token) => ({
  ...token,
  name: token.name.toUpperCase(),
}));

type Props = {
  preferences: Preferences['campaigns_autojoin'] | null;
  onSectionChange: (
    section: 'campaigns_autojoin',
    value: Preferences['campaigns_autojoin']
  ) => void;
  isPreferencesLoading: boolean;
  isSavingPreferences: boolean;
};

const AutojoinPreferences: FC<Props> = ({
  preferences,
  onSectionChange,
  isPreferencesLoading,
  isSavingPreferences,
}) => {
  const enabled = preferences?.enabled ?? false;
  const selectedCampaignTypes = preferences?.campaign_types ?? [];
  const selectedExchanges = preferences?.exchanges ?? [];
  const selectedTokens = preferences?.tokens ?? [];

  const { exchanges: exchangesOptions, isLoading: isExchangesLoading } =
    useExchangesContext();

  const isAllExchangesSelected =
    !!exchangesOptions?.length &&
    exchangesOptions.length === selectedExchanges.length;
  const isAllTokensSelected = TOKEN_OPTIONS.length === selectedTokens.length;

  const handleSwitchChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!preferences) {
      return;
    }

    event.stopPropagation();
    onSectionChange('campaigns_autojoin', {
      ...preferences,
      enabled: event.target.checked,
    });
  };

  const handleSelectAll = (section: 'exchanges' | 'tokens') => {
    if (!preferences || !exchangesOptions) return null;

    const options = section === 'exchanges' ? exchangesOptions : TOKEN_OPTIONS;
    const isAlreadySelected = preferences?.[section].length === options?.length;

    if (isAlreadySelected) {
      onSectionChange('campaigns_autojoin', {
        ...preferences,
        [section]: [],
      });
    } else {
      const nextValues = options?.map(({ name }) => name) ?? [];
      onSectionChange('campaigns_autojoin', {
        ...preferences,
        [section]: nextValues,
      });
    }
  };

  const handleToggleOption = (
    value: string,
    section: 'exchanges' | 'tokens' | 'campaign_types'
  ) => {
    if (!preferences) return null;

    const isAlreadySelected = preferences?.[section]?.includes(value);

    if (isAlreadySelected) {
      onSectionChange('campaigns_autojoin', {
        ...preferences,
        [section]: preferences?.[section].filter((v) => v !== value).sort(),
      });
    } else {
      onSectionChange('campaigns_autojoin', {
        ...preferences,
        [section]: [...(preferences?.[section] ?? []), value].sort(),
      });
    }
  };

  return (
    <Stack
      sx={{
        minHeight: '130px',
        width: '100%',
        borderRadius: '18px',
        border: '2px solid',
        borderColor: enabled ? '#43ba96' : '#100735',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'linear-gradient(90deg, #251D47 0%, #3C2F73 100%)',
          gap: 2,
          pl: 6,
          pr: 3,
          py: 4,
        }}
      >
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Box
            sx={{
              display: 'flex',
              position: 'relative',
              width: 63,
              height: 63,
            }}
          >
            <AutojoinLabelIcon
              sx={{
                width: 63,
                height: 63,
                color: enabled ? '#3d5b6e' : '#331d4a',
              }}
            />
            <LightningIcon
              sx={{
                width: 16,
                height: 16,
                position: 'absolute',
                top: 0,
                right: 4,
                color: enabled ? '#43ba96' : '#201d2c',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ color: 'white', fontSize: 20, fontWeight: 700 }}>
              Autojoin campaigns
            </Typography>
            <Typography
              sx={{ color: '#a29dca', fontSize: 16, fontWeight: 500 }}
            >
              Automatically join campaigns that match your preferences below.
              You must select at least one option in each section.
            </Typography>
          </Box>
        </Box>
        {isPreferencesLoading || isExchangesLoading ? (
          <CircularProgress size={28} sx={{ color: 'white' }} />
        ) : (
          <SwitchStyled
            checked={enabled}
            disabled={isSavingPreferences}
            onChange={handleSwitchChange}
          />
        )}
      </Box>
      <Stack sx={{ display: enabled ? 'flex' : 'none', bgcolor: '#251d47' }}>
        <Row>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 270,
              height: '100%',
              p: 3,
              gap: 1,
            }}
          >
            <Typography
              sx={{
                color: 'white',
                fontSize: 20,
                fontWeight: 600,
                lineHeight: '150%',
              }}
            >
              Campaign types
            </Typography>
            <Typography
              sx={{ color: '#a29dca', fontSize: 14, fontWeight: 500 }}
            >
              Select which campaign types to autojoin
            </Typography>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: '#3a2e6f' }}
          />
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexWrap: 'wrap',
              px: 4,
              gap: 3,
            }}
          >
            {CAMPAIGN_TYPES.map(({ label, value }) => {
              const isChecked = selectedCampaignTypes.includes(value);
              return (
                <FormControlLabelStyled
                  key={value}
                  label={label}
                  labelPlacement="start"
                  borderColor={isChecked ? '#fa2a75' : '#3a2e6f'}
                  disabled={isPreferencesLoading || isSavingPreferences}
                  control={
                    <Checkbox
                      checked={isChecked}
                      icon={<CheckboxIcon />}
                      checkedIcon={<CheckboxCheckedIcon />}
                      disableRipple
                    />
                  }
                  onChange={() => handleToggleOption(value, 'campaign_types')}
                />
              );
            })}
          </Box>
        </Row>
        <Row>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 270,
              height: '100%',
              p: 3,
              gap: 1,
            }}
          >
            <Typography
              sx={{
                color: 'white',
                fontSize: 20,
                fontWeight: 600,
                lineHeight: '150%',
              }}
            >
              Exchanges
            </Typography>
            <Typography
              sx={{ color: '#a29dca', fontSize: 14, fontWeight: 500 }}
            >
              Only autojoin campaigns running on these exchanges
            </Typography>
            <Button
              size="large"
              variant="outlined"
              disableRipple
              disabled={isSavingPreferences}
              sx={{
                mt: 2,
                minWidth: 200,
                color: isAllExchangesSelected ? 'error.main' : 'white',
                borderRadius: 99,
                border: '1px solid',
                borderColor: isAllExchangesSelected ? 'error.main' : '#3a2e6f',
              }}
              onClick={() => handleSelectAll('exchanges')}
            >
              Select All
            </Button>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: '#3a2e6f' }}
          />
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexWrap: 'wrap',
              px: 4,
              gap: 3,
            }}
          >
            {exchangesOptions?.map(({ name, display_name }) => {
              const isChecked =
                isAllExchangesSelected || selectedExchanges.includes(name);
              return (
                <FormControlLabelStyled
                  key={name}
                  label={display_name}
                  labelPlacement="start"
                  borderColor={isChecked ? '#fa2a75' : '#3a2e6f'}
                  disabled={isPreferencesLoading || isSavingPreferences}
                  control={
                    <Checkbox
                      checked={isChecked}
                      icon={<CheckboxIcon />}
                      checkedIcon={<CheckboxCheckedIcon />}
                      disableRipple
                    />
                  }
                  onChange={() => handleToggleOption(name, 'exchanges')}
                />
              );
            })}
          </Box>
        </Row>
        <Row>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: 270,
              height: '100%',
              p: 3,
              gap: 1,
            }}
          >
            <Typography
              sx={{
                color: 'white',
                fontSize: 20,
                fontWeight: 600,
                lineHeight: '150%',
              }}
            >
              Tokens
            </Typography>
            <Typography
              sx={{ color: '#a29dca', fontSize: 14, fontWeight: 500 }}
            >
              Autojoin campaigns for these tokens only
            </Typography>
            <Button
              size="large"
              variant="outlined"
              disableRipple
              disabled={isSavingPreferences}
              sx={{
                mt: 2,
                minWidth: 200,
                color: isAllTokensSelected ? 'error.main' : 'white',
                borderRadius: 99,
                border: '1px solid',
                borderColor: isAllTokensSelected ? 'error.main' : '#3a2e6f',
              }}
              onClick={() => handleSelectAll('tokens')}
            >
              Select All
            </Button>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{ borderColor: '#3a2e6f' }}
          />
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexWrap: 'wrap',
              px: 4,
              gap: 3,
            }}
          >
            {TOKEN_OPTIONS.map(({ name, label, icon }) => {
              const isChecked =
                isAllTokensSelected || selectedTokens.includes(name);
              return (
                <FormControlLabelStyled
                  key={name}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <Box
                        component="img"
                        src={icon}
                        alt={label}
                        sx={{ width: 20, height: 20, m: 1 }}
                      />
                      {label}
                    </Box>
                  }
                  labelPlacement="start"
                  borderColor={isChecked ? '#fa2a75' : '#3a2e6f'}
                  disabled={isPreferencesLoading || isSavingPreferences}
                  control={
                    <Checkbox
                      checked={isChecked}
                      icon={<CheckboxIcon />}
                      checkedIcon={<CheckboxCheckedIcon />}
                      disableRipple
                    />
                  }
                  onChange={() => handleToggleOption(name, 'tokens')}
                />
              );
            })}
          </Box>
        </Row>
      </Stack>
    </Stack>
  );
};

export default AutojoinPreferences;
