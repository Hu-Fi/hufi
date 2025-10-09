import EscrowFactoryABI from '@human-protocol/core/abis/EscrowFactory.json';
import { Escrow__factory } from '@human-protocol/core/typechain-types';
import { ContractTransactionReceipt, ethers, EventLog, TransactionReceipt } from 'ethers';

type ReplacementResult = | 
{
  success: false;
  error: string;
} | {
  success: true;
  result: unknown;
}

type HandlerType = 'createEscrow' | 'fund' | 'setup';

export const handleCreateEscrowReplacement = async (provider: ethers.Provider, receipt: TransactionReceipt): Promise<ReplacementResult> => {
  const iface = new ethers.Interface(EscrowFactoryABI);
  const contractTransactionReceipt = new ContractTransactionReceipt(iface, provider, receipt);

  const event = contractTransactionReceipt.logs.find(({ topics }) => 
    topics.includes(ethers.id('LaunchedV2(address,address,string)'))
  ) as EventLog;

  const escrowAddress = event?.args?.escrow;

  if (!escrowAddress) {
    return {
      success: false,
      error: 'Transaction has been replaced by a different transaction'
    }
  } else {
    return {
      success: true,
      result: escrowAddress
    }
  }
}

export const handleFundReplacement = async (provider: ethers.Provider, receipt: TransactionReceipt, options?: Record<string, unknown>): Promise<ReplacementResult> => {
  const abi = ['event Transfer(address indexed _from, address indexed _to, uint256 _value)'];
  const iface = new ethers.Interface(abi);
  const contractTransactionReceipt = new ContractTransactionReceipt(iface, provider, receipt);

  const event = contractTransactionReceipt.logs.find(({ topics }) => 
    topics.includes(ethers.id('Transfer(address,address,uint256)'))
  ) as EventLog;

  if (event?.args?._to.toLowerCase() === (options?.escrowAddress as string)?.toLowerCase()) {
    return {
      success: true,
      result: undefined
    }
  } else {
    return {
      success: false,
      error: 'Transaction has been replaced by a different transaction'
    }
  }
}

export const handleSetupReplacement = async (provider: ethers.Provider, receipt: TransactionReceipt, options?: Record<string, unknown>): Promise<ReplacementResult> => {
  const iface = new ethers.Interface(Escrow__factory.abi);
  const contractTransactionReceipt = new ContractTransactionReceipt(iface, provider, receipt);

  const event = contractTransactionReceipt.logs.find(({ topics }) => 
    topics.includes(ethers.id('Fund(uint256)'))
  ) as EventLog;

  if (event && receipt?.to?.toLowerCase() === (options?.escrowAddress as string)?.toLowerCase()) {
    return {
      success: true,
      result: undefined
    }
  } else {
    return {
      success: false,
      error: 'Transaction has been replaced by a different transaction'
    }
  }
}

const getReplacementHandler = (type: HandlerType) => {
  switch (type) {
    case 'createEscrow':
      return handleCreateEscrowReplacement;
    case 'fund':
      return handleFundReplacement;
    case 'setup':
      return handleSetupReplacement;
  }
}

const handleTransactionReplacement = async <T>(
  callback: () => Promise<T>,
  opts: { provider: ethers.Provider; signer: ethers.Signer; type: HandlerType; meta?: Record<string, unknown> }
): Promise<T> => {
  // artificially slowing down the transactions
  const originalSendTransaction = opts.signer.sendTransaction.bind(opts.signer);
  opts.signer.sendTransaction = async (tx) => {
    return originalSendTransaction({
      ...tx,
      gasPrice: 25000000000n // 25 gwei
    });
  };
  
  const { provider, signer } = opts;
  const from = (await signer.getAddress()).toLowerCase();
  const pendingNonce = await provider.getTransactionCount(from, 'pending');

  let active = true;
  
  const replacementPromise = new Promise<T>((resolve, reject) => {
    const onBlock = async (newBlockNumber: ethers.BlockTag) => {
      if (!active) return;

      try {
        const currentPendingNonce = await provider.getTransactionCount(from, newBlockNumber);
        if (currentPendingNonce > pendingNonce) {
          const newBlock = await provider.getBlock(newBlockNumber);

          if (!newBlock) {
            reject(new Error('Block not found'));
            active = false;
            provider.off('block', onBlock);
            return;
          }
          
          for (const txHash of newBlock.transactions) {
            const tx = await provider.getTransaction(txHash);
            if (!tx) continue;
            
            const txFrom = (tx.from || '').toLowerCase();
            const txTo = (tx.to || '').toLowerCase();
              
            if (txFrom === from && tx.nonce === pendingNonce) {
              if (txTo === from && (tx.value === 0n || tx.value?.toString() === '0')) {
                // Self-send with 0 value -> cancellation
                active = false;
                provider.off('block', onBlock);
                reject(new Error('Transaction was cancelled by user'));
                return;
              } else {
                // Different destination or non-zero value -> speed up
                const receipt = await provider.getTransactionReceipt(tx.hash);
                if (!receipt) continue;

                const handler = getReplacementHandler(opts.type);
                const replacementResult = await handler(provider, receipt, { escrowAddress: opts.meta?.escrowAddress });

                if (!replacementResult.success) {
                  active = false;
                  provider.off('block', onBlock);
                  reject(new Error(replacementResult.error));
                  return;
                } else {
                  active = false;
                  provider.off('block', onBlock);
                  resolve(replacementResult.result as T);
                  return;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Replacement error:', e);
      }
    };

    provider.on('block', onBlock);
  });

  const callbackPromise = callback().finally(() => {
    active = false;
    provider.removeAllListeners('block');
  });

  return Promise.race([callbackPromise, replacementPromise]);
}

export default handleTransactionReplacement;
