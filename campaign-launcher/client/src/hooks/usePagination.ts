import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_CAMPAIGNS_QUERY_LIMIT,
  DEFAULT_CAMPAIGNS_QUERY_LIMIT_MOBILE,
} from '@/constants';

import { useIsMobile } from './useBreakpoints';

type PaginationState = {
  params: {
    limit: number;
    skip: number;
  };
  pagination: {
    page: number;
    pageSize: number;
  };
  resetPage: () => void;
  setNextPage: () => void;
  setPrevPage: () => void;
};

const usePagination = (): PaginationState => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(
    isMobile
      ? DEFAULT_CAMPAIGNS_QUERY_LIMIT_MOBILE
      : DEFAULT_CAMPAIGNS_QUERY_LIMIT
  );

  const skip = page * pageSize;

  useEffect(() => {
    if (isMobile) {
      setPageSize(DEFAULT_CAMPAIGNS_QUERY_LIMIT_MOBILE);
    } else {
      setPageSize(DEFAULT_CAMPAIGNS_QUERY_LIMIT);
    }
  }, [isMobile]);

  const setNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const setPrevPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(0);
  }, []);

  return {
    params: {
      limit: pageSize,
      skip,
    },
    pagination: {
      page,
      pageSize,
    },
    resetPage,
    setNextPage,
    setPrevPage,
  };
};

export default usePagination;
