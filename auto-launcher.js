/** auto-launcher.js
 * 
 * ONE-COMMAND AUTOMATION ORCHESTRATOR
 * 
 * This is the "one command" solution you wanted!
 * 
 * How it works:
 * - Detects which Source Files you have unlocked
 * - Launches appropriate modules as SEPARATE processes (ns.run)
 * - Monitors all modules and restarts if they crash
 * - No imports = No massive RAM cost!
 * 
 * RAM Cost: ~2-3GB (just for the launcher itself)
 * Each module runs separately with its own RAM
 * 
 * Usage:
 *   run auto-launcher.js
 * 
 * That's it! Everything runs automatically from this one command.
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const CONFIG = {
    checkInterval: 60000,  // Check every 60 seconds
    restartDelay: 5000,    // Wait 5 seconds before restarting crashed module
    
    // Dashboard settings
    dashboard: {
      enabled: true,         // Auto-launch dashboard
      script: "dashboard.js",
      refreshRate: 2000      // Dashboard refresh rate (ms)
    },
    
    // RAM upgrade settings
    ramUpgrade: {
      enabled: true,          // Auto-upgrade home RAM
      priority: true,         // Prioritize RAM upgrades over other purchases
      targetRAM: 1024,        // Ultimate goal: 1TB (will auto-stop when reached)
      minMoneyReserve: 1000000, // Keep at least $1m after purchase
      checkInterval: 30000    // Check for upgrades every 30 seconds
    },
    
    // Module definitions
    modules: {
      // Core automation (always runs)
      batchManager: {
        script: "batch/batch-manager.js",
        args: [],
        threads: 1,
        enabled: true,
        displayName: "Batch Manager (Core)"
      },
      
      hacknetManager: {
        script: "hacknet-farm-manager.js",
        args: [],
        threads: 1,
        enabled: true,
        displayName: "Hacknet Farm"
      },
      
      // SF4 modules (Singularity)
      factionManager: {
        script: "modules/faction-manager.js",
        args: [],
        threads: 1,
        requireAPI: "singularity",
        displayName: "Faction Manager (SF4)"
      },
      
      companyAutomator: {
        script: "modules/company-automator.js",
        args: [],
        threads: 1,
        requireAPI: "singularity",
        displayName: "Company Automator (SF4)"
      },
      
      augmentationTracker: {
        script: "modules/augmentation-tracker.js",
        args: [],
        threads: 1,
        requireAPI: "singularity",
        displayName: "Augmentation Tracker (SF4)"
      },
      
      // SF6/SF7 module (Bladeburner)
      bladeburnerCommander: {
        script: "modules/bladeburner-commander.js",
        args: [],
        threads: 1,
        requireAPI: "bladeburner",
        displayName: "Bladeburner Commander (SF6/SF7)"
      },
      
      // SF2 module (Gang)
      gangManager: {
        script: "modules/gang-manager.js",
        args: [],
        threads: 1,
        requireAPI: "gang",
        displayName: "Gang Manager (SF2)"
      },
      
      // SF3 module (Corporation)
      corporationManager: {
        script: "modules/corporation-manager.js",
        args: [],
        threads: 1,
        requireAPI: "corporation",
        displayName: "Corporation Manager (SF3)"
      },
      
      // Go game (if unlocked)
      goCommander: {
        script: "go4.js",
        args: [],
        threads: 1,
        requireAPI: "go",
        displayName: "Go Commander"
      }
    }
  };
  
  // Track running processes
  const runningProcesses = new Map();
  const crashCount = new Map();
  const MAX_CRASHES = 3;
  
  // Helper: Check if API is available
  // NOTE: We only check if API exists, not if player is using it
  // The modules themselves will handle checking if player is in gang/has corp/etc
  function checkAPI(apiName) {
    try {
      switch (apiName) {
        case "singularity":
          return ns.singularity !== undefined;
        case "bladeburner":
          return ns.bladeburner !== undefined;
        case "gang":
          return ns.gang !== undefined;  // Just check API exists, module will check if in gang
        case "corporation":
          return ns.corporation !== undefined;  // Just check API exists, module will check if has corp
        case "go":
          return ns.go !== undefined;
        default:
          return true;
      }
    } catch (e) {
      return false;
    }
  }
  
  // Helper: Check if script file exists
  function scriptExists(filename) {
    return ns.fileExists(filename, "home");
  }
  
  // Helper: Launch a module
  function launchModule(moduleKey, moduleConfig) {
    try {
      const pid = ns.run(moduleConfig.script, moduleConfig.threads, ...moduleConfig.args);
      
      if (pid > 0) {
        runningProcesses.set(moduleKey, {
          pid: pid,
          script: moduleConfig.script,
          displayName: moduleConfig.displayName,
          startTime: Date.now()
        });
        ns.print(`✓ Started: ${moduleConfig.displayName}`);
        return true;
      } else {
        ns.print(`✗ Failed to start: ${moduleConfig.displayName} (no RAM?)`);
        return false;
      }
    } catch (e) {
      ns.print(`✗ Error starting ${moduleConfig.displayName}: ${e}`);
      return false;
    }
  }
  
  // Helper: Check if process is still running
  function isProcessRunning(pid) {
    return ns.isRunning(pid);
  }
  
  // Helper: Format uptime
  function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
  
  // Helper: Format money
  function formatMoney(num) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}t`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}b`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}m`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}k`;
    return `$${num.toFixed(2)}`;
  }
  
  // Helper: Check if RAM upgrade should be prioritized
  function isRAMUpgradePriority() {
    if (!CONFIG.ramUpgrade.enabled || !CONFIG.ramUpgrade.priority) return false;
    if (!ns.singularity?.getUpgradeHomeRamCost) return false;
    
    const currentRAM = ns.getServerMaxRam("home");
    if (currentRAM >= CONFIG.ramUpgrade.targetRAM) return false;
    
    // RAM upgrade is priority if we have failed modules
    return failedModules.length > 0;
  }
  
  // Helper: Check if we should upgrade home RAM
  function shouldUpgradeRAM() {
    if (!CONFIG.ramUpgrade.enabled) return false;
    
    const currentRAM = ns.getServerMaxRam("home");
    if (currentRAM >= CONFIG.ramUpgrade.targetRAM) return false;
    
    const upgradeCost = ns.singularity?.getUpgradeHomeRamCost?.();
    if (!upgradeCost) return false; // No singularity access
    
    const currentMoney = ns.getPlayer().money;
    const afterPurchase = currentMoney - upgradeCost;
    
    return afterPurchase >= CONFIG.ramUpgrade.minMoneyReserve;
  }
  
  // Helper: Get how much money we're saving for RAM
  function getRAMSavingTarget() {
    if (!isRAMUpgradePriority()) return 0;
    
    const upgradeCost = ns.singularity?.getUpgradeHomeRamCost?.();
    if (!upgradeCost) return 0;
    
    return upgradeCost + CONFIG.ramUpgrade.minMoneyReserve;
  }
  
  // Helper: Upgrade home RAM
  async function upgradeHomeRAM() {
    const currentRAM = ns.getServerMaxRam("home");
    const upgradeCost = ns.singularity?.getUpgradeHomeRamCost?.();
    
    if (!upgradeCost) return false;
    
    ns.print("");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("💰 UPGRADING HOME RAM!");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print(`Current RAM: ${currentRAM}GB → ${currentRAM * 2}GB`);
    ns.print(`Cost: ${formatMoney(upgradeCost)}`);
    
    const success = ns.singularity.upgradeHomeRam();
    
    if (success) {
      ns.print("✓ RAM upgraded successfully!");
      ns.print("");
      ns.print("Attempting to launch failed modules with new RAM...");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      
      return true;
    } else {
      ns.print("✗ RAM upgrade failed!");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      return false;
    }
  }
  
  // Helper: Try to launch failed modules
  async function launchFailedModules(availableAPIs, failedModules) {
    let newlyStarted = 0;
    
    for (const moduleKey of failedModules) {
      const moduleConfig = CONFIG.modules[moduleKey];
      
      // Check if still should skip
      if (moduleConfig.enabled === false) continue;
      if (!scriptExists(moduleConfig.script)) continue;
      if (moduleConfig.requireAPI && !availableAPIs[moduleConfig.requireAPI]) continue;
      
      // Try to launch
      if (launchModule(moduleKey, moduleConfig)) {
        newlyStarted++;
        crashCount.set(moduleKey, 0);
        await ns.sleep(500);
      }
    }
    
    return newlyStarted;
  }
  
  // Initial startup
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🚀 AUTO-LAUNCHER - One Command, Full Automation");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print("Detecting available features...");
  ns.print("");
  
  // Check what's available
  const availableAPIs = {
    singularity: checkAPI("singularity"),
    bladeburner: checkAPI("bladeburner"),
    gang: checkAPI("gang"),
    corporation: checkAPI("corporation"),
    go: checkAPI("go")
  };
  
  ns.print("Available APIs:");
  if (availableAPIs.singularity) ns.print("  ✓ Singularity (SF4) - Factions, Companies, Augmentations");
  if (availableAPIs.bladeburner) ns.print("  ✓ Bladeburner (SF6/SF7)");
  if (availableAPIs.gang) ns.print("  ✓ Gang (SF2)");
  if (availableAPIs.corporation) ns.print("  ✓ Corporation (SF3)");
  if (availableAPIs.go) ns.print("  ✓ Go");
  
  const unlockedCount = Object.values(availableAPIs).filter(v => v).length;
  if (unlockedCount === 0) {
    ns.print("  (No advanced features unlocked yet - running core automation only)");
  }
  ns.print("");
  
  // Launch all applicable modules
  ns.print("Starting automation modules...");
  ns.print("");
  
  let startedCount = 0;
  let skippedCount = 0;
  const skippedModules = [];
  const failedModules = []; // Track modules that failed to start (likely due to RAM)
  
  for (const [moduleKey, moduleConfig] of Object.entries(CONFIG.modules)) {
    // Check if explicitly disabled
    if (moduleConfig.enabled === false) {
      skippedCount++;
      continue;
    }
    
    // Check if script exists
    if (!scriptExists(moduleConfig.script)) {
      ns.print(`⚠️  Skipping ${moduleConfig.displayName}: Script not found (${moduleConfig.script})`);
      skippedModules.push(`${moduleConfig.displayName} (missing file)`);
      skippedCount++;
      continue;
    }
    
    // Check if required API is available
    if (moduleConfig.requireAPI && !availableAPIs[moduleConfig.requireAPI]) {
      skippedModules.push(`${moduleConfig.displayName} (API locked)`);
      skippedCount++;
      continue;
    }
    
    // Launch it!
    if (launchModule(moduleKey, moduleConfig)) {
      startedCount++;
      crashCount.set(moduleKey, 0);
    } else {
      skippedCount++;
      skippedModules.push(`${moduleConfig.displayName} (start failed)`);
      failedModules.push(moduleKey); // Track for later retry
    }
    
    // Small delay between launches
    await ns.sleep(500);
  }
  
  ns.print("");
  ns.print(`✓ Started ${startedCount} modules`);
  if (skippedModules.length > 0) {
    ns.print(`Skipped ${skippedCount} modules:`);
    for (const skipped of skippedModules) {
      ns.print(`  • ${skipped}`);
    }
  }
  
  // Show RAM upgrade status
  if (CONFIG.ramUpgrade.enabled && availableAPIs.singularity) {
    const currentRAM = ns.getServerMaxRam("home");
    const usedRAM = ns.getServerUsedRam("home");
    const freeRAM = currentRAM - usedRAM;
    const upgradeCost = ns.singularity.getUpgradeHomeRamCost();
    const currentMoney = ns.getPlayer().money;
    const savingTarget = getRAMSavingTarget();
    
    ns.print("");
    ns.print("RAM Status:");
    ns.print(`  Current: ${currentRAM}GB (${freeRAM.toFixed(1)}GB free)`);
    
    if (failedModules.length > 0) {
      ns.print(`  ⚠️  ${failedModules.length} modules failed (likely insufficient RAM)`);
      ns.print(`  Next upgrade: ${currentRAM}GB → ${currentRAM * 2}GB (${formatMoney(upgradeCost)})`);
      
      if (CONFIG.ramUpgrade.priority && isRAMUpgradePriority()) {
        ns.print(`  🎯 PRIORITY MODE: Saving for RAM upgrade first!`);
        const remaining = savingTarget - currentMoney;
        if (remaining > 0) {
          ns.print(`  💰 Need ${formatMoney(remaining)} more (${((currentMoney/savingTarget)*100).toFixed(1)}% saved)`);
        } else {
          ns.print(`  💰 Ready to upgrade! Will upgrade in next check...`);
        }
      } else {
        ns.print(`  💰 Auto-upgrade enabled! Will upgrade when affordable.`);
      }
    } else if (currentRAM < CONFIG.ramUpgrade.targetRAM) {
      ns.print(`  Next upgrade: ${currentRAM}GB → ${currentRAM * 2}GB (${formatMoney(upgradeCost)})`);
      ns.print(`  💰 Auto-upgrade enabled!`);
    } else {
      ns.print(`  ✓ Target RAM reached (${CONFIG.ramUpgrade.targetRAM}GB)`);
    }
  }
  
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("✅ All automation launched! Monitoring for crashes...");
  if (CONFIG.ramUpgrade.enabled && failedModules.length > 0) {
    ns.print("💰 Will auto-upgrade RAM to launch failed modules");
    if (CONFIG.ramUpgrade.priority) {
      ns.print("🎯 RAM UPGRADE PRIORITY MODE ACTIVE");
      ns.print("   System will focus on RAM upgrades first!");
    }
  }
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Launch dashboard automatically
  let dashboardPID = 0;
  if (CONFIG.dashboard.enabled && scriptExists(CONFIG.dashboard.script)) {
    ns.print("📊 Launching real-time dashboard...");
    try {
      dashboardPID = ns.run(CONFIG.dashboard.script, 1, `--refresh`, CONFIG.dashboard.refreshRate);
      if (dashboardPID > 0) {
        ns.print(`✓ Dashboard started! (PID: ${dashboardPID})`);
        ns.print("   Monitor your automation in real-time!");
      } else {
        ns.print("⚠️  Dashboard failed to start (insufficient RAM?)");
      }
    } catch (e) {
      ns.print(`⚠️  Dashboard error: ${e}`);
    }
    ns.print("");
  }
  
  // Main monitoring loop
  let lastRAMCheck = Date.now();
  
  while (true) {
    await ns.sleep(CONFIG.checkInterval);
    
    // Check dashboard
    if (dashboardPID > 0 && !isProcessRunning(dashboardPID)) {
      ns.print("");
      ns.print("⚠️  Dashboard crashed! Restarting...");
      try {
        dashboardPID = ns.run(CONFIG.dashboard.script, 1, `--refresh`, CONFIG.dashboard.refreshRate);
        if (dashboardPID > 0) {
          ns.print("✓ Dashboard restarted successfully");
        } else {
          ns.print("✗ Dashboard restart failed");
        }
      } catch (e) {
        ns.print(`✗ Dashboard restart error: ${e}`);
      }
      ns.print("");
    }
    
    // Check each running process
    for (const [moduleKey, processInfo] of runningProcesses.entries()) {
      if (!isProcessRunning(processInfo.pid)) {
        // Process died!
        const crashes = crashCount.get(moduleKey) || 0;
        
        ns.print("");
        ns.print(`⚠️  ${processInfo.displayName} crashed!`);
        
        if (crashes < MAX_CRASHES) {
          ns.print(`   Restarting in 5 seconds... (crash #${crashes + 1})`);
          crashCount.set(moduleKey, crashes + 1);
          
          await ns.sleep(CONFIG.restartDelay);
          
          const moduleConfig = CONFIG.modules[moduleKey];
          if (launchModule(moduleKey, moduleConfig)) {
            ns.print(`   ✓ Restarted successfully`);
          } else {
            ns.print(`   ✗ Restart failed`);
          }
        } else {
          ns.print(`   ✗ Too many crashes (${MAX_CRASHES}). Not restarting.`);
          ns.print(`   Manual intervention required: run ${processInfo.script}`);
          runningProcesses.delete(moduleKey);
        }
        ns.print("");
      }
    }
    
    // Check if we should upgrade RAM
    const now = Date.now();
    if (CONFIG.ramUpgrade.enabled && 
        failedModules.length > 0 && 
        now - lastRAMCheck >= CONFIG.ramUpgrade.checkInterval) {
      
      lastRAMCheck = now;
      
      if (shouldUpgradeRAM()) {
        const upgraded = await upgradeHomeRAM();
        
        if (upgraded) {
          // Try to launch failed modules with new RAM
          const newlyStarted = await launchFailedModules(availableAPIs, failedModules);
          
          if (newlyStarted > 0) {
            ns.print(`✓ Successfully started ${newlyStarted} additional modules!`);
            
            // Remove successfully started modules from failed list
            const stillFailed = [];
            for (const moduleKey of failedModules) {
              if (!runningProcesses.has(moduleKey)) {
                stillFailed.push(moduleKey);
              }
            }
            failedModules.length = 0;
            failedModules.push(...stillFailed);
            
            if (failedModules.length === 0) {
              ns.print("🎉 All modules now running!");
            } else {
              ns.print(`⚠️  ${failedModules.length} modules still need more RAM`);
            }
          } else {
            ns.print("⚠️  Still not enough RAM for remaining modules");
          }
          ns.print("");
        }
      }
    }
    
    // Periodic status update
    if (runningProcesses.size > 0) {
      ns.print("─────────────────────────────────────────────────────────");
      ns.print(`Status Update - ${new Date().toLocaleTimeString()}`);
      ns.print("─────────────────────────────────────────────────────────");
      
      // Show RAM info
      const currentRAM = ns.getServerMaxRam("home");
      const usedRAM = ns.getServerUsedRam("home");
      const freeRAM = currentRAM - usedRAM;
      ns.print(`RAM: ${usedRAM.toFixed(1)}GB / ${currentRAM}GB (${freeRAM.toFixed(1)}GB free)`);
      
      // Show module status
      ns.print(`Running: ${runningProcesses.size} modules`);
      if (failedModules.length > 0) {
        ns.print(`Waiting for RAM: ${failedModules.length} modules`);
        
        if (CONFIG.ramUpgrade.enabled && availableAPIs.singularity) {
          const upgradeCost = ns.singularity.getUpgradeHomeRamCost();
          const currentMoney = ns.getPlayer().money;
          const savingTarget = getRAMSavingTarget();
          
          if (isRAMUpgradePriority()) {
            // Priority mode - show progress toward RAM
            ns.print(`🎯 PRIORITY: Saving for RAM upgrade`);
            const remaining = savingTarget - currentMoney;
            if (remaining > 0) {
              const percent = ((currentMoney/savingTarget)*100).toFixed(1);
              ns.print(`💰 Progress: ${formatMoney(currentMoney)} / ${formatMoney(savingTarget)} (${percent}%)`);
            } else {
              ns.print(`💰 Upgrading RAM soon... (${formatMoney(upgradeCost)})`);
            }
          } else {
            // Normal mode
            if (currentMoney >= upgradeCost + CONFIG.ramUpgrade.minMoneyReserve) {
              ns.print(`💰 Upgrading RAM soon... (${formatMoney(upgradeCost)})`);
            } else {
              const needed = upgradeCost + CONFIG.ramUpgrade.minMoneyReserve - currentMoney;
              ns.print(`💰 Saving for RAM upgrade (need ${formatMoney(needed)} more)`);
            }
          }
        }
      }
      ns.print("");
      
      for (const [moduleKey, processInfo] of runningProcesses.entries()) {
        const uptime = Date.now() - processInfo.startTime;
        const crashes = crashCount.get(moduleKey) || 0;
        const crashInfo = crashes > 0 ? ` (crashes: ${crashes})` : "";
        ns.print(`✓ ${processInfo.displayName}: ${formatUptime(uptime)}${crashInfo}`);
      }
      
      ns.print("─────────────────────────────────────────────────────────");
      ns.print("");
    }
  }
}
