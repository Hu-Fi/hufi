import { type FC } from 'react';

import { Stack, Typography } from '@mui/material';
import {
  type Control,
  type FieldErrors,
  type UseFormTrigger,
  type UseFormWatch,
} from 'react-hook-form';

import { type CompetitiveMmFormValues, type CampaignType } from '@/types';

type Props = {
  control: Control<CompetitiveMmFormValues>;
  errors: FieldErrors<CompetitiveMmFormValues>;
  watch: UseFormWatch<CompetitiveMmFormValues>;
  trigger: UseFormTrigger<CompetitiveMmFormValues>;
  campaignType: CampaignType;
};

const CompetitiveMarketMakingForm: FC<Props> = () => {
  return (
    <Stack>
      <Typography variant="h6">Competitive Market Making</Typography>
    </Stack>
  );
};

export default CompetitiveMarketMakingForm;
