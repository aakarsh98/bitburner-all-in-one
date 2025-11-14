# Augmentation Installation & Soft Reset Guide

## 🔄 What is a Soft Reset?

When you **install augmentations** in Bitburner, the game performs a **soft reset**. This is the core progression mechanic.

### What You LOSE (Temporary):
- ❌ All your money
- ❌ All purchased servers
- ❌ All scripts (unless backed up)
- ❌ All your current stats (hacking level, combat stats, etc.)
- ❌ Current faction memberships
- ❌ Company positions
- ❌ Gang (if you had one)
- ❌ Corporation (if you had one)

### What You KEEP (Permanent):
- ✅ **Augmentations you installed** (permanent stat bonuses!)
- ✅ **Source Files** from completed BitNodes
- ✅ **Home server RAM** (if you bought permanent upgrades)
- ✅ Knowledge and experience (you!)

---

## 📈 Why Reset?

Each reset makes you **exponentially stronger**:

**First Run:** Make $100m, takes 10 hours
**After Augs:** Same $100m, takes 2 hours (5x faster!)
**After More Augs:** Same $100m, takes 30 minutes (20x faster!)

Augmentations provide **permanent multipliers**:
- +12% hacking skill
- +15% hacking exp gain
- +10% hacking money
- +5% reputation gains
- And many more!

---

## 🎯 Optimal Reset Strategy

### Phase 1: First Augmentation Purchase (Early Game)

**Goal:** Buy 5-10 augmentations, install, reset

1. **Make Money** (~$10-50 million)
   ```bash
   run utils/auto-manager.js
   ```

2. **Join Factions** (manually or wait for automation with SF4)
   - CyberSec (hack CSEC server)
   - Tian Di Hui ($1m + hacking 50+)
   - Netburners (hacking 80+, hacknet levels 100+)

3. **Farm Reputation** (~25k-50k per faction)
   - Work for faction: Hacking contracts (best for hacking builds)
   - Or with SF4: `run utils/auto-manager.js` handles this automatically

4. **Buy Augmentations**
   - Focus on **hacking augmentations** first:
     - BitWire (+5% hacking)
     - Artificial Bio-neural Network Implant (+12% hacking)
     - Neuralstimulator (+3% hacking speed/chance)
   - Buy **NeuroFlux Governor** multiple times (stackable!)

5. **Install When Ready**
   - Have 5-10 augmentations purchased?
   - Install them: Options → Augmentations → Install Augmentations
   - **OR** use the automation (see below)

### Phase 2: Subsequent Resets (Mid-Game)

**With each reset:**
- Your augmentation bonuses stack multiplicatively
- You reach the same milestones faster
- You can buy MORE augmentations each run
- Target: 10-20 augs per reset

**Strategy:**
- Reset every 2-4 hours of gameplay
- Each reset should net you MORE augs than the last
- Focus on augmentations that help your money-making strategy

### Phase 3: Late Game Resets

**After SF4 (Singularity):**
- Full automation handles everything
- Reset every 1-2 hours
- Buy 20-50 augmentations per reset
- Use RAM sharing for massive reputation gains

---

## 🤖 Automation Support

### Without SF4 (Manual Mode)

The augmentation tracker can **plan** your purchases:

```bash
# See what augmentations you can afford and optimal purchase order
run modules/augmentation-tracker.js
```

**Output shows:**
- Affordable augmentations
- Optimal purchase order (accounts for 1.9x price multiplier)
- Priority scores
- Total cost

**You must:**
- Purchase augmentations manually (visit factions)
- Install augmentations manually (Options menu)

### With SF4 (Full Automation)

The all-in-one system handles everything:

```bash
# Start full automation
run utils/auto-manager.js
```

**What it does:**
1. ✅ Joins factions automatically
2. ✅ Farms reputation via hacking contracts
3. ✅ Tracks affordable augmentations
4. ✅ Plans optimal purchase order
5. ✅ **Recommends when to install** (but doesn't auto-install for safety)

**When ready to install:**
- System will print: `⚠️ Augmentations ready to install - this will reset!`
- You must manually install (safety feature)

---

## ⚠️ Important Reset Considerations

### 1. Backup Your Scripts First!

**Before installing augmentations:**

```bash
# CRITICAL: Save your scripts to GitHub or external storage!
# The all-in-one system can re-download them after reset

# After reset, just run:
wget https://raw.githubusercontent.com/YOUR_USERNAME/bitburner-all-in-one/main/quick-deploy.js quick-deploy.js
run quick-deploy.js
```

**If you don't backup:** You'll lose all scripts and have to re-download them.

### 2. Price Multiplier Math

Each augmentation purchased increases the price of ALL remaining augs by **1.9x**.

**Example:**
- BitWire costs $10m (first purchase)
- Neuralstimulator costs $50m normally
- If you buy BitWire first, Neuralstimulator now costs $50m × 1.9 = $95m
- Buy 5 augs? 6th aug costs original_price × (1.9^5) = 2.48x more

**Strategy:**
- The augmentation-tracker module handles this automatically
- It calculates optimal order to minimize total cost
- Generally: buy cheaper augs first, expensive augs last

### 3. Minimum Augmentations Before Reset

**Don't reset too early!**

Default threshold: **5 augmentations minimum**

**Why?**
- Each reset takes time (re-downloading scripts, restarting automation)
- Better to buy 10-15 augs per reset than 2-3
- More augs = bigger multiplicative bonus

**Configure in augmentation-tracker:**
```javascript
const tracker = new AugmentationTracker(ns, {
  minAugsBeforeInstall: 10  // Require 10 augs before suggesting install
});
```

---

## 📊 Post-Reset Checklist

After installing augmentations:

### 🚀 FASTEST METHOD (Automated - 1 minute):

**Copy-paste this ONE command:**
```bash
wget https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main/post-reset.js post-reset.js
run post-reset.js
```

**This automated script:**
1. ✅ Downloads all scripts automatically
2. ✅ Analyzes your current situation
3. ✅ Finds the best starter target
4. ✅ Deploys optimal automation (auto-manager or smart-batcher)
5. ✅ Provides personalized recommendations
6. ✅ Starts making money immediately

**That's it! Everything else is automatic.**

---

### 📋 Manual Method (If automated fails):

### Immediate (First 5 minutes):
1. ✅ **Re-download scripts**
   ```bash
   wget https://raw.githubusercontent.com/aakarsh98/bitburner-all-in-one/main/quick-deploy.js quick-deploy.js
   run quick-deploy.js
   ```

2. ✅ **Start automation**
   ```bash
   run utils/auto-manager.js
   ```

3. ✅ **Verify augmentation bonuses**
   - Check your stats (hacking level should be higher than before)
   - Open Augmentations menu → See active bonuses

### Short-term (First 30 minutes):
4. ✅ **Re-join key factions** (if no SF4)
   - CyberSec, Tian Di Hui, Netburners
   - With SF4: automation handles this

5. ✅ **Upgrade home RAM** (if needed)
   - Priority purchase after making first $1-5m
   - 16GB is comfortable, 32GB is great

### Mid-term (First 1-2 hours):
6. ✅ **Resume your money-making strategy**
   - Auto-manager finds optimal targets
   - Income should be MUCH higher than last run
   - Example: $1m/s before → $5m/s after (5x improvement!)

7. ✅ **Set new augmentation goals**
   - Aim for MORE augs this run
   - Track progress: `run modules/augmentation-tracker.js`

---

## 🎓 Advanced: Augmentation Priority System

The augmentation-tracker uses a **priority scoring system**:

### Priority Weights (default):
```javascript
priorityWeights: {
  hacking: 10,              // Highest priority for hacking builds
  hackingSpeed: 8,          // Faster operations = more money
  hackingMoney: 9,          // Direct money multiplier
  hackingChance: 7,         // Better success rate
  reputation: 8,            // Faster faction rep = more augs
  combat: 3,                // Lower priority (unless combat build)
  charisma: 4,              // Company/faction rep gains
  bladeburner: 2,           // Late game focus
  unique: 10                // Special augs (like The Red Pill)
}
```

### High-Priority Augmentations:
1. **NeuroFlux Governor** - Stackable, buy multiple times
2. **BitWire** - +5% hacking
3. **Artificial Bio-neural Network Implant** - +12% hacking
4. **Artificial Synaptic Potentiation** - +5% hacking speed
5. **Enhanced Social Interaction Implant** - +10% rep gains
6. **Neuralstimulator** - +3% hacking speed/chance
7. **BitRunners Neurolink** - +5% hacking skills
8. **The Red Pill** - Access to World Daemon (endgame)

---

## 🔒 Safety Features

### Auto-Install is DISABLED by Default

**Why?**
- Soft reset is **permanent** (can't undo)
- You might want to buy MORE augs first
- You might want to backup scripts
- You might want to check if it's a good time to reset

**The system will:**
- ✅ Track affordable augmentations
- ✅ Plan optimal purchase order
- ✅ Recommend augmentations to buy
- ✅ **WARN when ready to install**
- ❌ **NEVER auto-install without your confirmation**

**To install (always manual):**
1. Options menu → Augmentations
2. Click "Install Augmentations"
3. Confirm

---

## 💡 Pro Tips

### 1. Reset During Downtime
- Reset before going to bed/work
- Let automation rebuild overnight
- Wake up to progress!

### 2. Prioritize Reputation Multipliers
- Augmentations that give +% rep gain
- Each run, you'll farm rep FASTER
- Enables buying more augs per run

### 3. Track Your Progress
```bash
# Before reset - record these:
# - Total augs installed
# - Hacking level
# - Money/hour rate

# After reset - compare:
# - How much faster did you reach same milestones?
# - What's your new money/hour rate?
```

### 4. Don't Rush First Reset
- First reset is special (biggest learning curve)
- Wait until you have 10-15 good augmentations
- Make sure you understand the mechanics

### 5. Use Source Files Wisely
- After first BitNode completion, you get Source-File bonuses
- These stack with augmentations
- Some Source Files unlock new gameplay mechanics

---

## 📖 Related Documentation

- **Faction Guide**: How to join and farm reputation
- **Stock Trading Guide**: Make money faster for augs
- **RAM Sharing Guide**: Farm reputation 100x faster (late game)
- **BitNode Guide**: Complete BitNodes for Source Files

---

## 🆘 Common Questions

**Q: Will I lose my scripts after reset?**
A: Yes, unless backed up to GitHub or external storage. Use quick-deploy.js after reset to re-download.

**Q: How many augmentations should I buy before resetting?**
A: Minimum 5, ideal 10-15 for first reset. Later runs: 20-50.

**Q: Can I undo a soft reset?**
A: No, it's permanent. But that's the point - you get stronger each time!

**Q: What if I don't have SF4?**
A: Manual faction work is slower, but still works. Automation helps after SF4.

**Q: Do augmentations stack?**
A: Yes! Multiplicatively. Two +10% augs = 1.1 × 1.1 = 1.21 (21% bonus).

**Q: Should I focus on one faction or many?**
A: Start with 3-5 factions for variety of augmentations. Later: join more.

---

**Current Version**: 2.0.0  
**Last Updated**: November 14, 2025  
**Part of**: Bitburner All-in-One Automation System
