/** quick-update.js
 * 
 * Quick update script - Downloads latest bitburner-update.js then runs it
 * 
 * Use this to ensure you have the latest update script before updating everything
 * 
 * Usage:
 *   run quick-update.js
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  const repoUrl = "https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main";
  
  ns.tprint("\n═══════════════════════════════════════════════════════");
  ns.tprint("⚡ QUICK UPDATE - Downloading latest scripts");
  ns.tprint("═══════════════════════════════════════════════════════");
  ns.tprint("");
  
  // Step 1: Download latest bitburner-update.js
  ns.tprint("📥 Step 1: Downloading latest bitburner-update.js...");
  try {
    const success = await ns.wget(`${repoUrl}/bitburner-update.js`, "bitburner-update.js");
    if (success) {
      ns.tprint("✓ bitburner-update.js downloaded");
    } else {
      ns.tprint("✗ Failed to download bitburner-update.js");
      ns.tprint("\nTry manually:");
      ns.tprint(`wget ${repoUrl}/bitburner-update.js bitburner-update.js`);
      return;
    }
  } catch (e) {
    ns.tprint(`✗ Error: ${e}`);
    return;
  }
  
  await ns.sleep(500);
  
  // Step 2: Run it to download everything
  ns.tprint("");
  ns.tprint("📥 Step 2: Running bitburner-update.js --all...");
  ns.tprint("This will download all scripts (30-60 seconds)...");
  ns.tprint("");
  
  try {
    const pid = ns.run("bitburner-update.js", 1, "--all");
    
    if (pid > 0) {
      ns.tprint("✓ Update script started!");
      ns.tprint("");
      ns.tprint("⏳ Downloading... check terminal for progress");
      ns.tprint("");
      
      // Wait for it to complete
      while (ns.isRunning(pid)) {
        await ns.sleep(1000);
      }
      
      ns.tprint("");
      ns.tprint("═══════════════════════════════════════════════════════");
      ns.tprint("✅ UPDATE COMPLETE!");
      ns.tprint("═══════════════════════════════════════════════════════");
      ns.tprint("");
      ns.tprint("New scripts downloaded:");
      ns.tprint("  • auto-launcher.js (2-3GB - ONE COMMAND AUTOMATION)");
      ns.tprint("  • ram-upgrader.js (auto RAM expansion)");
      ns.tprint("  • dashboard.js (real-time monitoring)");
      ns.tprint("  • post-reset.js (automated recovery)");
      ns.tprint("  • All modules updated");
      ns.tprint("");
      ns.tprint("🚀 Ready to use! Run:");
      ns.tprint("   run auto-launcher.js");
      ns.tprint("");
      
    } else {
      ns.tprint("✗ Failed to run bitburner-update.js");
      ns.tprint("Try manually: run bitburner-update.js --all");
    }
  } catch (e) {
    ns.tprint(`✗ Error: ${e}`);
  }
}
