/** sf4-roadmap.js
 * 
 * YOUR PERSONAL ROADMAP TO SF4
 * 
 * Shows exactly what you need to do to get Source-File 4
 * Provides actionable steps and progress tracking
 * 
 * Usage: run sf4-roadmap.js
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const player = ns.getPlayer();
  const currentBitNode = player.bitNodeN || 1;
  const hasSF4 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 4);
  
  function checkServer(serverName) {
    try {
      const server = ns.getServer(serverName);
      return {
        exists: true,
        hasRoot: server.hasAdminRights,
        hasBackdoor: server.backdoorInstalled,
        hackReq: server.requiredHackingSkill
      };
    } catch (e) {
      return { exists: false };
    }
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🎯 YOUR ROADMAP TO SOURCE-FILE 4");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  if (hasSF4) {
    ns.print("🎉 CONGRATULATIONS! You already have SF4!");
    ns.print("");
    ns.print("All singularity functions are now unlocked:");
    ns.print("  ✓ Auto-upgrade home RAM");
    ns.print("  ✓ Auto-buy programs");
    ns.print("  ✓ Auto-work for factions");
    ns.print("  ✓ Auto-backdoor servers");
    ns.print("  ✓ Full automation available!");
    return;
  }
  
  ns.print(`📍 Current Status:`);
  ns.print(`   BitNode: BN${currentBitNode}`);
  ns.print(`   Hacking Level: ${player.skills.hacking}`);
  ns.print(`   Money: ${ns.formatNumber(player.money)}`);
  ns.print("");
  
  // Check key milestones
  const milestones = [
    { name: "CSEC", faction: "CyberSec", hackReq: 51 },
    { name: "avmnite-02h", faction: "NiteSec", hackReq: 202 },
    { name: "I.I.I.I", faction: "The Black Hand", hackReq: 340 },
    { name: "run4theh111z", faction: "BitRunners", hackReq: 505 },
    { name: "w0r1d_d43m0n", faction: "Daedalus", hackReq: 3000 }
  ];
  
  let currentMilestone = null;
  let completedCount = 0;
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("📋 KEY MILESTONES:");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  for (const milestone of milestones) {
    const status = checkServer(milestone.name);
    const canHack = player.skills.hacking >= milestone.hackReq;
    
    let icon = "⏳";
    let statusText = "";
    
    if (status.hasBackdoor) {
      icon = "✅";
      statusText = "DONE";
      completedCount++;
    } else if (status.hasRoot && canHack) {
      icon = "🔓";
      statusText = "Ready to backdoor!";
      if (!currentMilestone) currentMilestone = milestone;
    } else if (status.hasRoot) {
      icon = "🔒";
      statusText = `Need hack ${milestone.hackReq} (${player.skills.hacking}/${milestone.hackReq})`;
      if (!currentMilestone) currentMilestone = milestone;
    } else if (canHack) {
      icon = "🔐";
      statusText = "Need root access";
      if (!currentMilestone) currentMilestone = milestone;
    } else {
      icon = "⛔";
      statusText = `Need hack ${milestone.hackReq} (${player.skills.hacking}/${milestone.hackReq})`;
      if (!currentMilestone) currentMilestone = milestone;
    }
    
    ns.print(`${icon} ${milestone.name.padEnd(20)} ${statusText}`);
    ns.print(`   → ${milestone.faction}`);
    ns.print("");
  }
  
  // Progress bar
  const progress = (completedCount / milestones.length) * 100;
  const barLength = 40;
  const filledLength = Math.floor((progress / 100) * barLength);
  const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print(`Progress: [${bar}] ${progress.toFixed(0)}%`);
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Current objectives
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🎯 CURRENT OBJECTIVES:");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  if (completedCount === milestones.length) {
    ns.print("🎉 ALL MILESTONES COMPLETE!");
    ns.print("");
    ns.print("You're ready to destroy this BitNode!");
    ns.print("");
    ns.print("Next steps:");
    ns.print("  1. Make sure you have key augmentations");
    ns.print("  2. Install augmentations when ready");
    ns.print("  3. Choose BitNode 4 as your next BitNode");
    ns.print("  4. Complete BN4 to get SF4 permanently!");
  } else if (currentMilestone) {
    const status = checkServer(currentMilestone.name);
    
    ns.print(`📍 Current Goal: ${currentMilestone.name}`);
    ns.print(`   Faction: ${currentMilestone.faction}`);
    ns.print("");
    
    if (status.hasRoot && player.skills.hacking >= currentMilestone.hackReq) {
      ns.print("✅ You can backdoor this server NOW!");
      ns.print("");
      ns.print("How to backdoor:");
      ns.print("  1. Go to Terminal");
      ns.print("  2. Type: connect " + currentMilestone.name);
      ns.print("  3. Type: backdoor");
      ns.print("  4. Wait for completion");
      ns.print("");
      ns.print("OR run: run bitnode-progression.js");
      ns.print("(It will guide you step-by-step)");
    } else if (status.hasRoot) {
      ns.print("⏳ Need to level up hacking");
      ns.print("");
      ns.print(`Current: ${player.skills.hacking}`);
      ns.print(`Target:  ${currentMilestone.hackReq}`);
      ns.print(`Needed:  ${currentMilestone.hackReq - player.skills.hacking} more levels`);
      ns.print("");
      ns.print("How to level up:");
      ns.print("  • Your batch scripts give passive XP");
      ns.print("  • Hack more servers for more XP");
      ns.print("  • Work for a company (if you have SF4)");
      ns.print("  • Study at university");
    } else {
      ns.print("⏳ Need root access first");
      ns.print("");
      ns.print("Your server-scanner should handle this automatically.");
      ns.print("Make sure it's running!");
      ns.print("");
      ns.print("Check: run auto-launcher.js");
    }
  }
  
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("💡 QUICK TIPS:");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print("• Focus on hacking level - it unlocks everything");
  ns.print("• Backdoor servers unlock faction invitations");
  ns.print("• Join factions and buy augmentations");
  ns.print("• BitNode 4 is REQUIRED for SF4");
  ns.print("• SF4 unlocks massive automation potential!");
  ns.print("");
  
  // Estimated time
  if (player.skills.hacking < 3000) {
    const levelsNeeded = 3000 - player.skills.hacking;
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("⏱️  ROUGH ESTIMATE:");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    ns.print(`Hack levels to reach 3000: ${levelsNeeded}`);
    ns.print("");
    ns.print("Time varies based on:");
    ns.print("  • Your batch script efficiency");
    ns.print("  • Number of servers you're hacking");
    ns.print("  • Your augmentations");
    ns.print("  • Active vs idle play");
    ns.print("");
    
    if (levelsNeeded > 2000) {
      ns.print("Estimated: Several hours of active play");
    } else if (levelsNeeded > 1000) {
      ns.print("Estimated: 1-3 hours of active play");
    } else if (levelsNeeded > 500) {
      ns.print("Estimated: 30-90 minutes");
    } else {
      ns.print("Estimated: Less than 30 minutes!");
    }
  }
  
  ns.print("");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("Run this script anytime to check your progress!");
  ns.print("═════════════════════════════════════════════════════════");
}
