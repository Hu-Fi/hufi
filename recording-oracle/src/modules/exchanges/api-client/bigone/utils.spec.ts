import { faker } from '@faker-js/faker';

import { TakerOrMakerFlag, TradingSide } from '../types';
import { generateBigoneTrade } from './fixtures';
import { mapAssetPairToSymbol, mapSymbolToAssetPair, mapTrade } from './utils';

describe('BigONE client utils', () => {
  it('should map trading pair symbol to asset pair', () => {
    const base = faker.finance.currencyCode();
    const quote = faker.finance.currencyCode();

    expect(mapSymbolToAssetPair(`${base}/${quote}`)).toBe(`${base}-${quote}`);
  });

  it('should map asset pair to trading pair symbol', () => {
    const base = faker.finance.currencyCode();
    const quote = faker.finance.currencyCode();

    expect(mapAssetPairToSymbol(`${base}-${quote}`)).toBe(`${base}/${quote}`);
  });

  describe('mapTrade', () => {
    it('should map to correct format with exact common props', () => {
      const apiTrade = generateBigoneTrade();

      const mappedTrade = mapTrade(apiTrade);

      const expectedPrice = Number(apiTrade.price);
      const expectedAmount = Number(apiTrade.amount);

      expect(mappedTrade).toEqual({
        id: apiTrade.id.toString(),
        symbol: mapAssetPairToSymbol(apiTrade.asset_pair_name),
        timestamp: new Date(apiTrade.inserted_at).valueOf(),
        takerOrMaker: expect.any(String),
        side: expect.any(String),
        price: expectedPrice,
        amount: expectedAmount,
        cost: expectedPrice * expectedAmount,
      });
    });

    it('should correctly map maker buy', () => {
      const apiTrade = generateBigoneTrade({
        taker_fee: null,
        taker_side: 'ASK',
        side: 'BID',
      });

      const mappedTrade = mapTrade(apiTrade);

      expect(mappedTrade.takerOrMaker).toEqual(TakerOrMakerFlag.MAKER);
      expect(mappedTrade.side).toEqual(TradingSide.BUY);
    });

    it('should correctly map maker sell', () => {
      const apiTrade = generateBigoneTrade({
        taker_fee: null,
        taker_side: 'BID',
        side: 'ASK',
      });

      const mappedTrade = mapTrade(apiTrade);

      expect(mappedTrade.takerOrMaker).toEqual(TakerOrMakerFlag.MAKER);
      expect(mappedTrade.side).toEqual(TradingSide.SELL);
    });

    it('should correctly map taker buy', () => {
      const apiTrade = generateBigoneTrade({
        taker_fee: Math.random().toString(),
        taker_side: 'BID',
        side: 'BID',
      });

      const mappedTrade = mapTrade(apiTrade);

      expect(mappedTrade.takerOrMaker).toEqual(TakerOrMakerFlag.TAKER);
      expect(mappedTrade.side).toEqual(TradingSide.BUY);
    });

    it('should correctly map taker sell', () => {
      const apiTrade = generateBigoneTrade({
        taker_fee: Math.random().toString(),
        taker_side: 'ASK',
        side: 'ASK',
      });

      const mappedTrade = mapTrade(apiTrade);

      expect(mappedTrade.takerOrMaker).toEqual(TakerOrMakerFlag.TAKER);
      expect(mappedTrade.side).toEqual(TradingSide.SELL);
    });

    it('should correctly map self trades', () => {
      const apiTrade = generateBigoneTrade({
        taker_side: 'ASK',
        side: 'SELF_TRADING',
      });

      const mappedTrade = mapTrade(apiTrade);

      expect(mappedTrade.takerOrMaker).toEqual(TakerOrMakerFlag.TAKER);
      expect(mappedTrade.side).toEqual(TradingSide.SELL);
    });
  });
});
