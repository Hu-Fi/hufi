import { useContext } from 'react';

import { NotificationContext } from '@/providers';

export const useNotification = () => {
  const { setNotification, clearNotification } =
    useContext(NotificationContext);

  return { setNotification, clearNotification };
};
