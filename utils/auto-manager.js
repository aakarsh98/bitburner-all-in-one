/** auto-manager.js
 * Complete All-in-One Automation System for Bitburner
 * 
 * RAM USAGE: Uses dynamic imports - only loads enabled modules!
 * - Base system: ~6-8GB (hacking + servers + hacknet)
 * - Each additional module: +2-4GB when enabled
 * - Modules auto-detect if APIs are available (SF4, SF6, etc.)
 * 
 * INTEGRATED MODULES (loaded on-demand):
 * - Hacking: Automated target analysis and smart-batcher deployment (always enabled)
 * - Servers: Automated server purchasing and upgrading with ROI analysis (always enabled)
 * - Hacknet: Automated hacknet node management and optimization (always enabled)
 * - Factions: Intelligent faction joining and reputation farming (needs SF4)
 * - Augmentations: Optimal augmentation purchase planning (needs SF4)
 * - Companies: Automated company work and promotions (needs SF4)
 * - Bladeburner: Automated operations and skill management (needs SF6/SF7)
 * - Gangs: Automated gang management and ascension (needs SF2)
 * - Corporations: Basic corporation tracking and recommendations (needs SF3)
 * - Go: Automated Go game playing with advanced 5-stage strategy
 * 
 * Usage:
 *   run auto-manager.js                           # Core automation (hacking/servers/hacknet)
 *   run auto-manager.js --aggressive              # More aggressive investing
 *   run auto-manager.js --conservative            # Higher safety reserves
 *   run auto-manager.js --analyze-only            # Analysis and suggestions only
 *   run auto-manager.js --deployment-only         # Skip server purchasing
 *   run auto-manager.js --monitor                 # Show current status
 * 
 * Module Control (modules only load if enabled AND API available):
 *   run auto-manager.js --no-factions             # Disable faction automation
 *   run auto-manager.js --no-companies            # Disable company automation
 *   run auto-manager.js --no-bladeburner          # Disable Bladeburner automation
 *   run auto-manager.js --no-gangs                # Disable gang automation
 *   run auto-manager.js --no-go                   # Disable Go automation
 * 
 * Advanced options:
 *   run auto-manager.js --max-servers 15 --roi-hours 1.5 --reserve-fund 2000000
 */

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("sleep");
  ns.disableLog("getServerMaxRam");
  ns.disableLog("getServerUsedRam");
  ns.disableLog("scan");
  ns.disableLog("getPurchasedServerCost");
  ns.disableLog("getPurchasedServers");
  ns.disableLog("getPurchasedServerLimit");
  ns.disableLog("purchaseServer");
  ns.disableLog("deleteServer");
  ns.disableLog("killall");
  ns.disableLog("getPlayer");
  ns.disableLog("ps");
  ns.disableLog("exec");
  
  // Disable Hacknet logs if enabled
  if (ns.hacknet) {
    ns.disableLog("hacknet.numNodes");
    ns.disableLog("hacknet.purchaseNode");
    ns.disableLog("hacknet.getPurchaseNodeCost");
    ns.disableLog("hacknet.getNodeStats");
    ns.disableLog("hacknet.upgradeLevel");
    ns.disableLog("hacknet.upgradeRam");
    ns.disableLog("hacknet.upgradeCore");
    ns.disableLog("hacknet.getLevelUpgradeCost");
    ns.disableLog("hacknet.getRamUpgradeCost");
    ns.disableLog("hacknet.getCoreUpgradeCost");
  }

  // ===== CONFIGURATION =====
  const CONFIG = {
    // Safety rules
    emergencyFund: 1000000,        // Always keep $1M reserve
    maxInvestmentRatio: 0.7,       // Never invest >70% of current money
    minIncomeThreshold: 10000,     // Only invest if making >$10k/s
    roiThreshold: 2.0,             // Maximum 2-hour ROI for investments
    serverUtilizationThreshold: 0.85, // Only upgrade when RAM usage >85%
    
    // Module enablement (can be overridden by flags)
    modules: {
      hacking: true,               // Core hacking automation
      servers: true,               // Server purchasing/upgrading
      hacknet: true,               // Hacknet farm management
      factions: true,              // Faction automation
      companies: true,             // Company work automation
      augmentations: true,         // Augmentation tracking
      bladeburner: true,           // Bladeburner automation
      gangs: true,                 // Gang management
      corporations: true,          // Corporation tracking
      go: true                     // Go game automation
    },
    
    // Hacknet integration
    enableHacknet: true,           // Enable Hacknet investments (legacy, use modules.hacknet)
    hacknetMaxNodes: 24,           // Max Hacknet nodes to own
    hacknetROIMultiplier: 1.0,     // Adjust Hacknet ROI comparison (1.0 = equal priority)
    
    // Monitoring settings
    monitorInterval: 300000,         // Check every 5 minutes (300 seconds)
    statusInterval: 60000,           // Status update every minute
    productionDelay: 60000,          // Wait 1 minute before measuring income
    
    // Script paths
    scripts: {
      profitScan: "analysis/profit-scan-flex.js",
      smartBatcher: "batch/smart-batcher.js",
      batchManager: "batch/batch-manager.js",
      globalKill: "utils/global-kill.js",
      purchaseServer: "deploy/purchase-server-8gb.js",
      replaceServers: "deploy/replace-pservs-no-copy.js",
      productionMonitor: "analysis/production-monitor.js",
      listPservs: "utils/list-pservs.js"
    },
    
    // Server purchasing strategy
    serverPurchasing: {
      minRAM: 8,
      maxRAM: 1048576,  // 1 PB max
      targetUtilization: 0.85,
      upgradeMultiplier: 2,  // Double RAM on upgrades
      smartSizing: true  // Buy larger servers when you can afford them
    },
    
    // Hack percentage strategy
    hackStrategy: {
      minHackPercent: 0.02,   // 2% minimum (tiny servers)
      maxHackPercent: 0.25,   // 25% maximum (huge servers with large fleet)
      baseHackPercent: 0.05,  // 5% baseline (medium servers)
      aggressiveMultiplier: 1.5,    // Aggressive mode: 50% higher
      conservativeMultiplier: 0.7   // Conservative mode: 30% lower
    }
  };

  // Parse command line arguments
  const args = parseArgs(ns);
  const mode = args.mode || 'normal';
  const customConfig = args.config || {};
  
  // Merge custom config with defaults and apply module flags
  const config = { 
    ...CONFIG, 
    ...customConfig,
    modules: { ...CONFIG.modules, ...args.modules }
  };
  
  // Initialize all automation modules using dynamic imports
  // This reduces RAM cost - only loads modules that are enabled
  async function loadModules() {
    const loadedModules = {
      factions: null,
      augmentations: null,
      companies: null,
      bladeburner: null,
      gangs: null,
      corporations: null,
      go: null
    };
    
    try {
      if (config.modules.factions) {
        const { FactionManager } = await import('../modules/faction-manager.js');
        loadedModules.factions = new FactionManager(ns);
      }
    } catch (e) { ns.print(`⚠️ Could not load faction-manager: ${e}`); }
    
    try {
      if (config.modules.augmentations) {
        const { AugmentationTracker } = await import('../modules/augmentation-tracker.js');
        loadedModules.augmentations = new AugmentationTracker(ns);
      }
    } catch (e) { ns.print(`⚠️ Could not load augmentation-tracker: ${e}`); }
    
    try {
      if (config.modules.companies) {
        const { CompanyAutomator } = await import('../modules/company-automator.js');
        loadedModules.companies = new CompanyAutomator(ns);
      }
    } catch (e) { ns.print(`⚠️ Could not load company-automator: ${e}`); }
    
    try {
      if (config.modules.bladeburner) {
        const { BladeburnerCommander } = await import('../modules/bladeburner-commander.js');
        loadedModules.bladeburner = new BladeburnerCommander(ns);
      }
    } catch (e) { ns.print(`⚠️ Could not load bladeburner-commander: ${e}`); }
    
    try {
      if (config.modules.gangs) {
        const { GangManager } = await import('../modules/gang-manager.js');
        loadedModules.gangs = new GangManager(ns);
      }
    } catch (e) { ns.print(`⚠️ Could not load gang-manager: ${e}`); }
    
    try {
      if (config.modules.corporations) {
        const { CorporationManager } = await import('../modules/corporation-manager.js');
        loadedModules.corporations = new CorporationManager(ns);
      }
    } catch (e) { ns.print(`⚠️ Could not load corporation-manager: ${e}`); }
    
    try {
      if (config.modules.go) {
        const { GoCommander } = await import('../modules/go-commander.js');
        loadedModules.go = new GoCommander(ns);
      }
    } catch (e) { ns.print(`⚠️ Could not load go-commander: ${e}`); }
    
    return loadedModules;
  }
  
  const modules = await loadModules();

  // ===== HELPER FUNCTIONS =====
  
  function parseArgs(ns) {
    const args = ns.args.slice();
    const flags = new Set();
    const params = {};
    
    // Extract flags
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (typeof arg === 'string' && arg.startsWith('--')) {
        flags.add(arg);
        
        // Handle parameter values
        if (arg.includes('=')) {
          const [key, value] = arg.substring(2).split('=');
          params[key] = isNaN(value) ? value : Number(value);
        }
      }
    }
    
    let mode = 'normal';
    if (flags.has('--aggressive')) mode = 'aggressive';
    if (flags.has('--conservative')) mode = 'conservative';
    if (flags.has('--analyze-only')) mode = 'analyze-only';
    if (flags.has('--deployment-only')) mode = 'deployment-only';
    if (flags.has('--monitor')) mode = 'monitor';
    
    // Module control flags
    const moduleFlags = {
      factions: !flags.has('--no-factions'),
      companies: !flags.has('--no-companies'),
      augmentations: !flags.has('--no-augmentations'),
      bladeburner: !flags.has('--no-bladeburner'),
      gangs: !flags.has('--no-gangs'),
      corporations: !flags.has('--no-corporations'),
      hacknet: !flags.has('--no-hacknet'),
      servers: !flags.has('--no-servers'),
      hacking: !flags.has('--no-hacking'),
      go: !flags.has('--no-go')
    };
    
    return {
      mode,
      flags: Array.from(flags),
      config: params,
      rawArgs: args,
      modules: moduleFlags
    };
  }

  function formatMoney(ns, value, format = "$0.00a") {
    try {
      return ns.nFormat(value, format);
    } catch (e) {
      const units = ['', 'k', 'm', 'b', 't', 'q', 'Q', 's', 'S', 'o', 'n'];
      let unitIndex = 0;
      let num = Math.abs(value);
      while (num >= 1000 && unitIndex < units.length - 1) {
        num /= 1000;
        unitIndex++;
      }
      const decimals = format.includes('.00') ? 2 : format.includes('.000') ? 3 : 0;
      const formatted = num.toFixed(decimals) + units[unitIndex];
      return (value < 0 ? '-$' : '$') + formatted;
    }
  }

  function formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  function canAccessServer(ns, server) {
    if (!server.requiredHackingLevel || server.requiredHackingLevel > ns.getHackingLevel()) {
      return false;
    }
    
    if (!server.hasRootAccess && server.numPortsRequired > 0) {
      // Check if we have enough hack tools
      let toolsAvailable = 0;
      if (ns.fileExists("BruteSSH.exe", "home")) toolsAvailable++;
      if (ns.fileExists("FTPCrack.exe", "home")) toolsAvailable++;
      if (ns.fileExists("relaySMTP.exe", "home")) toolsAvailable++;
      if (ns.fileExists("HTTPWorm.exe", "home")) toolsAvailable++;
      if (ns.fileExists("SQLInject.exe", "home")) toolsAvailable++;
      
      return toolsAvailable >= server.numPortsRequired;
    }
    
    return server.hasRootAccess || server.numPortsRequired === 0;
  }

  async function executeScript(ns, scriptPath, args = []) {
    const pid = ns.run(scriptPath, 1, ...args);
    if (pid === 0) {
      throw new Error(`Failed to execute ${scriptPath}`);
    }
    
    // Wait for script to complete
    while (ns.isRunning(pid)) {
      await ns.sleep(1000);
    }
    
    return pid;
  }

  async function getServerFleetState(ns) {
    const pservs = ns.getPurchasedServers();
    const totalRAM = pservs.reduce((sum, server) => sum + ns.getServerMaxRam(server), 0);
    
    let usedRAM = 0;
    for (const server of pservs) {
      usedRAM += ns.getServerUsedRam(server);
    }
    
    return {
      count: pservs.length,
      currentRAM: pservs.length > 0 ? ns.getServerMaxRam(pservs[0]) : 0,
      totalRAM,
      usedRAM,
      utilization: totalRAM > 0 ? usedRAM / totalRAM : 0,
      list: pservs
    };
  }

  async function getCurrentIncome(ns) {
    // Measure actual money change over 30 seconds
    const startMoney = ns.getPlayer().money;
    const measureTime = 30000; // 30 seconds
    
    ns.print(`[INCOME] Measuring income over ${measureTime/1000}s...`);
    await ns.sleep(measureTime);
    
    const endMoney = ns.getPlayer().money;
    const gained = endMoney - startMoney;
    const perSecond = gained / (measureTime / 1000);
    
    // Return per-second income (handle negative income gracefully)
    return Math.max(0, perSecond);
  }

  function scanAllServers(ns) {
    // BFS to get all reachable servers
    const visited = new Set();
    const queue = ["home"];
    const servers = [];
    
    while (queue.length) {
      const host = queue.shift();
      if (visited.has(host)) continue;
      visited.add(host);
      servers.push(host);
      
      for (const neighbor of ns.scan(host)) {
        if (!visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
    
    return servers;
  }

  function calculateOptimalHackPercent(ns, targetServer, fleet, mode) {
    // Dynamic hack % based on server capacity, fleet size, and prep status
    const serverMoney = targetServer.maxMoney;
    const fleetRAM = fleet.totalRAM;
    const isPrepared = !targetServer.needsPrep;
    
    // Base calculation: logarithmic scale based on money pool
    // Small servers ($1M): ~2-3%
    // Medium servers ($100M): ~5-8%
    // Large servers ($10B): ~10-15%
    // Huge servers ($100B+): ~15-25%
    let hackPercent = config.hackStrategy.baseHackPercent;
    
    if (serverMoney > 0) {
      // Logarithmic scaling: more money = higher %
      const moneyFactor = Math.log10(serverMoney / 1000000); // Normalize to millions
      hackPercent = 0.02 + (moneyFactor * 0.025); // 2% + scaling factor
    }
    
    // Fleet size bonus: more RAM = can handle higher %
    if (fleetRAM > 1000) {
      const fleetBonus = Math.min(0.05, (fleetRAM / 10000) * 0.05);
      hackPercent += fleetBonus;
    }
    
    // Prep status: prepped servers can handle higher %
    if (isPrepared) {
      hackPercent *= 1.2; // 20% boost for prepped servers
    } else {
      hackPercent *= 0.8; // 20% penalty for unprepped (gentler)
    }
    
    // Mode adjustments
    if (mode === 'aggressive') {
      hackPercent *= config.hackStrategy.aggressiveMultiplier;
    } else if (mode === 'conservative') {
      hackPercent *= config.hackStrategy.conservativeMultiplier;
    }
    
    // Clamp to min/max bounds
    hackPercent = Math.max(
      config.hackStrategy.minHackPercent,
      Math.min(config.hackStrategy.maxHackPercent, hackPercent)
    );
    
    return hackPercent;
  }

  function analyzeServer(ns, hostname) {
    try {
      const maxMoney = ns.getServerMaxMoney(hostname);
      
      // Skip zero-money servers (purchased servers, home, etc.)
      if (!maxMoney || maxMoney <= 0) return null;
      
      const minSec = ns.getServerMinSecurityLevel(hostname);
      const curSec = ns.getServerSecurityLevel(hostname);
      const secDelta = curSec - minSec;
      const hasRoot = ns.hasRootAccess(hostname);
      const reqHack = ns.getServerRequiredHackingLevel(hostname);
      const reqPorts = ns.getServerNumPortsRequired(hostname);
      
      // Get timing data
      const hackTimeMs = ns.getHackTime(hostname);
      const growTimeMs = ns.getGrowTime(hostname);
      const weakenTimeMs = ns.getWeakenTime(hostname);
      
      // Calculate batch cycle efficiency
      const batchCycleMs = Math.max(hackTimeMs, growTimeMs, weakenTimeMs);
      const batchIntervalMs = batchCycleMs * 1.25;
      const batchesPerSecond = 1000 / batchIntervalMs;
      
      // Calculate per-thread income
      const fracPerThread = ns.hackAnalyze(hostname);
      const chance = ns.hackAnalyzeChance(hostname);
      const moneyPerHack = maxMoney * fracPerThread * chance;
      const perThreadPerSec = moneyPerHack * batchesPerSecond;
      
      // Calculate OPTIMAL state (at min security)
      const secFactor = 1 + (secDelta / Math.max(minSec, 1));
      const optimalBatchCycleMs = batchCycleMs / secFactor;
      const optimalBatchIntervalMs = optimalBatchCycleMs * 1.25;
      const optimalBatchesPerSecond = 1000 / optimalBatchIntervalMs;
      const optimalChance = Math.min(0.95, chance * (1 + secDelta / minSec));
      const optimalMoneyPerHack = maxMoney * fracPerThread * optimalChance;
      const optimalPerThreadPerSec = optimalMoneyPerHack * optimalBatchesPerSecond;
      
      // Calculate Fleet Potential Score (capacity + efficiency)
      const fleetScore = optimalPerThreadPerSec * Math.log10(Math.max(maxMoney, 1));
      
      // Prep status
      const moneyAvailable = ns.getServerMoneyAvailable(hostname);
      const moneyPercentage = maxMoney > 0 ? moneyAvailable / maxMoney : 0;
      const needsPrep = secDelta > minSec * 0.1 || moneyPercentage < 0.8;
      
      return {
        server: hostname,
        fleetScore,
        maxMoney,
        moneyPercentage,
        requiredHackingLevel: reqHack,
        numPortsRequired: reqPorts,
        hasRootAccess: hasRoot,
        minSecurity: minSec,
        currentSecurity: curSec,
        securityDelta: secDelta,
        needsPrep,
        hackTime: hackTimeMs,
        growTime: growTimeMs,
        weakenTime: weakenTimeMs,
        optimalIncomePerThread: optimalPerThreadPerSec,
        currentIncomePerThread: perThreadPerSec
      };
    } catch (e) {
      return null;
    }
  }

  function analyzeProfitTargets(ns, analysisResults) {
    const player = ns.getPlayer();
    const targets = [];
    
    for (const target of analysisResults) {
      if (!canAccessServer(ns, target)) {
        continue;
      }
      
      // Calculate comprehensive score
      const fleetScore = target.fleetScore || 0;
      const accessibilityBonus = target.requiredHackingLevel <= player.hacking ? 1.2 : 0.8;
      const preparationEfficiency = target.moneyPercentage && target.moneyPercentage > 0.9 ? 1.0 : 0.7;
      
      const finalScore = fleetScore * accessibilityBonus * preparationEfficiency;
      
      targets.push({
        ...target,
        finalScore
      });
    }
    
    return targets.sort((a, b) => b.finalScore - a.finalScore);
  }

  function calculateOptimalServerRAM(ns, availableMoney, currentIncome) {
    // Smart sizing: Buy larger servers when you can afford them
    const ramOptions = [8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];
    
    for (let i = ramOptions.length - 1; i >= 0; i--) {
      const ram = ramOptions[i];
      const cost = ns.getPurchasedServerCost(ram);
      const roiHours = currentIncome > 0 ? cost / (currentIncome * 3600) : 999;
      
      // Can afford it and ROI is reasonable
      if (cost <= availableMoney * 0.3 && roiHours < config.roiThreshold) {
        return ram;
      }
    }
    
    // Default to 8GB if nothing else works
    return config.serverPurchasing.minRAM;
  }

  function getHacknetStats(ns) {
    // Get current Hacknet farm statistics
    const numNodes = ns.hacknet.numNodes();
    let totalProduction = 0;
    let totalSpent = 0;
    
    for (let i = 0; i < numNodes; i++) {
      const stats = ns.hacknet.getNodeStats(i);
      totalProduction += stats.production;
    }
    
    return {
      numNodes,
      totalProduction,
      totalSpent
    };
  }

  function evaluateHacknetInvestments(ns, availableForInvestment) {
    // Find best Hacknet upgrade based on ROI
    if (!config.enableHacknet) return [];
    
    const numNodes = ns.hacknet.numNodes();
    const maxNodes = Math.min(config.hacknetMaxNodes, ns.hacknet.maxNumNodes());
    const upgrades = [];
    
    // Option 1: Buy a new node
    const newNodeCost = ns.hacknet.getPurchaseNodeCost();
    if (newNodeCost <= availableForInvestment && numNodes < maxNodes) {
      // Estimate base production for new node
      const baseProduction = 1.5; // ~$1.5/sec base
      const roiSeconds = newNodeCost / baseProduction;
      const roiHours = roiSeconds / 3600;
      
      upgrades.push({
        type: 'hacknet-purchase',
        cost: newNodeCost,
        production: baseProduction,
        roiHours: roiHours,
        reason: `Buy Hacknet node #${numNodes} (${formatMoney(ns, baseProduction)}/s)`
      });
    }
    
    // Options 2-4: Upgrade existing nodes
    for (let i = 0; i < numNodes; i++) {
      const stats = ns.hacknet.getNodeStats(i);
      
      // Level upgrade
      const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
      if (levelCost > 0 && levelCost <= availableForInvestment) {
        const productionIncrease = 1.5; // ~$1.5/sec per level
        const roiSeconds = levelCost / productionIncrease;
        const roiHours = roiSeconds / 3600;
        
        upgrades.push({
          type: 'hacknet-level',
          nodeIndex: i,
          cost: levelCost,
          production: productionIncrease,
          roiHours: roiHours,
          reason: `Hacknet node ${i}: Level ${stats.level} → ${stats.level + 1}`
        });
      }
      
      // RAM upgrade
      const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
      if (ramCost > 0 && ramCost <= availableForInvestment) {
        const productionIncrease = stats.production * 0.07; // ~7% boost
        const roiSeconds = ramCost / productionIncrease;
        const roiHours = roiSeconds / 3600;
        
        upgrades.push({
          type: 'hacknet-ram',
          nodeIndex: i,
          cost: ramCost,
          production: productionIncrease,
          roiHours: roiHours,
          reason: `Hacknet node ${i}: RAM ${stats.ram}GB → ${stats.ram * 2}GB`
        });
      }
      
      // Core upgrade
      const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
      if (coreCost > 0 && coreCost <= availableForInvestment) {
        const productionIncrease = stats.production * 0.07; // ~7% boost
        const roiSeconds = coreCost / productionIncrease;
        const roiHours = roiSeconds / 3600;
        
        upgrades.push({
          type: 'hacknet-cores',
          nodeIndex: i,
          cost: coreCost,
          production: productionIncrease,
          roiHours: roiHours,
          reason: `Hacknet node ${i}: Cores ${stats.cores} → ${stats.cores + 1}`
        });
      }
    }
    
    // Apply multiplier for comparison with server investments
    for (const upgrade of upgrades) {
      upgrade.roiHours *= config.hacknetROIMultiplier;
    }
    
    return upgrades;
  }

  async function executeHacknetUpgrade(ns, upgrade) {
    try {
      switch (upgrade.type) {
        case 'hacknet-purchase':
          const nodeIndex = ns.hacknet.purchaseNode();
          return nodeIndex >= 0;
          
        case 'hacknet-level':
          return ns.hacknet.upgradeLevel(upgrade.nodeIndex, 1);
          
        case 'hacknet-ram':
          return ns.hacknet.upgradeRam(upgrade.nodeIndex, 1);
          
        case 'hacknet-cores':
          return ns.hacknet.upgradeCore(upgrade.nodeIndex, 1);
          
        default:
          return false;
      }
    } catch (e) {
      ns.print(`[HACKNET] ERROR: ${e}`);
      return false;
    }
  }

  function evaluateServerInvestment(ns, currentIncome, currentMoney, fleet) {
    const decisions = [];
    
    // Safety check
    if (currentIncome < config.minIncomeThreshold) {
      ns.print(`[INVESTMENT] Income too low: ${formatMoney(ns, currentIncome)}/s (need ${formatMoney(ns, config.minIncomeThreshold)}/s)`);
      return decisions;
    }
    
    const availableForInvestment = Math.min(
      currentMoney - config.emergencyFund,
      currentMoney * config.maxInvestmentRatio
    );
    
    if (availableForInvestment <= 0) {
      ns.print(`[INVESTMENT] Insufficient funds for investment`);
      return decisions;
    }
    
    // UPGRADING: Check if upgrading existing servers is better (higher priority)
    if (fleet.count > 0 && fleet.currentRAM < config.serverPurchasing.maxRAM) {
      const utilizationThreshold = config.serverPurchasing.targetUtilization;
      
      if (fleet.utilization > utilizationThreshold) {
        const upgradeRAM = Math.min(
          fleet.currentRAM * config.serverPurchasing.upgradeMultiplier,
          config.serverPurchasing.maxRAM
        );
        const upgradeCost = ns.getPurchasedServerCost(upgradeRAM) * fleet.count;
        const roiHours = upgradeCost / (currentIncome * 3600);
        
        if (roiHours < config.roiThreshold && availableForInvestment > upgradeCost) {
          decisions.push({
            type: 'upgrade',
            currentRAM: fleet.currentRAM,
            targetRAM: upgradeRAM,
            cost: upgradeCost,
            roiHours,
            reason: `High utilization (${(fleet.utilization * 100).toFixed(1)}%), ROI: ${roiHours.toFixed(2)}h`
          });
        }
      }
    }
    
    // NEW SERVERS: Buy more if under limit
    if (fleet.count < 25) {
      const optimalRAM = fleet.count > 0 ? 
        Math.max(fleet.currentRAM, calculateOptimalServerRAM(ns, availableForInvestment, currentIncome)) :
        calculateOptimalServerRAM(ns, availableForInvestment, currentIncome);
      
      const serverCost = ns.getPurchasedServerCost(optimalRAM);
      const roiHours = serverCost / (currentIncome * 3600);
      
      if (roiHours < config.roiThreshold && availableForInvestment > serverCost * 2) {
        const maxAffordable = Math.floor(availableForInvestment / serverCost);
        const quantity = Math.min(maxAffordable, 25 - fleet.count, 5); // Buy max 5 at a time
        
        if (quantity > 0) {
          decisions.push({
            type: 'purchase',
            quantity,
            ram: optimalRAM,
            cost: quantity * serverCost,
            roiHours,
            reason: `${quantity}x ${optimalRAM}GB servers, ROI: ${roiHours.toFixed(2)}h`
          });
        }
      }
    }
    
    // Sort by priority (lower ROI hours = higher priority, upgrades before purchases)
    return decisions.sort((a, b) => {
      if (a.type === 'upgrade' && b.type !== 'upgrade') return -1;
      if (a.type !== 'upgrade' && b.type === 'upgrade') return 1;
      return a.roiHours - b.roiHours;
    });
  }

  async function deployBatcher(ns, target, hackPercent = 0.05, useBatchManager = true) {
    const batcherName = useBatchManager ? 'batch-manager' : 'smart-batcher';
    ns.print(`[DEPLOY] Deploying ${batcherName} to ${target} with ${(hackPercent * 100).toFixed(1)}% hack rate`);
    
    // Selectively kill old batcher scripts (but not auto-manager)
    const runningScripts = ns.ps("home");
    const scriptsToKill = ['smart-batcher.js', 'batch-manager.js', 'hack.js', 'grow.js', 'weaken.js'];
    let killedCount = 0;
    
    for (const proc of runningScripts) {
      const filename = proc.filename.split('/').pop();
      if (scriptsToKill.includes(filename) && proc.pid !== ns.pid) {
        ns.kill(proc.pid);
        killedCount++;
      }
    }
    
    if (killedCount > 0) {
      ns.print(`[DEPLOY] Stopped ${killedCount} old batcher processes`);
      await ns.sleep(1000);
    }
    
    // Start the chosen batcher
    const script = useBatchManager ? config.scripts.batchManager : config.scripts.smartBatcher;
    const args = [target, hackPercent, '--quiet'];
    
    const pid = ns.run(script, 1, ...args);
    if (pid === 0) {
      throw new Error(`Failed to start ${batcherName} on ${target}`);
    }
    
    // Wait a moment for it to start
    await ns.sleep(2000);
    
    ns.print(`✓ ${batcherName} deployed to ${target} (PID: ${pid})`);
    return pid;
  }

  async function purchaseServers(ns, quantity, ram) {
    ns.print(`[PURCHASE] Buying ${quantity} servers with ${ram}GB RAM`);
    
    for (let i = 0; i < quantity; i++) {
      const pid = ns.run(config.scripts.purchaseServer, 1, 1, ram);
      if (pid === 0) {
        ns.print(`✗ Failed to purchase server ${i + 1}/${quantity}`);
        return false;
      }
      
      // Wait for purchase to complete
      while (ns.isRunning(pid)) {
        await ns.sleep(100);
      }
      
      await ns.sleep(1000); // Brief delay between purchases
    }
    
    ns.print(`✓ Purchased ${quantity} servers with ${ram}GB RAM`);
    return true;
  }

  async function upgradeServers(ns, targetRAM) {
    ns.print(`[UPGRADE] Upgrading all servers to ${targetRAM}GB RAM`);
    
    const pid = ns.run(config.scripts.replaceServers, 1, targetRAM);
    if (pid === 0) {
      throw new Error(`Failed to start server upgrade`);
    }
    
    // Wait for upgrade to complete
    while (ns.isRunning(pid)) {
      await ns.sleep(1000);
    }
    
    ns.print(`✓ All servers upgraded to ${targetRAM}GB RAM`);
    return true;
  }

  async function coordinateModuleDecisions(ns) {
    // Get decisions from all active modules
    const decisions = [];
    
    if (modules.factions && modules.factions.hasSingularityAccess()) {
      const decision = modules.factions.makeDecision();
      if (decision.type !== 'none') {
        decisions.push({ module: 'factions', ...decision });
      }
    }
    
    if (modules.companies && modules.companies.hasSingularityAccess()) {
      const decision = modules.companies.makeDecision();
      if (decision.type !== 'none') {
        decisions.push({ module: 'companies', ...decision });
      }
    }
    
    if (modules.augmentations && modules.augmentations.hasSingularityAccess()) {
      const decision = modules.augmentations.makeDecision();
      if (decision.type !== 'none') {
        decisions.push({ module: 'augmentations', ...decision });
      }
    }
    
    if (modules.bladeburner && modules.bladeburner.hasBladeburnerAccess()) {
      const decision = modules.bladeburner.makeDecision();
      if (decision.type !== 'none') {
        decisions.push({ module: 'bladeburner', ...decision });
      }
    }
    
    if (modules.gangs && modules.gangs.hasGangAccess()) {
      const decision = modules.gangs.makeDecision();
      if (decision.type !== 'none') {
        decisions.push({ module: 'gangs', ...decision });
      }
    }
    
    if (modules.corporations && modules.corporations.hasCorporationAccess()) {
      const decision = modules.corporations.makeDecision();
      if (decision.type !== 'none') {
        decisions.push({ module: 'corporations', ...decision });
      }
    }
    
    if (modules.go && modules.go.hasGoAccess()) {
      const decision = modules.go.makeDecision();
      if (decision.type !== 'none') {
        decisions.push({ module: 'go', ...decision });
      }
    }
    
    // Sort by priority (high > medium > low)
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    decisions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    
    return decisions;
  }
  
  async function executeModuleDecision(ns, decision, state) {
    const module = decision.module;
    
    try {
      if (module === 'factions') {
        if (decision.type === 'join') {
          ns.singularity.joinFaction(decision.faction);
          ns.print(`✓ Joined faction: ${decision.faction}`);
          return true;
        } else if (decision.type === 'work') {
          const success = ns.singularity.workForFaction(decision.faction, decision.workType);
          if (success) {
            ns.print(`✓ Started ${decision.workType} work for ${decision.faction}`);
            return true;
          }
        }
      } else if (module === 'companies') {
        if (decision.type === 'apply') {
          const success = ns.singularity.applyToCompany(decision.company, decision.position);
          if (success) {
            ns.print(`✓ Applied to ${decision.company} as ${decision.position}`);
            return true;
          }
        } else if (decision.type === 'promote') {
          const success = ns.singularity.applyToCompany(decision.company, decision.position);
          if (success) {
            ns.print(`✓ Promoted at ${decision.company} to ${decision.position}`);
            return true;
          }
        } else if (decision.type === 'work') {
          const success = ns.singularity.workForCompany(decision.company);
          if (success) {
            ns.print(`✓ Started working at ${decision.company}`);
            return true;
          }
        }
      } else if (module === 'augmentations') {
        if (decision.type === 'purchase') {
          const aug = decision.augmentation;
          const success = ns.singularity.purchaseAugmentation(aug.purchaseFaction, aug.name);
          if (success) {
            ns.print(`✓ Purchased ${aug.name} from ${aug.purchaseFaction} ($${(aug.adjustedPrice / 1e6).toFixed(2)}m)`);
            return true;
          }
        } else if (decision.type === 'install') {
          ns.print("═════════════════════════════════════════════════════════");
          ns.print(`⚠️  AUGMENTATIONS READY TO INSTALL - SOFT RESET!`);
          ns.print("═════════════════════════════════════════════════════════");
          ns.print(`${decision.count} augmentations purchased and ready`);
          ns.print(``);
          ns.print(`Installing will:`)
          ns.print(`  - RESET your money, servers, scripts (back them up!)`);
          ns.print(`  - KEEP your augmentation bonuses (permanent!)`);
          ns.print(`  - KEEP Source Files from BitNodes`);
          ns.print(``);
          ns.print(`To install:`);
          ns.print(`  1. Backup scripts to GitHub (if not using auto-update)`);
          ns.print(`  2. Options → Augmentations → Install Augmentations`);
          ns.print(`  3. After reset: run quick-deploy.js to restore scripts`);
          ns.print(``);
          ns.print(`See: docs/Feature Guides/AUGMENTATION_RESET_GUIDE.md`);
          ns.print("═════════════════════════════════════════════════════════");
          return false; // NEVER auto-install (safety)
        }
      } else if (module === 'bladeburner') {
        if (decision.type === 'action') {
          const success = modules.bladeburner.startAction(decision.actionType, decision.actionName);
          if (success) {
            ns.print(`✓ Bladeburner: ${decision.actionType} - ${decision.actionName}`);
            return true;
          }
        }
      } else if (module === 'gangs') {
        if (decision.type === 'recruit') {
          const success = ns.gang.recruitMember(decision.name);
          if (success) {
            ns.print(`✓ Gang: Recruited ${decision.name}`);
            return true;
          }
        } else if (decision.type === 'ascend') {
          const result = ns.gang.ascendMember(decision.memberName);
          if (result) {
            ns.print(`✓ Gang: Ascended ${decision.memberName}`);
            return true;
          }
        } else if (decision.type === 'task') {
          const success = ns.gang.setMemberTask(decision.memberName, decision.task);
          if (success) {
            ns.print(`✓ Gang: ${decision.memberName} → ${decision.task}`);
            return true;
          }
        } else if (decision.type === 'territory') {
          ns.gang.setTerritoryWarfare(decision.enabled);
          ns.print(`✓ Gang: Territory warfare ${decision.enabled ? 'ENABLED' : 'DISABLED'}`);
          return true;
        }
      } else if (module === 'corporations') {
        // Corporations are mostly recommendations, not automated actions
        ns.print(`ℹ️ Corporation: ${decision.reason}`);
        return false;
      } else if (module === 'go') {
        if (decision.type === 'start') {
          const success = modules.go.startGoScript();
          if (success) {
            ns.print(`✓ Go: Started automation (${decision.script})`);
            return true;
          }
        } else if (decision.type === 'stop') {
          const success = modules.go.stopGoScript();
          if (success) {
            ns.print(`✓ Go: Stopped automation`);
            return true;
          }
        }
      }
    } catch (error) {
      ns.print(`✗ Failed to execute ${module} decision: ${error}`);
      return false;
    }
    
    return false;
  }

  function printStatus(ns, state) {
    const hacknetStats = config.enableHacknet ? getHacknetStats(ns) : null;
    const totalIncome = state.currentIncome + (hacknetStats ? hacknetStats.totalProduction : 0);
    
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("AUTO-MANAGER STATUS - ALL-IN-ONE AUTOMATION");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print(`Target: ${state.currentTarget || 'None'}`);
    ns.print(`Hacking Income: ${formatMoney(ns, state.currentIncome)}/s`);
    
    if (hacknetStats) {
      ns.print(`Hacknet Income: ${formatMoney(ns, hacknetStats.totalProduction)}/s (${hacknetStats.numNodes} nodes)`);
      ns.print(`Total Income: ${formatMoney(ns, totalIncome)}/s`);
    }
    
    ns.print(`Fleet: ${state.fleet.count} servers @ ${state.fleet.currentRAM}GB`);
    ns.print(`RAM Usage: ${(state.fleet.utilization * 100).toFixed(1)}%`);
    
    // Module status
    ns.print("─────────────────────────────────────────────────────────");
    ns.print("MODULES:");
    const enabledModules = [];
    if (modules.factions?.hasSingularityAccess()) enabledModules.push("Factions");
    if (modules.companies?.hasSingularityAccess()) enabledModules.push("Companies");
    if (modules.augmentations?.hasSingularityAccess()) enabledModules.push("Augmentations");
    if (modules.bladeburner?.hasBladeburnerAccess()) enabledModules.push("Bladeburner");
    if (modules.gangs?.hasGangAccess()) enabledModules.push("Gangs");
    if (modules.corporations?.hasCorporationAccess()) enabledModules.push("Corporations");
    if (modules.go?.hasGoAccess()) enabledModules.push("Go");
    if (config.modules.hacknet) enabledModules.push("Hacknet");
    ns.print(`Active: ${enabledModules.length > 0 ? enabledModules.join(', ') : 'Hacking only'}`);
    
    ns.print("─────────────────────────────────────────────────────────");
    ns.print(`Uptime: ${formatDuration(Date.now() - state.startTime)}`);
    ns.print(`Next Decision: In ${formatDuration(config.monitorInterval - (Date.now() - state.lastDecision))}`);
    ns.print("═════════════════════════════════════════════════════════");
    
    if (state.recentActions.length > 0) {
      ns.print("Recent Actions:");
      for (const action of state.recentActions.slice(-5)) {
        ns.print(`✓ ${action.description} (${formatDuration(Date.now() - action.timestamp)} ago)`);
      }
      ns.print("═════════════════════════════════════════════════════════");
    }
  }

  // ===== MAIN AUTOMATION LOOP =====
  
  const state = {
    startTime: Date.now(),
    currentTarget: null,
    currentIncome: 0,
    fleet: await getServerFleetState(ns),
    lastDecision: 0,
    recentActions: [],
    running: true
  };

  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🚀 STARTING ALL-IN-ONE AUTO-MANAGER");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print(`Mode: ${mode.toUpperCase()}`);
  ns.print(`Emergency Fund: ${formatMoney(ns, config.emergencyFund)}`);
  ns.print(`ROI Threshold: ${config.roiThreshold} hours`);
  
  // Show enabled modules
  const enabledModules = [];
  if (config.modules.hacking) enabledModules.push("Hacking");
  if (config.modules.servers) enabledModules.push("Servers");
  if (config.modules.hacknet) enabledModules.push("Hacknet");
  if (modules.factions) enabledModules.push("Factions" + (modules.factions.hasSingularityAccess() ? "" : " (locked)"));
  if (modules.companies) enabledModules.push("Companies" + (modules.companies.hasSingularityAccess() ? "" : " (locked)"));
  if (modules.augmentations) enabledModules.push("Augmentations" + (modules.augmentations.hasSingularityAccess() ? "" : " (locked)"));
  if (modules.bladeburner) enabledModules.push("Bladeburner" + (modules.bladeburner.hasBladeburnerAccess() ? "" : " (locked)"));
  if (modules.gangs) enabledModules.push("Gangs" + (modules.gangs.hasGangAccess() ? "" : " (locked)"));
  if (modules.corporations) enabledModules.push("Corporations" + (modules.corporations.hasCorporationAccess() ? "" : " (locked)"));
  if (modules.go) enabledModules.push("Go" + (modules.go.hasGoAccess() ? "" : " (locked)"));
  
  ns.print(`Enabled Modules: ${enabledModules.join(', ')}`);
  ns.print("═════════════════════════════════════════════════════════");

  if (mode === 'monitor') {
    // Just show current status and exit
    await printStatus(ns, state);
    return;
  }

  while (state.running) {
    try {
      const now = Date.now();
      
      // ANALYSIS PHASE
      ns.print("[ANALYSIS] Starting phase...");
      
      // Get current player state
      const player = ns.getPlayer();
      const currentMoney = player.money;
      
      // Update fleet state
      state.fleet = await getServerFleetState(ns);
      
      // Get current income
      state.currentIncome = await getCurrentIncome(ns);
      
      // Run profit analysis - scan ALL servers on the network
      ns.print("[ANALYSIS] Scanning network for profitable targets...");
      
      const allServers = scanAllServers(ns);
      let analysisResults = [];
      
      for (const hostname of allServers) {
        const analysis = analyzeServer(ns, hostname);
        if (analysis) {
          analysisResults.push(analysis);
        }
      }
      
      ns.print(`[ANALYSIS] Found ${analysisResults.length} hackable servers`);
      
      const targets = analyzeProfitTargets(ns, analysisResults);
      const bestTarget = targets[0];
      
      if (bestTarget) {
        ns.print(`[ANALYSIS] Best target: ${bestTarget.server} (Score: ${bestTarget.finalScore})`);
      } else {
        ns.print(`[ANALYSIS] No accessible targets found`);
      }
      
      // DECISION PHASE
      if (bestTarget && bestTarget.server !== state.currentTarget) {
        const improvementRatio = bestTarget.finalScore / (state.currentIncome > 0 ? state.currentIncome * 10 : 10000);
        
        if (improvementRatio > 1.5 || !state.currentTarget) {
          // Calculate optimal hack % for this target
          const optimalHackPercent = calculateOptimalHackPercent(ns, bestTarget, state.fleet, mode);
          
          ns.print(`[DECISION] Retarget: ${state.currentTarget || 'None'} → ${bestTarget.server}`);
          ns.print(`[PREDICTION] Income improvement: ${(improvementRatio).toFixed(2)}x`);
          ns.print(`[STRATEGY] Optimal hack rate: ${(optimalHackPercent * 100).toFixed(1)}%`);
          ns.print(`  Server: ${formatMoney(ns, bestTarget.maxMoney)} pool, Prep: ${bestTarget.needsPrep ? 'NEEDED' : 'READY'}, Fleet: ${state.fleet.totalRAM.toFixed(0)}GB`);
          
          if (mode !== 'analyze-only') {
            await deployBatcher(ns, bestTarget.server, optimalHackPercent, true);
            state.currentTarget = bestTarget.server;
            state.recentActions.push({
              type: 'retarget',
              description: `Retarget to ${bestTarget.server} (${(optimalHackPercent * 100).toFixed(1)}% hack)`,
              timestamp: Date.now()
            });
          } else {
            ns.print(`[PREVIEW] Would retarget to ${bestTarget.server} with ${(optimalHackPercent * 100).toFixed(1)}% hack rate`);
          }
        }
      }
      
      // INVESTMENT PHASE - Compare servers vs Hacknet
      if (mode !== 'deployment-only' && mode !== 'analyze-only') {
        const availableForInvestment = Math.min(
          currentMoney - config.emergencyFund,
          currentMoney * config.maxInvestmentRatio
        );
        
        // Get both server and Hacknet investment options
        const serverDecisions = evaluateServerInvestment(ns, state.currentIncome, currentMoney, state.fleet);
        const hacknetDecisions = evaluateHacknetInvestments(ns, availableForInvestment);
        
        // Combine and sort by ROI (lower is better)
        const allDecisions = [...serverDecisions, ...hacknetDecisions].sort((a, b) => a.roiHours - b.roiHours);
        
        // Show Hacknet stats if enabled
        if (config.enableHacknet) {
          const hacknetStats = getHacknetStats(ns);
          ns.print(`[HACKNET] Nodes: ${hacknetStats.numNodes}, Production: ${formatMoney(ns, hacknetStats.totalProduction)}/s`);
        }
        
        // Execute the best investment
        for (const decision of allDecisions) {
          const isHacknet = decision.type.startsWith('hacknet-');
          const investmentType = isHacknet ? 'HACKNET' : 'SERVER';
          
          ns.print(`[${investmentType}] ${decision.reason}`);
          ns.print(`[PREDICTION] Cost: ${formatMoney(ns, decision.cost)}, ROI: ${decision.roiHours.toFixed(2)}h, Income: +${formatMoney(ns, decision.production)}/s`);
          
          if (mode !== 'analyze-only') {
            let success = false;
            
            // Execute based on type
            if (isHacknet) {
              success = await executeHacknetUpgrade(ns, decision);
            } else if (decision.type === 'purchase') {
              success = await purchaseServers(ns, decision.quantity, decision.ram);
            } else if (decision.type === 'upgrade') {
              success = await upgradeServers(ns, decision.targetRAM);
            }
            
            if (success) {
              state.recentActions.push({
                type: decision.type,
                description: decision.reason,
                timestamp: Date.now()
              });
              
              ns.print(`✓ SUCCESS: ${decision.reason}`);
              
              // Update state after changes
              await ns.sleep(2000);
              state.fleet = await getServerFleetState(ns);
              
              // Only do one investment per cycle
              break;
            } else {
              ns.print(`✗ FAILED: ${decision.reason}`);
            }
          } else {
            ns.print(`[PREVIEW] Would execute: ${decision.reason}`);
          }
          
          // Only show top 3 options in analyze mode
          if (mode === 'analyze-only' && allDecisions.indexOf(decision) >= 2) {
            break;
          }
        }
      }
      
      // MODULE DECISION PHASE - Coordinate all automation modules
      if (mode !== 'analyze-only' && mode !== 'deployment-only') {
        ns.print("[MODULES] Coordinating automation modules...");
        const moduleDecisions = await coordinateModuleDecisions(ns);
        
        if (moduleDecisions.length > 0) {
          ns.print(`[MODULES] Found ${moduleDecisions.length} recommended actions`);
          
          // Execute highest priority decision (first in sorted list)
          const topDecision = moduleDecisions[0];
          ns.print(`[MODULES] ${topDecision.module.toUpperCase()}: ${topDecision.reason} (Priority: ${topDecision.priority})`);
          
          const success = await executeModuleDecision(ns, topDecision, state);
          if (success) {
            state.recentActions.push({
              type: topDecision.module,
              description: `${topDecision.module}: ${topDecision.reason}`,
              timestamp: Date.now()
            });
          }
          
          // Show other pending decisions (for awareness)
          if (moduleDecisions.length > 1) {
            ns.print(`[MODULES] ${moduleDecisions.length - 1} other actions pending:`);
            for (let i = 1; i < Math.min(4, moduleDecisions.length); i++) {
              const dec = moduleDecisions[i];
              ns.print(`  - ${dec.module}: ${dec.reason} (${dec.priority})`);
            }
          }
        } else {
          ns.print("[MODULES] All modules optimized, no actions needed");
        }
      }
      
      state.lastDecision = Date.now();
      
      // MONITORING PHASE
      if (mode !== 'analyze-only') {
        await printStatus(ns, state);
      }
      
      // Wait for next cycle
      ns.print(`[WAIT] Next cycle in ${formatDuration(config.monitorInterval)}`);
      
      while (Date.now() - state.lastDecision < config.monitorInterval && state.running) {
        await ns.sleep(5000);
        
        // Check for user interrupt
        const currentPid = ns.pid;
        if (!ns.isRunning(currentPid)) {
          state.running = false;
          break;
        }
      }
      
    } catch (error) {
      ns.print(`✗ ERROR: ${error}`);
      await ns.sleep(10000); // Wait before retrying
    }
  }
  
  ns.print("🛑 Auto-Manager stopped");
}
