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
import { useIsMobile } from '@/hooks/useBreakpoints';
import { AutojoinLabelIcon, LightningIcon } from '@/icons';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { CampaignType, type UserPreferences } from '@/types';

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
  preferences: UserPreferences['campaigns_autojoin'] | null;
  onSectionChange: (
    section: 'campaigns_autojoin',
    value: UserPreferences['campaigns_autojoin']
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

  const isMobile = useIsMobile();
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
        borderColor: enabled ? 'success.main' : 'transparent',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: `linear-gradient(90deg, ${theme.palette.background.paper} 0%, ${theme.palette.border.strong} 100%)`,
          gap: 2,
          px: { xs: 2, md: 5 },
          py: { xs: 3.5, md: 4.5 },
        })}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1.5, md: 3 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              position: 'relative',
            }}
          >
            <AutojoinLabelIcon
              sx={{
                width: { xs: 48, md: 64 },
                height: { xs: 48, md: 64 },
                color: enabled ? '#3d5b6e' : '#331d4a',
              }}
            />
            <LightningIcon
              sx={{
                width: { xs: 12, md: 16 },
                height: { xs: 12, md: 16 },
                position: 'absolute',
                top: 0,
                right: 4,
                color: enabled ? 'success.main' : '#201d2c',
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 0.5, md: 1 },
            }}
          >
            <Typography
              sx={{
                color: 'neutral.100',
                fontSize: { xs: 16, md: 20 },
                fontWeight: 700,
                lineHeight: '100%',
              }}
            >
              Autojoin campaigns
            </Typography>
            <Typography
              sx={{
                color: 'secondary.200',
                fontSize: { xs: 12, md: 16 },
                fontWeight: 500,
                lineHeight: '100%',
              }}
            >
              Automatically join campaigns that match your preferences below.
            </Typography>
            <Typography
              sx={{
                color: 'secondary.200',
                fontSize: { xs: 12, md: 16 },
                fontWeight: 500,
                lineHeight: '100%',
              }}
            >
              You must select at least one option in each section.
            </Typography>
          </Box>
        </Box>
        {isPreferencesLoading || isExchangesLoading ? (
          <CircularProgress size={28} sx={{ color: 'neutral.100' }} />
        ) : (
          <SwitchStyled
            checked={enabled}
            disabled={isSavingPreferences}
            onChange={handleSwitchChange}
          />
        )}
      </Box>
      <Stack
        sx={{ display: enabled ? 'flex' : 'none', bgcolor: 'background.paper' }}
      >
        <Row>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: { xs: '100%', md: 270 },
              height: '100%',
              px: { xs: 0, md: 3 },
              pt: { xs: 0, md: 3 },
              pb: { xs: 0, md: 3 },
              gap: { xs: 0.5, md: 1 },
            }}
          >
            <Typography
              variant={isMobile ? 'body4' : 'h5'}
              sx={{ color: 'neutral.100' }}
            >
              Campaign types
            </Typography>
            <Typography
              variant={isMobile ? 'subtitle4' : 'body1'}
              sx={{ color: 'secondary.200' }}
            >
              Select which campaign types to autojoin
            </Typography>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: 'none', md: 'block' },
              borderColor: 'border.strong',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexWrap: 'wrap',
              px: { xs: 0, md: 4 },
              gap: { xs: 1.5, md: 3 },
            }}
          >
            {CAMPAIGN_TYPES.map(({ label, value }) => {
              const isChecked = selectedCampaignTypes.includes(value);
              return (
                <FormControlLabelStyled
                  key={value}
                  label={label}
                  labelPlacement="start"
                  sx={{
                    borderColor: isChecked ? 'accent.main' : 'border.strong',
                  }}
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
              flexDirection: { xs: 'row', md: 'column' },
              alignItems: { xs: 'center', md: 'flex-start' },
              width: { xs: '100%', md: 270 },
              height: '100%',
              px: { xs: 0, md: 3 },
              pt: { xs: 0, md: 3 },
              pb: { xs: 0, md: 3 },
              gap: 3,
            }}
          >
            <Stack sx={{ gap: { xs: 0.5, md: 1 } }}>
              <Typography
                variant={isMobile ? 'body4' : 'h5'}
                sx={{ color: 'neutral.100' }}
              >
                Exchanges
              </Typography>
              <Typography
                variant={isMobile ? 'subtitle4' : 'body1'}
                sx={{ color: 'secondary.200' }}
              >
                Only autojoin campaigns running on these exchanges
              </Typography>
            </Stack>
            <Button
              size="large"
              variant="outlined"
              disableRipple
              disabled={isSavingPreferences}
              sx={{
                fontSize: { xs: 14, md: 16 },
                fontWeight: 500,
                lineHeight: '150%',
                width: { xs: 100, md: 200 },
                minWidth: { xs: 100, md: 200 },
                px: { xs: '14px', md: '22px' },
                color: isAllExchangesSelected ? 'accent.main' : 'neutral.100',
                borderRadius: 99,
                border: '1px solid',
                borderColor: isAllExchangesSelected
                  ? 'accent.main'
                  : 'border.strong',
              }}
              onClick={() => handleSelectAll('exchanges')}
            >
              Select All
            </Button>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: 'none', md: 'block' },
              borderColor: 'border.strong',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexWrap: 'wrap',
              px: { xs: 0, md: 4 },
              gap: { xs: 1.5, md: 3 },
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
                  sx={{
                    borderColor: isChecked ? 'accent.main' : 'border.strong',
                  }}
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
              flexDirection: { xs: 'row', md: 'column' },
              alignItems: { xs: 'center', md: 'flex-start' },
              width: { xs: '100%', md: 270 },
              height: '100%',
              px: { xs: 0, md: 3 },
              pt: { xs: 0, md: 3 },
              pb: { xs: 0, md: 3 },
              gap: 3,
            }}
          >
            <Stack sx={{ gap: { xs: 0.5, md: 1 } }}>
              <Typography
                variant={isMobile ? 'body4' : 'h5'}
                sx={{ color: 'neutral.100' }}
              >
                Tokens
              </Typography>
              <Typography
                variant={isMobile ? 'subtitle4' : 'body1'}
                sx={{ color: 'secondary.200' }}
              >
                Autojoin campaigns for these tokens only
              </Typography>
            </Stack>
            <Button
              size="large"
              variant="outlined"
              disableRipple
              disabled={isSavingPreferences}
              sx={{
                fontSize: { xs: 14, md: 16 },
                fontWeight: 500,
                lineHeight: '150%',
                width: { xs: 100, md: 200 },
                minWidth: { xs: 100, md: 200 },
                px: { xs: '14px', md: '22px' },
                color: isAllTokensSelected ? 'accent.main' : 'neutral.100',
                borderRadius: 99,
                border: '1px solid',
                borderColor: isAllTokensSelected
                  ? 'accent.main'
                  : 'border.strong',
              }}
              onClick={() => handleSelectAll('tokens')}
            >
              Select All
            </Button>
          </Box>
          <Divider
            orientation="vertical"
            flexItem
            sx={{
              display: { xs: 'none', md: 'block' },
              borderColor: 'border.strong',
            }}
          />
          <Box
            sx={{
              display: 'flex',
              flex: 1,
              height: '100%',
              flexWrap: 'wrap',
              px: { xs: 0, md: 4 },
              gap: { xs: 1.5, md: 3 },
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
                  sx={{
                    borderColor: isChecked ? 'accent.main' : 'border.strong',
                  }}
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
