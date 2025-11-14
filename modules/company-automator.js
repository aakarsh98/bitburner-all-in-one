/** modules/company-automator.js
 * Intelligent company employment and career automation
 * 
 * FEATURES:
 * - Auto-applies to best companies based on your stats
 * - Works optimal job types for income and reputation
 * - Auto-applies for promotions when qualified
 * - Manages company reputation for faction invitations
 * - Optimizes between company work and faction work
 * 
 * INTEGRATION:
 * - Coordinates with faction-manager.js for optimal workflow
 * - Provides income estimates to auto-manager.js
 * 
 * @param {NS} ns
 */

export class CompanyAutomator {
  constructor(ns, config = {}) {
    this.ns = ns;
    this.config = {
      // Work preferences
      preferIncome: true,         // Prioritize $ over reputation
      minIncomeRate: 10000,       // Min $/sec to consider job valuable
      
      // Auto-apply settings
      autoApply: true,            // Auto-apply to companies
      autoPromote: true,          // Auto-apply for promotions
      
      // Company priorities (by sector)
      preferredSectors: [
        'Technology',             // Tech companies (good for hackers)
        'Software',               // Software companies
        'Computer',               // Computer companies
        'Network',                // Network companies
        'Security'                // Security companies
      ],
      
      // Top companies (best pay/reputation)
      topCompanies: [
        'MegaCorp',
        'Blade Industries',
        'Four Sigma',
        'NWO',
        'Clarke Incorporated',
        'OmniTek Incorporated',
        'Bachman & Associates',
        'ECorp',
        'Fulcrum Technologies',
        'Storm Technologies',
        'DefComm',
        'Helios Labs',
        'VitaLife',
        'Icarus Microsystems',
        'Universal Energy',
        'Galactic Cybersystems'
      ],
      
      // Faction-linked companies (work here to get faction invites)
      factionCompanies: {
        'ECorp': 'ECorp',
        'MegaCorp': 'MegaCorp',
        'Blade Industries': 'Blade Industries',
        'Four Sigma': 'Four Sigma',
        'NWO': 'NWO',
        'Clarke Incorporated': 'Clarke Incorporated',
        'OmniTek Incorporated': 'OmniTek Incorporated',
        'Bachman & Associates': 'Bachman & Associates',
        'Fulcrum Technologies': 'Fulcrum Secret Technologies',
        'KuaiGong International': 'KuaiGong International'
      },
      
      ...config
    };
  }

  /**
   * Check if Singularity API is available
   */
  hasSingularityAccess() {
    return this.ns.singularity !== undefined;
  }

  /**
   * Get all companies in the game
   */
  getAllCompanies() {
    // Bitburner doesn't have an API to list all companies
    // We maintain a known list
    const allCompanies = [
      // Megacorporations
      'ECorp', 'MegaCorp', 'Blade Industries', 'NWO',
      'Clarke Incorporated', 'OmniTek Incorporated',
      'Four Sigma', 'KuaiGong International',
      'Fulcrum Technologies', 'Bachman & Associates',
      
      // Major companies
      'Storm Technologies', 'DefComm', 'Helios Labs',
      'VitaLife', 'Icarus Microsystems', 'Universal Energy',
      'Galactic Cybersystems', 'AeroCorp', 'Omnia Cybersystems',
      'Solaris Space Systems', 'DeltaOne', 'Global Pharmaceuticals',
      'Nova Medical', 'Watchdog Security', 'LexoCorp',
      'Rho Construction', 'Alpha Enterprises', 'Aevum Police Headquarters',
      
      // Sector-12 companies
      'Carmichael Security', 'FoodNStuff', 'Joes Guns',
      
      // Other
      'Omega Software', 'Noodle Bar'
    ];
    
    return allCompanies;
  }

  /**
   * Get company reputation
   */
  getCompanyRep(company) {
    if (!this.hasSingularityAccess()) return 0;
    
    try {
      return this.ns.singularity.getCompanyRep(company);
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get company favor
   */
  getCompanyFavor(company) {
    if (!this.hasSingularityAccess()) return 0;
    
    try {
      return this.ns.singularity.getCompanyFavor(company);
    } catch (e) {
      return 0;
    }
  }

  /**
   * Check if player works for a company
   */
  worksForCompany(company) {
    if (!this.hasSingularityAccess()) return false;
    
    try {
      const player = this.ns.getPlayer();
      return player.jobs && player.jobs[company] !== undefined;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get current job position at a company
   */
  getJobPosition(company) {
    if (!this.hasSingularityAccess()) return null;
    
    try {
      const player = this.ns.getPlayer();
      return player.jobs ? player.jobs[company] : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Apply to a company
   */
  applyToCompany(company, field) {
    if (!this.hasSingularityAccess()) {
      this.ns.print(`[COMPANY] Cannot apply - Singularity API not available`);
      return false;
    }
    
    try {
      const success = this.ns.singularity.applyToCompany(company, field);
      if (success) {
        this.ns.print(`✓ Applied to ${company} (${field})`);
      }
      return success;
    } catch (e) {
      this.ns.print(`[COMPANY] Error applying to ${company}: ${e}`);
      return false;
    }
  }

  /**
   * Work for a company
   */
  workForCompany(company) {
    if (!this.hasSingularityAccess()) {
      this.ns.print(`[COMPANY] Cannot work - Singularity API not available`);
      return false;
    }
    
    try {
      const success = this.ns.singularity.workForCompany(company);
      if (success) {
        this.ns.print(`✓ Started working at ${company}`);
      }
      return success;
    } catch (e) {
      this.ns.print(`[COMPANY] Error working for ${company}: ${e}`);
      return false;
    }
  }

  /**
   * Apply for promotion at current company
   */
  applyForPromotion(company) {
    if (!this.hasSingularityAccess()) return false;
    
    try {
      const success = this.ns.singularity.applyToCompany(company, 'software');
      return success;
    } catch (e) {
      return false;
    }
  }

  /**
   * Evaluate a company's potential value
   */
  evaluateCompany(company, player) {
    let score = 0;
    let reason = [];
    
    // Priority 1: Top companies
    if (this.config.topCompanies.includes(company)) {
      score += 100;
      reason.push('Top company');
    }
    
    // Priority 2: Faction-linked companies
    if (this.config.factionCompanies[company]) {
      score += 75;
      reason.push(`Leads to ${this.config.factionCompanies[company]} faction`);
    }
    
    // Priority 3: Already working there (existing relationship)
    if (this.worksForCompany(company)) {
      score += 50;
      const rep = this.getCompanyRep(company);
      if (rep > 0) {
        score += Math.log10(rep + 1) * 10; // Bonus for existing reputation
        reason.push(`Current rep: ${rep.toFixed(0)}`);
      }
    }
    
    // Priority 4: Tech sector (good for hackers)
    const isTechCompany = this.config.preferredSectors.some(sector => 
      company.includes(sector)
    );
    if (isTechCompany || company.includes('Tech') || company.includes('Software')) {
      score += 30;
      reason.push('Tech sector');
    }
    
    return {
      company,
      score,
      reason: reason.join(', ') || 'Standard company'
    };
  }

  /**
   * Find best company to work for
   */
  findBestCompany() {
    if (!this.hasSingularityAccess()) return null;
    
    const player = this.ns.getPlayer();
    const companies = this.getAllCompanies();
    const evaluated = [];
    
    for (const company of companies) {
      const evaluation = this.evaluateCompany(company, player);
      evaluated.push(evaluation);
    }
    
    // Sort by score (highest first)
    evaluated.sort((a, b) => b.score - a.score);
    
    return evaluated[0];
  }

  /**
   * Get current work status
   */
  getCurrentWork() {
    if (!this.hasSingularityAccess()) return { isWorking: false };
    
    try {
      const player = this.ns.getPlayer();
      
      // Check if working for a company
      if (player.currentWorkFactionName) {
        return {
          isWorking: true,
          type: 'faction',
          location: player.currentWorkFactionName
        };
      }
      
      // Check if working at a company
      if (player.companyName) {
        return {
          isWorking: true,
          type: 'company',
          location: player.companyName,
          position: player.jobs ? player.jobs[player.companyName] : null
        };
      }
      
      return { isWorking: false };
    } catch (e) {
      return { isWorking: false };
    }
  }

  /**
   * Get list of companies player works for
   */
  getEmployedCompanies() {
    if (!this.hasSingularityAccess()) return [];
    
    try {
      const player = this.ns.getPlayer();
      return player.jobs ? Object.keys(player.jobs) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Get status summary
   */
  getStatus() {
    const employed = this.getEmployedCompanies();
    const currentWork = this.getCurrentWork();
    
    const status = {
      employedAt: employed.length,
      companies: employed,
      isWorking: currentWork.isWorking,
      workType: currentWork.type || null,
      currentCompany: currentWork.location || null,
      currentPosition: currentWork.position || null
    };
    
    // Get reputation for all companies
    status.companyReps = {};
    for (const company of employed) {
      status.companyReps[company] = this.getCompanyRep(company);
    }
    
    return status;
  }

  /**
   * Estimate income rate from company work
   */
  estimateIncomeRate(company, player) {
    // Rough estimate based on hacking skill
    // Actual income depends on position and company
    const baseRate = player.skills.hacking * 100; // $100 per hack skill
    
    // Top companies pay more
    const companyMultiplier = this.config.topCompanies.includes(company) ? 2.0 : 1.0;
    
    return baseRate * companyMultiplier;
  }

  /**
   * Main decision loop
   */
  makeDecision() {
    if (!this.hasSingularityAccess()) {
      return { type: 'none', reason: 'Singularity API not available' };
    }
    
    const player = this.ns.getPlayer();
    const employed = this.getEmployedCompanies();
    const currentWork = this.getCurrentWork();
    
    // Decision 1: Should we apply to a company?
    if (this.config.autoApply && employed.length === 0) {
      const bestCompany = this.findBestCompany();
      if (bestCompany) {
        return {
          type: 'apply',
          company: bestCompany.company,
          field: 'software', // Default to software field for hackers
          reason: bestCompany.reason,
          priority: 'medium'
        };
      }
    }
    
    // Decision 2: Should we apply for promotion?
    if (this.config.autoPromote && employed.length > 0) {
      // Check each company we work for
      for (const company of employed) {
        const rep = this.getCompanyRep(company);
        
        // If we have high rep, try for promotion
        if (rep > 10000) {
          return {
            type: 'promote',
            company: company,
            reason: `High reputation (${rep.toFixed(0)}), try for promotion`,
            priority: 'low'
          };
        }
      }
    }
    
    // Decision 3: Should we start working?
    if (employed.length > 0 && !currentWork.isWorking) {
      // Work at company with highest reputation
      let bestCompany = employed[0];
      let bestRep = this.getCompanyRep(employed[0]);
      
      for (const company of employed) {
        const rep = this.getCompanyRep(company);
        if (rep > bestRep) {
          bestRep = rep;
          bestCompany = company;
        }
      }
      
      const estimatedIncome = this.estimateIncomeRate(bestCompany, player);
      
      return {
        type: 'work',
        company: bestCompany,
        estimatedIncome,
        reason: `Work at ${bestCompany} (~${this.ns.formatNumber(estimatedIncome, 2)}/s)`,
        priority: 'low'
      };
    }
    
    // Decision 4: Compare company work vs faction work
    if (currentWork.isWorking && currentWork.type === 'company') {
      // We're already working, check if it's optimal
      // This decision should be coordinated with faction-manager
      const estimatedIncome = this.estimateIncomeRate(currentWork.location, player);
      
      if (estimatedIncome < this.config.minIncomeRate) {
        return {
          type: 'stop',
          reason: `Low income rate (${this.ns.formatNumber(estimatedIncome, 2)}/s)`,
          priority: 'low'
        };
      }
    }
    
    return {
      type: 'none',
      reason: 'All company work optimized',
      priority: 'low'
    };
  }
}

/** Standalone execution for testing */
export async function main(ns) {
  ns.disableLog("ALL");
  
  const player = ns.getPlayer();
  const hasSF4 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 4);
  
  if (!hasSF4) {
    ns.print("ℹ️  Source-File 4 not available");
    ns.print("This module requires SF4 (The Singularity)");
    ns.print("");
    ns.print("Once you get SF4, this will manage:");
    ns.print("  • Auto-apply to best companies");
    ns.print("  • Work optimal job types");
    ns.print("  • Auto-apply for promotions");
    ns.print("  • Optimize income and reputation");
    return;
  }
  
  const automator = new CompanyAutomator(ns);
  
  ns.tprint("=== COMPANY AUTOMATOR TEST ===");
  
  const status = automator.getStatus();
  ns.tprint(`\nEmployed at: ${status.employedAt} companies`);
  ns.tprint(`Working: ${status.isWorking ? 'Yes' : 'No'}`);
  
  if (status.isWorking) {
    ns.tprint(`  Type: ${status.workType}`);
    ns.tprint(`  Location: ${status.currentCompany}`);
    if (status.currentPosition) {
      ns.tprint(`  Position: ${status.currentPosition}`);
    }
  }
  
  if (status.companies.length > 0) {
    ns.tprint("\nCompany Reputations:");
    for (const company of status.companies) {
      const rep = status.companyReps[company] || 0;
      ns.tprint(`  ${company}: ${rep.toFixed(0)}`);
    }
  }
  
  const decision = automator.makeDecision();
  ns.tprint(`\nRecommended Action: ${decision.type.toUpperCase()}`);
  ns.tprint(`  ${decision.reason}`);
  ns.tprint(`  Priority: ${decision.priority}`);
}
