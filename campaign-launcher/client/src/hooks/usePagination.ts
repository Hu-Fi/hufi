import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_TABLE_PAGE_SIZE,
  DEFAULT_TABLE_PAGE_SIZE_MOBILE,
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
  setNextPage: () => void;
  setPrevPage: () => void;
  setPageSize: (pageSize: number) => void;
};

const usePagination = (): PaginationState => {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(
    isMobile ? DEFAULT_TABLE_PAGE_SIZE_MOBILE : DEFAULT_TABLE_PAGE_SIZE
  );

  const skip = page * pageSize;

  useEffect(() => {
    if (isMobile) {
      setPageSize(DEFAULT_TABLE_PAGE_SIZE_MOBILE);
    } else {
      setPageSize(DEFAULT_TABLE_PAGE_SIZE);
    }
  }, [isMobile]);

  const setNextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const setPrevPage = useCallback(() => {
    setPage((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
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
    setNextPage,
    setPrevPage,
    setPageSize: handleSetPageSize,
  };
};

export default usePagination;
