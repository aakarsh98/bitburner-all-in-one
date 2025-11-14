# Bitburner Automation Modules

Complete modular automation system for Bitburner. Each module is independent and can be tested standalone or integrated into the master auto-manager.js.

---

## 📦 Available Modules

### ✅ Core Modules (All Complete!)

| Module | File | Status | Requirements |
|--------|------|--------|--------------|
| 🏛️ **Faction Manager** | `faction-manager.js` | ✅ Complete | SF4 (Singularity) |
| 🧬 **Augmentation Tracker** | `augmentation-tracker.js` | ✅ Complete | SF4 (Singularity) |
| 🏢 **Company Automator** | `company-automator.js` | ✅ Complete | SF4 (Singularity) |
| ⚔️ **Bladeburner Commander** | `bladeburner-commander.js` | ✅ Complete | SF6 or SF7 |
| 👥 **Gang Manager** | `gang-manager.js` | ✅ Complete | SF2 + Join gang |
| 🏭 **Corporation Manager** | `corporation-manager.js` | ✅ Complete | $150b + SF3 |
| 🌐 **Hacknet Farm** | `../hacknet-farm-manager.js` | ✅ Complete | None |
| 🎮 **Go Commander** | `go-commander.js` | ✅ Complete | Go minigame unlocked |

---

## 🧪 Testing Each Module

All modules can be tested standalone:

```bash
# Test each module individually
run modules/faction-manager.js
run modules/augmentation-tracker.js
run modules/company-automator.js
run modules/bladeburner-commander.js
run modules/gang-manager.js
run modules/corporation-manager.js
run modules/go-commander.js
run hacknet-farm-manager.js
```

**Each test will show:**
- Current status
- Available actions
- Recommended next step
- Priority level

---

## 🎯 Module Architecture

```
Each Module Class:
  ├─ constructor(ns, config)      # Initialize with configuration
  ├─ hasXAccess()                 # Check if API available
  ├─ getStatus()                  # Get current state summary
  ├─ makeDecision()               # Return recommended action
  └─ execute methods              # Perform specific actions
```

**Standardized Decision Format:**
```javascript
{
  type: 'action',           // Type of action
  reason: 'Description',    // Why this action
  priority: 'high/medium/low',
  ...actionSpecificData
}
```

---

## 📊 Module Features

### 🏛️ Faction Manager
**Features:**
- Auto-joins best factions
- Optimizes work type (hacking/field/security)
- Tracks reputation for all factions
- Prioritizes important factions (CyberSec, BitRunners, etc.)

**Decision Types:**
- `join` - Join a new faction
- `work` - Start/change faction work
- `none` - All optimized

---

### 🧬 Augmentation Tracker
**Features:**
- Tracks all available augmentations
- Calculates optimal purchase order (price multiplier!)
- Prioritizes by value (hacking > combat for our build)
- Plans when to install (soft reset)

**Smart Features:**
- Price multiplier calculation (each aug increases others by 1.9x)
- Prerequisite tracking
- Cost-benefit analysis
- High-priority aug list

**Decision Types:**
- `purchase` - Buy specific augmentation
- `install` - Install all (soft reset!)
- `none` - Nothing affordable

---

### 🏢 Company Automator
**Features:**
- Auto-applies to top companies
- Auto-promotes when qualified
- Estimates income rates
- Targets faction-linked companies

**Top Companies:**
- MegaCorp, Blade Industries, Four Sigma, NWO, etc.
- Prioritizes tech sector (good for hackers)

**Decision Types:**
- `apply` - Apply to company
- `promote` - Apply for promotion
- `work` - Start working
- `stop` - Stop low-income work

---

### ⚔️ Bladeburner Commander
**Features:**
- Manages stamina (rest when <50%, work when >95%)
- Auto-upgrades action levels (when success >90%)
- Trains combat stats automatically
- Auto-purchases skills with skill points

**Strategy Phases:**
1. Train stats to 100+ all combat
2. Do Tracking until Bounty Hunter viable
3. Optimize contracts/operations for max rank

**Decision Types:**
- `action` - Start specific Bladeburner action
- `none` - Continuing current action

---

### 👥 Gang Manager
**Features:**
- Auto-recruits members
- Ascension optimization (power-of-2 brackets)
- Territory warfare management
- Auto-purchases equipment

**Ascension Logic:**
- Tracks stat multipliers by bracket
- Ascends at 2x threshold
- Max bracket: 2^6 = 64x multiplier
- Buys equipment after ascension

**Decision Types:**
- `recruit` - Recruit new member
- `ascend` - Ascend member
- `task` - Assign member task
- `territory` - Enable warfare

---

### 🏭 Corporation Manager
**Features:**
- Tracks corporation health
- Monitors divisions and products
- Provides expansion recommendations
- Basic automation support

**Note:** Corporations are extremely complex!
- This module provides tracking and guidance
- Full automation requires manual oversight
- See bitbotter's corp/ scripts for advanced automation

**Decision Types:**
- `recommendation` - Suggested action
- `none` - All optimal

---

### 🎮 Go Commander
**Features:**
- Auto-plays Go games against opponents
- Uses advanced 5-stage strategy from go4.js
- Manages opponent rotation
- Tracks game statistics
- Runs in background while other automation continues

**Strategy Phases:**
1. Build base shaft along board edges
2. Create perpendicular columns (form "eyes")
3. Expand territory with priority-based moves
4. Clean up base while preserving eyes
5. Fill remaining spaces (carpet bombing)

**Opponents:**
- Netburners, The Black Hand, Daedalus, Illuminati
- Automatically rotates through opponents
- 13x13 board size

**Decision Types:**
- `start` - Start Go automation (launches go4.js)
- `stop` - Stop Go automation
- `none` - Already running or max games reached

**Integration Notes:**
- Starts go4.js script in background
- Low priority (doesn't interfere with other automation)
- Provides passive income/rewards from winning games

---

## 🔗 Integration Ready

All modules use the **same interface pattern**:

```javascript
import { ModuleName } from './modules/module-name.js';

const module = new ModuleName(ns, config);
const status = module.getStatus();
const decision = module.makeDecision();

// Execute decision in auto-manager
if (decision.type !== 'none') {
  // Handle decision based on type
  executeDecision(decision);
}
```

---

## 🚀 Next Steps

**Option 1: Test Modules Individually**
- Run each module standalone
- Understand what each does
- Verify they work in your game

**Option 2: Integrate into Auto-Manager**
- Add imports to utils/auto-manager.js
- Initialize all modules
- Add decision coordination logic
- Create unified status display

**Option 3: Build Master Orchestrator**
- Create modules/orchestrator.js
- Coordinates all modules
- Handles decision priorities
- Resolves conflicts (e.g., faction work vs company work)

---

## 📚 Learning from bitbotter

These modules were inspired by the excellent [bitbotter](https://github.com/unknown/bitbotter) repository:

**Key learnings:**
- Bladeburner: Stamina management and success chance optimization
- Gang: Power-of-2 ascension brackets
- Hacknet: Cost-benefit ROI analysis
- Corporation: Material ratios and constants

**Our improvements:**
- Cleaner class-based architecture
- Standardized decision interface
- Better documentation
- ES6 modules (not TypeScript)

---

## ⚠️ API Requirements

| Module | Required SF | Notes |
|--------|-------------|-------|
| Faction Manager | SF4 | Singularity API |
| Augmentation Tracker | SF4 | Singularity API |
| Company Automator | SF4 | Singularity API |
| Bladeburner Commander | SF6 or SF7 | Bladeburner access |
| Gang Manager | SF2 | Must also join a gang |
| Corporation Manager | SF3 | Need $150b to create corp |
| Go Commander | None | Go minigame must be unlocked |
| Hacknet Farm | None | Available from start |

**Without required SFs:**
- Modules return `{ type: 'none', reason: 'Not available' }`
- No errors, just graceful degradation
- Other modules continue working

---

## 💡 Configuration

Each module accepts custom configuration:

```javascript
// Example: Custom faction manager
const factionManager = new FactionManager(ns, {
  autoJoin: true,
  maxFactions: 12,
  priorityFactions: ['CyberSec', 'BitRunners'],
  preferredWork: ['hacking', 'field', 'security']
});
```

See each module file for full config options!

---

## 🎓 Module Complexity

**Easy to Understand:**
- ✅ Hacknet Farm Manager
- ✅ Company Automator
- ✅ Faction Manager

**Medium Complexity:**
- 🔶 Augmentation Tracker
- 🔶 Bladeburner Commander

**Advanced:**
- 🔴 Gang Manager
- 🔴 Corporation Manager

---

## 📖 Further Reading

- `/docs` folder for general Bitburner guides
- Each module has detailed comments
- Test standalone before integration
- Check bitbotter repo for advanced patterns

---

**Created:** 2025-11-14
**Status:** All 8 modules complete + integrated into auto-manager.js!
**Next:** Testing and optimization
