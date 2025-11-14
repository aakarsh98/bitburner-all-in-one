/** modules/faction-manager.js
 * Intelligent Faction reputation and relationship management
 * 
 * FEATURES:
 * - Auto-joins best factions based on your stats
 * - Farms reputation efficiently (hacking contracts/field work/security)
 * - Tracks augmentation requirements
 * - Optimizes work type based on stats
 * 
 * INTEGRATION:
 * - Called by auto-manager.js for faction decisions
 * - Works with augmentation-tracker.js for goals
 * 
 * @param {NS} ns
 */

export class FactionManager {
  constructor(ns, config = {}) {
    this.ns = ns;
    this.config = {
      // Work preferences (in priority order)
      preferredWork: ['hacking', 'field', 'security'],
      
      // Auto-join settings
      autoJoin: true,
      maxFactions: 12, // Don't join too many (reputation spreads thin)
      
      // Reputation farming
      minRepGainRate: 1, // Min rep/sec to consider work valuable
      workDuration: 60000, // Work for 1 minute before checking
      
      // Priority factions (join these first if available)
      priorityFactions: [
        'CyberSec',        // Early hacking faction
        'Tian Di Hui',     // Easy to join
        'Netburners',      // Hacking focus
        'Sector-12',       // City faction
        'BitRunners',      // Mid-game hacking
        'The Black Hand',  // Advanced hacking
        'NiteSec'          // Early-mid hacking
      ],
      
      ...config
    };
  }

  /**
   * Get all available factions you can join
   */
  getAvailableFactions() {
    // Get all faction invitations
    const invitations = this.ns.singularity ? this.ns.singularity.checkFactionInvitations() : [];
    
    // Get current factions
    const currentFactions = this.ns.getPlayer().factions || [];
    
    return {
      invitations,
      current: currentFactions,
      canJoinMore: currentFactions.length < this.config.maxFactions
    };
  }

  /**
   * Evaluate which faction to join next
   * Returns: { faction, reason, priority }
   */
  evaluateBestFactionToJoin(invitations) {
    if (!invitations || invitations.length === 0) return null;
    
    const player = this.ns.getPlayer();
    const scored = [];
    
    for (const faction of invitations) {
      let score = 0;
      let reason = '';
      
      // Priority faction bonus
      if (this.config.priorityFactions.includes(faction)) {
        const priorityIndex = this.config.priorityFactions.indexOf(faction);
        score += (this.config.priorityFactions.length - priorityIndex) * 100;
        reason = 'Priority faction';
      }
      
      // Early game factions (low requirements)
      const easyFactions = ['CyberSec', 'Tian Di Hui', 'Netburners', 'Sector-12'];
      if (easyFactions.includes(faction)) {
        score += 50;
        reason = reason ? `${reason}, Easy to progress` : 'Easy to progress';
      }
      
      // Hacking-focused factions (good for your build)
      const hackingFactions = ['BitRunners', 'The Black Hand', 'NiteSec', 'CyberSec', 'Netburners'];
      if (hackingFactions.includes(faction) && player.skills.hacking > 50) {
        score += 75;
        reason = reason ? `${reason}, Hacking synergy` : 'Hacking synergy';
      }
      
      scored.push({ faction, score, reason });
    }
    
    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0] || null;
  }

  /**
   * Join a faction
   */
  joinFaction(faction) {
    if (!this.ns.singularity) {
      this.ns.print(`[FACTION] Cannot join - Singularity API not available`);
      return false;
    }
    
    try {
      const success = this.ns.singularity.joinFaction(faction);
      if (success) {
        this.ns.print(`✓ Joined faction: ${faction}`);
      }
      return success;
    } catch (e) {
      this.ns.print(`[FACTION] Error joining ${faction}: ${e}`);
      return false;
    }
  }

  /**
   * Get current faction work status
   */
  getCurrentWork() {
    if (!this.ns.singularity) return null;
    
    try {
      // Try to get current work (API varies by version)
      const player = this.ns.getPlayer();
      if (player.currentWorkFactionName) {
        return {
          faction: player.currentWorkFactionName,
          type: player.currentWorkFactionDescription || 'unknown',
          isWorking: true
        };
      }
      return { isWorking: false };
    } catch (e) {
      return { isWorking: false };
    }
  }

  /**
   * Start working for a faction
   * @param {string} faction - Faction name
   * @param {string} workType - 'hacking', 'field', or 'security'
   */
  startWork(faction, workType = 'hacking') {
    if (!this.ns.singularity) {
      this.ns.print(`[FACTION] Cannot work - Singularity API not available`);
      return false;
    }
    
    try {
      let success = false;
      
      switch (workType) {
        case 'hacking':
          success = this.ns.singularity.workForFaction(faction, 'hacking');
          break;
        case 'field':
          success = this.ns.singularity.workForFaction(faction, 'field');
          break;
        case 'security':
          success = this.ns.singularity.workForFaction(faction, 'security');
          break;
      }
      
      if (success) {
        this.ns.print(`✓ Started ${workType} work for ${faction}`);
      }
      return success;
    } catch (e) {
      this.ns.print(`[FACTION] Error starting work for ${faction}: ${e}`);
      return false;
    }
  }

  /**
   * Get reputation for a faction
   */
  getFactionRep(faction) {
    try {
      return this.ns.singularity ? this.ns.singularity.getFactionRep(faction) : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get faction favor
   */
  getFactionFavor(faction) {
    try {
      return this.ns.singularity ? this.ns.singularity.getFactionFavor(faction) : 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Evaluate best faction to work for
   * Returns: { faction, workType, reason, expectedRepRate }
   */
  evaluateBestWork(currentFactions, targetAugmentations = []) {
    if (!currentFactions || currentFactions.length === 0) return null;
    
    const player = this.ns.getPlayer();
    const options = [];
    
    for (const faction of currentFactions) {
      const rep = this.getFactionRep(faction);
      const favor = this.getFactionFavor(faction);
      
      // Determine best work type based on stats
      let workType = 'hacking';
      let expectedRate = player.skills.hacking / 10; // Rough estimate
      
      if (player.skills.strength > player.skills.hacking) {
        workType = 'field';
        expectedRate = (player.skills.strength + player.skills.defense) / 20;
      }
      
      // Check if this faction has augmentations we want
      let hasTargetAugs = false;
      if (targetAugmentations.length > 0) {
        // Would need to check faction augmentations here
        hasTargetAugs = true; // Placeholder
      }
      
      options.push({
        faction,
        workType,
        expectedRepRate: expectedRate,
        currentRep: rep,
        favor,
        hasTargetAugs,
        reason: `${workType} work, ~${expectedRate.toFixed(1)} rep/sec`
      });
    }
    
    // Sort by: target augs > expected rep rate > current rep (lowest first)
    options.sort((a, b) => {
      if (a.hasTargetAugs !== b.hasTargetAugs) return b.hasTargetAugs - a.hasTargetAugs;
      if (Math.abs(a.expectedRepRate - b.expectedRepRate) > 1) return b.expectedRepRate - a.expectedRepRate;
      return a.currentRep - b.currentRep; // Work on faction with least rep
    });
    
    return options[0] || null;
  }

  /**
   * Get status summary
   */
  getStatus() {
    const factions = this.getAvailableFactions();
    const currentWork = this.getCurrentWork();
    
    const status = {
      currentFactions: factions.current.length,
      maxFactions: this.config.maxFactions,
      invitations: factions.invitations.length,
      isWorking: currentWork.isWorking,
      currentWorkFaction: currentWork.faction || null,
      currentWorkType: currentWork.type || null
    };
    
    // Get reputation for all factions
    status.factionReps = {};
    for (const faction of factions.current) {
      status.factionReps[faction] = this.getFactionRep(faction);
    }
    
    return status;
  }

  /**
   * Main decision loop - returns action to take
   */
  makeDecision() {
    const factions = this.getAvailableFactions();
    const currentWork = this.getCurrentWork();
    
    // Decision 1: Should we join a new faction?
    if (this.config.autoJoin && factions.canJoinMore && factions.invitations.length > 0) {
      const bestFaction = this.evaluateBestFactionToJoin(factions.invitations);
      if (bestFaction) {
        return {
          type: 'join',
          faction: bestFaction.faction,
          reason: bestFaction.reason,
          priority: 'high'
        };
      }
    }
    
    // Decision 2: Should we start/change faction work?
    if (factions.current.length > 0) {
      const bestWork = this.evaluateBestWork(factions.current);
      
      if (bestWork) {
        // If not working or working on different faction/type, switch
        if (!currentWork.isWorking || 
            currentWork.faction !== bestWork.faction ||
            currentWork.type !== bestWork.workType) {
          return {
            type: 'work',
            faction: bestWork.faction,
            workType: bestWork.workType,
            reason: bestWork.reason,
            priority: 'medium'
          };
        }
      }
    }
    
    // No action needed
    return {
      type: 'none',
      reason: 'All faction work optimized',
      priority: 'low'
    };
  }
}

/** Standalone execution for testing */
export async function main(ns) {
  const manager = new FactionManager(ns);
  
  ns.print("=== FACTION MANAGER TEST ===");
  
  const status = manager.getStatus();
  ns.print(`Current Factions: ${status.currentFactions}/${status.maxFactions}`);
  ns.print(`Invitations: ${status.invitations}`);
  ns.print(`Working: ${status.isWorking ? 'Yes' : 'No'}`);
  
  if (status.isWorking) {
    ns.print(`  Faction: ${status.currentWorkFaction}`);
    ns.print(`  Type: ${status.currentWorkType}`);
  }
  
  ns.print("\nFaction Reputations:");
  for (const [faction, rep] of Object.entries(status.factionReps)) {
    ns.print(`  ${faction}: ${rep.toFixed(0)}`);
  }
  
  const decision = manager.makeDecision();
  ns.print(`\nRecommended Action: ${decision.type.toUpperCase()}`);
  ns.print(`  ${decision.reason}`);
  ns.print(`  Priority: ${decision.priority}`);
}
