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
  function checkAPI(apiName) {
    try {
      switch (apiName) {
        case "singularity":
          return ns.singularity !== undefined;
        case "bladeburner":
          return ns.bladeburner !== undefined;
        case "gang":
          return ns.gang !== undefined && ns.gang.inGang();
        case "corporation":
          return ns.corporation !== undefined && ns.corporation.hasCorporation();
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
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("✅ All automation launched! Monitoring for crashes...");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Main monitoring loop
  while (true) {
    await ns.sleep(CONFIG.checkInterval);
    
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
    
    // Periodic status update
    if (runningProcesses.size > 0) {
      ns.print("─────────────────────────────────────────────────────────");
      ns.print(`Status Update - ${new Date().toLocaleTimeString()}`);
      ns.print("─────────────────────────────────────────────────────────");
      
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
