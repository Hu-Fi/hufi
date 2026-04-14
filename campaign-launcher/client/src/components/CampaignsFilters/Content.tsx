import { type FC, type SubmitEvent, useEffect, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Radio,
  Stack,
  Typography,
} from '@mui/material';

import { type CampaignsFiltersSelection } from '@/components/CampaignsFilters';
import { useIsMobile } from '@/hooks/useBreakpoints';
import { useExchangesContext } from '@/providers/ExchangesProvider';
import { config as wagmiConfig } from '@/providers/WagmiProvider';
import { CampaignType } from '@/types';
import { mapTypeToLabel } from '@/utils';

const controlSlotProps = {
  root: {
    sx: {
      ml: 1,
      py: 0,
      px: 0.5,
    },
  },
};

const labelSlotProps = {
  typography: {
    color: 'white',
  },
};

const CheckboxIcon = () => (
  <Box
    width={20}
    height={20}
    borderRadius="4px"
    border="1.5px solid #6d6d6d"
    bgcolor="transparent"
  />
);

const CheckboxCheckedIcon = () => (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="center"
    width={20}
    height={20}
    borderRadius="4px"
    bgcolor="error.main"
  >
    <CheckIcon sx={{ color: '#ffffff', fontSize: 16 }} />
  </Box>
);

const campaignTypeOptions = [...Object.values(CampaignType)].map(
  (campaignType) => ({
    value: campaignType,
    label: mapTypeToLabel(campaignType),
  })
);

const networkOptions = wagmiConfig.chains.map((chain) => ({
  value: chain.id,
  label: chain.name,
}));

const ALL_OPTION_VALUE = 'all' as const;

type Props = {
  appliedFilters: CampaignsFiltersSelection;
  isOpen: boolean;
  onApplyFilters: (filters: CampaignsFiltersSelection) => void;
  onAppliedFiltersCountChange: (count: number) => void;
  onClose: () => void;
};

type MultiSelectSection = 'campaignTypes' | 'exchanges';

const CampaignsFiltersContent: FC<Props> = ({
  appliedFilters,
  isOpen,
  onApplyFilters,
  onAppliedFiltersCountChange,
  onClose,
}) => {
  const [draftFilters, setDraftFilters] =
    useState<CampaignsFiltersSelection>(appliedFilters);

  const { exchanges = [] } = useExchangesContext();
  const isMobile = useIsMobile();

  const exchangeOptions = exchanges.map(({ name, display_name }) => ({
    value: name,
    label: display_name,
  }));
  const campaignTypeValues = campaignTypeOptions.map((option) => option.value);
  const exchangeValues = exchangeOptions.map((option) => option.value);
  const sectionOptions: Record<MultiSelectSection, string[]> = {
    campaignTypes: campaignTypeValues,
    exchanges: exchangeValues,
  };

  const isAllCampaignTypesSelected =
    draftFilters.campaignTypes.includes(ALL_OPTION_VALUE);
  const isAllExchangesSelected =
    draftFilters.exchanges.includes(ALL_OPTION_VALUE);

  const handleToggleAll = (section: MultiSelectSection) => {
    const currentValues = draftFilters[section] as string[];
    const isAllSelected = currentValues.includes(ALL_OPTION_VALUE);

    setDraftFilters((previous) => ({
      ...previous,
      [section]: isAllSelected ? [] : [ALL_OPTION_VALUE],
    }));
  };

  const handleToggleOption = (value: string, section: MultiSelectSection) => {
    const options = sectionOptions[section];
    const currentValues = draftFilters[section] as string[];
    let nextValues: string[];

    if (currentValues.includes(ALL_OPTION_VALUE)) {
      nextValues = options.filter((option) => option !== value);
    } else if (currentValues.includes(value)) {
      nextValues = currentValues.filter(
        (selectedValue) => selectedValue !== value
      );
    } else {
      nextValues = [...currentValues, value];
    }

    setDraftFilters((previous) => ({
      ...previous,
      [section]:
        nextValues.length === options.length ? [ALL_OPTION_VALUE] : nextValues,
    }));
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    let nextFiltersCount = 0;

    if (draftFilters.campaignTypes.includes(ALL_OPTION_VALUE)) {
      nextFiltersCount += campaignTypeOptions.length;
    } else {
      nextFiltersCount += draftFilters.campaignTypes.length;
    }

    if (draftFilters.exchanges.includes(ALL_OPTION_VALUE)) {
      nextFiltersCount += exchangeOptions.length;
    } else {
      nextFiltersCount += draftFilters.exchanges.length;
    }

    onApplyFilters(draftFilters);
    onAppliedFiltersCountChange(nextFiltersCount);
    onClose();
  };

  const handleClearAll = () => {
    setDraftFilters({
      campaignTypes: [],
      exchanges: [],
      network: appliedFilters.network,
    });
  };

  useEffect(() => {
    if (isOpen) {
      setDraftFilters(appliedFilters);
    }
  }, [isOpen, appliedFilters]);

  const disableClearAll = Object.entries(draftFilters)
    .filter(([key]) => key !== 'network')
    .every(([, value]) => (Array.isArray(value) ? value.length === 0 : !value));

  return (
    <Stack
      component="form"
      height="100%"
      maxHeight="100%"
      minHeight={0}
      overflow="hidden"
      onSubmit={handleSubmit}
    >
      <Typography
        variant="h6"
        color="white"
        lineHeight={1}
        ml={{ xs: 2, md: 4 }}
        mb={3}
      >
        Campaign Filters
      </Typography>
      <Stack pt={2} pb={3} gap={2} minHeight={0} flex={1} overflow="auto">
        <Stack gap={1} px={{ xs: 2, md: 4 }}>
          <Typography
            variant="caption"
            fontSize={13}
            fontWeight={500}
            textTransform="uppercase"
          >
            Network
          </Typography>
          {networkOptions.map(({ label, value }) => (
            <FormControlLabel
              key={value}
              label={label}
              slotProps={labelSlotProps}
              control={
                <Radio
                  checked={draftFilters.network === value}
                  slotProps={controlSlotProps}
                  icon={
                    <Box
                      width={20}
                      height={20}
                      borderRadius="50%"
                      border="1.5px solid #6d6d6d"
                      bgcolor="transparent"
                    />
                  }
                  checkedIcon={
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      width={20}
                      height={20}
                      borderRadius="50%"
                      bgcolor="error.main"
                    >
                      <CheckIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                  }
                />
              }
              onChange={() =>
                setDraftFilters((previous) => ({
                  ...previous,
                  network: value,
                }))
              }
            />
          ))}
        </Stack>
        <Divider sx={{ borderColor: '#3a2e6f' }} />
        <Stack gap={1} px={{ xs: 2, md: 4 }}>
          <Typography
            variant="caption"
            fontSize={13}
            fontWeight={500}
            textTransform="uppercase"
          >
            Campaign Type
          </Typography>
          <FormControlLabel
            label="All"
            control={
              <Checkbox
                checked={isAllCampaignTypesSelected}
                slotProps={controlSlotProps}
                icon={<CheckboxIcon />}
                checkedIcon={<CheckboxCheckedIcon />}
              />
            }
            slotProps={labelSlotProps}
            onChange={() => handleToggleAll('campaignTypes')}
          />
          {campaignTypeOptions.map(({ label, value }) => (
            <FormControlLabel
              key={value}
              label={label}
              control={
                <Checkbox
                  checked={
                    isAllCampaignTypesSelected ||
                    draftFilters.campaignTypes.includes(value)
                  }
                  slotProps={controlSlotProps}
                  icon={<CheckboxIcon />}
                  checkedIcon={<CheckboxCheckedIcon />}
                />
              }
              slotProps={labelSlotProps}
              onChange={() => handleToggleOption(value, 'campaignTypes')}
            />
          ))}
        </Stack>
        <Divider sx={{ borderColor: '#3a2e6f' }} />
        <Stack gap={1} px={{ xs: 2, md: 4 }}>
          <Typography
            variant="caption"
            fontSize={13}
            fontWeight={500}
            textTransform="uppercase"
          >
            Exchanges
          </Typography>
          <FormControlLabel
            label="All"
            control={
              <Checkbox
                checked={isAllExchangesSelected}
                slotProps={controlSlotProps}
                icon={<CheckboxIcon />}
                checkedIcon={<CheckboxCheckedIcon />}
              />
            }
            slotProps={labelSlotProps}
            onChange={() => handleToggleAll('exchanges')}
          />
          {exchangeOptions.map(({ label, value }) => (
            <FormControlLabel
              key={value}
              label={label}
              control={
                <Checkbox
                  checked={
                    isAllExchangesSelected ||
                    draftFilters.exchanges.includes(value)
                  }
                  slotProps={controlSlotProps}
                  icon={<CheckboxIcon />}
                  checkedIcon={<CheckboxCheckedIcon />}
                />
              }
              slotProps={labelSlotProps}
              onChange={() => handleToggleOption(value, 'exchanges')}
            />
          ))}
        </Stack>
      </Stack>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        borderTop="1px solid #3a2e6f"
        pt={3}
        pb={4}
        px={{ xs: 2, md: 3 }}
        gap={2}
      >
        <Button
          size="large"
          variant="outlined"
          disabled={disableClearAll}
          fullWidth={isMobile}
          disableRipple
          sx={{
            color: 'white',
            boxShadow: 'none',
          }}
          onClick={handleClearAll}
        >
          Clear All
        </Button>
        <Button
          type="submit"
          size="large"
          variant="contained"
          color="error"
          fullWidth={isMobile}
          disableRipple
          sx={{
            color: 'white',
            boxShadow: 'none',
          }}
        >
          Apply filters
        </Button>
      </Box>
    </Stack>
  );
};

export default CampaignsFiltersContent;
