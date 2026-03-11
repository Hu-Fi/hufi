import { type FC, type SubmitEvent, useMemo, useState } from 'react';

import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Radio,
  Stack,
  styled,
  Typography,
} from '@mui/material';

import { FilterIcon } from '@/icons';
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
    bgcolor="#FA2A75"
  >
    <CheckIcon sx={{ color: '#ffffff', fontSize: 16 }} />
  </Box>
);

const FiltersCountStyled = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  position: 'absolute',
  top: -4,
  right: -4,
  backgroundColor: '#FA2A75',
  color: 'white',
  fontSize: 12,
  borderRadius: '50%',
});

export type CampaignsFiltersSelection = {
  campaignTypes: (CampaignType | '')[];
  exchanges: string[];
  network: number;
};

type Props = {
  appliedFilters: CampaignsFiltersSelection;
  handleApplyFilters: (filters: CampaignsFiltersSelection) => void;
  isDisabled: boolean;
};

const CampaignsFilters: FC<Props> = ({
  appliedFilters,
  handleApplyFilters,
  isDisabled,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filtersCount, setFiltersCount] = useState(0);
  const [draftFilters, setDraftFilters] =
    useState<CampaignsFiltersSelection>(appliedFilters);

  const { exchanges = [] } = useExchangesContext();

  const campaignTypeOptions = useMemo(
    () =>
      [...Object.values(CampaignType)].map((campaignType) => ({
        value: campaignType,
        label: mapTypeToLabel(campaignType),
      })),
    []
  );

  const exchangeOptions = useMemo(
    () =>
      exchanges.map(({ name, display_name }) => ({
        value: name,
        label: display_name,
      })),
    [exchanges]
  );

  const networkOptions = useMemo(
    () =>
      wagmiConfig.chains.map((chain) => ({
        value: chain.id,
        label: chain.name,
      })),
    []
  );

  const isAllCampaignTypesSelected = draftFilters.campaignTypes.includes('');
  const isAllExchangesSelected = draftFilters.exchanges.includes('');

  const toggleAll = (section: keyof CampaignsFiltersSelection) => {
    const currentValues = draftFilters[section] as string[];
    const isAllSelected = currentValues.includes('');

    setDraftFilters((previous) => ({
      ...previous,
      [section]: isAllSelected ? [] : [''],
    }));
  };

  const toggleOption = (
    section: keyof CampaignsFiltersSelection,
    value: string,
    options: string[]
  ) => {
    const currentValues = draftFilters[section] as string[];
    let nextValues: string[];

    if (currentValues.includes('')) {
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
      [section]: nextValues.length === options.length ? [''] : nextValues,
    }));
  };

  const selectNetwork = (networkId: number) => {
    setDraftFilters((previous) => ({
      ...previous,
      network: networkId,
    }));
  };

  const handleOpen = () => {
    setDraftFilters(appliedFilters);
    setIsDrawerOpen(true);
  };

  const handleClose = () => {
    setDraftFilters(appliedFilters);
    setIsDrawerOpen(false);
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    let _filtersCount = 0;

    if (draftFilters.campaignTypes.includes('')) {
      _filtersCount += campaignTypeOptions.length;
    } else {
      _filtersCount += draftFilters.campaignTypes.length;
    }

    if (draftFilters.exchanges.includes('')) {
      _filtersCount += exchangeOptions.length;
    } else {
      _filtersCount += draftFilters.exchanges.length;
    }

    handleApplyFilters(draftFilters);
    setFiltersCount(_filtersCount);
    setIsDrawerOpen(false);
  };

  return (
    <>
      <Box
        component="button"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
        bgcolor="background.default"
        width={42}
        height={42}
        border="1px solid #251d47"
        borderRadius="100%"
        flexShrink={0}
        disabled={isDisabled}
        sx={{ cursor: isDisabled ? 'default' : 'pointer' }}
        onClick={handleOpen}
      >
        <FilterIcon />
        {filtersCount > 0 && (
          <FiltersCountStyled>{filtersCount}</FiltersCountStyled>
        )}
      </Box>
      <Drawer
        open={isDrawerOpen}
        onClose={handleClose}
        anchor="bottom"
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(7px)',
              background: 'rgba(0, 0, 0, 0.3)',
            },
          },
          paper: {
            elevation: 0,
            sx: {
              py: 2,
              bgcolor: '#251d47',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              border: 'none',
              maxHeight: '75dvh',
            },
          },
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{ position: 'absolute', top: 16, right: 16, p: 0 }}
        >
          <CloseIcon sx={{ color: 'white' }} />
        </IconButton>
        <Box
          component="form"
          display="flex"
          flexDirection="column"
          maxHeight="100%"
          minHeight={0}
          onSubmit={handleSubmit}
        >
          <Typography
            variant="h6"
            component="h6"
            color="white"
            lineHeight={1}
            ml={2}
            mb={3}
          >
            Campaign Filters
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            flex={1}
            pt={2}
            minHeight={0}
            overflow="auto"
            gap={2}
          >
            <Stack gap={1} px={2}>
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
                          bgcolor="#FA2A75"
                        >
                          <CheckIcon sx={{ color: '#ffffff', fontSize: 16 }} />
                        </Box>
                      }
                    />
                  }
                  onChange={() => selectNetwork(value)}
                />
              ))}
            </Stack>
            <Divider sx={{ borderColor: '#3a2e6f' }} />
            <Stack gap={1} px={2}>
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
                onChange={() => toggleAll('campaignTypes')}
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
                  onChange={() =>
                    toggleOption(
                      'campaignTypes',
                      value,
                      campaignTypeOptions.map((option) => option.value)
                    )
                  }
                />
              ))}
            </Stack>
            <Divider sx={{ borderColor: '#3a2e6f' }} />
            <Stack gap={1} px={2} pb={3}>
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
                onChange={() => toggleAll('exchanges')}
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
                  onChange={() =>
                    toggleOption(
                      'exchanges',
                      value,
                      exchangeOptions.map((option) => option.value)
                    )
                  }
                />
              ))}
            </Stack>
          </Box>
          <Box
            display="flex"
            borderTop="1px solid #3a2e6f"
            pt={3}
            pb={1}
            px={2}
          >
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disableRipple
              sx={{ bgcolor: '#fa2a75', color: 'white', boxShadow: 'none' }}
            >
              Apply filters
            </Button>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default CampaignsFilters;
