#!/usr/bin/env node

/**
 * Lighthouse Performance Checker
 * 
 * This script runs Lighthouse audits for the Next.js app
 * Make sure the dev server is running on http://localhost:3000
 * 
 * Usage:
 *   npm run lighthouse
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAGES = [
  { name: 'home', url: 'http://localhost:3000' },
  { name: 'products', url: 'http://localhost:3000/products' },
];

function checkServer() {
  try {
    const http = require('http');
    return new Promise((resolve) => {
      const req = http.get('http://localhost:3000', (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(1000, () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

async function runLighthouse(page) {
  console.log(`\n🔍 Running Lighthouse for ${page.name}...`);
  const outputPath = path.join(process.cwd(), 'lighthouse', `${page.name}`);
  
  const flags = [
    '--output=html',
    `--output-path=${outputPath}`,
    '--only-categories=performance,accessibility,best-practices,seo',
    '--quiet',
    page.url,
  ].join(' ');
  
  try {
    execSync(`npx --yes lighthouse ${flags}`, {
      stdio: 'inherit',
    });
    console.log(`✅ Report saved: lighthouse/${page.name}.html`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Lighthouse Performance Checker\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Dev server is not running on http://localhost:3000');
    console.log('\n💡 Start the dev server first:');
    console.log('   cd frontend && npm run dev\n');
    process.exit(1);
  }
  
  console.log('✅ Dev server is running\n');
  
  // Create lighthouse directory
  const lighthouseDir = path.join(process.cwd(), 'lighthouse');
  if (!fs.existsSync(lighthouseDir)) {
    fs.mkdirSync(lighthouseDir, { recursive: true });
  }
  
  for (const page of PAGES) {
    await runLighthouse(page);
  }
  
  console.log('\n✨ Lighthouse audit complete!');
  console.log('\n📊 Reports saved in: frontend/lighthouse/');
  console.log('   - home.html');
  console.log('   - products.html');
  console.log('\n💡 Open the HTML files in your browser to view reports');
}

main().catch(console.error);

