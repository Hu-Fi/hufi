import { FC } from 'react';

import { CreateCampaign } from './pages/create-campaign';
import { Main } from './pages/main';
import { StakeHMT } from './pages/stake-hmt';

interface Route {
  key: string;
  title: string;
  path: string;
  component: FC;
}

export const PATHS = {
  MAIN: '/',
  CREATE_CAMPAIGN: '/create-campaign',
  STAKE_HMT: '/stake-hmt',
};

export const ROUTES: Array<Route> = [
  {
    key: 'main',
    title: 'Home',
    path: PATHS.MAIN,
    component: Main,
  },
  {
    key: 'create-campaign',
    title: 'Create a campaign',
    path: PATHS.CREATE_CAMPAIGN,
    component: CreateCampaign,
  },
  {
    key: 'stake',
    title: 'Stake HMT',
    path: PATHS.STAKE_HMT,
    component: StakeHMT,
  },
];
