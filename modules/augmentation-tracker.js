/** modules/augmentation-tracker.js
 * Intelligent augmentation purchase planning and tracking
 * 
 * FEATURES:
 * - Tracks all available augmentations from joined factions
 * - Calculates purchase requirements (reputation + money)
 * - Plans optimal purchase order (price increases with each purchase)
 * - Prioritizes augmentations by value/benefit
 * - Tracks prerequisites and dependencies
 * 
 * INTEGRATION:
 * - Works with faction-manager.js to set reputation goals
 * - Provides purchase recommendations to auto-manager.js
 * 
 * @param {NS} ns
 */

export class AugmentationTracker {
  constructor(ns, config = {}) {
    this.ns = ns;
    this.config = {
      // Budget management
      reserveFunds: 1000000,      // Keep $1M reserve
      maxSpendPercent: 0.5,       // Spend max 50% of money on augs
      
      // Purchase strategy
      autoBuy: false,             // Auto-purchase when affordable (dangerous!)
      minAugsBeforeInstall: 5,    // Buy at least 5 before installing
      
      // Prioritization weights
      priorityWeights: {
        hacking: 10,              // Hacking skill/exp multipliers
        hackingSpeed: 8,          // Faster hack/grow/weaken
        hackingMoney: 9,          // More money from hacking
        hackingChance: 7,         // Better success rate
        combat: 3,                // Combat stats (lower priority for hacking build)
        charisma: 4,              // Company/faction rep gains
        reputation: 8,            // Faction rep multipliers
        bladeburner: 2,           // Bladeburner bonuses (late game)
        unique: 10                // Special/powerful augs
      },
      
      // High-priority augmentations (always buy these)
      highPriorityAugs: [
        'NeuroFlux Governor',     // Can buy infinite times
        'BitWire',                // +5% hacking
        'Artificial Bio-neural Network Implant', // +12% hacking
        'Artificial Synaptic Potentiation',      // +5% hacking speed
        'Enhanced Social Interaction Implant',   // +10% rep from factions/companies
        'Neuralstimulator',       // +3% hacking speed/chance
        'BitRunners Neurolink',   // +5% hacking skills
        'The Red Pill'            // Access to World Daemon (endgame)
      ],
      
      ...config
    };
    
    // Cache for augmentation data
    this.augCache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 60000; // 1 minute
  }

  /**
   * Check if Singularity API is available
   */
  hasSingularityAccess() {
    return this.ns.singularity !== undefined;
  }

  /**
   * Get all augmentations available from a faction
   */
  getFactionAugmentations(faction) {
    if (!this.hasSingularityAccess()) return [];
    
    try {
      return this.ns.singularity.getAugmentationsFromFaction(faction);
    } catch (e) {
      return [];
    }
  }

  /**
   * Get augmentation details
   */
  getAugmentationStats(augName) {
    if (!this.hasSingularityAccess()) return null;
    
    // Check cache first
    const now = Date.now();
    if (this.augCache.has(augName) && (now - this.lastCacheUpdate) < this.cacheTimeout) {
      return this.augCache.get(augName);
    }
    
    try {
      const stats = this.ns.singularity.getAugmentationStats(augName);
      const price = this.ns.singularity.getAugmentationPrice(augName);
      const repReq = this.ns.singularity.getAugmentationRepReq(augName);
      const prereqs = this.ns.singularity.getAugmentationPrereq(augName);
      
      const augData = {
        name: augName,
        price,
        repReq,
        prereqs: prereqs || [],
        stats,
        owned: this.isAugmentationOwned(augName)
      };
      
      this.augCache.set(augName, augData);
      this.lastCacheUpdate = now;
      
      return augData;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if an augmentation is already owned/purchased
   */
  isAugmentationOwned(augName) {
    if (!this.hasSingularityAccess()) return false;
    
    try {
      const owned = this.ns.singularity.getOwnedAugmentations(true); // true = include pending
      return owned.includes(augName);
    } catch (e) {
      return false;
    }
  }

  /**
   * Calculate priority score for an augmentation
   */
  calculatePriority(aug) {
    let score = 0;
    const stats = aug.stats;
    const weights = this.config.priorityWeights;
    
    // High priority augmentations get bonus
    if (this.config.highPriorityAugs.includes(aug.name)) {
      score += 1000;
    }
    
    // Hacking multipliers
    if (stats.hacking_mult) score += (stats.hacking_mult - 1) * 100 * weights.hacking;
    if (stats.hacking_exp_mult) score += (stats.hacking_exp_mult - 1) * 100 * weights.hacking;
    if (stats.hacking_speed_mult) score += (stats.hacking_speed_mult - 1) * 100 * weights.hackingSpeed;
    if (stats.hacking_money_mult) score += (stats.hacking_money_mult - 1) * 100 * weights.hackingMoney;
    if (stats.hacking_grow_mult) score += (stats.hacking_grow_mult - 1) * 100 * weights.hackingMoney;
    if (stats.hacking_chance_mult) score += (stats.hacking_chance_mult - 1) * 100 * weights.hackingChance;
    
    // Combat stats (lower priority)
    const combatStats = ['strength_mult', 'defense_mult', 'dexterity_mult', 'agility_mult'];
    for (const stat of combatStats) {
      if (stats[stat]) score += (stats[stat] - 1) * 100 * weights.combat;
    }
    
    // Charisma and reputation
    if (stats.charisma_mult) score += (stats.charisma_mult - 1) * 100 * weights.charisma;
    if (stats.faction_rep_mult) score += (stats.faction_rep_mult - 1) * 100 * weights.reputation;
    if (stats.company_rep_mult) score += (stats.company_rep_mult - 1) * 100 * weights.reputation;
    
    // Special case: NeuroFlux Governor (can buy infinite times, always valuable)
    if (aug.name === 'NeuroFlux Governor') {
      score += 500;
    }
    
    // Adjust score by cost-effectiveness (benefit per dollar)
    if (aug.price > 0 && score > 0) {
      const costEfficiency = score / (aug.price / 1000000); // Score per $1M
      score = score * 0.7 + costEfficiency * 0.3; // 70% raw benefit, 30% cost-efficiency
    }
    
    return score;
  }

  /**
   * Get all available augmentations from all joined factions
   */
  getAllAvailableAugmentations() {
    if (!this.hasSingularityAccess()) return [];
    
    const player = this.ns.getPlayer();
    const factions = player.factions || [];
    const augMap = new Map(); // Prevent duplicates
    
    for (const faction of factions) {
      const factionAugs = this.getFactionAugmentations(faction);
      
      for (const augName of factionAugs) {
        if (this.isAugmentationOwned(augName)) continue; // Skip owned
        
        const augData = this.getAugmentationStats(augName);
        if (!augData) continue;
        
        // Track which faction offers this aug (some augs available from multiple factions)
        if (augMap.has(augName)) {
          augMap.get(augName).factions.push(faction);
        } else {
          augData.factions = [faction];
          augData.priority = this.calculatePriority(augData);
          augMap.set(augName, augData);
        }
      }
    }
    
    return Array.from(augMap.values());
  }

  /**
   * Filter augmentations by affordability and prerequisites
   */
  getAffordableAugmentations(currentMoney, factionReps) {
    const allAugs = this.getAllAvailableAugmentations();
    const affordable = [];
    
    const budget = Math.min(
      currentMoney - this.config.reserveFunds,
      currentMoney * this.config.maxSpendPercent
    );
    
    for (const aug of allAugs) {
      // Check price
      if (aug.price > budget) continue;
      
      // Check reputation (must meet rep req in at least one faction)
      let hasEnoughRep = false;
      for (const faction of aug.factions) {
        const rep = factionReps[faction] || 0;
        if (rep >= aug.repReq) {
          hasEnoughRep = true;
          aug.purchaseFaction = faction; // Mark which faction to buy from
          break;
        }
      }
      
      if (!hasEnoughRep) continue;
      
      // Check prerequisites
      const prereqsMet = aug.prereqs.every(prereq => this.isAugmentationOwned(prereq));
      if (!prereqsMet) continue;
      
      affordable.push(aug);
    }
    
    // Sort by priority (highest first)
    affordable.sort((a, b) => b.priority - a.priority);
    
    return affordable;
  }

  /**
   * Plan augmentation purchase order accounting for price increases
   * 
   * Each aug purchase increases the price of all remaining augs by 1.9x
   * This calculates the optimal order to minimize total cost
   */
  planPurchaseOrder(affordable) {
    if (affordable.length === 0) return [];
    
    // Create a copy to work with
    const augs = [...affordable];
    const plan = [];
    let multiplier = 1.0;
    
    // Greedy algorithm: at each step, buy the aug with best priority/cost ratio
    // considering current price with multiplier
    while (augs.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;
      
      for (let i = 0; i < augs.length; i++) {
        const aug = augs[i];
        const adjustedPrice = aug.price * multiplier;
        
        // Score = priority / log(price) to balance value vs cost
        // Using log prevents expensive augs from dominating
        const score = aug.priority / Math.log10(adjustedPrice + 1);
        
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      
      // Add best aug to plan
      const selectedAug = augs[bestIndex];
      plan.push({
        ...selectedAug,
        purchaseOrder: plan.length + 1,
        priceMultiplier: multiplier,
        adjustedPrice: selectedAug.price * multiplier
      });
      
      // Remove from list and increase multiplier
      augs.splice(bestIndex, 1);
      multiplier *= 1.9;
    }
    
    return plan;
  }

  /**
   * Purchase an augmentation
   */
  purchaseAugmentation(augName, faction) {
    if (!this.hasSingularityAccess()) {
      this.ns.print(`[AUG] Cannot purchase - Singularity API not available`);
      return false;
    }
    
    try {
      const success = this.ns.singularity.purchaseAugmentation(faction, augName);
      if (success) {
        this.ns.print(`✓ Purchased: ${augName} from ${faction}`);
        
        // Clear cache for this aug
        this.augCache.delete(augName);
      }
      return success;
    } catch (e) {
      this.ns.print(`[AUG] Error purchasing ${augName}: ${e}`);
      return false;
    }
  }

  /**
   * Install all purchased augmentations (soft reset)
   */
  installAugmentations() {
    if (!this.hasSingularityAccess()) {
      this.ns.print(`[AUG] Cannot install - Singularity API not available`);
      return false;
    }
    
    const owned = this.ns.singularity.getOwnedAugmentations(false); // false = only pending
    
    if (owned.length < this.config.minAugsBeforeInstall) {
      this.ns.print(`[AUG] Not enough augmentations to install (${owned.length}/${this.config.minAugsBeforeInstall})`);
      return false;
    }
    
    try {
      this.ns.singularity.installAugmentations();
      this.ns.print(`✓ Installing ${owned.length} augmentations - SOFT RESET INITIATED`);
      return true;
    } catch (e) {
      this.ns.print(`[AUG] Error installing augmentations: ${e}`);
      return false;
    }
  }

  /**
   * Get status summary
   */
  getStatus() {
    const owned = this.hasSingularityAccess() ? 
      this.ns.singularity.getOwnedAugmentations(true) : [];
    const installed = this.hasSingularityAccess() ?
      this.ns.singularity.getOwnedAugmentations(false) : [];
    
    const available = this.getAllAvailableAugmentations();
    const player = this.ns.getPlayer();
    
    return {
      ownedCount: owned.length,
      installedCount: installed.length,
      pendingCount: owned.length - installed.length,
      availableCount: available.length,
      readyToInstall: (owned.length - installed.length) >= this.config.minAugsBeforeInstall,
      currentMoney: player.money
    };
  }

  /**
   * Main decision loop
   */
  makeDecision(currentMoney, factionReps) {
    if (!this.hasSingularityAccess()) {
      return { type: 'none', reason: 'Singularity API not available' };
    }
    
    const affordable = this.getAffordableAugmentations(currentMoney, factionReps);
    
    if (affordable.length === 0) {
      return {
        type: 'none',
        reason: 'No affordable augmentations available',
        needMoreMoney: true
      };
    }
    
    const plan = this.planPurchaseOrder(affordable);
    const nextAug = plan[0];
    
    // Check if we should install
    const status = this.getStatus();
    if (status.readyToInstall && this.config.autoBuy) {
      return {
        type: 'install',
        reason: `${status.pendingCount} augmentations ready to install`,
        count: status.pendingCount
      };
    }
    
    return {
      type: 'purchase',
      augmentation: nextAug,
      reason: `Buy ${nextAug.name} from ${nextAug.purchaseFaction}`,
      cost: nextAug.adjustedPrice,
      priority: nextAug.priority,
      totalAffordable: affordable.length
    };
  }
}

/** Standalone execution for testing */
export async function main(ns) {
  const tracker = new AugmentationTracker(ns);
  
  ns.tprint("=== AUGMENTATION TRACKER TEST ===");
  
  if (!tracker.hasSingularityAccess()) {
    ns.tprint("ERROR: Singularity API not available");
    ns.tprint("You need Source-File 4 (Singularity) to use this module");
    return;
  }
  
  const status = tracker.getStatus();
  ns.tprint(`\nOwned: ${status.ownedCount} | Installed: ${status.installedCount} | Pending: ${status.pendingCount}`);
  ns.tprint(`Available from factions: ${status.availableCount}`);
  ns.tprint(`Ready to install: ${status.readyToInstall ? 'YES' : 'NO'}`);
  
  // Get faction reps
  const player = ns.getPlayer();
  const factionReps = {};
  for (const faction of player.factions || []) {
    factionReps[faction] = ns.singularity.getFactionRep(faction);
  }
  
  const affordable = tracker.getAffordableAugmentations(status.currentMoney, factionReps);
  ns.tprint(`\nAffordable now: ${affordable.length}`);
  
  if (affordable.length > 0) {
    const plan = tracker.planPurchaseOrder(affordable);
    ns.tprint("\nTop 5 Purchase Recommendations:");
    
    for (let i = 0; i < Math.min(5, plan.length); i++) {
      const aug = plan[i];
      ns.tprint(`${i + 1}. ${aug.name}`);
      ns.tprint(`   Priority: ${aug.priority.toFixed(0)} | Cost: $${(aug.adjustedPrice / 1e6).toFixed(2)}m`);
      ns.tprint(`   Faction: ${aug.purchaseFaction} | Req Rep: ${aug.repReq.toFixed(0)}`);
    }
  }
  
  const decision = tracker.makeDecision(status.currentMoney, factionReps);
  ns.tprint(`\nRecommended Action: ${decision.type.toUpperCase()}`);
  ns.tprint(`  ${decision.reason}`);
}
