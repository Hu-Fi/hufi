import { useEffect, useMemo, useState } from 'react';

import dayjs from '@/utils/dayjs';

export const useCycleTimeline = (startDate: string, endDate: string) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const cycleTimeInfo = useMemo(() => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const nowDate = dayjs(now);

    const totalCycles = Math.ceil(end.diff(start, 'day', true));
    const fullCyclesPassed = nowDate.diff(start, 'day', false);
    const currentCycle = Math.min(totalCycles, fullCyclesPassed + 1);
    const cycleEndCandidate = start.add(currentCycle, 'day');
    const currentCycleEnd = cycleEndCandidate.isBefore(end)
      ? cycleEndCandidate
      : end;
    const remainingMs = Math.max(0, currentCycleEnd.diff(nowDate));

    return {
      currentCycle,
      totalCycles,
      remainingTime: dayjs
        .duration(Math.max(0, remainingMs))
        .format('HH[h]:mm[m]:ss[s]'),
    };
  }, [startDate, endDate, now]);

  return cycleTimeInfo;
};
