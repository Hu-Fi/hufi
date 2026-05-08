import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ApiController,
  AssetUtil,
  ChainController,
  ConnectionController,
  ConnectorController,
  ConnectorControllerUtil,
  ConnectorUtil,
  WalletUtil,
  type ConnectorOrWalletItem,
} from '@reown/appkit-controllers';

import { WALLET_PAGE_SIZE } from '@/constants';

export type WalletOption = {
  id: string;
  imageUrl: string;
  item: ConnectorOrWalletItem;
  name: string;
};

const getWalletImage = (item: ConnectorOrWalletItem) => {
  if (item.kind === 'wallet') {
    return (
      AssetUtil.getWalletImage(item.wallet) ||
      AssetUtil.getWalletImageUrl(item.wallet.image_id)
    );
  }

  return (
    item.connector.imageUrl ||
    item.connector.info?.icon ||
    AssetUtil.getConnectorImage(item.connector) ||
    AssetUtil.getAssetImageUrl(item.connector.imageId)
  );
};

const mapWalletOption = (item: ConnectorOrWalletItem): WalletOption => {
  if (item.kind === 'wallet') {
    return {
      id: item.wallet.id,
      imageUrl: getWalletImage(item),
      item,
      name: item.wallet.name,
    };
  }

  return {
    id: item.connector.id,
    imageUrl: getWalletImage(item),
    item,
    name: item.connector.name,
  };
};

const getInitialWallets = () =>
  ConnectorUtil.connectorList().map(mapWalletOption);

const getWalletConnectWallets = () =>
  WalletUtil.getWalletConnectWallets(ApiController.state.wallets).map(
    (wallet) =>
      mapWalletOption({ kind: 'wallet', subtype: 'recommended', wallet })
  );

const mapRemoteWallets = (
  wallets: Parameters<typeof WalletUtil.getWalletConnectWallets>[0]
) =>
  wallets.map((wallet) =>
    mapWalletOption({ kind: 'wallet', subtype: 'recommended', wallet })
  );

const normalizeSearchValue = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const searchWallets = (walletOptions: WalletOption[], searchValue: string) => {
  const normalizedSearch = normalizeSearchValue(searchValue);

  if (!normalizedSearch) {
    return walletOptions;
  }

  return walletOptions.filter((wallet) =>
    normalizeSearchValue(wallet.name).includes(normalizedSearch)
  );
};

const mergeWalletOptions = (walletOptions: WalletOption[]) => {
  const uniqueWallets = new Map<string, WalletOption>();

  walletOptions.forEach((wallet) => {
    const key =
      normalizeSearchValue(wallet.name) || `${wallet.item.kind}-${wallet.id}`;

    if (!uniqueWallets.has(key)) {
      uniqueWallets.set(key, wallet);
    }
  });

  return [...uniqueWallets.values()];
};

export const useReownWalletOptions = ({
  open,
  search,
  showAllWallets,
}: {
  open: boolean;
  search: string;
  showAllWallets: boolean;
}) => {
  const [wallets, setWallets] = useState(getInitialWallets);
  const [wcWallets, setWcWallets] = useState(getWalletConnectWallets);
  const [remoteSearchWallets, setRemoteSearchWallets] = useState<
    WalletOption[]
  >([]);
  const [count, setCount] = useState(ApiController.state.count);
  const [page, setPage] = useState(ApiController.state.page);
  const [wcUri, setWcUri] = useState(ConnectionController.state.wcUri);
  const [isFetchingWallets, setIsFetchingWallets] = useState(false);
  const [isFetchingWcUri, setIsFetchingWcUri] = useState(
    ConnectionController.state.wcFetchingUri
  );
  const [connectingWallet, setConnectingWallet] = useState<WalletOption | null>(
    null
  );
  const searchRequestIdRef = useRef(0);

  useEffect(() => {
    const updateInitialWallets = () => setWallets(getInitialWallets());
    const updateWcWallets = () => setWcWallets(getWalletConnectWallets());

    const unsubscribers = [
      ConnectorController.subscribeKey('connectors', updateInitialWallets),
      ApiController.subscribeKey('recommended', updateInitialWallets),
      ApiController.subscribeKey('wallets', updateWcWallets),
      ApiController.subscribeKey('count', setCount),
      ApiController.subscribeKey('page', setPage),
      ConnectionController.subscribeKey('wcUri', setWcUri),
      ConnectionController.subscribeKey('wcFetchingUri', setIsFetchingWcUri),
    ];

    updateInitialWallets();
    updateWcWallets();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    setIsFetchingWallets(true);
    void Promise.allSettled([
      ApiController.fetchRecommendedWallets(),
      ApiController.fetchWalletsByPage({ entries: WALLET_PAGE_SIZE, page: 1 }),
    ]).finally(() => setIsFetchingWallets(false));
  }, [open]);

  useEffect(() => {
    if (!open || !showAllWallets) return;

    const timeout = window.setTimeout(() => {
      const searchValue = search.trim();
      setIsFetchingWallets(true);
      searchRequestIdRef.current += 1;
      const requestId = searchRequestIdRef.current;

      const fetchPromise = searchValue
        ? ApiController.fetchWallets({
            chains: ChainController.getRequestedCaipNetworkIds().join(','),
            entries: WALLET_PAGE_SIZE,
            page: 1,
            search: searchValue,
          }).then(({ data }) => {
            if (requestId === searchRequestIdRef.current) {
              setRemoteSearchWallets(mapRemoteWallets(data));
            }
          })
        : ApiController.fetchWalletsByPage({
            entries: WALLET_PAGE_SIZE,
            page: 1,
          }).then(() => {
            if (requestId === searchRequestIdRef.current) {
              setRemoteSearchWallets([]);
            }
          });

      void fetchPromise.finally(() => {
        if (requestId === searchRequestIdRef.current) {
          setIsFetchingWallets(false);
        }
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [open, search, showAllWallets]);

  const displayedWallets = useMemo(() => {
    if (showAllWallets) {
      const searchValue = search.trim();

      return mergeWalletOptions([
        ...searchWallets(wallets, searchValue),
        ...(searchValue ? remoteSearchWallets : wcWallets),
      ]);
    }

    return wallets;
  }, [remoteSearchWallets, search, showAllWallets, wallets, wcWallets]);

  const resetWalletConnect = useCallback(() => {
    ConnectionController.resetUri();
    ConnectionController.setWcLinking(undefined);
    ConnectionController.setRecentWallet(undefined);
    setConnectingWallet(null);
  }, []);

  const connectWallet = useCallback(
    async (wallet: WalletOption) => {
      resetWalletConnect();
      setConnectingWallet(wallet);

      try {
        if (
          wallet.item.kind === 'connector' &&
          wallet.item.subtype !== 'walletConnect'
        ) {
          await ConnectorControllerUtil.connectExternal(wallet.item.connector);
          return;
        }

        if (wallet.item.kind === 'wallet') {
          ConnectionController.setRecentWallet(wallet.item.wallet);
        }

        await ConnectionController.connectWalletConnect({ cache: 'never' });
      } catch {
        setConnectingWallet(null);
      }
    },
    [resetWalletConnect]
  );

  const resetSearch = useCallback(() => {
    setRemoteSearchWallets([]);
  }, []);

  const fetchMoreWallets = useCallback(() => {
    setIsFetchingWallets(true);
    void ApiController.fetchWalletsByPage({
      entries: WALLET_PAGE_SIZE,
      page: page + 1,
    }).finally(() => setIsFetchingWallets(false));
  }, [page]);

  const totalFetched = page * WALLET_PAGE_SIZE;
  const hasMoreWallets = showAllWallets && totalFetched < count;

  return {
    connectingWallet,
    connectWallet,
    displayedWallets,
    fetchMoreWallets,
    hasMoreWallets,
    isFetchingWallets,
    isFetchingWcUri,
    resetSearch,
    resetWalletConnect,
    wcUri,
  };
};
