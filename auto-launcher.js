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
    
    // RAM upgrader settings
    ramUpgrader: {
      enabled: true,          // Auto-launch RAM upgrader
      script: "ram-upgrader.js"
    },
    
    // Module definitions
    modules: {
      // Core automation (always runs)
      // Note: batch-manager is heavy (~6GB), smart-batcher is lighter (~2-3GB)
      batchManager: {
        script: "batch/batch-manager.js",
        args: [],
        threads: 1,
        enabled: true,
        displayName: "Batch Manager (Core)",
        minRAM: 16,  // Needs 16GB+ home to run batch-manager
        fallback: {
          script: "batch/smart-batcher.js",
          args: ["joesguns", 0.05],  // target, hack 5%
          displayName: "Smart Batcher"
        }
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
      // Check if we should use fallback due to low RAM
      const homeRAM = ns.getServerMaxRam("home");
      let scriptToRun = moduleConfig.script;
      let argsToUse = moduleConfig.args;
      let displayName = moduleConfig.displayName;
      
      if (moduleConfig.minRAM && homeRAM < moduleConfig.minRAM && moduleConfig.fallback) {
        ns.print(`ℹ️  Home RAM (${homeRAM}GB) < ${moduleConfig.minRAM}GB, using fallback...`);
        scriptToRun = moduleConfig.fallback.script;
        argsToUse = moduleConfig.fallback.args;
        displayName = moduleConfig.fallback.displayName;
      }
      
      const pid = ns.run(scriptToRun, moduleConfig.threads, ...argsToUse);
      
      if (pid > 0) {
        runningProcesses.set(moduleKey, {
          pid: pid,
          script: scriptToRun,
          displayName: displayName,
          startTime: Date.now()
        });
        ns.print(`✓ Started: ${displayName}`);
        return true;
      } else {
        ns.print(`✗ Failed to start: ${displayName} (no RAM?)`);
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
  
  // Show RAM status (no expensive calls)
  const currentRAM = ns.getServerMaxRam("home");
  const usedRAM = ns.getServerUsedRam("home");
  const freeRAM = currentRAM - usedRAM;
  
  ns.print("");
  ns.print("RAM Status:");
  ns.print(`  Current: ${currentRAM}GB (${freeRAM.toFixed(1)}GB free)`);
  
  if (failedModules.length > 0) {
    ns.print(`  ⚠️  ${failedModules.length} modules failed (likely insufficient RAM)`);
    if (CONFIG.ramUpgrader.enabled && availableAPIs.singularity) {
      ns.print(`  💰 RAM upgrader will auto-upgrade when affordable`);
    } else if (!availableAPIs.singularity) {
      ns.print(`  ℹ️  Unlock SF4 for automatic RAM upgrades`);
    }
  }
  
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("✅ All automation launched! Monitoring for crashes...");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Launch dashboard automatically (skip on very low RAM)
  let dashboardPID = 0;
  if (currentRAM >= 16 && CONFIG.dashboard.enabled && scriptExists(CONFIG.dashboard.script)) {
    ns.print("📊 Launching real-time dashboard...");
    try {
      dashboardPID = ns.run(CONFIG.dashboard.script, 1, `--refresh`, CONFIG.dashboard.refreshRate);
      if (dashboardPID > 0) {
        ns.print(`✓ Dashboard started! (PID: ${dashboardPID})`);
      } else {
        ns.print("⚠️  Dashboard failed to start (insufficient RAM?)");
      }
    } catch (e) {
      ns.print(`⚠️  Dashboard error: ${e}`);
    }
  } else if (currentRAM < 16) {
    ns.print("ℹ️  Dashboard disabled (need 16GB+ RAM)");
    ns.print("   Upgrade home RAM for real-time monitoring");
  }
  
  // Launch RAM upgrader automatically (if SF4 available, skip on very low RAM)
  let ramUpgraderPID = 0;
  if (currentRAM >= 16 && CONFIG.ramUpgrader.enabled && availableAPIs.singularity && scriptExists(CONFIG.ramUpgrader.script)) {
    ns.print("💰 Launching RAM upgrader...");
    try {
      ramUpgraderPID = ns.run(CONFIG.ramUpgrader.script, 1);
      if (ramUpgraderPID > 0) {
        ns.print(`✓ RAM upgrader started! (PID: ${ramUpgraderPID})`);
        if (failedModules.length > 0) {
          ns.print(`   Will auto-upgrade RAM to launch ${failedModules.length} failed modules`);
        }
      } else {
        ns.print("⚠️  RAM upgrader failed to start (insufficient RAM?)");
      }
    } catch (e) {
      ns.print(`⚠️  RAM upgrader error: ${e}`);
    }
  } else if (currentRAM < 16 && availableAPIs.singularity) {
    ns.print("ℹ️  RAM upgrader disabled (need 16GB+ RAM)");
    ns.print("   Manually upgrade RAM then restart auto-launcher");
  } else if (!availableAPIs.singularity && currentRAM >= 16) {
    ns.print("ℹ️  RAM upgrader disabled (need SF4)");
    ns.print("   Manually upgrade RAM from main menu");
    ns.print("   Or complete BitNode 4 for auto-upgrades!");
  }
  
  ns.print("");
  
  // Main monitoring loop
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
    
    // Check RAM upgrader
    if (ramUpgraderPID > 0 && !isProcessRunning(ramUpgraderPID)) {
      ns.print("");
      ns.print("⚠️  RAM upgrader stopped! Restarting...");
      try {
        ramUpgraderPID = ns.run(CONFIG.ramUpgrader.script, 1);
        if (ramUpgraderPID > 0) {
          ns.print("✓ RAM upgrader restarted successfully");
        } else {
          ns.print("✗ RAM upgrader restart failed");
        }
      } catch (e) {
        ns.print(`✗ RAM upgrader restart error: ${e}`);
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
    
    // Note: RAM upgrades are now handled by ram-upgrader.js
    // It runs as a separate process and will restart failed modules after upgrading
    
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
        if (ramUpgraderPID > 0) {
          ns.print(`💰 RAM upgrader running (check its window for progress)`);
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
