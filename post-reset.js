/** post-reset.js
 * 
 * AUTOMATED POST-RESET RECOVERY SCRIPT
 * 
 * Run this immediately after augmentation reset or on fresh game start.
 * Handles the complete recovery process automatically.
 * 
 * What it does:
 * 1. Downloads all scripts from GitHub (if needed)
 * 2. Analyzes your current situation (money, RAM, stats)
 * 3. Finds the best starter target
 * 4. Deploys optimal automation based on available resources
 * 5. Starts making money immediately
 * 
 * Usage:
 *   wget https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main/post-reset.js post-reset.js
 *   run post-reset.js
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const repoUrl = "https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main";
  
  // Helper function to check if script exists
  function scriptExists(filename) {
    return ns.fileExists(filename, "home");
  }
  
  // Helper function to format money
  function fmt(num) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}t`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}b`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}m`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}k`;
    return `$${num.toFixed(2)}`;
  }
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🔄 POST-RESET RECOVERY / FRESH GAME START");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  // PHASE 1: Assess current situation
  ns.print("📊 PHASE 1: Analyzing current situation...");
  ns.print("");
  
  const player = ns.getPlayer();
  const homeRAM = ns.getServerMaxRam("home");
  const currentMoney = player.money;
  const hackLevel = player.skills.hacking;
  
  ns.print(`Current Status:`);
  ns.print(`  Money: ${fmt(currentMoney)}`);
  ns.print(`  Hacking: ${hackLevel}`);
  ns.print(`  Home RAM: ${homeRAM}GB`);
  
  // Determine if this is a reset or fresh game
  const isReset = player.totalPlaytime > 3600; // More than 1 hour played
  const hasAugmentations = player.augmentations?.length > 0;
  
  if (isReset || hasAugmentations) {
    ns.print(`  Status: POST-RESET (augmentations detected)`);
    ns.print(`  Augmentations: ${player.augmentations?.length || 0}`);
  } else {
    ns.print(`  Status: FRESH GAME START`);
  }
  ns.print("");
  
  // PHASE 2: Download scripts if needed
  ns.print("📥 PHASE 2: Checking scripts...");
  ns.print("");
  
  const criticalScripts = [
    "utils/auto-manager.js",
    "batch/smart-batcher.js",
    "core/attack-hack.js",
    "core/attack-grow.js",
    "core/attack-weaken.js"
  ];
  
  let needsDownload = false;
  for (const script of criticalScripts) {
    if (!scriptExists(script)) {
      needsDownload = true;
      break;
    }
  }
  
  if (needsDownload) {
    ns.print("⚠️  Critical scripts missing - downloading all scripts...");
    ns.print("");
    
    // Download the update script
    try {
      await ns.wget(`${repoUrl}/bitburner-update.js`, "bitburner-update.js");
      ns.print("✓ Downloaded bitburner-update.js");
      
      // Run it to download everything
      const pid = ns.run("bitburner-update.js", 1, "--all");
      if (pid === 0) {
        ns.print("✗ Failed to run bitburner-update.js");
        ns.print("");
        ns.print("Manual download:");
        ns.print(`  wget ${repoUrl}/bitburner-update.js bitburner-update.js`);
        ns.print(`  run bitburner-update.js --all`);
        return;
      }
      
      // Wait for download to complete
      ns.print("Downloading all scripts (30-60 seconds)...");
      while (ns.isRunning(pid)) {
        await ns.sleep(1000);
      }
      ns.print("✓ All scripts downloaded!");
      ns.print("");
    } catch (e) {
      ns.print(`✗ Download failed: ${e}`);
      return;
    }
  } else {
    ns.print("✓ All critical scripts found");
    ns.print("");
  }
  
  // PHASE 3: Find best starter target
  ns.print("🎯 PHASE 3: Finding optimal target...");
  ns.print("");
  
  // Scan network for hackable servers
  function scanNetwork(current, visited = new Set()) {
    if (visited.has(current)) return [];
    visited.add(current);
    
    const neighbors = ns.scan(current);
    let servers = [current];
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        servers = servers.concat(scanNetwork(neighbor, visited));
      }
    }
    
    return servers;
  }
  
  const allServers = scanNetwork("home");
  
  // Find best target we can hack
  const targets = allServers
    .filter(s => {
      const maxMoney = ns.getServerMaxMoney(s);
      const reqHack = ns.getServerRequiredHackingLevel(s);
      const hasRoot = ns.hasRootAccess(s);
      
      return maxMoney > 0 && reqHack <= hackLevel && hasRoot;
    })
    .map(s => ({
      name: s,
      maxMoney: ns.getServerMaxMoney(s),
      minSec: ns.getServerMinSecurityLevel(s),
      reqHack: ns.getServerRequiredHackingLevel(s),
      score: ns.getServerMaxMoney(s) / ns.getServerMinSecurityLevel(s)
    }))
    .sort((a, b) => b.score - a.score);
  
  if (targets.length === 0) {
    ns.print("✗ No hackable targets found!");
    ns.print("  Try gaining root access to more servers first");
    return;
  }
  
  const bestTarget = targets[0];
  ns.print(`✓ Best target: ${bestTarget.name}`);
  ns.print(`  Max Money: ${fmt(bestTarget.maxMoney)}`);
  ns.print(`  Required Hacking: ${bestTarget.reqHack}`);
  ns.print(`  Min Security: ${bestTarget.minSec}`);
  ns.print("");
  
  // Alternative targets
  if (targets.length > 1) {
    ns.print("Alternative targets:");
    for (let i = 1; i < Math.min(4, targets.length); i++) {
      ns.print(`  ${i + 1}. ${targets[i].name} (${fmt(targets[i].maxMoney)})`);
    }
    ns.print("");
  }
  
  // PHASE 4: Deploy optimal automation
  ns.print("🚀 PHASE 4: Deploying automation...");
  ns.print("");
  
  let deploymentSuccess = false;
  
  // Try auto-launcher first (best option - launches everything)
  if (homeRAM >= 16) {
    ns.print(`Starting auto-launcher (full automation suite)...`);
    
    try {
      const pid = ns.run("auto-launcher.js", 1);
      
      if (pid > 0) {
        ns.print("✓ Auto-launcher started!");
        ns.print("");
        ns.print("Full automation suite is running:");
        ns.print("  • Core: Hacking, servers, hacknet");
        ns.print("  • SF4 modules (if unlocked): Factions, companies, augs");
        ns.print("  • SF6/SF7 (if unlocked): Bladeburner");
        ns.print("  • SF2 (if unlocked): Gangs");
        ns.print("  • Automatically launches what you've unlocked");
        ns.print("  • Monitors and restarts if crashes");
        ns.print("");
        deploymentSuccess = true;
      }
    } catch (e) {
      ns.print(`⚠️  Auto-launcher failed: ${e}`);
    }
  }
  
  // Fallback to batch-manager if auto-launcher didn't work
  if (!deploymentSuccess && homeRAM >= 8) {
    ns.print(`Starting batch-manager (core automation only)...`);
    
    try {
      const pid = ns.run("batch/batch-manager.js", 1, bestTarget.name, "--quiet");
      
      if (pid > 0) {
        ns.print("✓ Batch-manager started!");
        ns.print("");
        ns.print("Core automation is running:");
        ns.print("  • Auto-targets best servers");
        ns.print("  • Detects RAM upgrades automatically");
        ns.print("  • Scales as you grow");
        ns.print("");
        ns.print("For full automation with all modules:");
        ns.print("  run auto-launcher.js");
        ns.print("");
        deploymentSuccess = true;
      }
    } catch (e) {
      ns.print(`⚠️  Batch-manager failed: ${e}`);
    }
  }
  
  // Fallback to smart-batcher if batch-manager didn't work
  if (!deploymentSuccess && homeRAM >= 5) {
    ns.print(`Starting smart-batcher directly...`);
    
    try {
      const pid = ns.run("batch/smart-batcher.js", 1, bestTarget.name, 0.05);
      
      if (pid > 0) {
        ns.print(`✓ Smart-batcher started on ${bestTarget.name}!`);
        ns.print("");
        ns.print("Basic hacking automation is running");
        ns.print(`To upgrade to full automation when you have more RAM:`);
        ns.print(`  run utils/auto-manager.js`);
        ns.print("");
        deploymentSuccess = true;
      }
    } catch (e) {
      ns.print(`⚠️  Smart-batcher failed: ${e}`);
    }
  }
  
  // Last resort: basic hacking
  if (!deploymentSuccess) {
    ns.print(`Starting basic hack loop (low RAM mode)...`);
    
    // Simple hack script
    const basicScript = `
/** @param {NS} ns */
export async function main(ns) {
  const target = ns.args[0] || "n00dles";
  while (true) {
    await ns.hack(target);
  }
}`;
    
    await ns.write("basic-hack.js", basicScript, "w");
    const pid = ns.run("basic-hack.js", 1, bestTarget.name);
    
    if (pid > 0) {
      ns.print(`✓ Basic hack started on ${bestTarget.name}`);
      ns.print("");
      ns.print("Running minimal automation");
      ns.print("Upgrade home RAM as soon as possible!");
      deploymentSuccess = true;
    }
  }
  
  if (!deploymentSuccess) {
    ns.print("✗ Failed to start any automation");
    ns.print("Manual steps:");
    ns.print(`  run batch/smart-batcher.js ${bestTarget.name}`);
    return;
  }
  
  // PHASE 5: Recommendations
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("💡 RECOMMENDATIONS");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  if (homeRAM < 16) {
    ns.print("🎯 PRIORITY: Upgrade home RAM to 16GB");
    ns.print(`   Current: ${homeRAM}GB → Target: 16GB`);
    ns.print(`   Cost: ~$1-5 million`);
    ns.print(`   Benefit: Run full automation + utilities`);
    ns.print("");
  }
  
  if (isReset || hasAugmentations) {
    ns.print("✨ POST-RESET PROGRESSION:");
    ns.print("   1. Let automation run for 5-10 minutes");
    ns.print("   2. Upgrade home RAM to 16-32GB");
    ns.print("   3. Start working toward next augmentations");
    ns.print("   4. Each reset should be faster than the last!");
    ns.print("");
  } else {
    ns.print("🎓 FRESH GAME PROGRESSION:");
    ns.print("   1. Let automation make $1-10 million");
    ns.print("   2. Upgrade home RAM (Priority #1)");
    ns.print("   3. Level up hacking skill to 50+");
    ns.print("   4. Join factions (CyberSec, Tian Di Hui)");
    ns.print("   5. Work toward first augmentations!");
    ns.print("");
  }
  
  ns.print("📊 Monitor progress:");
  ns.print("   run utils/auto-manager.js --monitor");
  ns.print("");
  
  ns.print("📖 Need help?");
  ns.print("   See: docs/Feature Guides/AUGMENTATION_RESET_GUIDE.md");
  ns.print("   See: docs/Getting Started/NEW_GAME_QUICKSTART.md");
  ns.print("");
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("✅ POST-RESET RECOVERY COMPLETE!");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print("Your automation is running. Go AFK and make money! 💰");
  ns.print("");
}
