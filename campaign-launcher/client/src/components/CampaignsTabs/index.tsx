import { type FC, useCallback, useEffect, useRef } from 'react';

import { Box, Stack, styled } from '@mui/material';

import { useIsMobile } from '@/hooks/useBreakpoints';
import { CampaignsTabFilter as TabFilter } from '@/types';

const TabFilterStyled = styled('button')<{ isActive: boolean }>(
  ({ isActive, theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 42,
    color: 'white',
    fontSize: 16,
    fontWeight: 500,
    borderRadius: '40px',
    backgroundColor: isActive ? '#251D47' : theme.palette.background.default,
    border: isActive ? '1px solid #FA2A75' : '1px solid #433679',
    cursor: 'pointer',
  })
);

const GradientBox = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 42,
  width: 100,
  height: 42,
  background: 'linear-gradient(90deg, rgba(16, 7, 53, 0) 0%, #100735 100%)',
  transition: 'display 0.3s ease-in-out',
  cursor: 'pointer',
});

type Props = {
  activeTab: TabFilter;
  setActiveTab: (tab: TabFilter) => void;
  isDisabled: boolean;
};

const CampaignsTabs: FC<Props> = ({ activeTab, setActiveTab, isDisabled }) => {
  const filtersScrollRef = useRef<HTMLDivElement | null>(null);
  const gradientRef = useRef<HTMLDivElement | null>(null);

  const isMobile = useIsMobile();

  const updateGradientVisibility = useCallback(() => {
    const container = filtersScrollRef.current;
    const gradient = gradientRef.current;

    if (!container || !gradient) {
      return;
    }

    const NEAR_END_THRESHOLD_PX = 12;
    const hasOverflow = container.scrollWidth > container.clientWidth;
    const isNearEnd =
      container.scrollLeft + container.clientWidth >=
      container.scrollWidth - NEAR_END_THRESHOLD_PX;

    gradient.style.display = hasOverflow && !isNearEnd ? 'block' : 'none';
  }, []);

  useEffect(() => {
    updateGradientVisibility();
    window.addEventListener('resize', updateGradientVisibility);

    return () => {
      window.removeEventListener('resize', updateGradientVisibility);
    };
  }, [updateGradientVisibility]);

  return (
    <>
      <Box
        ref={filtersScrollRef}
        onScroll={updateGradientVisibility}
        sx={{
          display: 'flex',
          flexGrow: isMobile ? 1 : 0,
          minWidth: 0,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        <Stack
          direction="row"
          sx={{
            gap: 1.5,
            whiteSpace: 'nowrap',
          }}
        >
          <TabFilterStyled
            disabled={isDisabled}
            isActive={activeTab === TabFilter.ACTIVE}
            onClick={() => setActiveTab(TabFilter.ACTIVE)}
          >
            Active
          </TabFilterStyled>
          <TabFilterStyled
            disabled={isDisabled}
            isActive={activeTab === TabFilter.JOINED}
            onClick={() => setActiveTab(TabFilter.JOINED)}
          >
            Joined
          </TabFilterStyled>
          <TabFilterStyled
            disabled={isDisabled}
            isActive={activeTab === TabFilter.HOSTED}
            onClick={() => setActiveTab(TabFilter.HOSTED)}
          >
            Hosted
          </TabFilterStyled>
          <TabFilterStyled
            disabled={isDisabled}
            isActive={activeTab === TabFilter.HISTORY}
            onClick={() => setActiveTab(TabFilter.HISTORY)}
          >
            History
          </TabFilterStyled>
        </Stack>
      </Box>
      <GradientBox ref={gradientRef} />
    </>
  );
};

export default CampaignsTabs;
