/** modules/corporation-manager.js
 * Corporation status tracking and basic automation
 * 
 * REQUIRES: $150 billion + Source-File 3 (Corporation access)
 * 
 * FEATURES:
 * - Tracks corporation status and divisions
 * - Monitors product lifecycle
 * - Provides expansion recommendations
 * - Basic automation for simple tasks
 * 
 * NOTE: Full corporation automation is extremely complex
 * This module provides status tracking and basic guidance
 * For advanced automation, see bitbotter's corp/ scripts
 * 
 * @param {NS} ns
 */

export class CorporationManager {
  constructor(ns, config = {}) {
    this.ns = ns;
    this.config = {
      // Corporation constants (from bitbotter)
      CITIES: ['Aevum', 'Chongqing', 'New Tokyo', 'Ishima', 'Volhaven', 'Sector-12'],
      
      JOBS: [
        'Operations',
        'Engineer',
        'Business',
        'Management',
        'Research & Development',
        'Training'
      ],
      
      BOOST_MATERIALS: [
        'Hardware',
        'Robots',
        'AI Cores',
        'Real Estate'
      ],
      
      // Material ratios by industry (for smart trading)
      MATERIAL_RATIOS: {
        'Software': [5, 1, 3, 2],
        'Agriculture': [4, 5, 5, 14],
        'Tobacco': [2, 4, 2, 2],
        'Food': [2, 5, 5, 1],
        'Pharmaceutical': [2, 5, 4, 1],
        'Healthcare': [1, 1, 1, 1],
        'Robotics': [3, 1, 7, 6],
        'Hardware': [1, 7, 3, 4],
        'RealEstate': [1, 11, 11, 1],
        'Mining': [8, 9, 9, 5],
        'Energy': [1, 1, 5, 13],
        'Utilities': [1, 8, 8, 10],
        'Fishing': [6, 10, 4, 2],
        'Chemical': [4, 5, 4, 5]
      },
      
      // Auto-management settings
      autoHireEmployees: false,    // Too expensive early on
      autoExpandCities: false,      // Manual control recommended
      autoProducts: false,          // Manual control recommended
      
      ...config
    };
  }

  /**
   * Check if Corporation API is available
   */
  hasCorporationAccess() {
    try {
      return this.ns.corporation !== undefined && this.ns.corporation.hasCorporation();
    } catch (e) {
      return false;
    }
  }

  /**
   * Get corporation info
   */
  getCorporationInfo() {
    if (!this.hasCorporationAccess()) return null;
    
    try {
      return this.ns.corporation.getCorporation();
    } catch (e) {
      return null;
    }
  }

  /**
   * Get all divisions
   */
  getDivisions() {
    if (!this.hasCorporationAccess()) return [];
    
    try {
      const corp = this.getCorporationInfo();
      if (!corp) return [];
      
      return corp.divisions.map(divName => ({
        name: divName,
        info: this.ns.corporation.getDivision(divName)
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Get division products
   */
  getDivisionProducts(divisionName) {
    if (!this.hasCorporationAccess()) return [];
    
    try {
      const division = this.ns.corporation.getDivision(divisionName);
      return division.products || [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Check if can afford expansion
   */
  canAffordExpansion(cost) {
    if (!this.hasCorporationAccess()) return false;
    
    try {
      const corp = this.getCorporationInfo();
      return corp && corp.funds >= cost;
    } catch (e) {
      return false;
    }
  }

  /**
   * Evaluate corporation health
   */
  evaluateHealth() {
    if (!this.hasCorporationAccess()) {
      return { healthy: false, reason: 'No corporation' };
    }
    
    const corp = this.getCorporationInfo();
    if (!corp) {
      return { healthy: false, reason: 'Cannot get corp info' };
    }
    
    const divisions = this.getDivisions();
    
    // Check basic health indicators
    const indicators = {
      hasDivisions: divisions.length > 0,
      hasPositiveFunds: corp.funds > 0,
      hasPositiveRevenue: corp.revenue > 0,
      isProfit: corp.revenue > corp.expenses,
      profitMargin: corp.revenue > 0 ? (corp.revenue - corp.expenses) / corp.revenue : 0
    };
    
    if (!indicators.hasDivisions) {
      return {
        healthy: false,
        reason: 'No divisions created',
        indicators
      };
    }
    
    if (!indicators.hasPositiveFunds) {
      return {
        healthy: false,
        reason: 'Negative funds - bankruptcy risk',
        indicators
      };
    }
    
    if (!indicators.isProfit) {
      return {
        healthy: false,
        reason: 'Operating at a loss',
        indicators
      };
    }
    
    return {
      healthy: true,
      reason: `Profitable (${(indicators.profitMargin * 100).toFixed(1)}% margin)`,
      indicators
    };
  }

  /**
   * Get recommendations for improvements
   */
  getRecommendations() {
    if (!this.hasCorporationAccess()) {
      return [{
        type: 'create',
        priority: 'high',
        description: 'Create corporation ($150b required)',
        reason: 'Corporations provide massive passive income in late game'
      }];
    }
    
    const corp = this.getCorporationInfo();
    const divisions = this.getDivisions();
    const health = this.evaluateHealth();
    const recommendations = [];
    
    // Recommendation: Create first division
    if (divisions.length === 0) {
      recommendations.push({
        type: 'division',
        priority: 'high',
        description: 'Create first division (Agriculture recommended)',
        reason: 'Agriculture is easiest to start with'
      });
    }
    
    // Recommendation: Expand to all cities
    if (divisions.length > 0) {
      for (const div of divisions) {
        if (div.info.cities.length < this.config.CITIES.length) {
          recommendations.push({
            type: 'expand',
            priority: 'medium',
            description: `Expand ${div.name} to all cities`,
            reason: `Currently in ${div.info.cities.length}/${this.config.CITIES.length} cities`
          });
        }
      }
    }
    
    // Recommendation: Check products
    if (divisions.length > 0) {
      for (const div of divisions) {
        const products = this.getDivisionProducts(div.name);
        if (div.info.makesProducts && products.length < 3) {
          recommendations.push({
            type: 'product',
            priority: 'medium',
            description: `Develop products for ${div.name}`,
            reason: `Only ${products.length}/3 products`
          });
        }
      }
    }
    
    // Recommendation: Improve profitability
    if (!health.healthy) {
      recommendations.push({
        type: 'optimize',
        priority: 'high',
        description: 'Improve profitability',
        reason: health.reason
      });
    }
    
    return recommendations;
  }

  /**
   * Get status summary
   */
  getStatus() {
    if (!this.hasCorporationAccess()) {
      return {
        available: false,
        reason: 'No corporation (need $150b + SF3)'
      };
    }
    
    const corp = this.getCorporationInfo();
    const divisions = this.getDivisions();
    const health = this.evaluateHealth();
    const recommendations = this.getRecommendations();
    
    return {
      available: true,
      corp: {
        name: corp.name,
        funds: corp.funds,
        revenue: corp.revenue,
        expenses: corp.expenses,
        profit: corp.revenue - corp.expenses,
        divisions: divisions.length,
        public: corp.public,
        sharePrice: corp.sharePrice || 0
      },
      divisions: divisions.map(div => ({
        name: div.name,
        type: div.info.type,
        cities: div.info.cities.length,
        products: div.info.products.length,
        awareness: div.info.awareness,
        popularity: div.info.popularity
      })),
      health,
      recommendations
    };
  }

  /**
   * Main decision loop (simplified - corporations need manual management)
   */
  makeDecision() {
    if (!this.hasCorporationAccess()) {
      return {
        type: 'none',
        reason: 'Corporation not available (need $150b + SF3)',
        priority: 'low'
      };
    }
    
    const recommendations = this.getRecommendations();
    
    if (recommendations.length === 0) {
      return {
        type: 'none',
        reason: 'Corporation operations optimal',
        priority: 'low'
      };
    }
    
    // Return highest priority recommendation
    const bestRec = recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    })[0];
    
    return {
      type: 'recommendation',
      recommendation: bestRec,
      reason: bestRec.description,
      priority: bestRec.priority,
      allRecommendations: recommendations
    };
  }
}

/** Standalone execution for testing */
export async function main(ns) {
  const manager = new CorporationManager(ns);
  
  ns.tprint("=== CORPORATION MANAGER TEST ===");
  
  const status = manager.getStatus();
  
  if (!status.available) {
    ns.tprint(`\n${status.reason}`);
    ns.tprint("Corporation is a late-game feature requiring $150 billion");
    return;
  }
  
  const corp = status.corp;
  ns.tprint(`\nCorporation: ${corp.name}`);
  ns.tprint(`Funds: ${ns.formatNumber(corp.funds, 2)}`);
  ns.tprint(`Revenue: ${ns.formatNumber(corp.revenue, 2)}/s`);
  ns.tprint(`Expenses: ${ns.formatNumber(corp.expenses, 2)}/s`);
  ns.tprint(`Profit: ${ns.formatNumber(corp.profit, 2)}/s`);
  ns.tprint(`Divisions: ${corp.divisions}`);
  
  if (status.divisions.length > 0) {
    ns.tprint("\nDivisions:");
    for (const div of status.divisions) {
      ns.tprint(`  ${div.name} (${div.type})`);
      ns.tprint(`    Cities: ${div.cities}, Products: ${div.products}`);
      ns.tprint(`    Awareness: ${div.awareness.toFixed(0)}, Popularity: ${div.popularity.toFixed(0)}`);
    }
  }
  
  ns.tprint(`\nHealth: ${status.health.healthy ? '✓ HEALTHY' : '✗ NEEDS ATTENTION'}`);
  ns.tprint(`  ${status.health.reason}`);
  
  if (status.recommendations.length > 0) {
    ns.tprint("\nRecommendations:");
    for (const rec of status.recommendations) {
      ns.tprint(`  [${rec.priority.toUpperCase()}] ${rec.description}`);
      ns.tprint(`    ${rec.reason}`);
    }
  }
  
  const decision = manager.makeDecision();
  ns.tprint(`\nRecommended Action: ${decision.type.toUpperCase()}`);
  ns.tprint(`  ${decision.reason}`);
}
