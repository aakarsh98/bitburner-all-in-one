/** bitnode-progression.js
 * 
 * BITNODE PROGRESSION AUTOMATOR
 * 
 * Tracks your progress toward destroying the current BitNode
 * Provides clear guidance on next steps
 * Automates what's possible (with/without SF4)
 * 
 * Without SF4: Provides manual instructions
 * With SF4: Automates backdoor installation and preparation
 * 
 * Usage:
 *   run bitnode-progression.js
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const CONFIG = {
    checkInterval: 30000,  // Check every 30 seconds
    autoBackdoor: true,    // Auto-install backdoors (requires SF4)
    targetServer: "w0r1d_d43m0n",
    
    // Key servers to backdoor for faction access
    keyServers: [
      { name: "CSEC", faction: "CyberSec", hackReq: 51 },
      { name: "avmnite-02h", faction: "NiteSec", hackReq: 202 },
      { name: "I.I.I.I", faction: "The Black Hand", hackReq: 340 },
      { name: "run4theh111z", faction: "BitRunners", hackReq: 505 },
      { name: "w0r1d_d43m0n", faction: "Daedalus", hackReq: 3000 }
    ]
  };
  
  const player = ns.getPlayer();
  const hasSF4 = player.sourceFiles && player.sourceFiles.some(sf => sf.n === 4);
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🎯 BITNODE PROGRESSION TRACKER");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  ns.print(`Current BitNode: ${player.bitNodeN || 1}`);
  ns.print(`SF4 Available: ${hasSF4 ? "✓ Yes (Auto-mode)" : "✗ No (Manual mode)"}`);
  ns.print("");
  
  // Get all servers in the network
  function getAllServers() {
    const servers = new Set();
    const queue = ["home"];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (servers.has(current)) continue;
      
      servers.add(current);
      const neighbors = ns.scan(current);
      queue.push(...neighbors);
    }
    
    return Array.from(servers);
  }
  
  // Get path to a server
  function getPath(target) {
    const visited = new Set();
    const queue = [{ server: "home", path: [] }];
    
    while (queue.length > 0) {
      const { server, path } = queue.shift();
      
      if (server === target) {
        return [...path, target];
      }
      
      if (visited.has(server)) continue;
      visited.add(server);
      
      const neighbors = ns.scan(server);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          queue.push({ server: neighbor, path: [...path, server] });
        }
      }
    }
    
    return null;
  }
  
  // Check server status
  function checkServer(serverName) {
    try {
      const server = ns.getServer(serverName);
      const player = ns.getPlayer();
      
      return {
        exists: true,
        name: serverName,
        hackReq: server.requiredHackingSkill,
        playerHacking: player.skills.hacking,
        canHack: player.skills.hacking >= server.requiredHackingSkill,
        hasRoot: server.hasAdminRights,
        hasBackdoor: server.backdoorInstalled,
        portsRequired: server.numOpenPortsRequired,
        money: server.moneyMax
      };
    } catch (e) {
      return { exists: false, name: serverName };
    }
  }
  
  // Install backdoor on a server (requires SF4)
  async function installBackdoor(serverName) {
    if (!hasSF4) {
      return { success: false, reason: "SF4 required" };
    }
    
    try {
      const path = getPath(serverName);
      if (!path) {
        return { success: false, reason: "Path not found" };
      }
      
      // Connect to the server
      for (const hop of path) {
        if (!ns.singularity.connect(hop)) {
          return { success: false, reason: `Failed to connect to ${hop}` };
        }
      }
      
      // Install backdoor
      await ns.singularity.installBackdoor();
      
      // Return home
      ns.singularity.connect("home");
      
      return { success: true };
    } catch (e) {
      ns.singularity.connect("home");
      return { success: false, reason: e.message };
    }
  }
  
  // Main progression loop
  while (true) {
    ns.clearLog();
    
    const player = ns.getPlayer();
    const allServers = getAllServers();
    
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("🎯 BITNODE PROGRESSION STATUS");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    
    // Current stats
    ns.print("📊 YOUR STATS:");
    ns.print(`  Hacking: ${player.skills.hacking}`);
    ns.print(`  Money: $${ns.formatNumber(player.money)}`);
    ns.print("");
    
    // Check key servers
    ns.print("🔑 KEY SERVER PROGRESSION:");
    ns.print("");
    
    let currentGoal = null;
    let allComplete = true;
    
    for (const keyServer of CONFIG.keyServers) {
      const status = checkServer(keyServer.name);
      
      if (!status.exists) {
        ns.print(`  ❓ ${keyServer.name} - Not found in network`);
        continue;
      }
      
      const canAccess = status.canHack;
      const hasRoot = status.hasRoot;
      const hasBackdoor = status.hasBackdoor;
      
      let statusIcon = "⏳";
      let statusText = "Pending";
      
      if (hasBackdoor) {
        statusIcon = "✓";
        statusText = "Backdoored";
      } else if (hasRoot && canAccess) {
        statusIcon = "🔓";
        statusText = "Ready to backdoor";
        if (!currentGoal) {
          currentGoal = keyServer;
          allComplete = false;
        }
      } else if (hasRoot) {
        statusIcon = "🔒";
        statusText = `Need hack ${status.hackReq} (you: ${status.playerHacking})`;
        if (!currentGoal) {
          currentGoal = keyServer;
          allComplete = false;
        }
      } else if (canAccess) {
        statusIcon = "🔐";
        statusText = "Need root access";
        if (!currentGoal) {
          currentGoal = keyServer;
          allComplete = false;
        }
      } else {
        statusIcon = "⛔";
        statusText = `Need hack ${status.hackReq} (you: ${status.playerHacking})`;
        if (!currentGoal) {
          currentGoal = keyServer;
          allComplete = false;
        }
      }
      
      ns.print(`  ${statusIcon} ${keyServer.name.padEnd(15)} - ${statusText}`);
      ns.print(`     → Faction: ${keyServer.faction}`);
      ns.print("");
    }
    
    // Next steps section
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("📋 NEXT STEPS:");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    
    if (currentGoal) {
      const status = checkServer(currentGoal.name);
      
      if (currentGoal.name === CONFIG.targetServer) {
        // Special handling for w0r1d_d43m0n
        if (status.canHack && status.hasRoot && status.hasBackdoor) {
          ns.print("🎉 READY TO DESTROY BITNODE!");
          ns.print("");
          ns.print("Next steps:");
          ns.print("  1. Make sure you've joined key factions");
          ns.print("  2. Purchase important augmentations");
          ns.print("  3. Install augmentations when ready");
          ns.print("  4. Run: run hack w0r1d_d43m0n");
          ns.print("");
          ns.print("⚠️  After destroying, choose your next BitNode!");
        } else if (status.canHack && status.hasRoot) {
          ns.print(`🎯 Goal: Backdoor ${currentGoal.name}`);
          ns.print("");
          
          if (hasSF4 && CONFIG.autoBackdoor) {
            ns.print("🤖 Attempting auto-backdoor...");
            const result = await installBackdoor(currentGoal.name);
            if (result.success) {
              ns.print("✓ Backdoor installed successfully!");
            } else {
              ns.print(`✗ Failed: ${result.reason}`);
            }
          } else {
            const path = getPath(currentGoal.name);
            ns.print("Manual backdoor required:");
            ns.print("  1. Navigate to terminal");
            ns.print(`  2. Connect path: ${path ? path.join(" → ") : "unknown"}`);
            ns.print("  3. Type: backdoor");
            ns.print("  4. Wait for completion");
          }
        } else if (status.hasRoot) {
          ns.print(`⏳ Goal: Reach hacking level ${status.hackReq}`);
          ns.print(`   Current: ${status.playerHacking} / ${status.hackReq}`);
          ns.print(`   Remaining: ${status.hackReq - status.playerHacking} levels`);
          ns.print("");
          ns.print("How to level up:");
          ns.print("  • Let your batch scripts run (passive XP)");
          ns.print("  • Work for a company/university");
          ns.print("  • Study at university");
          ns.print("  • Train at gym");
        } else {
          ns.print(`🎯 Goal: Get root access on ${currentGoal.name}`);
          ns.print("");
          ns.print("How to get root:");
          ns.print("  1. Run your hacking scripts");
          ns.print("  2. They should auto-nuke servers");
          ns.print(`  3. Need ${status.portsRequired} ports to open`);
        }
      } else {
        // Handle other key servers
        if (status.hasRoot && status.canHack && !status.hasBackdoor) {
          ns.print(`🎯 Goal: Backdoor ${currentGoal.name}`);
          ns.print(`   → Unlocks faction: ${currentGoal.faction}`);
          ns.print("");
          
          if (hasSF4 && CONFIG.autoBackdoor) {
            ns.print("🤖 Attempting auto-backdoor...");
            const result = await installBackdoor(currentGoal.name);
            if (result.success) {
              ns.print("✓ Backdoor installed successfully!");
              ns.print(`✓ ${currentGoal.faction} faction now available!`);
            } else {
              ns.print(`✗ Failed: ${result.reason}`);
            }
          } else {
            const path = getPath(currentGoal.name);
            ns.print("Manual backdoor required:");
            ns.print("  1. Navigate to terminal");
            ns.print(`  2. Connect: ${path ? path.join(" → ") : "unknown"}`);
            if (path) {
              ns.print(`     Commands: ${path.map(s => `connect ${s}`).join("; ")}`);
            }
            ns.print("  3. Type: backdoor");
            ns.print("  4. Wait for completion");
            ns.print("");
            ns.print(`After backdoor: Join ${currentGoal.faction} faction`);
          }
        } else if (status.hasRoot && !status.canHack) {
          ns.print(`⏳ Goal: Reach hacking level ${status.hackReq}`);
          ns.print(`   Current: ${status.playerHacking} / ${status.hackReq}`);
          ns.print(`   Remaining: ${status.hackReq - status.playerHacking} levels`);
          ns.print("");
          ns.print("How to level up:");
          ns.print("  • Let your batch scripts run (passive XP)");
          if (hasSF4) {
            ns.print("  • Scripts can auto-work for companies");
          } else {
            ns.print("  • Manually work for companies (good XP + money)");
            ns.print("  • Study at university (ESC → City → University)");
          }
        } else if (status.canHack && !status.hasRoot) {
          ns.print(`🎯 Goal: Get root access on ${currentGoal.name}`);
          ns.print("");
          ns.print("Your batch scripts should handle this automatically.");
          ns.print(`Wait for them to open ${status.portsRequired} ports and nuke.`);
        } else {
          ns.print(`⏳ Multi-step goal for ${currentGoal.name}:`);
          ns.print(`   1. Reach hacking ${status.hackReq} (current: ${status.playerHacking})`);
          ns.print(`   2. Get root access (need ${status.portsRequired} ports)`);
          ns.print("   3. Install backdoor");
        }
      }
    } else {
      ns.print("🎉 ALL KEY SERVERS COMPLETED!");
      ns.print("");
      ns.print("Final steps to destroy BitNode:");
      ns.print("  1. Join important factions (check faction list)");
      ns.print("  2. Work for factions to increase rep");
      ns.print("  3. Purchase augmentations");
      ns.print("  4. Install augmentations");
      ns.print("  5. Hack w0r1d_d43m0n to destroy BitNode");
    }
    
    ns.print("");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print(`Updating in ${CONFIG.checkInterval / 1000}s...`);
    
    await ns.sleep(CONFIG.checkInterval);
  }
}
