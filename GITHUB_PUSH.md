# Push to GitHub

Your project is ready for GitHub! Here's how to push it:

## 1. Create a new repository on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `mailclean-pro` (or your preferred name)
3. Description: "Production-grade Chrome Extension for cleaning unnecessary Gmail emails with smart categorization"
4. Choose **Public** (recommended for open source) or **Private** (if not ready to share yet)
5. Do NOT initialize with README/gitignore/license (we already have these)
6. Click **Create repository**

## 2. Add remote and push

After creating the repo, GitHub shows commands. Run these in your terminal:

```bash
cd d:/work/mailCleanPr

# Add the remote (replace OWNER/REPO with your github username/repo name)
git remote add origin https://github.com/YOUR_USERNAME/mailclean-pro.git

# Verify remote is set
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### Using SSH instead of HTTPS (recommended for future commits)

If you've set up SSH keys on GitHub:

```bash
git remote set-url origin git@github.com:YOUR_USERNAME/mailclean-pro.git
git push -u origin main
```

## 3. Verify on GitHub

- Visit `https://github.com/YOUR_USERNAME/mailclean-pro`
- You should see all your files with the initial commit message

---

## What's excluded from git (safely ignored)

✅ `.gitignore` file prevents these from being committed:

- `node_modules/` — dependencies (run `npm install` to restore)
- `dist/` — build outputs (run `npm run build` to regenerate)
- `.env*` — environment variables
- `.claude/` — Claude Code session files
- `.vscode/`, `.idea/` — IDE config
- `*.log` — log files

Run this to verify nothing sensitive was committed:

```bash
git ls-files | grep -E 'node_modules|dist|\.env'
# Should return nothing
```

---

## Your current repo structure

```
mailclean-pro/
├── src/                      # Source code
│   ├── background/           # Service worker (OAuth, scan, trash)
│   ├── components/           # React UI components
│   ├── pages/                # Popup, Options, Dashboard pages
│   ├── services/             # Gmail API, classification, auth
│   ├── stores/               # Zustand state management
│   ├── types/                # TypeScript types
│   └── utils/                # Helpers (format, rate limiting, etc.)
├── public/                   # Icons and assets
├── manifest.config.ts        # Chrome Extension manifest
├── vite.config.ts            # Build configuration
├── package.json              # Dependencies
├── README.md                 # User-facing documentation
├── OAUTH_SETUP.md            # Google OAuth setup guide
├── PRIVACY_POLICY.md         # Required privacy policy
├── LICENSE                   # MIT License
└── .gitignore               # Files to ignore in git

```

---

## Next steps for GitHub

1. ✅ Push initial commit (you're here)
2. Add GitHub Topics: `chrome-extension` `gmail` `productivity` (in repo Settings → About)
3. Enable GitHub Pages (optional, for a landing page)
4. Add branch protection rules (Settings → Branches) to prevent accidental commits
5. Set up GitHub Actions for CI/CD (run tests/build on every push) — optional but recommended

---

## Example commands for future commits

```bash
# Make changes to code...

# Stage specific files
git add src/services/gmail/GmailClient.ts

# Or stage all changes (will still respect .gitignore)
git add .

# Commit with a message
git commit -m "Fix: improve email classification accuracy for newsletters"

# Push to GitHub
git push
```

---

If you get stuck, GitHub's error messages are usually clear. Feel free to ask!
