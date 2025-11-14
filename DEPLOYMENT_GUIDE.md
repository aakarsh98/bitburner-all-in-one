# Bitburner Deployment Guide - v2.0.0

## 🚀 Quick Deployment to Bitburner

This guide will help you get the **All-in-One Automation System** running in your Bitburner game.

---

## Method 1: GitHub + wget (Recommended)

**Prerequisites**: Push this repository to GitHub first

### Step 1: Push to GitHub

```bash
# On your local machine (PowerShell)
cd "C:\Users\Aakarsh Nadella\Desktop\bitburner-scripts-main"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Download in Bitburner

In the Bitburner terminal:

```bash
# Download the update script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO_NAME/main/bitburner-update.js bitburner-update.js

# Download ALL scripts (recommended for v2.0)
run bitburner-update.js --all

# Wait for download to complete, then start automation
run utils/auto-manager.js
```

---

## Method 2: Manual Copy-Paste (Quick Start)

If you want to start immediately without GitHub setup:

### Step 1: Core Files First

Copy these files manually into Bitburner (File > Create Script):

**Essential files:**
1. `go4.js` - Copy entire content
2. `utils/auto-manager.js` - Copy entire content
3. `modules/faction-manager.js` - Copy entire content
4. `modules/augmentation-tracker.js` - Copy entire content
5. `modules/company-automator.js` - Copy entire content
6. `modules/bladeburner-commander.js` - Copy entire content
7. `modules/gang-manager.js` - Copy entire content
8. `modules/corporation-manager.js` - Copy entire content
9. `modules/go-commander.js` - Copy entire content
10. `hacknet-farm-manager.js` - Copy entire content

**Plus these supporting files:**
- `batch/smart-batcher.js`
- `batch/batch-manager.js`
- `core/attack-hack.js`
- `core/attack-grow.js`
- `core/attack-weaken.js`
- `utils/global-kill.js`

### Step 2: Create Folder Structure

In Bitburner, create these folders:
- `utils/`
- `modules/`
- `batch/`
- `core/`
- `analysis/`

### Step 3: Run!

```bash
run utils/auto-manager.js
```

---

## Method 3: VS Code Remote API (Best for Development)

If you want to edit scripts locally and auto-sync:

### Step 1: Enable Remote API in Bitburner

1. Options → Remote API
2. Set port (default: 9990)
3. Enable API

### Step 2: Install VS Code Extension

1. Install "Bitburner VSCode Integration" extension
2. Configure connection (localhost:9990)

### Step 3: Sync Files

The extension will auto-sync files from this folder to Bitburner.

**See**: `docs/Deployment/REMOTE_API_SETUP.md` for detailed setup

---

## 🎯 Post-Deployment: First Run

Once scripts are in Bitburner:

```bash
# Start the all-in-one system
run utils/auto-manager.js
```

**What you'll see:**
```
═════════════════════════════════════════════════════════
🚀 STARTING ALL-IN-ONE AUTO-MANAGER
═════════════════════════════════════════════════════════
Mode: NORMAL
Emergency Fund: $1.00m
ROI Threshold: 2 hours
Enabled Modules: Hacking, Servers, Hacknet, Factions (locked), 
                 Companies (locked), Augmentations (locked), 
                 Bladeburner (locked), Gangs (locked), 
                 Corporations (locked), Go
═════════════════════════════════════════════════════════
```

**Note**: Modules show "(locked)" until you unlock the required APIs (SF4, SF6, SF7, SF2, SF3)

---

## 📝 Module Unlock Status

Check which modules are available:

```bash
# Quick status check
run utils/auto-manager.js --monitor
```

This shows:
- ✅ Active modules (green)
- 🔒 Locked modules (need Source Files)
- Current income from all sources
- Recent automation actions

---

## 🔧 Customization

### Disable Specific Modules

```bash
# Don't want faction automation?
run utils/auto-manager.js --no-factions

# Multiple disables
run utils/auto-manager.js --no-factions --no-companies --no-go
```

### Change Investment Strategy

```bash
# More aggressive server/hacknet buying
run utils/auto-manager.js --aggressive

# More conservative (higher safety reserves)
run utils/auto-manager.js --conservative
```

### Analysis Only (No Execution)

```bash
# See what it WOULD do without doing it
run utils/auto-manager.js --analyze-only
```

---

## 📦 What Gets Installed

**Core Automation (works from game start):**
- Hacking automation (smart-batcher)
- Server purchasing/upgrading
- Hacknet farm management
- Go game automation

**Advanced Modules (unlock as you progress):**
- Faction automation (SF4)
- Company automation (SF4)
- Augmentation tracker (SF4)
- Bladeburner (SF6/SF7)
- Gang manager (SF2)
- Corporation tracker (SF3)

---

## ⚡ Quick Troubleshooting

### "Module not found" errors

Make sure you created the folder structure correctly:
```
home/
├── utils/
│   └── auto-manager.js
├── modules/
│   ├── faction-manager.js
│   ├── augmentation-tracker.js
│   ├── company-automator.js
│   ├── bladeburner-commander.js
│   ├── gang-manager.js
│   ├── corporation-manager.js
│   └── go-commander.js
├── batch/
│   ├── smart-batcher.js
│   └── batch-manager.js
└── go4.js
```

### "Not enough RAM" errors

The auto-manager needs ~8-10GB RAM on home server. If you don't have enough:

```bash
# Use simpler version (no modules)
run batch/smart-batcher.js joesguns
```

Or upgrade your home server RAM first.

### Scripts not doing anything

Check the logs:
```bash
# See what's running
ps

# Check auto-manager status
run utils/auto-manager.js --monitor
```

---

## 🎮 Recommended First-Time Setup

**For complete beginners:**

1. Deploy files using Method 1 (GitHub + wget)
2. Start with: `run utils/auto-manager.js`
3. Let it run for 10-15 minutes
4. Check status: `run utils/auto-manager.js --monitor`
5. Go AFK! The system handles everything

**For advanced players with SF4+:**

1. Deploy all files
2. Start with: `run utils/auto-manager.js`
3. Modules auto-enable as they detect APIs
4. Fully automated gameplay!

---

## 📖 Learn More

- **Complete Guide**: See README.md
- **Module Details**: See modules/README.md
- **Changelog**: See CHANGELOG.md for version history
- **Stock Trading**: See docs/Feature Guides/STOCK_TRADING_GUIDE.md

---

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Read the README.md for detailed documentation
3. Check module-specific docs in modules/README.md
4. Review CHANGELOG.md for known issues

---

**Current Version**: 2.0.0  
**Last Updated**: November 14, 2025  
**New in v2.0**: Complete all-in-one automation system with 10 integrated modules
