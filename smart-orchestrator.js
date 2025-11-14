/** smart-orchestrator.js
 * 
 * INTELLIGENT SCRIPT ORCHESTRATOR
 * 
 * Dynamically loads/unloads scripts based on need
 * Saves RAM by running scripts only when necessary
 * Prioritizes money-making and essential automation
 * 
 * Features:
 * - Continuous scripts: Run always (batch-manager, server-scanner)
 * - Periodic scripts: Run every X minutes (hacknet, programs)
 * - One-time scripts: Run once when conditions met
 * - Smart RAM allocation
 * - Auto-restart failed scripts
 * 
 * Usage: run smart-orchestrator.js
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const CONFIG = {
    checkInterval: 10000, // Check every 10 seconds
    
    // Script categories with run frequencies
    scripts: {
      // CRITICAL: Always running (money making)
      continuous: [
        {
          name: "Money Maker",
          scripts: [
            { file: "batch/batch-manager.js", minRAM: 16, fallback: "bootstrap-income.js" },
            { file: "bootstrap-income.js", maxRAM: 15 } // Only if <16GB RAM
          ]
        },
        {
          name: "Server Scanner",
          script: "modules/server-scanner.js",
          requireSF: null
        }
      ],
      
      // PERIODIC: Run every X minutes
      periodic: [
        {
          name: "Hacknet Manager",
          script: "hacknet-farm-manager.js",
          interval: 300000, // 5 minutes
          requireSF: null
        },
        {
          name: "Program Buyer",
          script: "modules/program-buyer.js",
          interval: 1800000, // 30 minutes (programs don't change often)
          requireSF: 4,
          runOnce: true // Buy all programs then stop checking
        },
        {
          name: "Stock Trader",
          script: "modules/stock-trader.js",
          interval: 6000, // 6 seconds
          requireSF: 8
        }
      ],
      
      // ONE-TIME: Run once when conditions met, then stop
      oneTime: [
        {
          name: "Corporation Setup",
          script: "modules/corporation-manager.js",
          condition: (ns) => {
            try {
              return ns.corporation && ns.corporation.hasCorporation();
            } catch { return false; }
          },
          requireSF: 3
        },
        {
          name: "Gang Setup",
          script: "modules/gang-manager.js",
          condition: (ns) => {
            try {
              return ns.gang && ns.gang.inGang();
            } catch { return false; }
          },
          requireSF: 2
        }
      ],
      
      // BACKGROUND: Run in background, low priority
      background: [
        {
          name: "Bladeburner",
          script: "modules/bladeburner-automation.js",
          requireSF: [6, 7],
          condition: (ns) => {
            try {
              return ns.bladeburner && ns.bladeburner.inBladeburner();
            } catch { return false; }
          }
        }
      ]
    }
  };
  
  // State tracking
  const state = {
    running: new Map(), // pid -> script info
    lastRun: new Map(), // script -> last run time
    oneTimeCompleted: new Set(),
    programsBought: false
  };
  
  // Helper: Check if we have a Source File
  function hasSF(sfNum) {
    const player = ns.getPlayer();
    if (!player.sourceFiles) return false;
    if (Array.isArray(sfNum)) {
      return sfNum.some(n => player.sourceFiles.some(sf => sf.n === n));
    }
    return player.sourceFiles.some(sf => sf.n === sfNum);
  }
  
  // Helper: Get free RAM
  function getFreeRAM() {
    return ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
  }
  
  // Helper: Check if script is running
  function isRunning(scriptPath) {
    for (const [pid, info] of state.running) {
      if (info.script === scriptPath && ns.isRunning(pid)) {
        return true;
      }
    }
    return false;
  }
  
  // Helper: Start a script
  function startScript(scriptPath, displayName) {
    try {
      const scriptRAM = ns.getScriptRam(scriptPath);
      const freeRAM = getFreeRAM();
      
      if (scriptRAM > freeRAM) {
        return { success: false, reason: "insufficient_ram" };
      }
      
      const pid = ns.run(scriptPath, 1);
      if (pid > 0) {
        state.running.set(pid, {
          script: scriptPath,
          name: displayName,
          startTime: Date.now()
        });
        return { success: true, pid: pid };
      }
      return { success: false, reason: "failed_to_start" };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }
  
  // Helper: Stop a script
  function stopScript(scriptPath) {
    for (const [pid, info] of state.running) {
      if (info.script === scriptPath) {
        ns.kill(pid);
        state.running.delete(pid);
        return true;
      }
    }
    return false;
  }
  
  // Clean up dead processes
  function cleanupDeadProcesses() {
    for (const [pid, info] of state.running) {
      if (!ns.isRunning(pid)) {
        state.running.delete(pid);
      }
    }
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🧠 SMART ORCHESTRATOR - Intelligent Script Management");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Main loop
  while (true) {
    cleanupDeadProcesses();
    
    const homeRAM = ns.getServerMaxRam("home");
    const freeRAM = getFreeRAM();
    const now = Date.now();
    
    ns.clearLog();
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("🧠 SMART ORCHESTRATOR");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    ns.print(`RAM: ${ns.formatRam(homeRAM - freeRAM)} / ${ns.formatRam(homeRAM)} (${ns.formatRam(freeRAM)} free)`);
    ns.print(`Running: ${state.running.size} scripts`);
    ns.print("");
    
    // PRIORITY 1: Continuous scripts (money making!)
    ns.print("🔴 CONTINUOUS (Always Running):");
    for (const item of CONFIG.scripts.continuous) {
      if (item.scripts) {
        // Multiple script options (like money maker with fallback)
        let started = false;
        for (const scriptOpt of item.scripts) {
          // Check RAM constraints
          if (scriptOpt.minRAM && homeRAM < scriptOpt.minRAM) continue;
          if (scriptOpt.maxRAM && homeRAM > scriptOpt.maxRAM) continue;
          
          if (!isRunning(scriptOpt.file)) {
            const result = startScript(scriptOpt.file, item.name);
            if (result.success) {
              ns.print(`  ✓ Started: ${item.name} (${scriptOpt.file})`);
              started = true;
              break;
            }
          } else {
            ns.print(`  ✓ Running: ${item.name}`);
            started = true;
            break;
          }
        }
        if (!started) {
          ns.print(`  ⏳ Waiting: ${item.name} (need more RAM)`);
        }
      } else {
        // Single script
        if (item.requireSF && !hasSF(item.requireSF)) continue;
        
        if (!isRunning(item.script)) {
          const result = startScript(item.script, item.name);
          if (result.success) {
            ns.print(`  ✓ Started: ${item.name}`);
          } else {
            ns.print(`  ⏳ Waiting: ${item.name} (${result.reason})`);
          }
        } else {
          ns.print(`  ✓ Running: ${item.name}`);
        }
      }
    }
    ns.print("");
    
    // PRIORITY 2: Periodic scripts
    ns.print("🟡 PERIODIC (Scheduled):");
    for (const item of CONFIG.scripts.periodic) {
      if (item.requireSF && !hasSF(item.requireSF)) continue;
      
      // Check if it's a one-time script that's completed
      if (item.runOnce && state.oneTimeCompleted.has(item.script)) {
        ns.print(`  ✓ Completed: ${item.name}`);
        continue;
      }
      
      const lastRun = state.lastRun.get(item.script) || 0;
      const timeSince = now - lastRun;
      const shouldRun = timeSince >= item.interval;
      
      if (shouldRun && !isRunning(item.script)) {
        const result = startScript(item.script, item.name);
        if (result.success) {
          state.lastRun.set(item.script, now);
          ns.print(`  ✓ Started: ${item.name}`);
          
          // Mark as completed if it's run-once
          if (item.runOnce) {
            state.oneTimeCompleted.add(item.script);
          }
        } else {
          ns.print(`  ⏳ Waiting: ${item.name} (${result.reason})`);
        }
      } else if (isRunning(item.script)) {
        ns.print(`  ▶️  Running: ${item.name}`);
      } else {
        const nextRun = Math.ceil((item.interval - timeSince) / 1000);
        ns.print(`  ⏰ Next run: ${item.name} in ${nextRun}s`);
      }
    }
    ns.print("");
    
    // PRIORITY 3: One-time scripts
    ns.print("🟢 ONE-TIME (Condition-based):");
    for (const item of CONFIG.scripts.oneTime) {
      if (item.requireSF && !hasSF(item.requireSF)) continue;
      if (state.oneTimeCompleted.has(item.script)) {
        ns.print(`  ✓ Completed: ${item.name}`);
        continue;
      }
      
      const conditionMet = item.condition(ns);
      if (conditionMet && !isRunning(item.script)) {
        const result = startScript(item.script, item.name);
        if (result.success) {
          ns.print(`  ✓ Started: ${item.name}`);
          state.oneTimeCompleted.add(item.script);
        } else {
          ns.print(`  ⏳ Waiting: ${item.name} (${result.reason})`);
        }
      } else if (isRunning(item.script)) {
        ns.print(`  ▶️  Running: ${item.name}`);
      } else if (!conditionMet) {
        ns.print(`  ⏸️  Waiting: ${item.name} (condition not met)`);
      }
    }
    ns.print("");
    
    // PRIORITY 4: Background scripts (lowest priority)
    if (freeRAM > 4) {
      ns.print("🔵 BACKGROUND (Low Priority):");
      for (const item of CONFIG.scripts.background) {
        if (item.requireSF && !hasSF(item.requireSF)) continue;
        if (!item.condition(ns)) {
          ns.print(`  ⏸️  Waiting: ${item.name} (condition not met)`);
          continue;
        }
        
        if (!isRunning(item.script)) {
          const result = startScript(item.script, item.name);
          if (result.success) {
            ns.print(`  ✓ Started: ${item.name}`);
          } else {
            ns.print(`  ⏳ Waiting: ${item.name} (${result.reason})`);
          }
        } else {
          ns.print(`  ✓ Running: ${item.name}`);
        }
      }
      ns.print("");
    }
    
    // Status summary
    ns.print("─────────────────────────────────────────────────────────");
    ns.print("📊 Script Status:");
    for (const [pid, info] of state.running) {
      const runtime = Math.floor((now - info.startTime) / 1000);
      ns.print(`  ▶️  ${info.name}: ${runtime}s`);
    }
    
    ns.print("");
    ns.print(`Next check in ${CONFIG.checkInterval / 1000}s...`);
    
    await ns.sleep(CONFIG.checkInterval);
  }
}
