import {
  createContext,
  useContext,
  type FC,
  type PropsWithChildren,
} from 'react';

import {
  useGetEnrolledExchanges,
  useJoinedCampaigns,
} from '@/hooks/recording-oracle';
import { type Campaign, CampaignStatus } from '@/types';

import { useNetwork } from './NetworkProvider';

type AuthedUserDataContextType = {
  joinedCampaigns: { results: Campaign[]; has_more: boolean } | undefined;
  isJoinedCampaignsLoading: boolean;
  enrolledExchanges: string[] | undefined;
  isEnrolledExchangesLoading: boolean;
};

const AuthedUserDataContext = createContext<AuthedUserDataContextType>(
  {} as AuthedUserDataContextType
);

export const AuthedUserDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const { appChainId } = useNetwork();

  const { data: enrolledExchanges, isLoading: isEnrolledExchangesLoading } =
    useGetEnrolledExchanges();

  const { data: joinedCampaigns, isLoading: isJoinedCampaignsLoading } =
    useJoinedCampaigns({
      status: CampaignStatus.ACTIVE,
      limit: 100,
      chain_id: appChainId,
    });

  return (
    <AuthedUserDataContext.Provider
      value={{
        enrolledExchanges,
        isEnrolledExchangesLoading,
        joinedCampaigns,
        isJoinedCampaignsLoading,
      }}
    >
      {children}
    </AuthedUserDataContext.Provider>
  );
};

export const useAuthedUserData = () => {
  const context = useContext(AuthedUserDataContext);
  if (!context) {
    throw new Error(
      'useAuthedUserData must be used within an AuthedUserDataProvider'
    );
  }
  return context;
};
