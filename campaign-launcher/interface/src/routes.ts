import { FC } from 'react';

import { CreateCampaign } from '@/pages/create-campaign';
import { Main } from '@/pages/main';
import { StakeHMT } from '@/pages/stake-hmt';

interface Route {
  key: string;
  title: string;
  path: string;
  component: FC;
}

export const routes: Array<Route> = [
  {
    key: 'main',
    title: 'Main',
    path: '/',
    component: Main,
  },
  {
    key: 'create-campaign',
    title: 'Create a campaign',
    path: '/create-campaign',
    component: CreateCampaign,
  },
  {
    key: 'stake',
    title: 'Stake HMT',
    path: '/stake-hmt',
    component: StakeHMT,
  },
];
