import { useEffect, useState, type FC } from 'react';

import { Stack, Typography } from '@mui/material';
import isEqual from 'lodash/isEqual';

import AutojoinPreferences from '@/components/AutojoinPreferences';
import PageWrapper from '@/components/PageWrapper';
import UnsavedPreferencesBar from '@/components/UnsavedPreferencesBar';
import {
  useGetUserInfo,
  usePatchUserPreferences,
} from '@/hooks/recording-oracle/user';
import { type PatchPreferencesDto, type Preferences } from '@/types';

const PreferencesPage: FC = () => {
  const [draftPreferences, setDraftPreferences] = useState<Preferences | null>(
    null
  );
  const [dirtySections, setDirtySections] = useState<Set<keyof Preferences>>(
    new Set()
  );

  const { data: userInfo, isLoading: isLoadingUserInfo } = useGetUserInfo();
  const { mutate: savePreferences, isPending: isSavingPreferences } =
    usePatchUserPreferences();

  const hasUnsavedChanges = dirtySections.size > 0;

  useEffect(() => {
    if (!isLoadingUserInfo && userInfo) {
      setDraftPreferences(userInfo.preferences);
      setDirtySections(new Set());
    }
  }, [isLoadingUserInfo, userInfo]);

  const handleChangePreferenceSection = <TSection extends keyof Preferences>(
    section: TSection,
    value: Preferences[TSection]
  ) => {
    if (!userInfo) {
      return;
    }

    setDirtySections((previousDirtySections) => {
      const _dirtySections = new Set(previousDirtySections);
      const initialValue = userInfo.preferences[section];

      if (isEqual(initialValue, value)) {
        _dirtySections.delete(section);
      } else {
        _dirtySections.add(section);
      }

      return _dirtySections;
    });

    setDraftPreferences((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        [section]: {
          ...previous[section],
          ...value,
        },
      };
    });
  };

  const handleDiscardChanges = () => {
    setDraftPreferences(userInfo?.preferences ?? null);
    setDirtySections(new Set());
  };

  const handleSaveChanges = () => {
    if (!draftPreferences || dirtySections.size === 0) {
      return;
    }

    const payload: PatchPreferencesDto = {};

    dirtySections.forEach((section) => {
      payload[section] = draftPreferences[section];
    });

    savePreferences(payload);
  };

  return (
    <PageWrapper>
      <Typography
        component="h2"
        variant="h6"
        sx={{
          color: 'white',
          fontWeight: 700,
          lineHeight: '150%',
          mb: 1.5,
        }}
      >
        Preferences
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 400, color: '#6b6490' }}>
        Configure your account defaults and automation settings. Changes apply
        to your connected wallet.
      </Typography>
      <Stack
        sx={{ width: '100%', mt: 4, pb: { xs: '120px', md: '84px' }, gap: 4 }}
      >
        <AutojoinPreferences
          preferences={draftPreferences?.campaigns_autojoin ?? null}
          onSectionChange={handleChangePreferenceSection}
          isUserInfoLoading={isLoadingUserInfo}
        />
      </Stack>
      {hasUnsavedChanges && (
        <UnsavedPreferencesBar
          onDiscardChanges={handleDiscardChanges}
          onSaveChanges={handleSaveChanges}
          isSavingPreferences={isSavingPreferences}
        />
      )}
    </PageWrapper>
  );
};

export default PreferencesPage;
