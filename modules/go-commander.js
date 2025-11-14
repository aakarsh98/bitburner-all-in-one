/** modules/go-commander.js
 * Intelligent Go game automation
 * 
 * FEATURES:
 * - Auto-plays Go games against opponents
 * - Uses advanced 5-stage strategy (base building, expansion, cleanup)
 * - Tracks game statistics and win rate
 * - Manages opponent rotation
 * 
 * INTEGRATION:
 * - Called by auto-manager.js to start/check Go games
 * - Runs games in background while other automation continues
 * 
 * @param {NS} ns
 */

export class GoCommander {
  constructor(ns, config = {}) {
    this.ns = ns;
    this.config = {
      // Opponent rotation
      opponents: [
        "Netburners", 
        "The Black Hand", 
        "Daedalus",
        "Illuminati"
      ],
      
      // Board size
      boardSize: 13,
      
      // Game management
      autoPlay: true,              // Auto-start games
      maxGamesPerSession: 100,     // Stop after X games (0 = infinite)
      
      // Stats tracking
      trackStats: true,
      
      ...config
    };
    
    // Game state
    this.gameStats = {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      currentOpponent: null,
      lastGameTime: 0,
      isPlaying: false
    };
    
    // Script tracking
    this.goScriptPID = 0;
  }

  /**
   * Check if Go API is available
   */
  hasGoAccess() {
    return this.ns.go !== undefined;
  }

  /**
   * Get current Go game status
   */
  getGameStatus() {
    if (!this.hasGoAccess()) {
      return { status: 'unavailable' };
    }
    
    try {
      const boardState = this.ns.go.getBoardState();
      const currentPlayer = this.ns.go.getCurrentPlayer();
      const gameOver = currentPlayer === 'None';
      
      return {
        status: gameOver ? 'ended' : 'active',
        currentPlayer,
        boardState,
        gameOver
      };
    } catch (e) {
      return { status: 'no_game' };
    }
  }

  /**
   * Check if go4.js script is running
   */
  isGoScriptRunning() {
    if (this.goScriptPID > 0 && this.ns.isRunning(this.goScriptPID)) {
      return true;
    }
    
    // Check if go4.js is running anywhere
    const processes = this.ns.ps("home");
    for (const proc of processes) {
      if (proc.filename === "go4.js") {
        this.goScriptPID = proc.pid;
        return true;
      }
    }
    
    this.goScriptPID = 0;
    return false;
  }

  /**
   * Start go4.js script
   */
  startGoScript() {
    if (this.isGoScriptRunning()) {
      return true; // Already running
    }
    
    try {
      this.goScriptPID = this.ns.run("go4.js", 1);
      if (this.goScriptPID > 0) {
        this.gameStats.isPlaying = true;
        return true;
      }
    } catch (e) {
      this.ns.print(`[GO] Failed to start go4.js: ${e}`);
    }
    
    return false;
  }

  /**
   * Stop go4.js script
   */
  stopGoScript() {
    if (this.goScriptPID > 0) {
      try {
        this.ns.kill(this.goScriptPID);
        this.goScriptPID = 0;
        this.gameStats.isPlaying = false;
        return true;
      } catch (e) {
        this.ns.print(`[GO] Failed to stop go4.js: ${e}`);
      }
    }
    return false;
  }

  /**
   * Get game statistics
   */
  getStats() {
    return {
      ...this.gameStats,
      winRate: this.gameStats.gamesPlayed > 0 
        ? (this.gameStats.wins / this.gameStats.gamesPlayed * 100).toFixed(1)
        : 0
    };
  }

  /**
   * Get current status summary
   */
  getStatus() {
    if (!this.hasGoAccess()) {
      return {
        available: false,
        status: 'Go API not available',
        message: 'Go minigame not unlocked'
      };
    }
    
    const gameStatus = this.getGameStatus();
    const scriptRunning = this.isGoScriptRunning();
    const stats = this.getStats();
    
    return {
      available: true,
      scriptRunning,
      gameStatus: gameStatus.status,
      stats,
      message: scriptRunning 
        ? `Playing Go (${stats.gamesPlayed} games, ${stats.winRate}% win rate)`
        : 'Go automation idle'
    };
  }

  /**
   * Main decision loop
   */
  makeDecision() {
    if (!this.hasGoAccess()) {
      return {
        type: 'none',
        reason: 'Go API not available',
        priority: 'low'
      };
    }
    
    // Check if we should stop (max games reached)
    if (this.config.maxGamesPerSession > 0 && 
        this.gameStats.gamesPlayed >= this.config.maxGamesPerSession) {
      if (this.isGoScriptRunning()) {
        return {
          type: 'stop',
          reason: `Max games reached (${this.config.maxGamesPerSession})`,
          priority: 'medium'
        };
      }
      return {
        type: 'none',
        reason: 'Max games reached, automation stopped',
        priority: 'low'
      };
    }
    
    // Decision: Start Go automation if not running
    if (this.config.autoPlay && !this.isGoScriptRunning()) {
      return {
        type: 'start',
        reason: 'Start Go automation (background income)',
        priority: 'low',
        script: 'go4.js'
      };
    }
    
    // Update stats by checking game progress
    const gameStatus = this.getGameStatus();
    if (gameStatus.status === 'ended' && this.gameStats.isPlaying) {
      // Game just ended, update stats
      this.gameStats.gamesPlayed++;
      this.gameStats.lastGameTime = Date.now();
      // Note: We can't easily detect wins/losses without more API access
    }
    
    return {
      type: 'none',
      reason: this.isGoScriptRunning() 
        ? `Go automation running (${this.gameStats.gamesPlayed} games played)`
        : 'Go automation idle',
      priority: 'low'
    };
  }
}

/** @param {NS} ns */
export async function main(ns) {
  ns.tail();
  ns.disableLog("sleep");
  
  const commander = new GoCommander(ns);
  const status = commander.getStatus();
  
  ns.tprint("═════════════════════════════════════════════════════════");
  ns.tprint("GO COMMANDER STATUS");
  ns.tprint("═════════════════════════════════════════════════════════");
  
  if (!status.available) {
    ns.tprint("✗ Go API not available");
    ns.tprint("  Unlock Go minigame to enable automation");
    return;
  }
  
  ns.tprint(`Status: ${status.message}`);
  ns.tprint(`Script Running: ${status.scriptRunning ? 'YES' : 'NO'}`);
  ns.tprint(`Game Status: ${status.gameStatus}`);
  
  if (status.stats) {
    ns.tprint("\nStatistics:");
    ns.tprint(`  Games Played: ${status.stats.gamesPlayed}`);
    ns.tprint(`  Win Rate: ${status.stats.winRate}%`);
  }
  
  ns.tprint("─────────────────────────────────────────────────────────");
  
  const decision = commander.makeDecision();
  ns.tprint(`\nRecommended Action: ${decision.type.toUpperCase()}`);
  ns.tprint(`  ${decision.reason}`);
  ns.tprint(`  Priority: ${decision.priority}`);
  
  // Demo: Start automation if recommended
  if (decision.type === 'start') {
    ns.tprint("\n▶ Starting Go automation...");
    const success = commander.startGoScript();
    if (success) {
      ns.tprint("✓ Go automation started!");
      ns.tprint("  Playing games in background...");
    } else {
      ns.tprint("✗ Failed to start go4.js");
    }
  }
}
