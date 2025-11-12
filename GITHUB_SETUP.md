# GitHub Setup Instructions

Follow these steps to push your calculator project to GitHub.

## Step 1: Initialize Git Repository

Run these commands in your terminal from the project directory:

```bash
cd "/Users/marissa.ade/Desktop/my-drive/_FMG/Calculator Redesign Project"
git init
```

## Step 2: Configure Git (if not already done)

Make sure your git is configured with your GitHub account:

```bash
git config user.name "marissaade"
git config user.email "your-email@example.com"  # Use your GitHub email
```

## Step 3: Add All Files

```bash
git add .
```

## Step 4: Create Initial Commit

```bash
git commit -m "Initial commit: FMG Calculator Redesign Project"
```

## Step 5: Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `fmg-calculators` (or your preferred name)
3. Description: "Financial calculators for FMG websites - redesigned for consistency and UX"
4. Choose **Public** or **Private** (your preference)
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 6: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/marissaade/fmg-calculators.git
git branch -M main
git push -u origin main
```

(Replace `fmg-calculators` with whatever repository name you chose)

## Step 7: Verify

Visit your repository on GitHub to confirm all files are uploaded:
https://github.com/marissaade/[your-repo-name]

## Future Updates

When you make changes, use these commands:

```bash
git add .
git commit -m "Description of changes"
git push
```

## Notes

- The `.gitignore` file will exclude backup files, OS files, and other unnecessary files
- All calculator code is included
- CSV files and test files are included (you can modify `.gitignore` if needed)

