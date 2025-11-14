/** bootstrap-income.js
 * 
 * MINIMAL RAM MONEY MAKER - Bootstrap Script
 * 
 * Runs on LOW RAM (2-4GB total) to make initial money
 * Use this to bootstrap until you can afford RAM upgrade
 * 
 * Features:
 * - Ultra-low RAM usage (~1.8GB)
 * - Simple continuous hacking
 * - Auto-finds best target
 * - Runs until you have enough for RAM upgrade
 * 
 * Usage: run bootstrap-income.js
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const MIN_MONEY_FOR_RAM = 5e6; // $5 million should be enough for first upgrade
  
  // Find best target we can hack
  function findBestTarget() {
    const player = ns.getPlayer();
    const servers = [];
    
    // Scan network
    function scan(host, visited = new Set()) {
      visited.add(host);
      for (const next of ns.scan(host)) {
        if (!visited.has(next)) {
          scan(next, visited);
        }
      }
      return visited;
    }
    
    const allServers = Array.from(scan("home"));
    
    // Filter hackable servers
    for (const server of allServers) {
      if (server === "home") continue;
      
      const maxMoney = ns.getServerMaxMoney(server);
      const reqLevel = ns.getServerRequiredHackingLevel(server);
      const hasRoot = ns.hasRootAccess(server);
      
      if (maxMoney > 0 && hasRoot && player.skills.hacking >= reqLevel) {
        servers.push({
          name: server,
          money: maxMoney,
          security: ns.getServerMinSecurityLevel(server),
          reqLevel: reqLevel
        });
      }
    }
    
    // Sort by money (highest first)
    servers.sort((a, b) => b.money - a.money);
    
    return servers[0]?.name || "n00dles";
  }
  
  const target = findBestTarget();
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("💰 BOOTSTRAP INCOME - Minimal RAM Money Maker");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print(`Target: ${target}`);
  ns.print(`Goal: ${ns.formatNumber(MIN_MONEY_FOR_RAM)} for RAM upgrade`);
  ns.print("");
  ns.print("This script uses minimal RAM to get you started.");
  ns.print("Once you have money, upgrade RAM and run auto-launcher!");
  ns.print("");
  
  let totalEarned = 0;
  const startMoney = ns.getPlayer().money;
  let cycles = 0;
  
  while (true) {
    const currentMoney = ns.getPlayer().money;
    const moneyNeeded = MIN_MONEY_FOR_RAM - currentMoney;
    
    // Check if we have enough
    if (currentMoney >= MIN_MONEY_FOR_RAM) {
      ns.clearLog();
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("🎉 GOAL REACHED!");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      ns.print(`Money: ${ns.formatNumber(currentMoney)}`);
      ns.print(`Earned: ${ns.formatNumber(totalEarned)}`);
      ns.print("");
      ns.print("Next steps:");
      ns.print("  1. Type: home");
      ns.print("  2. Press ESC (main menu)");
      ns.print("  3. Click 'Upgrade Home RAM'");
      ns.print("  4. After upgrade: run auto-launcher.js");
      ns.print("");
      ns.print("Keep this script running to earn more if needed!");
      ns.print("═════════════════════════════════════════════════════════");
    }
    
    // Prep phase
    const currentSec = ns.getServerSecurityLevel(target);
    const minSec = ns.getServerMinSecurityLevel(target);
    const currentMon = ns.getServerMoneyAvailable(target);
    const maxMon = ns.getServerMaxMoney(target);
    
    // Weaken if security too high
    if (currentSec > minSec + 5) {
      ns.clearLog();
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("💰 BOOTSTRAP INCOME");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      ns.print(`Target: ${target}`);
      ns.print("");
      ns.print("⏳ PREP: Weakening security...");
      ns.print(`Security: ${currentSec.toFixed(1)} → ${minSec.toFixed(1)}`);
      ns.print("");
      ns.print(`Money: ${ns.formatNumber(currentMoney)}`);
      ns.print(`Goal:  ${ns.formatNumber(MIN_MONEY_FOR_RAM)}`);
      ns.print(`Need:  ${ns.formatNumber(moneyNeeded)}`);
      
      await ns.weaken(target);
      continue;
    }
    
    // Grow if money too low
    if (currentMon < maxMon * 0.75) {
      ns.clearLog();
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("💰 BOOTSTRAP INCOME");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      ns.print(`Target: ${target}`);
      ns.print("");
      ns.print("⏳ PREP: Growing money...");
      ns.print(`Money: ${ns.formatNumber(currentMon)} / ${ns.formatNumber(maxMon)}`);
      ns.print("");
      ns.print(`Your Money: ${ns.formatNumber(currentMoney)}`);
      ns.print(`Goal:       ${ns.formatNumber(MIN_MONEY_FOR_RAM)}`);
      ns.print(`Need:       ${ns.formatNumber(moneyNeeded)}`);
      
      await ns.grow(target);
      continue;
    }
    
    // Hack for money
    cycles++;
    const moneyBefore = ns.getPlayer().money;
    
    ns.clearLog();
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("💰 BOOTSTRAP INCOME - HACKING");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    ns.print(`Target: ${target}`);
    ns.print(`Cycles: ${cycles}`);
    ns.print("");
    ns.print("💵 Hacking for money...");
    ns.print("");
    ns.print(`Your Money: ${ns.formatNumber(currentMoney)}`);
    ns.print(`Goal:       ${ns.formatNumber(MIN_MONEY_FOR_RAM)}`);
    ns.print(`Progress:   ${((currentMoney / MIN_MONEY_FOR_RAM) * 100).toFixed(1)}%`);
    ns.print("");
    
    const progress = Math.floor((currentMoney / MIN_MONEY_FOR_RAM) * 40);
    const bar = "█".repeat(progress) + "░".repeat(40 - progress);
    ns.print(`[${bar}]`);
    
    await ns.hack(target);
    
    const moneyAfter = ns.getPlayer().money;
    const earned = moneyAfter - moneyBefore;
    if (earned > 0) {
      totalEarned += earned;
    }
    
    // Small delay to avoid spam
    await ns.sleep(100);
  }
}
