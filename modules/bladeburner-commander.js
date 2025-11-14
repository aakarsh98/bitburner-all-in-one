/** modules/bladeburner-commander.js
 * Intelligent Bladeburner operations automation
 * 
 * REQUIRES: Source-File 6 or 7 (Bladeburner access)
 * 
 * FEATURES:
 * - Auto-selects optimal operations based on success chance
 * - Manages stamina (rest when low, work when high)
 * - Auto-upgrades action levels when success rate is high
 * - Trains combat stats when needed
 * - Handles contracts, operations, and general actions
 * 
 * STRATEGY:
 * - Phase 1: Train stats until 100+ all combat
 * - Phase 2: Do Tracking contracts until Bounty Hunter viable
 * - Phase 3: Optimize between contracts/operations for max rank
 * 
 * @param {NS} ns
 */

export class BladeburnerCommander {
  constructor(ns, config = {}) {
    this.ns = ns;
    this.config = {
      // Stamina management
      minStaminaPercent: 0.5,      // Rest when below 50%
      maxStaminaPercent: 0.95,     // Resume work when above 95%
      
      // Success chance thresholds
      minSuccessChance: 0.75,      // Min 75% success for operations
      autoLevelThreshold: 0.90,    // Auto-upgrade level when >90% success
      
      // Stat requirements
      minCombatStats: 100,         // Min strength/defense/dex/agility before contracts
      minCharisma: null,           // Will calculate as avg(combat stats) / 4
      
      // Action priorities
      preferContracts: true,       // Prefer contracts over operations (safer)
      
      // Skill upgrades
      autoUpgradeSkills: true,     // Auto-buy skills with skill points
      skillPriorities: [
        'Blade\'s Intuition',      // Increases success chance
        'Cloak',                   // Better stealth
        'Short-Circuit',           // Better success chance
        'Digital Observer',        // Better success chance
        'Tracer',                  // Better success chance
        'Overclock',               // Faster actions
        'Reaper',                  // More rank gain
        'Evasive System',          // Better success
        'Datamancer',              // Better success
        'Cyber\'s Edge',           // Better success
        'Hands of Midas',          // Better success
        'Hyperdrive'               // Faster actions
      ],
      
      ...config
    };
  }

  /**
   * Check if Bladeburner API is available
   */
  hasBladeburnerAccess() {
    return this.ns.bladeburner !== undefined;
  }

  /**
   * Get current action
   */
  getCurrentAction() {
    if (!this.hasBladeburnerAccess()) return { type: 'Idle', name: '' };
    
    try {
      return this.ns.bladeburner.getCurrentAction();
    } catch (e) {
      return { type: 'Idle', name: '' };
    }
  }

  /**
   * Start an action (only if not already doing it)
   */
  startAction(type, name) {
    if (!this.hasBladeburnerAccess()) return false;
    
    const current = this.getCurrentAction();
    if (current.type === type && current.name === name) {
      return true; // Already doing this
    }
    
    try {
      return this.ns.bladeburner.startAction(type, name);
    } catch (e) {
      return false;
    }
  }

  /**
   * Get stamina (current and max)
   */
  getStamina() {
    if (!this.hasBladeburnerAccess()) return [0, 100];
    
    try {
      return this.ns.bladeburner.getStamina();
    } catch (e) {
      return [0, 100];
    }
  }

  /**
   * Get stamina percentage
   */
  getStaminaPercent() {
    const [current, max] = this.getStamina();
    return max > 0 ? current / max : 0;
  }

  /**
   * Get success chance for an action (returns average of min/max)
   */
  getSuccessChance(type, name) {
    if (!this.hasBladeburnerAccess()) return 0;
    
    try {
      const chance = this.ns.bladeburner.getActionEstimatedSuccessChance(type, name);
      return (chance[0] + chance[1]) / 2; // Average of min/max
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get action level (current and max)
   */
  getActionLevel(type, name) {
    if (!this.hasBladeburnerAccess()) return { current: 0, max: 0 };
    
    try {
      const current = this.ns.bladeburner.getActionCurrentLevel(type, name);
      const max = this.ns.bladeburner.getActionMaxLevel(type, name);
      return { current, max };
    } catch (e) {
      return { current: 0, max: 0 };
    }
  }

  /**
   * Try to upgrade action level
   */
  tryUpgradeLevel(type, name) {
    if (!this.hasBladeburnerAccess()) return false;
    
    // Only upgrade if success chance is high enough
    const chance = this.getSuccessChance(type, name);
    if (chance < this.config.autoLevelThreshold) return false;
    
    const level = this.getActionLevel(type, name);
    if (level.current >= level.max) return false;
    
    try {
      this.ns.bladeburner.setActionLevel(type, name, level.current + 1);
      this.ns.print(`✓ Upgraded ${name} to level ${level.current + 1}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get action count remaining
   */
  getActionCount(type, name) {
    if (!this.hasBladeburnerAccess()) return 0;
    
    try {
      return this.ns.bladeburner.getActionCountRemaining(type, name);
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get action time
   */
  getActionTime(type, name) {
    if (!this.hasBladeburnerAccess()) return 0;
    
    try {
      return this.ns.bladeburner.getActionTime(type, name);
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get rank
   */
  getRank() {
    if (!this.hasBladeburnerAccess()) return 0;
    
    try {
      return this.ns.bladeburner.getRank();
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get skill points
   */
  getSkillPoints() {
    if (!this.hasBladeburnerAccess()) return 0;
    
    try {
      return this.ns.bladeburner.getSkillPoints();
    } catch (e) {
      return 0;
    }
  }

  /**
   * Upgrade a skill
   */
  upgradeSkill(skillName) {
    if (!this.hasBladeburnerAccess()) return false;
    
    try {
      const success = this.ns.bladeburner.upgradeSkill(skillName);
      if (success) {
        this.ns.print(`✓ Upgraded skill: ${skillName}`);
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if player stats are sufficient
   */
  checkStats() {
    const player = this.ns.getPlayer();
    const skills = player.skills;
    
    const combatStats = {
      strength: skills.strength,
      defense: skills.defense,
      dexterity: skills.dexterity,
      agility: skills.agility
    };
    
    const avgCombat = (combatStats.strength + combatStats.defense + 
                       combatStats.dexterity + combatStats.agility) / 4;
    
    const minCharisma = this.config.minCharisma || avgCombat / 4;
    
    return {
      combatReady: Object.values(combatStats).every(stat => stat >= this.config.minCombatStats),
      charismaReady: skills.charisma >= minCharisma,
      combatStats,
      avgCombat,
      charisma: skills.charisma,
      needsCharisma: skills.charisma < minCharisma
    };
  }

  /**
   * Phase 1: Train stats until ready
   */
  evaluateTraining() {
    const stats = this.checkStats();
    
    if (!stats.combatReady) {
      return {
        action: 'train-combat',
        type: 'General',
        name: 'Training',
        reason: `Combat stats < ${this.config.minCombatStats}`,
        priority: 'high'
      };
    }
    
    if (stats.needsCharisma) {
      return {
        action: 'train-charisma',
        type: 'General',
        name: 'Recruitment',
        reason: `Charisma too low (${stats.charisma.toFixed(0)} < ${(stats.avgCombat / 4).toFixed(0)})`,
        priority: 'high'
      };
    }
    
    return null; // No training needed
  }

  /**
   * Phase 2: Build up to Bounty Hunter
   */
  evaluateEarlyContracts() {
    // Check if Bounty Hunter is viable
    const bountyChance = this.getSuccessChance('Contract', 'Bounty Hunter');
    
    if (bountyChance > 0.8) {
      return null; // Ready for normal operations
    }
    
    // Still building up - do Tracking
    const trackingChance = this.getSuccessChance('Contract', 'Tracking');
    
    if (trackingChance > 0.5) {
      // Try to upgrade Tracking level
      this.tryUpgradeLevel('Contract', 'Tracking');
      
      return {
        action: 'tracking',
        type: 'Contract',
        name: 'Tracking',
        reason: `Building up to Bounty Hunter (${(bountyChance * 100).toFixed(0)}%)`,
        priority: 'medium'
      };
    }
    
    // Field Analysis to recover stamina and gain intel
    return {
      action: 'field-analysis',
      type: 'General',
      name: 'Field Analysis',
      reason: 'Gaining intelligence',
      priority: 'low'
    };
  }

  /**
   * Phase 3: Optimal contract/operation selection
   */
  evaluateBestAction() {
    const actions = [];
    
    // Evaluate all contracts
    const contracts = ['Tracking', 'Bounty Hunter', 'Retirement'];
    for (const contract of contracts) {
      const count = this.getActionCount('Contract', contract);
      if (count === 0) continue;
      
      const chance = this.getSuccessChance('Contract', contract);
      if (chance < this.config.minSuccessChance) continue;
      
      const time = this.getActionTime('Contract', contract);
      
      // Try to upgrade level
      this.tryUpgradeLevel('Contract', contract);
      
      actions.push({
        type: 'Contract',
        name: contract,
        chance,
        time,
        score: chance / (time / 1000), // Success per second
        reason: `${contract} (${(chance * 100).toFixed(0)}% success, ${(time / 1000).toFixed(0)}s)`
      });
    }
    
    // Evaluate operations (if not preferring contracts only)
    if (!this.config.preferContracts || actions.length === 0) {
      const operations = ['Investigation', 'Undercover Operation', 'Sting Operation', 'Raid', 'Stealth Retirement Operation', 'Assassination'];
      for (const operation of operations) {
        const count = this.getActionCount('Operation', operation);
        if (count === 0) continue;
        
        const chance = this.getSuccessChance('Operation', operation);
        if (chance < this.config.minSuccessChance) continue;
        
        const time = this.getActionTime('Operation', operation);
        
        // Try to upgrade level
        this.tryUpgradeLevel('Operation', operation);
        
        actions.push({
          type: 'Operation',
          name: operation,
          chance,
          time,
          score: chance / (time / 1000) * 1.5, // Operations worth 1.5x (more rank)
          reason: `${operation} (${(chance * 100).toFixed(0)}% success, ${(time / 1000).toFixed(0)}s)`
        });
      }
    }
    
    // Sort by score (highest first)
    actions.sort((a, b) => b.score - a.score);
    
    return actions[0] || null;
  }

  /**
   * Try to spend skill points
   */
  tryUpgradeSkills() {
    if (!this.config.autoUpgradeSkills) return;
    if (!this.hasBladeburnerAccess()) return;
    
    const points = this.getSkillPoints();
    if (points < 1) return;
    
    for (const skill of this.config.skillPriorities) {
      if (this.upgradeSkill(skill)) {
        break; // Only upgrade one skill per check
      }
    }
  }

  /**
   * Get status summary
   */
  getStatus() {
    if (!this.hasBladeburnerAccess()) {
      return { available: false };
    }
    
    const current = this.getCurrentAction();
    const stamina = this.getStamina();
    const stats = this.checkStats();
    const rank = this.getRank();
    const skillPoints = this.getSkillPoints();
    
    return {
      available: true,
      currentAction: current,
      stamina: {
        current: stamina[0],
        max: stamina[1],
        percent: this.getStaminaPercent()
      },
      stats,
      rank,
      skillPoints
    };
  }

  /**
   * Main decision loop
   */
  makeDecision() {
    if (!this.hasBladeburnerAccess()) {
      return {
        type: 'none',
        reason: 'Bladeburner not available (need SF6 or SF7)'
      };
    }
    
    // Check stamina first
    const staminaPercent = this.getStaminaPercent();
    const current = this.getCurrentAction();
    
    if (staminaPercent < this.config.minStaminaPercent) {
      // Low stamina - rest
      if (current.type !== 'General' || current.name !== 'Field Analysis') {
        return {
          type: 'action',
          actionType: 'General',
          actionName: 'Field Analysis',
          reason: `Low stamina (${(staminaPercent * 100).toFixed(0)}%)`,
          priority: 'high'
        };
      }
      return { type: 'none', reason: 'Resting (low stamina)' };
    }
    
    // Try to upgrade skills
    this.tryUpgradeSkills();
    
    // Phase 1: Check if we need stat training
    const training = this.evaluateTraining();
    if (training) {
      return {
        type: 'action',
        actionType: training.type,
        actionName: training.name,
        reason: training.reason,
        priority: training.priority
      };
    }
    
    // Phase 2: Build up to Bounty Hunter
    const earlyWork = this.evaluateEarlyContracts();
    if (earlyWork) {
      return {
        type: 'action',
        actionType: earlyWork.type,
        actionName: earlyWork.name,
        reason: earlyWork.reason,
        priority: earlyWork.priority
      };
    }
    
    // Phase 3: Optimal action selection
    const bestAction = this.evaluateBestAction();
    if (bestAction) {
      return {
        type: 'action',
        actionType: bestAction.type,
        actionName: bestAction.name,
        reason: bestAction.reason,
        priority: 'medium'
      };
    }
    
    // Fallback: Field Analysis
    return {
      type: 'action',
      actionType: 'General',
      actionName: 'Field Analysis',
      reason: 'No viable actions, gathering intel',
      priority: 'low'
    };
  }
}

/** Standalone execution for testing */
export async function main(ns) {
  const commander = new BladeburnerCommander(ns);
  
  ns.tprint("=== BLADEBURNER COMMANDER TEST ===");
  
  const status = commander.getStatus();
  
  if (!status.available) {
    ns.tprint("ERROR: Bladeburner not available");
    ns.tprint("You need Source-File 6 or 7 to access Bladeburner");
    return;
  }
  
  ns.tprint(`\nRank: ${status.rank.toFixed(0)} | Skill Points: ${status.skillPoints}`);
  ns.tprint(`Stamina: ${status.stamina.current.toFixed(0)}/${status.stamina.max.toFixed(0)} (${(status.stamina.percent * 100).toFixed(0)}%)`);
  ns.tprint(`\nCurrent Action: ${status.currentAction.type} - ${status.currentAction.name}`);
  
  ns.tprint("\nStats Check:");
  ns.tprint(`  Combat Ready: ${status.stats.combatReady ? 'YES' : 'NO'}`);
  ns.tprint(`  Charisma Ready: ${status.stats.charismaReady ? 'YES' : 'NO'}`);
  ns.tprint(`  STR: ${status.stats.combatStats.strength.toFixed(0)}`);
  ns.tprint(`  DEF: ${status.stats.combatStats.defense.toFixed(0)}`);
  ns.tprint(`  DEX: ${status.stats.combatStats.dexterity.toFixed(0)}`);
  ns.tprint(`  AGI: ${status.stats.combatStats.agility.toFixed(0)}`);
  ns.tprint(`  CHA: ${status.stats.charisma.toFixed(0)}`);
  
  const decision = commander.makeDecision();
  ns.tprint(`\nRecommended Action: ${decision.type.toUpperCase()}`);
  if (decision.type === 'action') {
    ns.tprint(`  ${decision.actionType}: ${decision.actionName}`);
  }
  ns.tprint(`  ${decision.reason}`);
  ns.tprint(`  Priority: ${decision.priority}`);
}
