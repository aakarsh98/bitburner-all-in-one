/** ram-upgrader.js
 * 
 * AUTOMATIC HOME RAM UPGRADER
 * 
 * Monitors for failed modules and automatically upgrades home RAM
 * Run this alongside auto-launcher.js for automatic RAM expansion
 * 
 * Requires: Singularity API (SF4)
 * 
 * Usage:
 *   run ram-upgrader.js
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const CONFIG = {
    enabled: true,
    priority: true,
    targetRAM: 1024,
    minMoneyReserve: 1000000,
    checkInterval: 30000
  };
  
  // Check if we have SF4 by looking at owned source files
  const player = ns.getPlayer();
  const hasSF4 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 4);
  
  if (!hasSF4) {
    ns.print("ℹ️  Source-File 4 not available");
    ns.print("This script requires Source-File 4 (The Singularity)");
    ns.print("");
    ns.print("Without SF4, you need to manually upgrade RAM:");
    ns.print("  1. Open main menu (ESC)");
    ns.print("  2. Click 'Upgrade Home RAM' when you have money");
    ns.print("");
    ns.print("To get SF4:");
    ns.print("  1. Complete BitNode 4 (The Singularity)");
    ns.print("  2. After destroying the BitNode, you'll get SF4");
    ns.print("  3. Then this script will work automatically!");
    ns.print("");
    ns.print("Exiting - Manual upgrade required.");
    return;
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("💰 RAM UPGRADER - Automatic Home RAM Expansion");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print(`Target RAM: ${CONFIG.targetRAM}GB`);
  ns.print(`Money Reserve: $${(CONFIG.minMoneyReserve/1e6).toFixed(1)}m`);
  ns.print(`Check Interval: ${CONFIG.checkInterval/1000}s`);
  ns.print("");
  
  function fmt(num) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}t`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}b`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}m`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}k`;
    return `$${num.toFixed(2)}`;
  }
  
  while (true) {
    const currentRAM = ns.getServerMaxRam("home");
    
    if (currentRAM >= CONFIG.targetRAM) {
      ns.print(`✓ Target RAM reached (${currentRAM}GB)`);
      ns.print("Stopping RAM upgrader");
      return;
    }
    
    const upgradeCost = ns.singularity.getUpgradeHomeRamCost();
    const currentMoney = ns.getPlayer().money;
    const afterPurchase = currentMoney - upgradeCost;
    
    if (afterPurchase >= CONFIG.minMoneyReserve) {
      ns.print("");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("💰 UPGRADING HOME RAM!");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print(`Current RAM: ${currentRAM}GB → ${currentRAM * 2}GB`);
      ns.print(`Cost: ${fmt(upgradeCost)}`);
      
      const success = ns.singularity.upgradeHomeRam();
      
      if (success) {
        ns.print("✓ RAM upgraded successfully!");
        ns.print("");
        ns.print("Auto-launcher will detect new RAM and launch more modules");
        ns.print("═════════════════════════════════════════════════════════");
      } else {
        ns.print("✗ RAM upgrade failed!");
        ns.print("═════════════════════════════════════════════════════════");
      }
      ns.print("");
    } else {
      const needed = upgradeCost + CONFIG.minMoneyReserve - currentMoney;
      const percent = ((currentMoney / (upgradeCost + CONFIG.minMoneyReserve)) * 100).toFixed(1);
      
      ns.clearLog();
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("💰 RAM UPGRADER - Monitoring");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      ns.print(`Current RAM: ${currentRAM}GB`);
      ns.print(`Next Upgrade: ${currentRAM}GB → ${currentRAM * 2}GB`);
      ns.print(`Upgrade Cost: ${fmt(upgradeCost)}`);
      ns.print("");
      ns.print(`Current Money: ${fmt(currentMoney)}`);
      ns.print(`Need: ${fmt(needed)} more (${percent}% saved)`);
      ns.print("");
      ns.print(`Checking again in ${CONFIG.checkInterval/1000}s...`);
    }
    
    await ns.sleep(CONFIG.checkInterval);
  }
}
