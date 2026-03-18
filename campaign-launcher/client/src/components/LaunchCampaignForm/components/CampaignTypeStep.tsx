import { type SetStateAction, type Dispatch, type FC } from 'react';

import StarIcon from '@mui/icons-material/Star';
import { Box, Grid, Paper, Stack, Typography } from '@mui/material';

import {
  type CampaignFormValues,
  CampaignType,
  CampaignTypeNames,
} from '@/types';

import { getFormDefaultValues } from '../utils';

import { BottomNavigation } from '.';

type Props = {
  formValues: CampaignFormValues | null;
  setFormValues: (values: CampaignFormValues) => void;
  handleChangeStep: Dispatch<SetStateAction<number>>;
};

const CAMPAIGN_TYPE_DESCRIPTIONS = {
  [CampaignType.MARKET_MAKING]:
    'Allows you to generate trading activity on a pair.',
  [CampaignType.HOLDING]:
    'Requires market makers to collectively maintain a specified amount of a particular token.',
  [CampaignType.THRESHOLD]:
    'Requires market makers to maintain a minimum balance of a specified token.',
};

const CampaignTypeStep: FC<Props> = ({
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
      <Stack mt={4} width="100%" gridArea="main">
        <Grid container spacing={3}>
          {Object.values(CampaignType).map((type) => {
            const isSelected = formValues?.type === type;
            return (
              <Grid size={{ xs: 12, md: 6 }} key={type}>
                <Paper
                  elevation={0}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    py: 2,
                    px: 3,
                    height: { xs: 150, md: 170 },
                    borderRadius: '8px',
                    bgcolor: '#251d47',
                    border: '1px solid',
                    borderColor: isSelected ? 'error.main' : '#433679',
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
                    <Typography variant="h6" color="white" fontWeight={600}>
                      {CampaignTypeNames[type]}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {CAMPAIGN_TYPE_DESCRIPTIONS[type]}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
      <BottomNavigation
        handleBackClick={() => handleChangeStep((prev) => prev - 1)}
        handleNextClick={() => handleChangeStep((prev) => prev + 1)}
        disableNextButton={!formValues?.type}
      />
    </>
  );
};

export default CampaignTypeStep;
