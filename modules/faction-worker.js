/** modules/faction-worker.js
 * 
 * AUTOMATIC FACTION REPUTATION GRINDER
 * 
 * Automatically works for factions to build reputation
 * Works in priority order (most important factions first)
 * Grinds rep until target reached, then moves to next faction
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
    ns.print("Once you get SF4, this will auto-grind:");
    ns.print("  • Faction reputation");
    ns.print("  • Unlock augmentations");
    ns.print("  • Optimize work focus");
    return;
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🏛️  FACTION WORKER - Rep Grinding");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Faction priority list with target rep
  const factionWork = [
    { faction: "Daedalus", rep: 2.5e6 },        // Top tier
    { faction: "The Covenant", rep: 2.5e6 },    // Top tier
    { faction: "Illuminati", rep: 2.5e6 },      // Top tier
    { faction: "BitRunners", rep: 1e6 },        // High tier hacking
    { faction: "The Black Hand", rep: 175000 }, // Mid tier hacking
    { faction: "NiteSec", rep: 112500 },        // Early hacking
    { faction: "CyberSec", rep: 0 },            // First faction
    { faction: "Netburners", rep: 12500 },      // Easy early faction
    { faction: "Tian Di Hui", rep: 3750 },      // City faction
    { faction: "Sector-12", rep: 50000 },       // City faction
    { faction: "Aevum", rep: 100000 },          // City faction
    { faction: "Chongqing", rep: 50000 },       // City faction
    { faction: "New Tokyo", rep: 50000 },       // City faction
    { faction: "Ishima", rep: 50000 },          // City faction
    { faction: "Volhaven", rep: 50000 }         // City faction
  ];
  
  const joinedFactions = new Set(player.factions);
  
  if (joinedFactions.size === 0) {
    ns.print("ℹ️  No factions joined yet");
    ns.print("");
    ns.print("Join a faction first:");
    ns.print("  1. Get invited by backdooring servers");
    ns.print("  2. Check for invitations (main menu)");
    ns.print("  3. Accept an invitation");
    ns.print("");
    ns.print("This script will start working once you join a faction.");
    return;
  }
  
  // Filter to only joined factions and sort by priority (highest rep first)
  const workQueue = factionWork
    .filter(f => joinedFactions.has(f.faction))
    .sort((a, b) => b.rep - a.rep);
  
  if (workQueue.length === 0) {
    ns.print("✗ No configured factions joined");
    ns.print("Join one of the supported factions.");
    return;
  }
  
  ns.print("📋 Work Queue:");
  for (const faction of workQueue) {
    const currentRep = ns.singularity.getFactionRep(faction.faction);
    ns.print(`  • ${faction.faction.padEnd(20)} - ${ns.formatNumber(currentRep)} / ${ns.formatNumber(faction.rep)}`);
  }
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Work through each faction
  for (const work of workQueue) {
    ns.print(`🎯 Working for: ${work.faction}`);
    ns.print(`   Target rep: ${ns.formatNumber(work.rep)}`);
    ns.print("");
    
    // Start working for this faction
    ns.singularity.workForFaction(work.faction, "Hacking Contracts", false);
    
    // Grind until target rep reached
    while (true) {
      const currentRep = ns.singularity.getFactionRep(work.faction);
      
      if (currentRep >= work.rep) {
        ns.print(`✓ Completed: ${work.faction}`);
        ns.print(`   Final rep: ${ns.formatNumber(currentRep)}`);
        ns.print("");
        break;
      }
      
      const remaining = work.rep - currentRep;
      const progress = ((currentRep / work.rep) * 100).toFixed(1);
      
      ns.clearLog();
      ns.print("═════════════════════════════════════════════════════════");
      ns.print(`🏛️  FACTION WORKER - ${work.faction}`);
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      ns.print(`Current Rep:  ${ns.formatNumber(currentRep)}`);
      ns.print(`Target Rep:   ${ns.formatNumber(work.rep)}`);
      ns.print(`Remaining:    ${ns.formatNumber(remaining)}`);
      ns.print("");
      ns.print(`Progress: ${progress}%`);
      ns.print("");
      ns.print("Working on Hacking Contracts...");
      
      await ns.sleep(10000);
    }
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("✓ ALL FACTION WORK COMPLETE!");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print("All configured factions have reached target rep.");
  ns.print("You can now purchase augmentations!");
}
