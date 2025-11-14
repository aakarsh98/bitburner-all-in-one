/** modules/server-scanner.js
 * 
 * AUTOMATIC SERVER SCANNER & NUKE
 * 
 * Continuously scans for new servers and nukes them
 * Runs in background to catch servers as you level up
 * No SF requirements - works from the start!
 * 
 * @param {NS} ns
 */

export async function main(ns) {
  ns.disableLog("ALL");
  ns.tail();
  
  const CONFIG = {
    scanInterval: 30000  // Scan every 30 seconds
  };
  
  const programs = [
    { name: "BruteSSH.exe", fn: ns.brutessh },
    { name: "FTPCrack.exe", fn: ns.ftpcrack },
    { name: "relaySMTP.exe", fn: ns.relaysmtp },
    { name: "HTTPWorm.exe", fn: ns.httpworm },
    { name: "SQLInject.exe", fn: ns.sqlinject }
  ];
  
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
    
    return Array.from(servers).filter(s => s !== "home");
  }
  
  function nukeServer(server) {
    if (ns.hasRootAccess(server)) {
      return { success: true, reason: "already_rooted" };
    }
    
    const hackLevel = ns.getHackingLevel();
    const reqLevel = ns.getServerRequiredHackingLevel(server);
    
    if (hackLevel < reqLevel) {
      return { success: false, reason: `need_level_${reqLevel}` };
    }
    
    let portsOpened = 0;
    let portsRequired = ns.getServerNumPortsRequired(server);
    
    // Try to open ports
    for (const prog of programs) {
      if (ns.fileExists(prog.name, "home")) {
        try {
          prog.fn(server);
          portsOpened++;
        } catch (e) {
          // Already opened or error
        }
      }
    }
    
    if (portsOpened < portsRequired) {
      return { success: false, reason: `need_${portsRequired - portsOpened}_more_ports` };
    }
    
    try {
      ns.nuke(server);
      return { success: true, reason: "nuked" };
    } catch (e) {
      return { success: false, reason: e.message };
    }
  }
  
  let totalNuked = 0;
  let lastScan = 0;
  
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("🔓 SERVER SCANNER - Auto-Nuke");
  ns.print("═════════════════════════════════════════════════════════");
  ns.print("");
  
  while (true) {
    const servers = getAllServers();
    const player = ns.getPlayer();
    
    let rootedCount = 0;
    let nukedThisScan = 0;
    let cantHackYet = 0;
    let needMorePorts = 0;
    
    for (const server of servers) {
      if (ns.hasRootAccess(server)) {
        rootedCount++;
      } else {
        const result = nukeServer(server);
        if (result.success && result.reason === "nuked") {
          nukedThisScan++;
          totalNuked++;
          ns.tprint(`✓ Nuked: ${server}`);
        } else if (result.reason.startsWith("need_level")) {
          cantHackYet++;
        } else if (result.reason.startsWith("need_") && result.reason.includes("ports")) {
          needMorePorts++;
        }
      }
    }
    
    ns.clearLog();
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("🔓 SERVER SCANNER");
    ns.print("═════════════════════════════════════════════════════════");
    ns.print("");
    ns.print(`Hack Level: ${player.skills.hacking}`);
    ns.print("");
    ns.print("📊 Network Status:");
    ns.print(`  Total Servers:    ${servers.length}`);
    ns.print(`  Rooted:           ${rootedCount}`);
    ns.print(`  Not Rooted:       ${servers.length - rootedCount}`);
    ns.print("");
    
    if (nukedThisScan > 0) {
      ns.print(`🎉 Nuked ${nukedThisScan} new servers this scan!`);
      ns.print("");
    }
    
    ns.print("🚫 Blocked Servers:");
    ns.print(`  Too high level:   ${cantHackYet}`);
    ns.print(`  Need more ports:  ${needMorePorts}`);
    ns.print("");
    
    const ownedPrograms = programs.filter(p => ns.fileExists(p.name, "home")).length;
    ns.print(`💾 Port Openers: ${ownedPrograms} / ${programs.length}`);
    ns.print("");
    
    ns.print(`Total nuked this session: ${totalNuked}`);
    ns.print(`Next scan in ${CONFIG.scanInterval / 1000}s...`);
    
    await ns.sleep(CONFIG.scanInterval);
  }
}
