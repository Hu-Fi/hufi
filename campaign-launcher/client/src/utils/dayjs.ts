import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(dayjsDuration);
dayjs.extend(updateLocale);

dayjs.updateLocale('en', {
  weekStart: 1,
});

export default dayjs;
