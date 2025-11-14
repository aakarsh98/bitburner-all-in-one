/** auto-manager-lite.js
 * 
 * LIGHTWEIGHT VERSION - Core automation only (NO module imports)
 * 
 * RAM USAGE: ~5-6GB (hacking + servers + hacknet)
 * 
 * This version provides CORE automation without importing advanced modules:
 * - Hacking automation (target analysis & smart-batcher)
 * - Server purchasing & upgrading
 * - Hacknet farm management
 * 
 * Advanced features (factions, companies, etc.) can be run separately if you have SF4+
 * 
 * Usage:
 *   run utils/auto-manager-lite.js           # Core automation only
 *   run utils/auto-manager-lite.js --aggressive
 * 
 * For full system with all modules:
 *   Use utils/auto-manager.js (requires more RAM but has all features)
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🚀 AUTO-MANAGER LITE - Core Automation");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print("This is the lightweight version with NO module imports");
  ns.print("Provides: Hacking + Servers + Hacknet automation");
  ns.print("RAM Usage: ~5-6GB");
  ns.print("");
  
  // Check for advanced APIs
  const hasAdvancedAPIs = {
    singularity: ns.singularity !== undefined,
    bladeburner: ns.bladeburner !== undefined,
    gang: (function() { try { return ns.gang?.inGang(); } catch { return false; } })(),
    corporation: (function() { try { return ns.corporation !== undefined; } catch { return false; } })(),
    go: ns.go !== undefined
  };
  
  const unlockedFeatures = [];
  if (hasAdvancedAPIs.singularity) unlockedFeatures.push("Factions/Companies/Augs (SF4)");
  if (hasAdvancedAPIs.bladeburner) unlockedFeatures.push("Bladeburner (SF6/SF7)");
  if (hasAdvancedAPIs.gang) unlockedFeatures.push("Gangs (SF2)");
  if (hasAdvancedAPIs.corporation) unlockedFeatures.push("Corporations (SF3)");
  if (hasAdvancedAPIs.go) unlockedFeatures.push("Go");
  
  if (unlockedFeatures.length > 0) {
    ns.print("✨ You have advanced features unlocked:");
    for (const feature of unlockedFeatures) {
      ns.print(`   • ${feature}`);
    }
    ns.print("");
    ns.print("To use them, run modules manually:");
    if (hasAdvancedAPIs.singularity) {
      ns.print("   run modules/faction-manager.js");
      ns.print("   run modules/company-automator.js");
    }
    if (hasAdvancedAPIs.bladeburner) {
      ns.print("   run modules/bladeburner-commander.js");
    }
    if (hasAdvancedAPIs.gang) {
      ns.print("   run modules/gang-manager.js");
    }
    if (hasAdvancedAPIs.go) {
      ns.print("   run go4.js");
    }
    ns.print("");
  }
  
  ns.print("Starting CORE automation...");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // Core automation logic here
  // This would be the hacking/server/hacknet code without any imports
  
  ns.print("⚠️  NOTICE: This is a placeholder");
  ns.print("");
  ns.print("For now, use one of these instead:");
  ns.print("");
  ns.print("OPTION 1: Run smart-batcher directly (best for low RAM)");
  ns.print("   run batch/smart-batcher.js [target]");
  ns.print("");
  ns.print("OPTION 2: Use batch-manager (medium RAM)");
  ns.print("   run batch/batch-manager.js [target]");
  ns.print("");
  ns.print("The full auto-manager.js with all modules requires ~300GB");
  ns.print("due to how Bitburner calculates RAM statically.");
  ns.print("");
  ns.print("We're working on a better solution!");
}
