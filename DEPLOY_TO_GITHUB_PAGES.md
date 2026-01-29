# How to Deploy the Journey Explorer to GitHub Pages

Follow these steps to host your Journey Explorer visualization (charts and data) on GitHub Pages for free.

## Prerequisites
- You need a GitHub account.
- You need `git` installed on your machine.

## Step 1: Create a GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in.
2. Click the **+** icon in the top right and select **New repository**.
3. Name it `journey-explorer` (or any name you prefer).
4. Make it **Public** (required for free GitHub Pages).
5. Click **Create repository**.

## Step 2: Configure Vite for GitHub Pages
1. Open `app/vite.config.ts`.
2. Ensure the `base` property matches your repository name.
   - If your repo is `https://github.com/username/journey-explorer`, the base should be `/journey-explorer/`.
   - **Current setting:** `base: './'` (This works for relative paths, but explicit repo name is safer for routing).
   
   *Recommended Change:*
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/journey-explorer/', // Replace with your actual repo name
   })
   ```

## Step 3: Initialize Git and Push
Open your terminal in the project root (`c:\Users\mdevy\OneDrive\Projects\AnalyticsThinking\Journey Explorer`) and run:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Link to your new GitHub repo (replace URL with yours)
git remote add origin https://github.com/YOUR_USERNAME/journey-explorer.git

# Push
git push -u origin main
```

## Step 4: Deploy
You can deploy manually or set up an automatic workflow. The manual method is simplest for now.

### Option A: Manual Deploy (gh-pages)
1. Install the `gh-pages` package in the `app` folder:
   ```bash
   cd app
   npm install gh-pages --save-dev
   ```

2. Add a deploy script to `app/package.json`:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "tsc -b && vite build",
     "preview": "vite preview",
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Run the deploy command:
   ```bash
   npm run deploy
   ```

### Option B: GitHub Actions (Automatic)
1. Create a file `.github/workflows/deploy.yml` in the root.
2. Paste this content:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Checkout
           uses: actions/checkout@v3

         - name: Install and Build
           run: |
             cd app
             npm install
             npm run build

         - name: Deploy
           uses: JamesIves/github-pages-deploy-action@v4
           with:
             folder: app/dist
             branch: gh-pages
   ```
3. Push this file to GitHub.

## Step 5: Enable GitHub Pages
1. Go to your repository **Settings** on GitHub.
2. Click **Pages** on the left sidebar.
3. Under **Build and deployment** > **Source**, select **Deploy from a branch**.
4. Under **Branch**, select `gh-pages` and `/ (root)`.
5. Click **Save**.

Your visualization will be live at `https://YOUR_USERNAME.github.io/journey-explorer/`!
