/** hacknet-farm-manager.js
 * Intelligent Hacknet farm automation - maximizes passive income through optimal upgrades
 * 
 * WHAT IS HACKNET?
 * - Passive income system: buy nodes that generate money automatically
 * - Three upgrade types: Level, RAM, Cores (each increases production)
 * - Strategy: Always choose the upgrade with best ROI (cost per production increase)
 * 
 * HOW IT WORKS:
 * 1. Scans all nodes to find cheapest upgrade (best bang for buck)
 * 2. Buys that upgrade if affordable and within budget
 * 3. Repeats continuously for compound growth
 * 
 * Usage:
 *   run hacknet-farm-manager.js                  # Conservative (50% budget)
 *   run hacknet-farm-manager.js 0.8              # Aggressive (80% budget)
 *   run hacknet-farm-manager.js 0.3 100000       # Custom budget + min reserve
 * 
 * Arguments:
 *   [0] budgetPercent - Percentage of money to spend (default: 0.5 = 50%)
 *   [1] minReserve    - Minimum money to always keep (default: $100k)
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  // ===== CONFIGURATION =====
  
  // How much money to spend on Hacknet (50% = conservative, 80% = aggressive)
  const BUDGET_PERCENT = ns.args[0] || 0.5;
  
  // Always keep this much money in reserve (for other investments)
  const MIN_RESERVE = ns.args[1] || 100000;
  
  // How often to check for upgrades (in milliseconds)
  const UPDATE_INTERVAL = 5000; // 5 seconds
  
  // Whether to show detailed logs
  const VERBOSE = true;
  
  // Disable spammy logs
  ns.disableLog("sleep");
  ns.disableLog("getServerMoneyAvailable");
  
  
  // ===== HELPER FUNCTIONS =====
  
  /**
   * Formats money values for display
   * @param {number} value - The money amount
   * @returns {string} Formatted string like "$1.23m"
   */
  function formatMoney(value) {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}b`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}m`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}k`;
    return `$${value.toFixed(2)}`;
  }
  
  /**
   * Formats time values for display
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted string like "2h 30m"
   */
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }
  
  /**
   * Calculates how much money is available for Hacknet investments
   * @returns {number} Available budget
   */
  function getAvailableBudget() {
    const currentMoney = ns.getServerMoneyAvailable("home");
    const budgetAmount = currentMoney * BUDGET_PERCENT;
    const afterReserve = currentMoney - MIN_RESERVE;
    
    // Use the smaller of: budget percentage OR (money - reserve)
    return Math.max(0, Math.min(budgetAmount, afterReserve));
  }
  
  /**
   * Finds the best upgrade to make based on ROI
   * Returns: { type, index, cost, production, roi } or null if nothing affordable
   * 
   * ROI = Cost per additional $/sec of production
   * Lower ROI = better investment
   */
  function findBestUpgrade() {
    const budget = getAvailableBudget();
    const numNodes = ns.hacknet.numNodes();
    const upgrades = [];
    
    // Option 1: Buy a new node
    const newNodeCost = ns.hacknet.getPurchaseNodeCost();
    if (newNodeCost <= budget && numNodes < ns.hacknet.maxNumNodes()) {
      // New nodes start with base production (we'd need to check current multipliers)
      // Estimate: ~$1.5/sec base production for new node
      const baseProduction = 1.5;
      const roi = newNodeCost / baseProduction;
      
      upgrades.push({
        type: 'purchase',
        index: -1,
        cost: newNodeCost,
        production: baseProduction,
        roi: roi,
        description: `Buy new node #${numNodes}`
      });
    }
    
    // Options 2-4: Upgrade existing nodes (Level, RAM, Cores)
    for (let i = 0; i < numNodes; i++) {
      const stats = ns.hacknet.getNodeStats(i);
      
      // LEVEL UPGRADE: Increases production by fixed amount per level
      const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
      if (levelCost <= budget && levelCost > 0) {
        // Level increases production by ~1.5 per level (approximate)
        const productionIncrease = 1.5;
        const roi = levelCost / productionIncrease;
        
        upgrades.push({
          type: 'level',
          index: i,
          cost: levelCost,
          production: productionIncrease,
          roi: roi,
          currentValue: stats.level,
          description: `Node ${i}: Upgrade level ${stats.level} → ${stats.level + 1}`
        });
      }
      
      // RAM UPGRADE: Increases production multiplicatively
      const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
      if (ramCost <= budget && ramCost > 0) {
        // RAM doubles each upgrade, production increases by ~7% per doubling
        const currentProduction = stats.production;
        const productionIncrease = currentProduction * 0.07; // ~7% boost
        const roi = ramCost / productionIncrease;
        
        upgrades.push({
          type: 'ram',
          index: i,
          cost: ramCost,
          production: productionIncrease,
          roi: roi,
          currentValue: stats.ram,
          description: `Node ${i}: Upgrade RAM ${stats.ram}GB → ${stats.ram * 2}GB`
        });
      }
      
      // CORES UPGRADE: Increases production multiplicatively
      const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
      if (coreCost <= budget && coreCost > 0) {
        // Each core adds multiplicative bonus
        const currentProduction = stats.production;
        const productionIncrease = currentProduction * 0.07; // ~7% boost per core
        const roi = coreCost / productionIncrease;
        
        upgrades.push({
          type: 'cores',
          index: i,
          cost: coreCost,
          production: productionIncrease,
          roi: roi,
          currentValue: stats.cores,
          description: `Node ${i}: Upgrade cores ${stats.cores} → ${stats.cores + 1}`
        });
      }
    }
    
    // Sort by ROI (lower is better) and return the best option
    if (upgrades.length === 0) return null;
    
    upgrades.sort((a, b) => a.roi - b.roi);
    return upgrades[0];
  }
  
  /**
   * Executes an upgrade purchase
   * @param {object} upgrade - The upgrade object from findBestUpgrade()
   * @returns {boolean} True if successful
   */
  function executeUpgrade(upgrade) {
    try {
      switch (upgrade.type) {
        case 'purchase':
          const nodeIndex = ns.hacknet.purchaseNode();
          return nodeIndex >= 0;
          
        case 'level':
          return ns.hacknet.upgradeLevel(upgrade.index, 1);
          
        case 'ram':
          return ns.hacknet.upgradeRam(upgrade.index, 1);
          
        case 'cores':
          return ns.hacknet.upgradeCore(upgrade.index, 1);
          
        default:
          return false;
      }
    } catch (e) {
      ns.print(`ERROR: Failed to execute upgrade: ${e}`);
      return false;
    }
  }
  
  /**
   * Calculates total production and statistics
   * @returns {object} Stats about the farm
   */
  function getFarmStats() {
    const numNodes = ns.hacknet.numNodes();
    let totalProduction = 0;
    let totalValue = 0;
    let minLevel = Infinity;
    let maxLevel = 0;
    
    for (let i = 0; i < numNodes; i++) {
      const stats = ns.hacknet.getNodeStats(i);
      totalProduction += stats.production;
      totalValue += stats.totalProduction; // Total money earned all-time
      minLevel = Math.min(minLevel, stats.level);
      maxLevel = Math.max(maxLevel, stats.level);
    }
    
    return {
      numNodes,
      totalProduction,
      totalValue,
      minLevel: minLevel === Infinity ? 0 : minLevel,
      maxLevel
    };
  }
  
  /**
   * Prints status update
   */
  function printStatus(upgrade, stats) {
    ns.print("═".repeat(60));
    ns.print(`HACKNET FARM STATUS - ${new Date().toLocaleTimeString()}`);
    ns.print("═".repeat(60));
    ns.print(`Nodes: ${stats.numNodes} | Production: ${formatMoney(stats.totalProduction)}/sec`);
    ns.print(`Total Earned: ${formatMoney(stats.totalValue)} (all-time)`);
    ns.print(`Level Range: ${stats.minLevel} - ${stats.maxLevel}`);
    ns.print(`Budget Available: ${formatMoney(getAvailableBudget())} (${(BUDGET_PERCENT * 100).toFixed(0)}% of funds)`);
    
    if (upgrade) {
      ns.print("");
      ns.print(`Next Upgrade: ${upgrade.description}`);
      ns.print(`  Cost: ${formatMoney(upgrade.cost)} | ROI: ${formatMoney(upgrade.roi)}/production`);
      
      // Calculate payback time
      const paybackTime = upgrade.cost / stats.totalProduction;
      ns.print(`  Payback Time: ${formatTime(paybackTime)} (at current production)`);
    } else {
      ns.print("");
      ns.print("⚠ No affordable upgrades available with current budget");
    }
    
    ns.print("═".repeat(60));
  }
  
  
  // ===== MAIN LOOP =====
  
  ns.print("");
  ns.print("🚀 Starting Hacknet Farm Manager...");
  ns.print(`Config: ${(BUDGET_PERCENT * 100).toFixed(0)}% budget, ${formatMoney(MIN_RESERVE)} reserve`);
  ns.print("");
  
  let iterationCount = 0;
  let totalInvested = 0;
  let upgradesMade = 0;
  
  while (true) {
    iterationCount++;
    
    // Find the best upgrade
    const bestUpgrade = findBestUpgrade();
    const stats = getFarmStats();
    
    // Show status every 10 iterations or when we find an upgrade
    if (iterationCount % 10 === 1 || bestUpgrade) {
      printStatus(bestUpgrade, stats);
    }
    
    // Execute the upgrade if we found one
    if (bestUpgrade) {
      const success = executeUpgrade(bestUpgrade);
      
      if (success) {
        totalInvested += bestUpgrade.cost;
        upgradesMade++;
        
        ns.print("");
        ns.print(`✓ SUCCESS: ${bestUpgrade.description}`);
        ns.print(`  Invested: ${formatMoney(bestUpgrade.cost)} | Total Invested: ${formatMoney(totalInvested)}`);
        ns.print(`  Upgrades Made: ${upgradesMade}`);
        ns.print("");
        
        // Continue immediately to check for next upgrade
        continue;
      } else {
        ns.print(`✗ FAILED: Could not execute ${bestUpgrade.description}`);
      }
    }
    
    // Wait before next check
    await ns.sleep(UPDATE_INTERVAL);
  }
}
