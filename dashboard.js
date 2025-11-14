/** dashboard.js
 * 
 * COMPREHENSIVE AUTOMATION DASHBOARD
 * 
 * Real-time monitoring and analytics for the entire automation suite:
 * - Performance metrics and KPIs
 * - Active operations tracking
 * - Resource utilization
 * - Income analytics
 * - Strategic recommendations
 * - Alerts and notifications
 * 
 * Usage:
 *   run dashboard.js
 *   run dashboard.js --compact    # Smaller view
 *   run dashboard.js --detailed   # Extra detail
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  ns.resizeTail(1200, 800);
  
  const args = ns.flags([
    ["compact", false],
    ["detailed", false],
    ["refresh", 2000]  // Refresh rate in ms
  ]);
  
  // Helper: Format money
  function fmt(num) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}t`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}b`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}m`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}k`;
    return `$${num.toFixed(2)}`;
  }
  
  // Helper: Format time
  function fmtTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  // Helper: Format number with commas
  function fmtNum(num) {
    return num.toLocaleString('en-US');
  }
  
  // Helper: Progress bar
  function progressBar(current, max, width = 20) {
    const percent = Math.min(100, (current / max) * 100);
    const filled = Math.floor((percent / 100) * width);
    const empty = width - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percent.toFixed(1)}%`;
  }
  
  // Track historical data
  let lastMoney = ns.getPlayer().money;
  let lastUpdate = Date.now();
  const incomeHistory = [];
  const MAX_HISTORY = 60; // Keep 60 data points
  
  // Main dashboard loop
  while (true) {
    const now = Date.now();
    const player = ns.getPlayer();
    const currentMoney = player.money;
    
    // Check if we have SF4
    const hasSF4 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 4);
    
    // Calculate income rate
    const timeDiff = (now - lastUpdate) / 1000; // seconds
    const moneyDiff = currentMoney - lastMoney;
    const incomePerSec = timeDiff > 0 ? moneyDiff / timeDiff : 0;
    
    // Track income history
    incomeHistory.push(incomePerSec);
    if (incomeHistory.length > MAX_HISTORY) incomeHistory.shift();
    
    const avgIncome = incomeHistory.reduce((a, b) => a + b, 0) / incomeHistory.length;
    
    lastMoney = currentMoney;
    lastUpdate = now;
    
    // Clear screen
    ns.clearLog();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════════════════════════════════════
    ns.print("═══════════════════════════════════════════════════════════════════════════");
    ns.print("🎛️  AUTOMATION DASHBOARD - Real-Time Monitoring & Analytics");
    ns.print("═══════════════════════════════════════════════════════════════════════════");
    ns.print(`⏰ ${new Date().toLocaleString()}  |  📊 Update Rate: ${args.refresh}ms`);
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // KEY PERFORMANCE INDICATORS
    // ═══════════════════════════════════════════════════════════════════════════
    ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
    ns.print("│ 💰 FINANCIAL METRICS                                                    │");
    ns.print("├─────────────────────────────────────────────────────────────────────────┤");
    
    ns.print(`│ Current Balance:      ${fmt(currentMoney).padEnd(20)} 📈 ${incomePerSec >= 0 ? "+" : ""}${fmt(incomePerSec * 60)}/min`.padEnd(74) + "│");
    ns.print(`│ Income Rate:          ${fmt(incomePerSec)}/sec`.padEnd(75) + "│");
    ns.print(`│ Average (2min):       ${fmt(avgIncome)}/sec`.padEnd(75) + "│");
    
    // Projections
    const hourProjection = currentMoney + (avgIncome * 3600);
    const dayProjection = currentMoney + (avgIncome * 86400);
    ns.print(`│ 1-Hour Projection:    ${fmt(hourProjection)}`.padEnd(75) + "│");
    ns.print(`│ 24-Hour Projection:   ${fmt(dayProjection)}`.padEnd(75) + "│");
    ns.print("└─────────────────────────────────────────────────────────────────────────┘");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SYSTEM RESOURCES
    // ═══════════════════════════════════════════════════════════════════════════
    ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
    ns.print("│ 🖥️  SYSTEM RESOURCES                                                     │");
    ns.print("├─────────────────────────────────────────────────────────────────────────┤");
    
    const homeRAM = ns.getServerMaxRam("home");
    const homeUsed = ns.getServerUsedRam("home");
    const homeFree = homeRAM - homeUsed;
    const ramPercent = (homeUsed / homeRAM) * 100;
    
    ns.print(`│ Home RAM:             ${homeUsed.toFixed(1)}GB / ${homeRAM}GB (${ramPercent.toFixed(1)}% used)`.padEnd(75) + "│");
    ns.print(`│ ${progressBar(homeUsed, homeRAM, 50)}`.padEnd(75) + "│");
    ns.print(`│ Free RAM:             ${homeFree.toFixed(1)}GB`.padEnd(75) + "│");
    
    // Network stats
    const allServers = getAllServers(ns);
    const rootedServers = allServers.filter(s => ns.hasRootAccess(s));
    const totalNetworkRAM = allServers.reduce((sum, s) => sum + ns.getServerMaxRam(s), 0);
    const usedNetworkRAM = allServers.reduce((sum, s) => sum + ns.getServerUsedRam(s), 0);
    
    ns.print(`│ Network Servers:      ${rootedServers.length} / ${allServers.length} rooted`.padEnd(75) + "│");
    ns.print(`│ Total Network RAM:    ${totalNetworkRAM.toFixed(1)}GB (${usedNetworkRAM.toFixed(1)}GB used)`.padEnd(75) + "│");
    ns.print("└─────────────────────────────────────────────────────────────────────────┘");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIVE MODULES
    // ═══════════════════════════════════════════════════════════════════════════
    ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
    ns.print("│ 🤖 ACTIVE MODULES                                                        │");
    ns.print("├─────────────────────────────────────────────────────────────────────────┤");
    
    const processes = ns.ps("home");
    const moduleStatus = {
      autoLauncher: processes.find(p => p.filename === "auto-launcher.js"),
      batchManager: processes.find(p => p.filename === "batch/batch-manager.js"),
      hacknetFarm: processes.find(p => p.filename === "hacknet-farm-manager.js"),
      factionManager: processes.find(p => p.filename === "modules/faction-manager.js"),
      companyAutomator: processes.find(p => p.filename === "modules/company-automator.js"),
      augTracker: processes.find(p => p.filename === "modules/augmentation-tracker.js"),
      bladeburner: processes.find(p => p.filename === "modules/bladeburner-commander.js"),
      gangManager: processes.find(p => p.filename === "modules/gang-manager.js"),
      corporation: processes.find(p => p.filename === "modules/corporation-manager.js"),
      go: processes.find(p => p.filename === "go4.js")
    };
    
    const status = (proc) => proc ? "✓ RUNNING" : "✗ OFFLINE";
    const statusColor = (proc) => proc ? "✓" : "✗";
    
    ns.print(`│ ${statusColor(moduleStatus.autoLauncher)} Auto-Launcher        ${status(moduleStatus.autoLauncher)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.batchManager)} Batch Manager        ${status(moduleStatus.batchManager)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.hacknetFarm)} Hacknet Farm         ${status(moduleStatus.hacknetFarm)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.factionManager)} Faction Manager      ${status(moduleStatus.factionManager)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.companyAutomator)} Company Automator    ${status(moduleStatus.companyAutomator)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.augTracker)} Augmentation Tracker ${status(moduleStatus.augTracker)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.bladeburner)} Bladeburner Commander ${status(moduleStatus.bladeburner)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.gangManager)} Gang Manager         ${status(moduleStatus.gangManager)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.corporation)} Corporation Manager  ${status(moduleStatus.corporation)}`.padEnd(75) + "│");
    ns.print(`│ ${statusColor(moduleStatus.go)} Go Commander         ${status(moduleStatus.go)}`.padEnd(75) + "│");
    
    const activeCount = Object.values(moduleStatus).filter(p => p).length;
    ns.print("├─────────────────────────────────────────────────────────────────────────┤");
    ns.print(`│ Total Active: ${activeCount}/10 modules running`.padEnd(75) + "│");
    ns.print("└─────────────────────────────────────────────────────────────────────────┘");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PLAYER STATS
    // ═══════════════════════════════════════════════════════════════════════════
    ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
    ns.print("│ 👤 PLAYER STATS                                                          │");
    ns.print("├─────────────────────────────────────────────────────────────────────────┤");
    
    ns.print(`│ Hacking:     ${player.skills.hacking.toLocaleString().padEnd(10)} Strength:   ${player.skills.strength.toLocaleString().padEnd(10)}`.padEnd(75) + "│");
    ns.print(`│ Defense:     ${player.skills.defense.toLocaleString().padEnd(10)} Dexterity:  ${player.skills.dexterity.toLocaleString().padEnd(10)}`.padEnd(75) + "│");
    ns.print(`│ Agility:     ${player.skills.agility.toLocaleString().padEnd(10)} Charisma:   ${player.skills.charisma.toLocaleString().padEnd(10)}`.padEnd(75) + "│");
    
    const karma = ns.heart.break();
    ns.print(`│ Karma:       ${karma.toLocaleString()}`.padEnd(75) + "│");
    
    // Augmentations
    const augCount = player.augmentations?.length || 0;
    ns.print(`│ Augmentations Installed: ${augCount}`.padEnd(75) + "│");
    
    ns.print("└─────────────────────────────────────────────────────────────────────────┘");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FACTION PROGRESS (if SF4)
    // ═══════════════════════════════════════════════════════════════════════════
    if (hasSF4) {
      ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
      ns.print("│ 🏛️  FACTION PROGRESS                                                     │");
      ns.print("├─────────────────────────────────────────────────────────────────────────┤");
      
      const factions = player.factions || [];
      if (factions.length > 0) {
        const topFactions = factions.slice(0, 5); // Show top 5
        for (const faction of topFactions) {
          const rep = ns.singularity.getFactionRep(faction);
          const favor = ns.singularity.getFactionFavor(faction);
          ns.print(`│ ${faction.padEnd(25)} Rep: ${fmtNum(Math.floor(rep))} | Favor: ${Math.floor(favor)}`.padEnd(75) + "│");
        }
        if (factions.length > 5) {
          ns.print(`│ ... and ${factions.length - 5} more factions`.padEnd(75) + "│");
        }
      } else {
        ns.print(`│ No factions joined yet`.padEnd(75) + "│");
      }
      
      ns.print("└─────────────────────────────────────────────────────────────────────────┘");
      ns.print("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HACKNET PERFORMANCE
    // ═══════════════════════════════════════════════════════════════════════════
    const hacknetCount = ns.hacknet.numNodes();
    if (hacknetCount > 0) {
      ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
      ns.print("│ 🌐 HACKNET PERFORMANCE                                                   │");
      ns.print("├─────────────────────────────────────────────────────────────────────────┤");
      
      let totalProduction = 0;
      for (let i = 0; i < hacknetCount; i++) {
        totalProduction += ns.hacknet.getNodeStats(i).production;
      }
      
      ns.print(`│ Active Nodes:         ${hacknetCount}`.padEnd(75) + "│");
      ns.print(`│ Production Rate:      ${fmt(totalProduction)}/sec`.padEnd(75) + "│");
      ns.print(`│ Hourly Income:        ${fmt(totalProduction * 3600)}`.padEnd(75) + "│");
      
      ns.print("└─────────────────────────────────────────────────────────────────────────┘");
      ns.print("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ALERTS & NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    const alerts = [];
    
    // Check for critical issues
    if (!moduleStatus.autoLauncher) alerts.push("⚠️  Auto-launcher is offline!");
    if (!moduleStatus.batchManager) alerts.push("⚠️  Batch manager is offline - no hacking income!");
    if (homeFree < 2) alerts.push("⚠️  Home RAM nearly full! Consider upgrade.");
    if (incomePerSec < 1000 && currentMoney > 1000000) alerts.push("💡 Low income rate - check automation");
    
    // Check for opportunities
    if (hasSF4) {
      const upgradeCost = ns.singularity.getUpgradeHomeRamCost();
      if (currentMoney > upgradeCost * 2) {
        alerts.push(`💰 Can afford RAM upgrade! (${fmt(upgradeCost)})`);
      }
      
      // Check for affordable augmentations
      const ownedAugs = player.augmentations?.map(a => a.name) || [];
      const factions = player.factions || [];
      let affordableAugs = 0;
      
      for (const faction of factions) {
        const augs = ns.singularity.getAugmentationsFromFaction(faction);
        for (const aug of augs) {
          if (!ownedAugs.includes(aug)) {
            const cost = ns.singularity.getAugmentationPrice(aug);
            const rep = ns.singularity.getAugmentationRepReq(aug);
            const currentRep = ns.singularity.getFactionRep(faction);
            
            if (currentMoney >= cost && currentRep >= rep) {
              affordableAugs++;
            }
          }
        }
      }
      
      if (affordableAugs > 0) {
        alerts.push(`🧬 ${affordableAugs} augmentations ready to purchase!`);
      }
    }
    
    if (alerts.length > 0) {
      ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
      ns.print("│ 🔔 ALERTS & NOTIFICATIONS                                                │");
      ns.print("├─────────────────────────────────────────────────────────────────────────┤");
      
      for (const alert of alerts) {
        ns.print(`│ ${alert}`.padEnd(75) + "│");
      }
      
      ns.print("└─────────────────────────────────────────────────────────────────────────┘");
      ns.print("");
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STRATEGIC RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    ns.print("┌─────────────────────────────────────────────────────────────────────────┐");
    ns.print("│ 💡 STRATEGIC RECOMMENDATIONS                                             │");
    ns.print("├─────────────────────────────────────────────────────────────────────────┤");
    
    const recommendations = [];
    
    // Priority recommendations
    if (!moduleStatus.autoLauncher) {
      recommendations.push("🚨 CRITICAL: Start auto-launcher.js for full automation");
    }
    
    if (homeRAM < 32 && currentMoney > 5000000) {
      recommendations.push("📈 Priority: Upgrade home RAM to 32GB+ for more modules");
    }
    
    if (player.skills.hacking < 100) {
      recommendations.push("🎓 Focus: Level hacking skill to 100+ for better targets");
    }
    
    if (ns.singularity && player.factions.length < 3) {
      recommendations.push("🏛️  Join more factions for augmentation access");
    }
    
    if (hacknetCount === 0 && currentMoney > 1000000) {
      recommendations.push("🌐 Consider: Start hacknet farm for passive income");
    }
    
    // Income optimization
    if (incomePerSec > 0 && incomePerSec < 10000) {
      recommendations.push("💰 Optimize: Income is low - upgrade servers or find better targets");
    }
    
    if (rootedServers.length < allServers.length - 5) {
      recommendations.push("🔓 Expand: Root more servers to increase hacking fleet");
    }
    
    // Show recommendations
    if (recommendations.length > 0) {
      for (let i = 0; i < Math.min(5, recommendations.length); i++) {
        ns.print(`│ ${i + 1}. ${recommendations[i]}`.padEnd(75) + "│");
      }
    } else {
      ns.print(`│ ✓ All systems optimal! Keep up the great work!`.padEnd(75) + "│");
    }
    
    ns.print("└─────────────────────────────────────────────────────────────────────────┘");
    ns.print("");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════════════════════
    ns.print("═══════════════════════════════════════════════════════════════════════════");
    ns.print("💡 Tip: Close this dashboard anytime - automation continues in background");
    ns.print("═══════════════════════════════════════════════════════════════════════════");
    
    await ns.sleep(args.refresh);
  }
}

// Helper: Get all servers in network
function getAllServers(ns, current = "home", visited = new Set()) {
  if (visited.has(current)) return [];
  visited.add(current);
  
  const neighbors = ns.scan(current);
  let servers = [current];
  
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      servers = servers.concat(getAllServers(ns, neighbor, visited));
    }
  }
  
  return servers;
}
