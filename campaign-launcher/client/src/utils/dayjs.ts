import dayjs from 'dayjs';
import dayjsDuration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(dayjsDuration);

export default dayjs;
