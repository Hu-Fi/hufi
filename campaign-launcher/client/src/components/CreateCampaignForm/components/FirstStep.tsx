import { type FC } from 'react';

import StarIcon from '@mui/icons-material/Star';
import { Box, Grid, Paper, Typography } from '@mui/material';

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
  [CampaignType.MARKET_MAKING]:
    'Allows you to generate trading activity on a pair.',
  [CampaignType.HOLDING]:
    'Requires market makers to collectively maintain a specified amount of a particular token.',
  [CampaignType.THRESHOLD]:
    'Requires market makers to maintain a minimum balance of a specified token.',
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
      type,
    } as CampaignFormValues);
  };

  return (
    <>
      <Grid container spacing={3} mt={{ xs: 0, md: 4 }}>
        {Object.values(CampaignType).map((type) => (
          <Grid size={{ xs: 12, md: 4 }} key={type}>
            <Paper
              key={type}
              elevation={24}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: 160,
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
                mb={{ xs: 2, md: 1, lg: 4 }}
              >
                <StarIcon
                  sx={{ color: 'primary.main', width: 24, height: 24 }}
                />
                <Typography variant="h6" fontWeight={600}>
                  {CampaignTypeNames[type]}
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                {CAMPAIGN_TYPE_DESCRIPTIONS[type]}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <BottomNavigation
        step={1}
        handleNextClick={() => handleChangeStep(2)}
        disableNextButton={!formValues?.type}
      />
    </>
  );
};

export default FirstStep;
