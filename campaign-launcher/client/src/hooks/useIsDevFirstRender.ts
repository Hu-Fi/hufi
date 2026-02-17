import { useEffect, useState } from 'react';

const useIsDevFirstRender = () => {
  const [isDevFirstRender, setIsDevFirstRender] = useState(import.meta.env.DEV);

  useEffect(() => {
    if (isDevFirstRender) {
      setIsDevFirstRender(false);
    }
  }, [isDevFirstRender]);

  return isDevFirstRender;
};

export default useIsDevFirstRender;
