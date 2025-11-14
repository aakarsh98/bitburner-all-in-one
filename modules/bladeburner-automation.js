/** modules/bladeburner-automation.js
 * 
 * BLADEBURNER FULL AUTOMATION
 * 
 * Automatically manages Bladeburner division:
 * - Trains combat stats to minimum levels
 * - Upgrades contract levels intelligently
 * - Manages stamina with Field Analysis
 * - Progresses from Tracking → Bounty Hunter → Retirement
 * 
 * Requires: SF6 or SF7 (Bladeburner)
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const player = ns.getPlayer();
  const hasSF6 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 6);
  const hasSF7 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 7);
  
  if (!hasSF6 && !hasSF7) {
    ns.print("ℹ️  Bladeburner not available");
    ns.print("This module requires SF6 or SF7");
    ns.print("");
    ns.print("To unlock Bladeburner:");
    ns.print("  1. Complete BitNode 6 or 7");
    ns.print("  2. Destroy the BitNode to get SF6/SF7");
    ns.print("  3. Join Bladeburner division in new game");
    ns.print("");
    ns.print("Bladeburner provides:");
    ns.print("  • Combat stat training");
    ns.print("  • Money from contracts");
    ns.print("  • Unique augmentations");
    return;
  }
  
  if (!ns.bladeburner.inBladeburner()) {
    ns.print("ℹ️  Not in Bladeburner division");
    ns.print("Join Bladeburner from main menu (ESC)");
    ns.print("Look for 'Bladeburner' option");
    return;
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("⚔️  BLADEBURNER AUTOMATION");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  const CONFIG = {
    minCombatStats: 100,
    minCharismaRatio: 0.25,
    targetSuccessRate: 0.8,
    staminaRestThreshold: 0.5,
    staminaResumeThreshold: 0.95,
    checkInterval: 5000
  };
  
  function getStaminaPercentage() {
    const [current, max] = ns.bladeburner.getStamina();
    return current / max;
  }
  
  function getAverageChance(type, name) {
    const chance = ns.bladeburner.getActionEstimatedSuccessChance(type, name);
    return (chance[0] + chance[1]) / 2;
  }
  
  function doAction(type, name) {
    const current = ns.bladeburner.getCurrentAction();
    if (current.type === type && current.name === name) return;
    ns.bladeburner.startAction(type, name);
  }
  
  function tryUpgradeLevel(type, name) {
    if (getAverageChance(type, name) < 0.9) return;
    const current = ns.bladeburner.getActionCurrentLevel(type, name);
    const max = ns.bladeburner.getActionMaxLevel(type, name);
    if (current >= max) return;
    ns.bladeburner.setActionLevel(type, name, current + 1);
  }
  
  // Phase 1: Train combat stats
  ns.print("Phase 1: Training combat stats...");
  ns.print("");
  
  while (true) {
    const player = ns.getPlayer();
    const avgCombat = (player.skills.strength + player.skills.defense + 
                       player.skills.dexterity + player.skills.agility) / 4;
    
    if (player.skills.strength < CONFIG.minCombatStats ||
        player.skills.defense < CONFIG.minCombatStats ||
        player.skills.dexterity < CONFIG.minCombatStats ||
        player.skills.agility < CONFIG.minCombatStats) {
      
      ns.clearLog();
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("⚔️  PHASE 1: Combat Training");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      ns.print(`Strength:  ${player.skills.strength} / ${CONFIG.minCombatStats}`);
      ns.print(`Defense:   ${player.skills.defense} / ${CONFIG.minCombatStats}`);
      ns.print(`Dexterity: ${player.skills.dexterity} / ${CONFIG.minCombatStats}`);
      ns.print(`Agility:   ${player.skills.agility} / ${CONFIG.minCombatStats}`);
      ns.print("");
      ns.print("Training via general actions...");
      
      doAction("General", "Training");
      await ns.sleep(CONFIG.checkInterval);
      continue;
    }
    
    if (player.skills.charisma < avgCombat * CONFIG.minCharismaRatio) {
      ns.clearLog();
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("⚔️  PHASE 1: Charisma Training");
      ns.print("═════════════════════════════════════════════════════════");
      ns.print("");
      ns.print(`Charisma: ${player.skills.charisma} / ${Math.floor(avgCombat * CONFIG.minCharismaRatio)}`);
      ns.print("");
      ns.print("Training via Recruitment...");
      
      doAction("General", "Recruitment");
      await ns.sleep(CONFIG.checkInterval);
      continue;
    }
    
    break;
  }
  
  // Phase 2: Build up to Bounty Hunter
  ns.print("✓ Phase 1 Complete");
  ns.print("");
  ns.print("Phase 2: Preparing for Bounty Hunter...");
  ns.print("");
  
  ns.bladeburner.setActionAutolevel("Contract", "Tracking", false);
  ns.bladeburner.setActionAutolevel("Contract", "Bounty Hunter", false);
  
  let mode = "Tracking";
  
  while (true) {
    if (getAverageChance("Contract", "Bounty Hunter") > CONFIG.targetSuccessRate) {
      break;
    }
    
    tryUpgradeLevel("Contract", "Tracking");
    
    const stamina = getStaminaPercentage();
    if (mode === "Tracking" && stamina <= CONFIG.staminaRestThreshold) {
      mode = "Field Analysis";
    } else if (mode === "Field Analysis" && stamina > CONFIG.staminaResumeThreshold) {
      mode = "Tracking";
    }
    
    ns.clearLog();
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("⚔️  PHASE 2: Tracking Training");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    ns.print(`Current Mode: ${mode}`);
    ns.print(`Stamina: ${(stamina * 100).toFixed(1)}%`);
    ns.print("");
    ns.print(`Bounty Hunter Success: ${(getAverageChance("Contract", "Bounty Hunter") * 100).toFixed(1)}%`);
    ns.print(`Target: ${(CONFIG.targetSuccessRate * 100).toFixed(0)}%`);
    ns.print("");
    
    if (mode === "Tracking") {
      doAction("Contract", "Tracking");
    } else {
      doAction("General", "Field Analysis");
    }
    
    await ns.sleep(CONFIG.checkInterval);
  }
  
  // Phase 3: Main Bounty Hunter loop
  ns.print("✓ Phase 2 Complete");
  ns.print("");
  ns.print("Phase 3: Running Bounty Hunter contracts...");
  ns.print("");
  
  ns.bladeburner.setActionAutolevel("Contract", "Bounty Hunter", true);
  
  while (true) {
    const stamina = getStaminaPercentage();
    
    if (stamina <= CONFIG.staminaRestThreshold) {
      mode = "Field Analysis";
    } else if (stamina > CONFIG.staminaResumeThreshold) {
      mode = "Bounty Hunter";
    }
    
    ns.clearLog();
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("⚔️  PHASE 3: Bounty Hunter Operations");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    ns.print(`Current Mode: ${mode}`);
    ns.print(`Stamina: ${(stamina * 100).toFixed(1)}%`);
    ns.print("");
    
    const rank = ns.bladeburner.getRank();
    ns.print(`Current Rank: ${ns.formatNumber(rank)}`);
    
    const bhChance = getAverageChance("Contract", "Bounty Hunter");
    ns.print(`Success Rate: ${(bhChance * 100).toFixed(1)}%`);
    ns.print("");
    ns.print("💰 Earning money and rank from contracts...");
    
    if (mode === "Bounty Hunter") {
      doAction("Contract", "Bounty Hunter");
    } else {
      doAction("General", "Field Analysis");
    }
    
    await ns.sleep(CONFIG.checkInterval);
  }
}
