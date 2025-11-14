/** modules/program-buyer.js
 * 
 * AUTOMATIC DARKWEB PROGRAM PURCHASER
 * 
 * Automatically purchases port opener programs from the darkweb
 * Buys in order of cost (cheapest first)
 * Waits until you have 2x the cost before buying (safety buffer)
 * 
 * Requires: SF4 (Singularity)
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const player = ns.getPlayer();
  const hasSF4 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 4);
  
  if (!hasSF4) {
    ns.print("ℹ️  Source-File 4 not available");
    ns.print("This module requires SF4 (The Singularity)");
    ns.print("");
    ns.print("Once you get SF4, this will auto-buy:");
    ns.print("  • BruteSSH.exe");
    ns.print("  • FTPCrack.exe");
    ns.print("  • relaySMTP.exe");
    ns.print("  • HTTPWorm.exe");
    ns.print("  • SQLInject.exe");
    ns.print("");
    ns.print("These programs unlock more servers to hack!");
    return;
  }
  
  const programs = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
  ];
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("💻 PROGRAM BUYER - Darkweb Automation");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Check which programs we already have
  const needed = [];
  for (const program of programs) {
    if (ns.fileExists(program, "home")) {
      ns.print(`✓ Already own: ${program}`);
    } else {
      const cost = ns.singularity.getDarkwebProgramCost(program);
      if (cost > 0) {
        needed.push({ name: program, cost: cost });
      }
    }
  }
  
  if (needed.length === 0) {
    ns.print("");
    ns.print("✓ All programs already purchased!");
    ns.print("You have all port opener programs.");
    return;
  }
  
  // Sort by cost (cheapest first)
  needed.sort((a, b) => a.cost - b.cost);
  
  ns.print("");
  ns.print("Programs to purchase:");
  for (const prog of needed) {
    ns.print(`  • ${prog.name.padEnd(20)} - ${ns.formatNumber(prog.cost)}`);
  }
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  
  // Buy programs one by one
  for (const prog of needed) {
    ns.print("");
    ns.print(`🎯 Target: ${prog.name}`);
    ns.print(`   Cost: ${ns.formatNumber(prog.cost)}`);
    ns.print(`   Waiting for 2x cost (${ns.formatNumber(prog.cost * 2)})...`);
    
    // Wait until we have 2x the money (safety buffer)
    while (ns.getPlayer().money < prog.cost * 2) {
      await ns.sleep(10000);
    }
    
    // Purchase the program
    const success = ns.singularity.purchaseProgram(prog.name);
    
    if (success) {
      ns.print(`✓ Purchased ${prog.name}!`);
      ns.tprint(`SUCCESS: Purchased ${prog.name}`);
    } else {
      ns.print(`✗ Failed to purchase ${prog.name}`);
      ns.tprint(`ERROR: Failed to purchase ${prog.name}`);
    }
  }
  
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("✓ ALL PROGRAMS PURCHASED!");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print("You now have all port opener programs.");
  ns.print("Your batch scripts can now access more servers!");
}
