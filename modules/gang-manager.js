/** modules/gang-manager.js
 * Intelligent Gang management and automation
 * 
 * REQUIRES: Source-File 2 (Gang access) + Join a gang
 * 
 * FEATURES:
 * - Auto-recruits gang members
 * - Optimizes member training and ascension
 * - Manages territory warfare timing
 * - Auto-purchases equipment
 * - Maximizes respect and money gains
 * 
 * STRATEGY:
 * - Recruit members automatically
 * - Train until ascension thresholds
 * - Ascend at power-of-2 multipliers
 * - Engage in territory warfare when optimal
 * - Purchase equipment after ascension
 * 
 * @param {NS} ns
 */

export class GangManager {
  constructor(ns, config = {}) {
    this.ns = ns;
    this.config = {
      // Ascension strategy (based on bitbotter's power-of-2 approach)
      maxAscensionBracket: 6,     // Max bracket (2^6 = 64x multiplier)
      ascendThreshold: 2.0,       // Ascend when next multiplier reaches 2x
      
      // Territory warfare
      enableTerritoryWarfare: true,
      minWinChance: 0.55,         // Min 55% win chance for warfare
      
      // Equipment purchasing
      autoEquipment: true,
      priorityEquipment: [
        'Ford Flex V20',          // +30% all stats (cheap, always buy)
        'ATX1070 Superbike',      // +40% all stats (buy after bracket 3)
        'Mercedes-Benz S9001',    // +50% all stats (expensive)
        'White Ferrari',          // +60% all stats (very expensive)
        
        // Weapons
        'Baseball Bat',
        'Katana',
        'Glock 18C',
        'P90C',
        'Steyr AUG',
        'AK-47',
        'M15A10 Assault Rifle',
        'AWM Sniper Rifle',
        
        // Armor
        'Bulletproof Vest',
        'Full Body Armor',
        'Liquid Body Armor',
        'Graphene Plating Armor',
        
        // Vehicles (by bracket)
        // Already covered above
        
        // Rootkits
        'NUKE Rootkit',
        'Soulstealer Rootkit',
        'Demon Rootkit',
        'Hmap Node',
        'Jack the Ripper'
      ],
      
      // Task assignments
      earlyGameTask: 'Human Trafficking',  // Best money/respect early
      combatTrainTask: 'Train Combat',
      hackTrainTask: 'Train Hacking',
      charismaTrainTask: 'Human Trafficking', // Also trains charisma
      territoryTask: 'Territory Warfare',
      
      ...config
    };
  }

  /**
   * Check if Gang API is available
   */
  hasGangAccess() {
    try {
      return this.ns.gang !== undefined && this.ns.gang.inGang();
    } catch (e) {
      return false;
    }
  }

  /**
   * Get gang information
   */
  getGangInfo() {
    if (!this.hasGangAccess()) return null;
    
    try {
      return this.ns.gang.getGangInformation();
    } catch (e) {
      return null;
    }
  }

  /**
   * Get all gang member names
   */
  getMemberNames() {
    if (!this.hasGangAccess()) return [];
    
    try {
      return this.ns.gang.getMemberNames();
    } catch (e) {
      return [];
    }
  }

  /**
   * Get member information
   */
  getMemberInfo(name) {
    if (!this.hasGangAccess()) return null;
    
    try {
      return this.ns.gang.getMemberInformation(name);
    } catch (e) {
      return null;
    }
  }

  /**
   * Get ascension result (what multipliers would be gained)
   */
  getAscensionResult(name) {
    if (!this.hasGangAccess()) return null;
    
    try {
      return this.ns.gang.getAscensionResult(name);
    } catch (e) {
      return null;
    }
  }

  /**
   * Recruit a new member
   */
  recruitMember(name) {
    if (!this.hasGangAccess()) return false;
    
    try {
      const success = this.ns.gang.recruitMember(name);
      if (success) {
        this.ns.print(`✓ Recruited gang member: ${name}`);
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  /**
   * Can recruit new member
   */
  canRecruit() {
    if (!this.hasGangAccess()) return false;
    
    try {
      return this.ns.gang.canRecruitMember();
    } catch (e) {
      return false;
    }
  }

  /**
   * Set member task
   */
  setTask(name, task) {
    if (!this.hasGangAccess()) return false;
    
    try {
      return this.ns.gang.setMemberTask(name, task);
    } catch (e) {
      return false;
    }
  }

  /**
   * Ascend a member
   */
  ascendMember(name) {
    if (!this.hasGangAccess()) return null;
    
    try {
      const result = this.ns.gang.ascendMember(name);
      if (result) {
        this.ns.print(`✓ Ascended ${name}: STR=${result.str.toFixed(2)}x DEF=${result.def.toFixed(2)}x DEX=${result.dex.toFixed(2)}x AGI=${result.agi.toFixed(2)}x`);
      }
      return result;
    } catch (e) {
      return null;
    }
  }

  /**
   * Purchase equipment for a member
   */
  purchaseEquipment(name, equipment) {
    if (!this.hasGangAccess()) return false;
    
    try {
      const success = this.ns.gang.purchaseEquipment(name, equipment);
      if (success) {
        this.ns.print(`✓ Purchased ${equipment} for ${name}`);
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  /**
   * Calculate ascension bracket (power of 2)
   * Bracket 0 = 1x-2x, Bracket 1 = 2x-4x, Bracket 2 = 4x-8x, etc.
   */
  calculateBracket(multiplier) {
    return Math.floor(Math.log2(multiplier));
  }

  /**
   * Calculate next ascension multiplier needed
   */
  calculateNextMultiplier(bracket) {
    return Math.pow(2, bracket + 1);
  }

  /**
   * Evaluate if member should ascend
   */
  shouldAscend(memberName) {
    const memberInfo = this.getMemberInfo(memberName);
    if (!memberInfo) return { should: false, reason: 'No member info' };
    
    const ascResult = this.getAscensionResult(memberName);
    if (!ascResult) return { should: false, reason: 'Cannot ascend yet' };
    
    // Calculate brackets for each stat
    const brackets = {
      hack: this.calculateBracket(memberInfo.hack_asc_mult),
      str: this.calculateBracket(memberInfo.str_asc_mult),
      def: this.calculateBracket(memberInfo.def_asc_mult),
      dex: this.calculateBracket(memberInfo.dex_asc_mult),
      agi: this.calculateBracket(memberInfo.agi_asc_mult),
      cha: this.calculateBracket(memberInfo.cha_asc_mult)
    };
    
    const lowestBracket = Math.min(...Object.values(brackets));
    
    // Don't ascend if already at max bracket
    if (lowestBracket >= this.config.maxAscensionBracket) {
      return { should: false, reason: `Max bracket (${lowestBracket})` };
    }
    
    // Check if any stat at lowest bracket is ready to ascend
    const stats = ['hack', 'str', 'def', 'dex', 'agi', 'cha'];
    for (const stat of stats) {
      if (brackets[stat] === lowestBracket) {
        const currentMult = memberInfo[`${stat}_asc_mult`];
        const nextMultNeeded = this.calculateNextMultiplier(brackets[stat]);
        const gainMult = ascResult[stat];
        
        // Check if ascending would push us to next bracket
        if (gainMult >= this.config.ascendThreshold) {
          return {
            should: true,
            reason: `${stat.toUpperCase()} ready (${currentMult.toFixed(2)}x → ${(currentMult * gainMult).toFixed(2)}x)`,
            bracket: lowestBracket,
            stat
          };
        }
      }
    }
    
    return { should: false, reason: `Training (bracket ${lowestBracket})` };
  }

  /**
   * Determine best task for member
   */
  determineBestTask(memberName) {
    const memberInfo = this.getMemberInfo(memberName);
    if (!memberInfo) return this.config.earlyGameTask;
    
    const ascResult = this.getAscensionResult(memberName);
    if (!ascResult) {
      // New member - default task
      return this.config.earlyGameTask;
    }
    
    // Calculate brackets
    const brackets = {
      hack: this.calculateBracket(memberInfo.hack_asc_mult),
      str: this.calculateBracket(memberInfo.str_asc_mult),
      def: this.calculateBracket(memberInfo.def_asc_mult),
      dex: this.calculateBracket(memberInfo.dex_asc_mult),
      agi: this.calculateBracket(memberInfo.agi_asc_mult),
      cha: this.calculateBracket(memberInfo.cha_asc_mult)
    };
    
    const lowestBracket = Math.min(...Object.values(brackets));
    
    // Determine what needs training
    const needsCombatTraining = ['str', 'def', 'dex', 'agi'].some(stat => 
      brackets[stat] === lowestBracket && 
      ascResult[stat] < this.config.ascendThreshold
    );
    
    const needsCharismaTraining = brackets.cha === lowestBracket && 
      ascResult.cha < this.config.ascendThreshold;
    
    const needsHackTraining = brackets.hack === lowestBracket && 
      ascResult.hack < this.config.ascendThreshold;
    
    if (needsCombatTraining) {
      return this.config.combatTrainTask;
    } else if (needsCharismaTraining) {
      return this.config.charismaTrainTask;
    } else if (needsHackTraining) {
      return this.config.hackTrainTask;
    } else {
      // Ready to ascend or working on money/respect
      return this.config.earlyGameTask;
    }
  }

  /**
   * Purchase equipment for member (prioritized list)
   */
  equipMember(memberName) {
    if (!this.config.autoEquipment) return;
    
    const memberInfo = this.getMemberInfo(memberName);
    if (!memberInfo) return;
    
    const bracket = this.calculateBracket(memberInfo.str_asc_mult);
    
    // Buy Ford Flex (always)
    this.purchaseEquipment(memberName, 'Ford Flex V20');
    
    // Buy ATX1070 if bracket >= 3
    if (bracket >= 3) {
      this.purchaseEquipment(memberName, 'ATX1070 Superbike');
    }
    
    // Try to buy other equipment in priority order
    for (const equipment of this.config.priorityEquipment) {
      this.purchaseEquipment(memberName, equipment);
    }
  }

  /**
   * Manage territory warfare
   */
  manageTerritory() {
    if (!this.config.enableTerritoryWarfare) return false;
    if (!this.hasGangAccess()) return false;
    
    const gangInfo = this.getGangInfo();
    if (!gangInfo) return false;
    
    // Already have all territory
    if (gangInfo.territory >= 0.999) {
      return false; // No warfare needed
    }
    
    // Enable warfare if we have good win chance
    const clashChance = gangInfo.territoryClashChance;
    if (clashChance > 0) {
      try {
        this.ns.gang.setTerritoryWarfare(true);
        return true;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Get status summary
   */
  getStatus() {
    if (!this.hasGangAccess()) {
      return { available: false };
    }
    
    const gangInfo = this.getGangInfo();
    const members = this.getMemberNames();
    
    return {
      available: true,
      memberCount: members.length,
      canRecruit: this.canRecruit(),
      gangInfo,
      members: members.map(name => ({
        name,
        info: this.getMemberInfo(name),
        shouldAscend: this.shouldAscend(name)
      }))
    };
  }

  /**
   * Main decision loop
   */
  makeDecision() {
    if (!this.hasGangAccess()) {
      return {
        type: 'none',
        reason: 'Gang not available (need SF2 + join a gang)'
      };
    }
    
    // Priority 1: Recruit if possible
    if (this.canRecruit()) {
      const members = this.getMemberNames();
      const newName = String.fromCharCode(members.length + 'A'.charCodeAt(0));
      
      return {
        type: 'recruit',
        name: newName,
        reason: `Recruit member ${newName}`,
        priority: 'high'
      };
    }
    
    // Priority 2: Manage territory warfare
    const gangInfo = this.getGangInfo();
    const needsTerritory = gangInfo && gangInfo.territory < 0.999;
    
    if (needsTerritory && this.config.enableTerritoryWarfare) {
      return {
        type: 'territory',
        enabled: true,
        reason: `Territory warfare (${(gangInfo.territory * 100).toFixed(1)}% controlled)`,
        priority: 'medium'
      };
    }
    
    // Priority 3: Check for ascensions and task assignments
    const members = this.getMemberNames();
    const actions = [];
    
    for (const member of members) {
      const ascensionCheck = this.shouldAscend(member);
      
      if (ascensionCheck.should) {
        actions.push({
          type: 'ascend',
          member,
          reason: ascensionCheck.reason,
          bracket: ascensionCheck.bracket
        });
      } else {
        const bestTask = this.determineBestTask(member);
        actions.push({
          type: 'task',
          member,
          task: bestTask,
          reason: ascensionCheck.reason
        });
      }
    }
    
    // Return first action that needs doing
    if (actions.length > 0) {
      const action = actions[0];
      return {
        type: action.type,
        member: action.member,
        task: action.task,
        reason: action.reason,
        allActions: actions,
        priority: action.type === 'ascend' ? 'high' : 'low'
      };
    }
    
    return {
      type: 'none',
      reason: 'All gang operations optimized',
      priority: 'low'
    };
  }
}

/** Standalone execution for testing */
export async function main(ns) {
  ns.disableLog("ALL");
  
  // Check if gang is available BEFORE creating manager
  try {
    if (!ns.gang || !ns.gang.inGang()) {
      ns.print("ℹ️  Gang Manager - Not in a gang yet");
      ns.print("");
      ns.print("Requirements:");
      ns.print("  1. Source-File 2 (Gangs)");
      ns.print("  2. Join a gang from main menu");
      ns.print("");
      ns.print("This module will auto-activate when you join a gang.");
      ns.print("Exiting gracefully...");
      return;
    }
  } catch (e) {
    ns.print("ℹ️  Gang API not available (need SF2)");
    ns.print("Complete BitNode 2 to unlock gang features!");
    return;
  }
  
  const manager = new GangManager(ns);
  
  ns.tprint("=== GANG MANAGER TEST ===");
  
  const status = manager.getStatus();
  
  if (!status.available) {
    ns.tprint("ℹ️  Gang not available");
    ns.tprint("You need Source-File 2 and to join a gang");
    return;
  }
  
  const gangInfo = status.gangInfo;
  ns.tprint(`\nGang: ${gangInfo.faction}`);
  ns.tprint(`Members: ${status.memberCount}${status.canRecruit ? ' (can recruit)' : ''}`);
  ns.tprint(`Territory: ${(gangInfo.territory * 100).toFixed(1)}%`);
  ns.tprint(`Respect: ${gangInfo.respect.toFixed(0)} | Power: ${gangInfo.power.toFixed(0)}`);
  ns.tprint(`Wanted: ${gangInfo.wantedLevel.toFixed(0)} | Penalty: ${(gangInfo.wantedPenalty * 100).toFixed(1)}%`);
  
  if (status.members.length > 0) {
    ns.tprint("\nMembers:");
    for (const member of status.members) {
      const info = member.info;
      const lowestBracket = Math.min(
        Math.floor(Math.log2(info.hack_asc_mult)),
        Math.floor(Math.log2(info.str_asc_mult)),
        Math.floor(Math.log2(info.def_asc_mult)),
        Math.floor(Math.log2(info.dex_asc_mult)),
        Math.floor(Math.log2(info.agi_asc_mult)),
        Math.floor(Math.log2(info.cha_asc_mult))
      );
      
      ns.tprint(`  ${member.name}: ${info.task} | Bracket ${lowestBracket} | ${member.shouldAscend.reason}`);
    }
  }
  
  const decision = manager.makeDecision();
  ns.tprint(`\nRecommended Action: ${decision.type.toUpperCase()}`);
  ns.tprint(`  ${decision.reason}`);
  ns.tprint(`  Priority: ${decision.priority}`);
}
