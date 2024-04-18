# Hu Fi

## What is Hu Fi
![image](./hufi.png)

The crypto markets are characterized by their fragmented markets, where each cryptocurrency product on every exchange often requires its own market-making. Some products are quoted in USD, USDC, USDT, or even foreign currencies. In essence, each crypto exchange has an isolated order book for each trading pair. In addition, derivative and future products are also disjointed.  This differs from traditional markets, which have regulated, centralized market-making where the futures markets are well hedged. In the crypto sector, each product must manage its market-making independently in a one-off manner on each exchange it launches on.  Market making is a lucrative industry but it’s currently only available to the largest crypto actors and the average crypto user has no way to participate. Projects create one off agreements between market makers potentially with a subset of the exchanges they trade on. Recently DeFi markets have allowed for some programmatic market making directly from solidity but they represent a tiny fraction of the overall crypto market.

HuFi introduces a decentralized approach to market-making, enabling anyone with tokens and code to programmatically engage in market-making on any centralized exchange using Solidity. The code for market-making can be directly embedded in the crypto product itself, or externally with a sidecar market-making product. Additionally, anyone with exchange keys and the ability to run a bot can now become a market maker safely and transparently. Finally, anyone with excess crypto funds can earn income by providing it to the bot to generate yield on this excess crypto. 

HuFi utilizes the Human Protocol to ensure fair compensation for market makers. By leveraging the same smart contract framework and infrastructure already in use for various applications, including machine learning, market makers can trust that they will receive timely and fair payment. This trust is reinforced by the use of the same Escrow Factories, which have a proven track record of reliably disbursing payments to individuals involved in machine learning labeling tasks for years.

## Demo Videos

<div style="display: flex; justify-content: space-around; align-items: center;">
  <div>
    <!-- Video 1 -->
    <iframe width="560" height="315" src="https://www.youtube.com/embed/XERjwulS4co?si=M1iDt9ybR-l01lBS" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
  <div>
    <!-- Video 2 -->
    <iframe width="560" height="315" src="https://www.youtube.com/embed/1-cB4a0INyc?si=Ti0WNCT162yOF4op" frameborder="0" allow="accelerometer;clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
  </div>
</div>

## Building blocks
- [Campaign Launcher](./campaign-launcher)
- [Mr.Market](https://github.com/Hu-Fi/Mr.Market)
- [Recording oracle](./recording-oracle)
- Reputation oracle
