# 🚀 How to Run Lighthouse

## Quick Start - Browser Method (Easiest!)

1. **Start your dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open Chrome** and navigate to `http://localhost:3000`

3. **Open DevTools:**
   - Press `F12` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

4. **Click the "Lighthouse" tab**

5. **Select categories:**
   - ✅ Performance
   - ✅ Accessibility  
   - ✅ Best Practices
   - ✅ SEO

6. **Click "Analyze page load"**

7. **Wait ~30-60 seconds** for results

---

## Command Line Method

### Step 1: Start Dev Server
```bash
cd frontend
npm run dev
```
Keep this running in one terminal.

### Step 2: Run Lighthouse (in another terminal)

**For Home Page:**
```bash
cd frontend
npm run lighthouse:home
```

**For Products Page:**
```bash
npm run lighthouse:products
```

**For Both Pages:**
```bash
npm run lighthouse
```

### Step 3: View Reports

Reports will be saved in `frontend/lighthouse/`:
- `home.html` - Home page report
- `products.html` - Products page report

Open these HTML files in your browser to view detailed results.

---

## 📊 Target Scores

After all optimizations, you should achieve:

- **Performance**: ≥ 95
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 95
- **SEO**: ≥ 95

---

## 💡 Tips

1. **Run Lighthouse in Incognito mode** to avoid extensions affecting scores
2. **Close other tabs** to get more accurate results
3. **Use production build** for best results: `npm run build && npm start`
4. **Check both mobile and desktop** views in Chrome DevTools

---

## Troubleshooting

**"Dev server not running" error:**
- Make sure `npm run dev` is running
- Check that `http://localhost:3000` loads in browser

**Lighthouse CLI not found:**
- The scripts use `npx --yes lighthouse` which auto-installs
- First run may take longer to download

**Port already in use:**
- Check if another Next.js app is running: `lsof -i :3000`
- Kill it: `kill -9 <PID>` or use a different port: `PORT=3001 npm run dev`

