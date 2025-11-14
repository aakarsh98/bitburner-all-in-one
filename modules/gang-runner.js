/** gang-runner.js
 * 
 * Continuous wrapper for gang-manager.js
 * Runs the gang automation in a loop
 * 
 * @param {NS} ns
 */

import { GangManager } from './gang-manager.js';

export async function main(ns) {
  ns.disableLog("ALL");
  
  // Check if gang is available
  try {
    if (!ns.gang || !ns.gang.inGang()) {
      ns.print("ℹ️  Not in a gang yet");
      ns.print("Gang Manager requires:");
      ns.print("  1. Source-File 2 (Gangs)");
      ns.print("  2. Join a gang (via main menu)");
      ns.print("");
      ns.print("Exiting gracefully...");
      return;
    }
  } catch (e) {
    ns.print("ℹ️  Gang API not available");
    ns.print("Need Source-File 2 to access gangs");
    return;
  }
  
  const manager = new GangManager(ns);
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("👥 GANG MANAGER - Continuous Automation");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  const checkInterval = 60000; // Check every 60 seconds
  
  while (true) {
    try {
      // Check status
      const status = manager.getStatus();
      
      if (!status.available) {
        ns.print("⚠️  Gang no longer available - exiting");
        return;
      }
      
      // Make decision
      const decision = manager.makeDecision();
      
      if (decision.type !== 'none') {
        ns.print(`[${new Date().toLocaleTimeString()}] ${decision.type}: ${decision.reason}`);
        
        // Execute decision would go here
        // (In the full auto-manager, this is handled by executeModuleDecision)
        // For now, this is monitoring/planning only
      }
      
    } catch (e) {
      ns.print(`⚠️  Error: ${e}`);
    }
    
    await ns.sleep(checkInterval);
  }
}
