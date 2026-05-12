import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ApiController,
  AssetUtil,
  ChainController,
  ConnectionController,
  ConnectorController,
  ConnectorControllerUtil,
  ConnectorUtil,
  type WalletUtil,
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
  search,
  showAllWallets,
}: {
  search: string;
  showAllWallets: boolean;
}) => {
  const [wallets, setWallets] = useState(getInitialWallets);
  const [wcWallets, setWcWallets] = useState<WalletOption[]>([]);
  const [wcWalletsCount, setWcWalletsCount] = useState(0);
  const [wcWalletsPage, setWcWalletsPage] = useState(1);
  const [wcUri, setWcUri] = useState(ConnectionController.state.wcUri);
  const [isFetchingWallets, setIsFetchingWallets] = useState(false);
  const [isFetchingWcUri, setIsFetchingWcUri] = useState(
    ConnectionController.state.wcFetchingUri
  );
  const [connectingWallet, setConnectingWallet] = useState<WalletOption | null>(
    null
  );
  const [appliedSearchValue, setAppliedSearchValue] = useState('');

  const searchRequestIdRef = useRef(0);

  const fetchWcWallets = useCallback(
    async (_page: number, _searchValue: string) => {
      return ApiController.fetchWallets({
        chains: ChainController.getRequestedCaipNetworkIds().join(','),
        entries: WALLET_PAGE_SIZE,
        search: _searchValue,
        page: _page,
      }).then(({ data, count }) => {
        const mappedWallets = mapRemoteWallets(data);
        setWcWallets((prevWallets) =>
          _page === 1 ? mappedWallets : [...prevWallets, ...mappedWallets]
        );
        setWcWalletsCount(count);
      });
    },
    []
  );

  useEffect(() => {
    const updateInitialWallets = () => setWallets(getInitialWallets());

    const unsubscribers = [
      ConnectorController.subscribeKey('connectors', updateInitialWallets),
      ApiController.subscribeKey('recommended', updateInitialWallets),
      ConnectionController.subscribeKey('wcUri', setWcUri),
      ConnectionController.subscribeKey('wcFetchingUri', setIsFetchingWcUri),
    ];

    updateInitialWallets();

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  useEffect(() => {
    void ApiController.fetchRecommendedWallets();
  }, []);

  useEffect(() => {
    if (!showAllWallets) return;

    const requestedSearchValue = search.trim();
    const runFetch = () => {
      setIsFetchingWallets(true);
      searchRequestIdRef.current += 1;
      const requestId = searchRequestIdRef.current;

      fetchWcWallets(1, requestedSearchValue).finally(() => {
        if (requestId === searchRequestIdRef.current) {
          setAppliedSearchValue(requestedSearchValue);
          setIsFetchingWallets(false);
        }
      });
    };

    if (!requestedSearchValue) {
      runFetch();
      return;
    }

    const timeout = setTimeout(runFetch, 250);

    return () => clearTimeout(timeout);
  }, [search, showAllWallets, fetchWcWallets]);

  const displayedWallets = useMemo(() => {
    if (showAllWallets) {
      return mergeWalletOptions([
        ...searchWallets(wallets, appliedSearchValue),
        ...wcWallets,
      ]);
    } else {
      return wallets;
    }
  }, [appliedSearchValue, showAllWallets, wallets, wcWallets]);

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
    setAppliedSearchValue('');
    setWcWallets([]);
    setWcWalletsCount(0);
    setWcWalletsPage(1);
  }, []);

  const fetchMoreWallets = useCallback(() => {
    if (isFetchingWallets || isFetchingWcUri) return;

    setIsFetchingWallets(true);
    fetchWcWallets(wcWalletsPage + 1, appliedSearchValue).finally(() => {
      setWcWalletsPage(wcWalletsPage + 1);
      setIsFetchingWallets(false);
    });
  }, [
    appliedSearchValue,
    isFetchingWallets,
    isFetchingWcUri,
    fetchWcWallets,
    wcWalletsPage,
  ]);

  const hasMoreWallets = wcWalletsCount > wcWallets.length;

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
