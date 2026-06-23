import { useEffect, useMemo, useState, type FC } from 'react';

import { Stack, Typography } from '@mui/material';
import isEqual from 'lodash/isEqual';

import AutojoinPreferences from '@/components/AutojoinPreferences';
import NotificationPreferences from '@/components/NotificationPreferences';
import PageErrorState from '@/components/PageErrorState';
import PageWrapper from '@/components/PageWrapper';
import UnsavedPreferencesBar from '@/components/UnsavedPreferencesBar';
import { SHOW_AUTOJOIN_WIDGET_KEY } from '@/constants';
import {
  useGetUserInfo,
  usePatchUserPreferences,
} from '@/hooks/recording-oracle/user';
import { useNotification } from '@/hooks/useNotification';
import type { PatchPreferencesDto, UserPreferences } from '@/types';

type SectionKey = keyof UserPreferences;

const ignoredDirtySections = new Set<SectionKey>(['telegram_user_id']);

const PreferencesPage: FC = () => {
  const [draftPreferences, setDraftPreferences] =
    useState<UserPreferences | null>(null);
  const [isPreferencesLoading, setIsPreferencesLoading] = useState(true);
  const [dirtySections, setDirtySections] = useState<Set<SectionKey>>(
    new Set()
  );

  const {
    data: userInfo,
    isLoading: isLoadingUserInfo,
    isError,
    refetch,
  } = useGetUserInfo();
  const { mutateAsync: savePreferences, isPending: isSavingPreferences } =
    usePatchUserPreferences();
  const { showError } = useNotification();

  const hasUnsavedChanges = dirtySections.size > 0;

  useEffect(() => {
    if (!isLoadingUserInfo && userInfo) {
      setDraftPreferences(userInfo.preferences);
      setIsPreferencesLoading(false);
      setDirtySections(new Set());

      const { enabled } = userInfo.preferences.campaigns_autojoin;
      const showAutojoinWidget =
        localStorage.getItem(SHOW_AUTOJOIN_WIDGET_KEY) !== 'false';
      if (enabled && showAutojoinWidget) {
        localStorage.setItem(SHOW_AUTOJOIN_WIDGET_KEY, 'false');
      }
    }
  }, [isLoadingUserInfo, userInfo]);

  const isAbleToSaveAutojoinPreferences = useMemo(() => {
    const autojoin = draftPreferences?.campaigns_autojoin;

    return autojoin?.enabled
      ? [autojoin.campaign_types, autojoin.exchanges, autojoin.tokens].every(
          (items) => items.length > 0
        )
      : true;
  }, [draftPreferences]);

  const handleChangePreferenceSection = (
    section: SectionKey,
    value: UserPreferences[SectionKey]
  ) => {
    if (!userInfo) {
      return;
    }

    setDirtySections((previousDirtySections) => {
      const _dirtySections = new Set(previousDirtySections);
      const initialValue = userInfo.preferences[section];

      if (isEqual(initialValue, value)) {
        _dirtySections.delete(section);
      } else if (!ignoredDirtySections.has(section)) {
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
        [section]: value,
      };
    });
  };

  const handleTelegramUnlinked = () => {
    setDirtySections((prevValue) => {
      const nextValue = new Set(prevValue);
      nextValue.delete('notifications');
      return nextValue;
    });
  };

  const handleDiscardChanges = () => {
    if (!userInfo) return;

    setDraftPreferences({
      ...userInfo.preferences,
      telegram_user_id: draftPreferences?.telegram_user_id ?? null,
    });
    setDirtySections(new Set());
  };

  const handleSaveChanges = async () => {
    if (!draftPreferences || dirtySections.size === 0) {
      return;
    }

    if (!isAbleToSaveAutojoinPreferences) {
      return;
    }

    const payload: PatchPreferencesDto = {};

    dirtySections.forEach((section) => {
      Object.assign(payload, { [section]: draftPreferences[section] });
    });

    try {
      await savePreferences(payload);
    } catch (error) {
      console.error(error);
      showError('Failed to save preferences. Please try again.');
    }
  };

  return (
    <PageWrapper>
      <Typography
        component="h2"
        variant="h5"
        sx={{
          color: 'neutral.100',
          mb: 1.5,
        }}
      >
        Preferences
      </Typography>
      <Typography variant="body3" sx={{ color: 'secondary.100' }}>
        Configure your account defaults and automation settings. Changes apply
        to your connected wallet.
      </Typography>
      <Stack sx={{ width: '100%', mt: 4, gap: 4 }}>
        {isError && (
          <PageErrorState
            description="We couldn't load preferences right now. This is on our end, please try again in a moment."
            onRefetch={refetch}
          />
        )}
        {!isError && (
          <>
            <AutojoinPreferences
              preferences={draftPreferences?.campaigns_autojoin ?? null}
              onSectionChange={handleChangePreferenceSection}
              isPreferencesLoading={isPreferencesLoading}
              isSavingPreferences={isSavingPreferences}
            />
            <NotificationPreferences
              preferences={draftPreferences?.notifications ?? null}
              telegramUserId={draftPreferences?.telegram_user_id ?? null}
              onSectionChange={handleChangePreferenceSection}
              onUnlinkTelegram={handleTelegramUnlinked}
              isPreferencesLoading={isPreferencesLoading}
              isSavingPreferences={isSavingPreferences}
            />
          </>
        )}
      </Stack>
      <UnsavedPreferencesBar
        onDiscardChanges={handleDiscardChanges}
        onSaveChanges={handleSaveChanges}
        isSavingPreferences={isSavingPreferences}
        isSaveEnabled={isAbleToSaveAutojoinPreferences}
        isVisible={hasUnsavedChanges}
      />
    </PageWrapper>
  );
};

export default PreferencesPage;
