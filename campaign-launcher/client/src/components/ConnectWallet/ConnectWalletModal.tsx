import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from 'react';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ApiController,
  AssetUtil,
  ConnectionController,
  ConnectorController,
  ConnectorControllerUtil,
  ConnectorUtil,
  WalletUtil,
  type ConnectorOrWalletItem,
} from '@reown/appkit-controllers';
import '@reown/appkit-ui/wui-qr-code';

import ResponsiveOverlay from '@/components/ResponsiveOverlay';
import { WALLET_PAGE_SIZE } from '@/constants';

type Props = {
  open: boolean;
  onClose: () => void;
};

type AppKitQrCodeElement = HTMLElement & {
  alt?: string;
  imageSrc?: string;
  size?: number;
  theme?: 'dark' | 'light';
  uri?: string;
};

type AppKitQrCodeProps = {
  alt: string;
  imageSrc?: string;
  uri: string;
};

type WalletOption = {
  id: string;
  imageUrl: string;
  item: ConnectorOrWalletItem;
  name: string;
};

const AppKitQrCode: FC<AppKitQrCodeProps> = ({ alt, imageSrc, uri }) => {
  const qrCodeRef = useRef<AppKitQrCodeElement>(null);

  useEffect(() => {
    if (!qrCodeRef.current) return;

    qrCodeRef.current.alt = alt;
    qrCodeRef.current.imageSrc = imageSrc;
    qrCodeRef.current.size = 500;
    qrCodeRef.current.theme = 'light';
    qrCodeRef.current.uri = uri;
  }, [alt, imageSrc, uri]);

  return createElement('wui-qr-code', {
    ref: qrCodeRef,
    style: { display: 'block', height: '100%', width: '100%' },
  });
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

const getWalletConnectWallets = () => {
  const wallets = ApiController.state.search.length
    ? ApiController.state.search
    : WalletUtil.getWalletConnectWallets(ApiController.state.wallets);

  return wallets.map((wallet) =>
    mapWalletOption({ kind: 'wallet', subtype: 'recommended', wallet })
  );
};

const searchWallets = (walletOptions: WalletOption[], searchValue: string) => {
  const normalizedSearch = searchValue.toLowerCase();

  if (!normalizedSearch) {
    return walletOptions;
  }

  return walletOptions.filter((wallet) =>
    wallet.name.toLowerCase().includes(normalizedSearch)
  );
};

const mergeWalletOptions = (walletOptions: WalletOption[]) => {
  const uniqueWallets = new Map<string, WalletOption>();

  walletOptions.forEach((wallet) => {
    const key = `${wallet.item.kind}-${wallet.id}`;

    if (!uniqueWallets.has(key)) {
      uniqueWallets.set(key, wallet);
    }
  });

  return [...uniqueWallets.values()];
};

const ConnectWalletModal: FC<Props> = ({ open, onClose }) => {
  const [wallets, setWallets] = useState(getInitialWallets);
  const [wcWallets, setWcWallets] = useState(getWalletConnectWallets);
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
  const [search, setSearch] = useState('');
  const [showAllWallets, setShowAllWallets] = useState(false);

  useEffect(() => {
    const updateInitialWallets = () => setWallets(getInitialWallets());
    const updateWcWallets = () => setWcWallets(getWalletConnectWallets());

    const unsubscribers = [
      ConnectorController.subscribeKey('connectors', updateInitialWallets),
      ApiController.subscribeKey('recommended', updateInitialWallets),
      ApiController.subscribeKey('wallets', updateWcWallets),
      ApiController.subscribeKey('search', updateWcWallets),
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

      const fetchPromise = searchValue
        ? ApiController.searchWallet({
            entries: 100,
            page: 1,
            search: searchValue,
          })
        : ApiController.fetchWalletsByPage({
            entries: WALLET_PAGE_SIZE,
            page: 1,
          });

      void fetchPromise.finally(() => setIsFetchingWallets(false));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [open, search, showAllWallets]);

  const displayedWallets = useMemo(() => {
    if (showAllWallets) {
      return mergeWalletOptions([
        ...searchWallets(wallets, search.trim()),
        ...wcWallets,
      ]);
    }

    return wallets;
  }, [search, showAllWallets, wallets, wcWallets]);

  const resetWalletConnect = useCallback(() => {
    ConnectionController.resetUri();
    ConnectionController.setWcLinking(undefined);
    ConnectionController.setRecentWallet(undefined);
    setConnectingWallet(null);
  }, []);

  const handleClose = useCallback(() => {
    resetWalletConnect();
    setSearch('');
    setShowAllWallets(false);
    onClose();
  }, [onClose, resetWalletConnect]);

  const handleWalletClick = useCallback(
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

  const handleShowMore = useCallback(() => {
    setIsFetchingWallets(true);
    void ApiController.fetchWalletsByPage({
      entries: WALLET_PAGE_SIZE,
      page: page + 1,
    }).finally(() => setIsFetchingWallets(false));
  }, [page]);

  const totalFetched = page * WALLET_PAGE_SIZE;
  const hasMoreWallets = showAllWallets && totalFetched < count;
  const isBusy = isFetchingWallets || isFetchingWcUri;

  return (
    <ResponsiveOverlay
      open={open}
      onClose={handleClose}
      isLoading={isFetchingWcUri}
      desktopSx={{
        width: 640,
        height: 520,
        maxHeight: 'calc(100dvh - 48px)',
        px: 4,
        py: 4,
      }}
      mobileSx={{ height: '85dvh', p: 2 }}
      closeButtonSx={{ top: { xs: 16, md: 32 }, right: { xs: 16, md: 32 } }}
    >
      {wcUri && connectingWallet ? (
        <Stack
          sx={{
            alignItems: 'center',
            gap: 2,
            height: '100%',
            justifyContent: 'center',
            px: { xs: 2, md: 4 },
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            Scan with {connectingWallet.name}
          </Typography>
          <Box
            sx={{
              bgcolor: 'white',
              borderRadius: 2,
              height: 240,
              p: 2,
              width: 240,
            }}
          >
            <AppKitQrCode
              alt={connectingWallet.name}
              imageSrc={connectingWallet.imageUrl}
              uri={wcUri}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Open your wallet app and scan this QR code to continue.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              resetWalletConnect();
            }}
          >
            Back to wallets
          </Button>
        </Stack>
      ) : (
        <Stack sx={{ height: '100%', minHeight: 0 }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
            Connect Wallet
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.primary', fontWeight: 500, mb: 3, pr: 5 }}
          >
            Connect your wallet to create, participate in campaigns and even
            track your performance on the leaderboard.
          </Typography>

          {showAllWallets && (
            <TextField
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Wallet"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}

          <Box sx={{ minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
            <Grid container spacing={2}>
              {displayedWallets.map((wallet) => {
                const isConnectingWallet =
                  connectingWallet?.id === wallet.id && isFetchingWcUri;

                return (
                  <Grid size={{ xs: 6, md: 4 }} key={wallet.id}>
                    <Button
                      disabled={isBusy}
                      onClick={() => {
                        void handleWalletClick(wallet);
                      }}
                      sx={{
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'rgba(205, 199, 255, 0.22)',
                        borderRadius: '8px',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                        height: 132,
                        justifyContent: 'center',
                        p: 2,
                        width: '100%',
                        '&:hover': {
                          bgcolor: 'rgba(205, 199, 255, 0.08)',
                          borderColor: 'rgba(205, 199, 255, 0.45)',
                        },
                      }}
                    >
                      {isConnectingWallet ? (
                        <CircularProgress size={36} />
                      ) : (
                        <Box
                          component="img"
                          src={wallet.imageUrl}
                          alt={wallet.name}
                          sx={{
                            borderRadius: 1.5,
                            height: 48,
                            objectFit: 'contain',
                            width: 48,
                          }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'white',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {wallet.name}
                      </Typography>
                    </Button>
                  </Grid>
                );
              })}
            </Grid>

            {isBusy && displayedWallets.length === 0 && (
              <Stack sx={{ alignItems: 'center', py: 6 }}>
                <CircularProgress size={32} />
              </Stack>
            )}
          </Box>

          <Stack
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
              mt: 2,
            }}
          >
            {!showAllWallets ? (
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={() => setShowAllWallets(true)}
              >
                Search Wallet
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setShowAllWallets(false)}
                >
                  Back
                </Button>

                <Button
                  variant="outlined"
                  disabled={isFetchingWallets || !hasMoreWallets}
                  onClick={handleShowMore}
                >
                  Show more
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      )}
    </ResponsiveOverlay>
  );
};

export default ConnectWalletModal;
