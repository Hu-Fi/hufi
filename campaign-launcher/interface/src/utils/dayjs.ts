/* eslint-disable import/no-named-as-default-member */
import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(dayjsDuration);
dayjs.extend(utc);

export default dayjs;
