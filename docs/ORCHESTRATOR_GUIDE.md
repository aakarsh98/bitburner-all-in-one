# Smart Orchestrator vs Auto-Launcher

## 🆚 Comparison

### Auto-Launcher (Old Way)
```
RAM Usage: 
- Tries to run ALL modules at once
- Wastes RAM on idle scripts
- Example: 10 modules × 2GB = 20GB always used

Problems:
❌ Runs scripts that don't need to be continuous
❌ program-buyer.js running 24/7 (only needs to run once!)
❌ hacknet-manager.js checking constantly (5 min intervals enough)
❌ dashboard.js always running (only needed for viewing)
❌ Can't start on low RAM systems (8GB)
```

### Smart Orchestrator (New Way)
```
RAM Usage:
- Runs scripts only when needed
- Dynamic loading/unloading
- Example: 2-4 modules × 2GB = 4-8GB typical

Benefits:
✅ Critical scripts run continuously (money maker, scanner)
✅ Periodic scripts run on schedule (hacknet every 5 min)
✅ One-time scripts run once then stop (program-buyer)
✅ Background scripts run when RAM available
✅ Works on 8GB RAM systems
```

## 📊 RAM Savings Example

**8GB Home Server:**

### Auto-Launcher:
```
bootstrap-income.js    1.8GB
server-scanner.js      2.0GB
program-buyer.js       2.0GB  ← WASTED (just checking)
hacknet-manager.js     2.0GB  ← WASTED (just checking)
───────────────────────
Total: 7.8GB (0.2GB free) ← Can't run anything else!
```

### Smart Orchestrator:
```
bootstrap-income.js    1.8GB  ← Always running
server-scanner.js      2.0GB  ← Always running
hacknet-manager.js     2.0GB  ← Runs for 5 sec every 5 min
program-buyer.js       2.0GB  ← Runs once, then exits
───────────────────────
Typical: 3.8GB (4.2GB free) ← Plenty of room!
```

**Savings: 4GB+ RAM available for other tasks!**

## 🎯 Script Categories

### 🔴 Continuous (Always Running)
**Purpose:** Critical operations that must run 24/7

Scripts:
- `bootstrap-income.js` or `batch-manager.js` - Money making
- `server-scanner.js` - Auto-nuking new servers

RAM Impact: ~2-4GB always used

### 🟡 Periodic (Scheduled)
**Purpose:** Scripts that check/update every X minutes

Scripts:
- `hacknet-farm-manager.js` - Every 5 minutes
- `program-buyer.js` - Every 30 minutes (or once if complete)
- `stock-trader.js` - Every 6 seconds (if SF8)

RAM Impact: ~2GB for 5-30 seconds, then 0GB

**Why this works:**
- Hacknet nodes don't change every second
- Programs don't appear suddenly
- Check periodically is enough!

### 🟢 One-Time (Condition-Based)
**Purpose:** Run once when conditions met, then stop

Scripts:
- `corporation-manager.js` - Once you have a corporation
- `gang-manager.js` - Once you join a gang
- `program-buyer.js` - Once all programs bought

RAM Impact: ~2GB briefly, then 0GB forever

### 🔵 Background (Low Priority)
**Purpose:** Nice-to-have scripts that run when RAM available

Scripts:
- `bladeburner-automation.js` - If you're in Bladeburner
- `dashboard.js` - For real-time monitoring

RAM Impact: Only uses excess RAM (4GB+)

## 🚀 Usage

### Basic Usage
```bash
run smart-orchestrator.js
```

### When to Use Each:

**Use Smart Orchestrator if:**
- ✅ You have 8-32GB RAM (most players)
- ✅ You want optimal RAM usage
- ✅ You understand which scripts are important
- ✅ You want fine control over what runs

**Use Auto-Launcher if:**
- ✅ You have 64GB+ RAM (late game)
- ✅ You want "run everything" mode
- ✅ You don't care about RAM optimization

## 🔧 Customization

Edit `smart-orchestrator.js` to change:

### Change Check Interval:
```javascript
checkInterval: 10000, // 10 seconds (default)
// Change to 30000 for 30 seconds, etc.
```

### Change Periodic Script Intervals:
```javascript
{
  name: "Hacknet Manager",
  interval: 300000, // 5 minutes
  // Change to 600000 for 10 minutes
}
```

### Add Your Own Scripts:
```javascript
periodic: [
  {
    name: "My Custom Script",
    script: "my-script.js",
    interval: 60000, // Run every 1 minute
    requireSF: null // or 4 for SF4
  }
]
```

## 📈 Performance Impact

### Startup Time:
- Auto-Launcher: Immediate (tries to start everything)
- Smart Orchestrator: Immediate (starts critical only)

### RAM Efficiency:
- Auto-Launcher: 60-70% of home RAM used
- Smart Orchestrator: 30-40% of home RAM used

### Money Making:
- Both: Identical (same batch-manager running)

### Flexibility:
- Auto-Launcher: All or nothing
- Smart Orchestrator: Fine-grained control

## 🎓 Best Practices

### For New Players (8-16GB RAM):
```bash
run smart-orchestrator.js
```
- Gives you room to grow
- Doesn't waste RAM
- Leaves space for experimentation

### For Mid Game (32-64GB RAM):
```bash
run smart-orchestrator.js
```
- Still optimal
- Can add more background scripts
- Efficient resource usage

### For Late Game (128GB+ RAM):
```bash
run auto-launcher.js
```
- RAM is no longer a concern
- Run everything simultaneously
- Maximum convenience

## 🆘 Troubleshooting

### "Script not starting"
- Check RAM: Is there enough free RAM?
- Check SF: Do you have required Source Files?
- Check conditions: Are conditions met (gang, corp, etc.)?

### "Too much RAM usage"
- Increase intervals for periodic scripts
- Disable background scripts
- Use bootstrap-income.js instead of batch-manager

### "Script keeps restarting"
- Check if it's a one-time script (should stop)
- Check if conditions are met
- Look at script logs for errors

## 📝 Migration Guide

### From Auto-Launcher:
```bash
# Stop auto-launcher
kill auto-launcher.js

# Start smart orchestrator
run smart-orchestrator.js
```

### From Bootstrap:
```bash
# Kill bootstrap (orchestrator will start it)
kill bootstrap-income.js

# Start orchestrator
run smart-orchestrator.js
```

## 🎯 Recommended Setup

**For most players:**
```bash
# One command, optimal RAM usage
run smart-orchestrator.js
```

**Result:**
- Money making: ✅ Running continuously
- Server scanning: ✅ Running continuously  
- Hacknet: ✅ Checks every 5 minutes
- Programs: ✅ Buys once, then stops
- Everything else: ✅ Runs when needed
- RAM: ✅ 30-40% used instead of 70%+

**Your system automatically adapts as you progress!**
