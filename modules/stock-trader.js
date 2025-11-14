/** modules/stock-trader.js
 * 
 * STOCK MARKET AUTOMATED TRADER
 * 
 * Simple trend-based stock trading:
 * - Monitors stock price trends
 * - Buys stocks trending upward
 * - Sells stocks trending downward
 * - Manages portfolio automatically
 * 
 * Requires: SF8 (Stock Market Access)
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const player = ns.getPlayer();
  const hasSF8 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 8);
  
  if (!hasSF8) {
    ns.print("ℹ️  Source-File 8 not available");
    ns.print("This module requires SF8 (Stock Market)");
    ns.print("");
    ns.print("To unlock stock trading:");
    ns.print("  1. Complete BitNode 8");
    ns.print("  2. Destroy the BitNode to get SF8");
    ns.print("  3. Stock market will be available");
    ns.print("");
    ns.print("Stock trading provides:");
    ns.print("  • Passive income from investments");
    ns.print("  • Diversified money sources");
    ns.print("  • High profit potential");
    return;
  }
  
  // Check if we have stock market access
  if (!ns.stock.hasWSEAccount()) {
    ns.print("ℹ️  No WSE Account");
    ns.print("Purchase WSE Account from main menu");
    ns.print("Cost: $200m");
    ns.print("");
    ns.print("Once purchased, this script will auto-trade stocks.");
    return;
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("📈 STOCK TRADER - Automated Trading");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  const CONFIG = {
    minCash: 100e6,           // Keep at least $100m cash
    maxPositions: 10,          // Max number of stocks to hold
    buyThreshold: 0.55,        // Buy if forecast > 55%
    sellThreshold: 0.45,       // Sell if forecast < 45%
    checkInterval: 6000,       // Check every 6 seconds
    minSharePercent: 0.05,     // Buy at least 5% of available shares
    maxSharePercent: 0.2       // Buy at most 20% of available shares
  };
  
  const has4S = ns.stock.has4SData();
  const hasTIX = ns.stock.hasTIXAPIAccess();
  
  if (!hasTIX) {
    ns.print("⚠️  Warning: No TIX API Access");
    ns.print("Trading will be limited without TIX API");
    ns.print("Purchase TIX API for $5b to enable full automation");
    ns.print("");
  }
  
  if (!has4S) {
    ns.print("⚠️  Warning: No 4S Market Data");
    ns.print("Cannot forecast stock trends without 4S data");
    ns.print("Purchase 4S Market Data for $1b");
    ns.print("");
    return; // Can't trade without forecast data
  }
  
  function getAllStocks() {
    return ns.stock.getSymbols().map(sym => ({
      sym: sym,
      forecast: ns.stock.getForecast(sym),
      volatility: ns.stock.getVolatility(sym),
      price: ns.stock.getPrice(sym),
      shares: ns.stock.getPosition(sym)[0],
      avgPrice: ns.stock.getPosition(sym)[1],
      maxShares: ns.stock.getMaxShares(sym)
    }));
  }
  
  function getPortfolioValue() {
    let total = 0;
    for (const sym of ns.stock.getSymbols()) {
      const [shares, avgPrice] = ns.stock.getPosition(sym);
      if (shares > 0) {
        total += shares * ns.stock.getPrice(sym);
      }
    }
    return total;
  }
  
  while (true) {
    const stocks = getAllStocks();
    const currentMoney = ns.getPlayer().money;
    const portfolioValue = getPortfolioValue();
    const totalValue = currentMoney + portfolioValue;
    
    ns.clearLog();
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("📈 STOCK TRADER");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    ns.print(`Cash:      ${ns.formatNumber(currentMoney)}`);
    ns.print(`Portfolio: ${ns.formatNumber(portfolioValue)}`);
    ns.print(`Total:     ${ns.formatNumber(totalValue)}`);
    ns.print("");
    
    // Count current positions
    const currentPositions = stocks.filter(s => s.shares > 0).length;
    
    // Sell stocks that are trending down
    for (const stock of stocks) {
      if (stock.shares > 0 && stock.forecast < CONFIG.sellThreshold) {
        const salePrice = ns.stock.sellStock(stock.sym, stock.shares);
        if (salePrice > 0) {
          const profit = (salePrice - stock.avgPrice) * stock.shares;
          ns.print(`🔴 SELL: ${stock.sym}`);
          ns.print(`   Shares: ${stock.shares}`);
          ns.print(`   Price: ${ns.formatNumber(salePrice)}`);
          ns.print(`   P/L: ${ns.formatNumber(profit)}`);
          ns.print("");
        }
      }
    }
    
    // Buy stocks that are trending up
    const buyableCash = Math.max(0, currentMoney - CONFIG.minCash);
    
    if (buyableCash > 0 && currentPositions < CONFIG.maxPositions) {
      // Find best stocks to buy
      const buyTargets = stocks
        .filter(s => s.forecast > CONFIG.buyThreshold && s.shares === 0)
        .sort((a, b) => b.forecast - a.forecast)
        .slice(0, CONFIG.maxPositions - currentPositions);
      
      for (const stock of buyTargets) {
        const cashPerStock = buyableCash / buyTargets.length;
        const maxAffordable = Math.floor(cashPerStock / stock.price);
        const minShares = Math.floor(stock.maxShares * CONFIG.minSharePercent);
        const maxShares = Math.floor(stock.maxShares * CONFIG.maxSharePercent);
        
        const sharesToBuy = Math.max(minShares, Math.min(maxAffordable, maxShares));
        
        if (sharesToBuy > 0) {
          const buyPrice = ns.stock.buyStock(stock.sym, sharesToBuy);
          if (buyPrice > 0) {
            ns.print(`🟢 BUY: ${stock.sym}`);
            ns.print(`   Shares: ${sharesToBuy}`);
            ns.print(`   Price: ${ns.formatNumber(buyPrice)}`);
            ns.print(`   Forecast: ${(stock.forecast * 100).toFixed(1)}%`);
            ns.print("");
          }
        }
      }
    }
    
    // Show current portfolio
    const positions = stocks.filter(s => s.shares > 0);
    if (positions.length > 0) {
      ns.print("─────────────────────────────────────────────────────────");
      ns.print("📊 Current Positions:");
      ns.print("");
      for (const stock of positions) {
        const currentValue = stock.shares * stock.price;
        const costBasis = stock.shares * stock.avgPrice;
        const profit = currentValue - costBasis;
        const profitPercent = ((profit / costBasis) * 100).toFixed(1);
        
        ns.print(`${stock.sym.padEnd(6)} | ${(stock.forecast * 100).toFixed(0)}% | ${profitPercent.padStart(6)}% | ${ns.formatNumber(profit)}`);
      }
      ns.print("");
    } else {
      ns.print("No positions held.");
      ns.print("");
    }
    
    ns.print(`Checking again in ${CONFIG.checkInterval / 1000}s...`);
    
    await ns.sleep(CONFIG.checkInterval);
  }
}
