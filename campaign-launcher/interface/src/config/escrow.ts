export const oracles = {
  exchangeOracle: import.meta.env.VITE_APP_EXCHANGE_ORACLE_ADDRESS,
  exchangeOracleFee: BigInt(import.meta.env.VITE_APP_EXCHANGE_ORACLE_FEE),
  recordingOracle: import.meta.env.VITE_APP_RECORDING_ORACLE_ADDRESS,
  recordingOracleFee: BigInt(import.meta.env.VITE_APP_RECORDING_ORACLE_FEE),
  reputationOracle: import.meta.env.VITE_APP_REPUTATION_ORACLE_ADDRESS,
  reputationOracleFee: BigInt(import.meta.env.VITE_APP_REPUTATION_ORACLE_FEE),
};
