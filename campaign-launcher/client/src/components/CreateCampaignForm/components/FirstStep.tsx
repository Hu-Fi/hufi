import { type FC } from 'react';

import StarIcon from '@mui/icons-material/Star';
import { Box, Paper, Stack, Typography } from '@mui/material';

import {
  type CampaignFormValues,
  CampaignType,
  CampaignTypeNames,
} from '@/types';

import { getFormDefaultValues } from '../utils';

import { BottomNavigation } from './';

type Props = {
  formValues: CampaignFormValues | null;
  setFormValues: (values: CampaignFormValues) => void;
  handleChangeStep: (step: number) => void;
};

const CAMPAIGN_TYPE_DESCRIPTIONS = {
  [CampaignType.MARKET_MAKING]: 'Allows you to make markets on a pair.',
  [CampaignType.HOLDING]:
    'Allows you to hold a token for a certain period of time.',
  [CampaignType.THRESHOLD]: 'Allows you to reach a threshold of a token.',
};

const FirstStep: FC<Props> = ({
  formValues,
  setFormValues,
  handleChangeStep,
}) => {
  const handleChangeCampaignType = (type: CampaignType) => {
    const defaultValues = getFormDefaultValues(type);

    setFormValues({
      ...defaultValues,
      type: type,
    } as CampaignFormValues);
  };

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems="center"
        flexWrap="wrap"
        gap={3}
        mt={{ xs: 0, md: 4 }}
      >
        {Object.values(CampaignType).map((type) => (
          <Paper
            key={type}
            elevation={24}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: { xs: '130px', md: '160px' },
              width: { xs: '100%', md: 'calc((100% - 48px) / 3)' },
              py: 2,
              px: 3,
              borderRadius: 2,
              bgcolor: 'background.default',
              boxShadow: 'none',
              border: '1px solid',
              borderColor:
                formValues?.type === type ? 'primary.main' : 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => handleChangeCampaignType(type)}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              mb={{ xs: 2, md: 6 }}
            >
              <StarIcon sx={{ color: 'primary.main', width: 24, height: 24 }} />
              <Typography variant="h6" fontWeight={600}>
                {CampaignTypeNames[type]}
              </Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              {CAMPAIGN_TYPE_DESCRIPTIONS[type]}
            </Typography>
          </Paper>
        ))}
      </Stack>
      <BottomNavigation
        step={1}
        handleNextClick={() => handleChangeStep(2)}
        disableNextButton={!formValues?.type}
      />
    </>
  );
};

export default FirstStep;
