# Deployment Guide

Your site is a static Vite + React application, which means it can be deployed to any static hosting service. Here are the best options:

## Option 1: Netlify (Recommended - Easiest)

**Why Netlify:**
- Free tier with generous limits
- Automatic deployments from Git
- Easy custom domain setup
- Built-in SSL/HTTPS
- Great performance with global CDN

### Steps:

1. **Build your site locally:**
   ```bash
   npm run build
   ```

2. **Deploy via Netlify:**
   - Go to [netlify.com](https://netlify.com) and sign up (free)
   - Drag and drop your `dist/` folder to Netlify's deploy area, OR
   - Connect your GitHub/GitLab repo for automatic deployments

3. **Connect your domain:**
   - In Netlify dashboard: Site settings → Domain management → Add custom domain
   - Enter your domain from domain.com
   - Netlify will show you DNS records to add

4. **Update DNS at domain.com:**
   - Log into your domain.com account
   - Go to DNS management
   - Add an A record pointing to Netlify's IP (they'll provide it)
   - OR add a CNAME record pointing to your Netlify subdomain
   - Wait 24-48 hours for DNS propagation

---

## Option 2: Vercel

**Why Vercel:**
- Excellent performance
- Free tier
- Automatic deployments
- Great for React apps

### Steps:

1. **Build your site:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   - Go to [vercel.com](https://vercel.com) and sign up
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel` in your project directory
   - Follow the prompts

3. **Connect domain:**
   - In Vercel dashboard: Project → Settings → Domains
   - Add your domain
   - Update DNS records at domain.com as instructed

---

## Option 3: Cloudflare Pages (Free & Fast)

**Why Cloudflare Pages:**
- Completely free
- Excellent global CDN
- Fast deployments

### Steps:

1. **Deploy:**
   - Go to [pages.cloudflare.com](https://pages.cloudflare.com)
   - Sign up (free)
   - Connect your Git repository OR upload the `dist/` folder
   - Build command: `npm run build`
   - Output directory: `dist`

2. **Connect domain:**
   - In Cloudflare Pages: Your site → Custom domains
   - Add your domain
   - Update DNS at domain.com

---

## Option 4: GitHub Pages

**Why GitHub Pages:**
- Free if you use GitHub
- Simple setup

### Steps:

1. **Install gh-pages package:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json:**
   Add to scripts:
   ```json
   "deploy": "npm run build && gh-pages -d dist"
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages:**
   - Go to your repo → Settings → Pages
   - Select source branch (gh-pages)
   - Add custom domain in Pages settings

---

## Option 5: Traditional Web Hosting (domain.com)

If domain.com provided web hosting with your domain:

1. **Build your site:**
   ```bash
   npm run build
   ```

2. **Upload files:**
   - Use FTP/SFTP (FileZilla, Cyberduck, etc.)
   - Upload ALL contents of the `dist/` folder to your `public_html` or `www` directory
   - Make sure `index.html` is in the root

3. **Important:** Upload the entire `dist/` folder contents, not the folder itself

---

## DNS Configuration (for all options)

When connecting your domain.com domain to a hosting service, you'll typically need to:

1. **For A Record:**
   - Type: A
   - Host: @ (or leave blank)
   - Points to: [IP address provided by hosting service]
   - TTL: 3600 (or default)

2. **For CNAME Record:**
   - Type: CNAME
   - Host: @ (or www)
   - Points to: [hosting service URL, e.g., yoursite.netlify.app]
   - TTL: 3600

3. **Wait for propagation:** DNS changes can take 24-48 hours to fully propagate

---

## Pre-Deployment Checklist

- [ ] Test production build locally: `npm run build && npm run preview`
- [ ] Verify all images load correctly
- [ ] Check all links work
- [ ] Test on mobile devices
- [ ] Ensure HTTPS is enabled (most services do this automatically)
- [ ] Update any hardcoded localhost URLs if present

---

## Recommended: Netlify

For the easiest experience, I recommend **Netlify**:
- Drag-and-drop deployment (no Git required)
- Automatic SSL
- Easy domain management
- Great free tier

Would you like me to help you set up any specific deployment option?

