/** quick-deploy.js
 * 
 * ONE-COMMAND deployment for Bitburner All-in-One Automation System
 * 
 * INSTRUCTIONS:
 * 1. Copy this entire script
 * 2. In Bitburner: File → Create Script → Name it "quick-deploy.js"
 * 3. Paste and save
 * 4. Run: run quick-deploy.js
 * 
 * This will automatically download and start the complete automation system!
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  const baseUrl = "https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main";
  
  ns.tprint("═════════════════════════════════════════════════════════");
  ns.tprint("🚀 BITBURNER ALL-IN-ONE QUICK DEPLOY v2.0.0");
  ns.tprint("═════════════════════════════════════════════════════════");
  ns.tprint("");
  ns.tprint("📥 Downloading automation system...");
  ns.tprint("");
  
  try {
    // Step 1: Download the update script
    ns.tprint("Step 1/3: Downloading update script...");
    const updateScriptUrl = `${baseUrl}/bitburner-update.js`;
    await ns.wget(updateScriptUrl, "bitburner-update.js");
    ns.tprint("✓ Update script downloaded");
    
    // Wait a moment
    await ns.sleep(500);
    
    // Step 2: Run the update script to download everything
    ns.tprint("");
    ns.tprint("Step 2/3: Downloading all scripts (this may take 30-60 seconds)...");
    ns.tprint("");
    
    // Execute the update script
    const pid = ns.run("bitburner-update.js", 1, "--all");
    
    if (pid === 0) {
      ns.tprint("✗ Failed to run update script");
      return;
    }
    
    // Wait for update script to finish
    while (ns.isRunning(pid)) {
      await ns.sleep(1000);
    }
    
    ns.tprint("");
    ns.tprint("✓ All scripts downloaded successfully!");
    
    // Step 3: Start the automation
    ns.tprint("");
    ns.tprint("Step 3/3: Starting All-in-One Automation System...");
    await ns.sleep(1000);
    
    const autoPid = ns.run("utils/auto-manager.js", 1);
    
    if (autoPid === 0) {
      ns.tprint("✗ Failed to start auto-manager");
      ns.tprint("");
      ns.tprint("⚠️ You may need to start it manually:");
      ns.tprint("   run utils/auto-manager.js");
      return;
    }
    
    ns.tprint("✓ Automation system started!");
    ns.tprint("");
    ns.tprint("═════════════════════════════════════════════════════════");
    ns.tprint("🎉 DEPLOYMENT COMPLETE!");
    ns.tprint("═════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint("Your All-in-One Automation System is now running!");
    ns.tprint("");
    ns.tprint("What's happening:");
    ns.tprint("  • Analyzing hacking targets");
    ns.tprint("  • Managing servers and hacknet nodes");
    ns.tprint("  • Running background automation");
    ns.tprint("");
    ns.tprint("Check status anytime:");
    ns.tprint("  run utils/auto-manager.js --monitor");
    ns.tprint("");
    ns.tprint("View logs:");
    ns.tprint("  tail utils/auto-manager.js");
    ns.tprint("");
    ns.tprint("Modules will auto-enable as you unlock APIs:");
    ns.tprint("  • Factions, Companies, Augs (need SF4)");
    ns.tprint("  • Bladeburner (need SF6/SF7)");
    ns.tprint("  • Gangs (need SF2)");
    ns.tprint("  • Corporations (need SF3)");
    ns.tprint("  • Go (unlocks early game)");
    ns.tprint("");
    ns.tprint("Happy automating! 🤖");
    ns.tprint("═════════════════════════════════════════════════════════");
    
  } catch (error) {
    ns.tprint("");
    ns.tprint("═════════════════════════════════════════════════════════");
    ns.tprint("✗ DEPLOYMENT FAILED");
    ns.tprint("═════════════════════════════════════════════════════════");
    ns.tprint("");
    ns.tprint(`Error: ${error}`);
    ns.tprint("");
    ns.tprint("Manual deployment instructions:");
    ns.tprint("1. Download update script:");
    ns.tprint("   wget https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main/bitburner-update.js bitburner-update.js");
    ns.tprint("");
    ns.tprint("2. Download all scripts:");
    ns.tprint("   run bitburner-update.js --all");
    ns.tprint("");
    ns.tprint("3. Start automation:");
    ns.tprint("   run utils/auto-manager.js");
    ns.tprint("");
  }
}
