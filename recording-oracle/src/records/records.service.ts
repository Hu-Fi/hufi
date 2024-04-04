import { Injectable } from '@nestjs/common';
import * as ccxt from 'ccxt';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { LiquidityScoreCalculation } from './liquidity-score.model';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from 'src/common/entities/campaign.entity';
import { User } from 'src/common/entities/user.entity';

@Injectable()
export class RecordService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Campaign)
    private campaignRepository: Repository<Campaign>,
  ) {}

  private getExchangeInstance(
    exchangeId: string,
    apiKey: string,
    secret: string,
  ): ccxt.Exchange {
    const exchangeClass = ccxt[exchangeId];
    if (!exchangeClass) {
      throw new Error(`Exchange ${exchangeId} not supported.`);
    }
    return new exchangeClass({ apiKey, secret });
  }

  private async fetchTrades(
    exchange: ccxt.Exchange,
    symbol: string,
    since: number,
  ): Promise<ccxt.Trade[]> {
    return exchange.fetchMyTrades(symbol, since);
  }

  private async fetchOpenOrders(
    exchange: ccxt.Exchange,
    symbol: string,
  ): Promise<ccxt.Order[]> {
    return exchange.fetchOpenOrders(symbol);
  }

  private async fetchOrderBook(
    exchange: ccxt.Exchange,
    symbol: string,
  ): Promise<ccxt.OrderBook> {
    return exchange.fetchOrderBook(symbol);
  }

  private calculateSpread(orderBook: ccxt.OrderBook): number {
    const bid = orderBook.bids.length ? orderBook.bids[0][0] : 0;
    const ask = orderBook.asks.length ? orderBook.asks[0][0] : 0;
    return bid && ask ? ask - bid : 0;
  }

  private async processOpenOrders(
    exchange: ccxt.Exchange,
    symbol: string,
  ): Promise<{
    openOrderVolume: number;
    averageDuration: number;
    spread: number;
  }> {
    const orders = await this.fetchOpenOrders(exchange, symbol);
    const orderBook = await this.fetchOrderBook(exchange, symbol);
    const spread = this.calculateSpread(orderBook);

    const now = Date.now();
    let totalDuration = 0;
    const openOrderVolume = orders.reduce((acc, order) => {
      const orderCreationTime = new Date(order.timestamp).getTime();
      const duration = (now - orderCreationTime) / 1000; // Convert duration from milliseconds to seconds
      totalDuration += duration;
      return acc + order.amount;
    }, 0);

    const averageDuration = orders.length ? totalDuration / orders.length : 0;

    return { openOrderVolume, averageDuration, spread };
  }

  async calculateLiquidityScore(
    apiKey: string,
    secret: string,
    exchangeId: string,
    symbol: string,
    since: number,
  ): Promise<number> {
    const exchange = this.getExchangeInstance(exchangeId, apiKey, secret);
    const trades = await this.fetchTrades(exchange, symbol, since);
    const tradeVolume = trades.reduce((acc, trade) => acc + trade.amount, 0);

    const { openOrderVolume, averageDuration, spread } =
      await this.processOpenOrders(exchange, symbol);

    const liquidityScoreCalculation = new LiquidityScoreCalculation(
      tradeVolume,
      openOrderVolume,
      averageDuration,
      spread,
    );

    return liquidityScoreCalculation.calculate();
  }

  //   @Cron(CronExpression.EVERY_MINUTE)
  //   async handleLiquidityScores(): Promise<void> {
  //     this.logger.debug('Running Liquidity Score Updates');

  //     const campaigns = await this.campaignRepository.find({ relations: ['users'] });
  //     for (const campaign of campaigns) {
  //       for (const user of campaign.users) {
  //         try {
  //           // Assuming you have stored API keys and other necessary details within the user or campaign entities
  //           const { apiKey, secret } = user; // Ensure these are decrypted securely
  //           // You need to adjust based on your actual data model
  //           const exchangeId = campaign.exchangeId; // Example, adjust as needed
  //           const symbol = campaign.symbol; // Adjust as needed
  //           const since = /* Determine how to calculate 'since' based on your logic */;

  //           const score = await this.calculateLiquidityScore(apiKey, secret, exchangeId, symbol, since);
  //           // Update the score in your database
  //           // This step depends on how you've structured your liquidity score storage
  //         } catch (error) {
  //           this.logger.error(`Failed to update liquidity score for user ${user.id} on campaign ${campaign.address}: ${error.message}`);
  //         }
  //       }
  //     }
  //   }
}
