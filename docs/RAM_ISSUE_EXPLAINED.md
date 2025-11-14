# Auto-Manager RAM Issue - Technical Explanation

## 🔴 Current Status

**auto-manager.js requires ~300GB RAM** even with dynamic imports and API checks.

This is NOT a bug in our code - it's how Bitburner calculates RAM.

---

## 📊 Why This Happens

### Bitburner's Static RAM Analysis

Bitburner calculates script RAM **statically** (before execution) by:
1. Parsing all code in the file
2. Finding all possible `import` statements
3. Recursively loading all imported files
4. Summing up the RAM cost of everything that COULD be loaded

**Even if you use:**
- ✅ `if` statements to conditionally import
- ✅ Dynamic `import()` instead of static imports
- ✅ Check APIs before loading

**Bitburner still reserves RAM for ALL possible imports** because it can't know at analysis time which branches will execute.

### Example:

```javascript
// This STILL reserves RAM for faction-manager even if API doesn't exist!
if (ns.singularity !== undefined) {
  const { FactionManager } = await import('./faction-manager.js');
}
```

Why? Because Bitburner's static analyzer sees the import statement and says:
"This file MIGHT import faction-manager.js, so I need to reserve RAM for it"

---

## 🎯 Solutions

### **✅ SOLUTION 1: Use batch-manager.js (RECOMMENDED)**

**Best for most users:**
```bash
run batch/batch-manager.js joesguns
```

**Features:**
- ~5-6GB RAM
- Auto-detects RAM upgrades
- Auto-roots new servers
- Smart redeployment
- Works great for hacking automation

**Limitations:**
- No faction automation
- No company automation
- No augmentation tracking

---

### **✅ SOLUTION 2: Run modules separately**

If you have SF4+ and want advanced features:

```bash
# Core hacking
run batch/batch-manager.js joesguns

# Factions (if you have SF4)
run modules/faction-manager.js

# Companies (if you have SF4)
run modules/company-automator.js

# Bladeburner (if you have SF6/SF7)
run modules/bladeburner-commander.js

# Gang (if you have SF2)
run modules/gang-manager.js

# Go games
run go4.js
```

**RAM Cost:** Each module is separate, so only uses RAM for what you run.

---

### **✅ SOLUTION 3: Use post-reset.js for quick start**

**After augmentation reset:**
```bash
wget https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main/post-reset.js post-reset.js
run post-reset.js
```

This automatically:
- Downloads scripts
- Finds best target
- **Starts batch-manager** (not auto-manager)
- Gets you making money fast

---

### **❌ SOLUTION 4: Auto-manager (NOT RECOMMENDED - doesn't work)**

```bash
run utils/auto-manager.js  # ❌ Requires 300GB RAM
```

**Status:** Currently unusable due to static RAM analysis.

We tried:
- Dynamic imports
- API availability checks
- Conditional loading
- Lazy loading

**None of these work** because Bitburner's RAM calculation is static.

---

## 🔧 Technical Details

### What We Tried

#### Attempt 1: Static imports
```javascript
import { FactionManager } from './faction-manager.js';
// Result: Loads always, ~300GB RAM
```

#### Attempt 2: Dynamic imports
```javascript
const { FactionManager } = await import('./faction-manager.js');
// Result: STILL reserves RAM, ~300GB
```

#### Attempt 3: Conditional dynamic imports
```javascript
if (hasSF4) {
  const { FactionManager } = await import('./faction-manager.js');
}
// Result: STILL reserves RAM, ~300GB
// Why: Static analyzer sees import(), reserves RAM anyway
```

#### Attempt 4: API check before import
```javascript
function checkAPIs() {
  return { sf4: ns.singularity !== undefined };
}

if (checkAPIs().sf4) {
  const { FactionManager } = await import('./faction-manager.js');
}
// Result: STILL reserves RAM, ~300GB
// Why: Static analyzer doesn't execute checkAPIs(), sees possible import
```

### Why It Won't Work

Bitburner's RAM calculator:
1. Is **conservative** (worst-case analysis)
2. Doesn't execute code (static analysis only)
3. Can't know which branches execute
4. Reserves RAM for all possible imports

**This is by design** - prevents runtime "out of RAM" errors.

---

## 💡 What WOULD Work (But We Can't Do)

### Option A: No imports (lose modularity)
Put all code in one file - defeats the purpose of modular design.

### Option B: ns.run() instead of import
Launch modules as separate processes - loses tight integration.

### Option C: Bitburner engine change
Modify how Bitburner calculates RAM - not in our control.

---

## 📋 Recommended Workflow

### Fresh Game / Post-Reset:
```bash
# 1. Quick start
wget ... post-reset.js
run post-reset.js

# Automatically starts batch-manager
```

### Mid-Game (No SF4):
```bash
# Core automation
run batch/batch-manager.js [target]

# Optional: Hacknet
run hacknet-farm-manager.js

# Optional: Go games
run go4.js
```

### Late-Game (With SF4+):
```bash
# Core
run batch/batch-manager.js [target]

# Advanced (run what you want)
run modules/faction-manager.js
run modules/company-automator.js
run modules/augmentation-tracker.js

# Even more advanced
run modules/bladeburner-commander.js  # if SF6/SF7
run modules/gang-manager.js           # if SF2
```

---

## 🎯 Bottom Line

**Use `batch/batch-manager.js` for core automation.**

It works great, uses minimal RAM, and handles 90% of use cases.

The "all-in-one" dream of having everything in one script isn't possible due to how Bitburner calculates RAM statically.

**But the modular approach is actually BETTER:**
- Lower RAM usage
- Pick only what you need
- More flexible
- Each module tested independently

---

## 🔮 Future Plans

We're exploring:
1. **Server-based coordination** - One "coordinator" script that launches others
2. **Config-file approach** - Read configuration, launch appropriate scripts
3. **RAM-aware auto-launcher** - Checks available RAM, launches what fits

But for now: **batch-manager.js + individual modules** is the way to go.

---

**TL;DR:** Use `batch/batch-manager.js` instead of `auto-manager.js`. It works great and only uses ~5-6GB RAM.
