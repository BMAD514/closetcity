const fs = require('fs');
const path = require('path');

console.log('🏗️  Building static site...');

// Create output directory
const outDir = 'out';
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy static assets
console.log('📁 Copying static assets...');
const publicDir = 'public';
if (fs.existsSync(publicDir)) {
  copyDir(publicDir, outDir);
}

// Copy Next.js static assets
const nextStaticDir = '.next/static';
if (fs.existsSync(nextStaticDir)) {
  const targetDir = path.join(outDir, '_next/static');
  fs.mkdirSync(targetDir, { recursive: true });
  copyDir(nextStaticDir, targetDir);
}

// Copy HTML files from Next.js build
console.log('📄 Copying HTML pages...');
const htmlFiles = [
  { src: '.next/server/app/index.html', dest: 'index.html' },
  { src: '.next/server/app/shop.html', dest: 'shop.html' },
  { src: '.next/server/app/virtual-try-on.html', dest: 'virtual-try-on.html' },
  { src: '.next/server/app/manifesto.html', dest: 'manifesto.html' },
  { src: '.next/server/app/invite.html', dest: 'invite.html' },
  { src: '.next/server/app/dashboard.html', dest: 'dashboard.html' },
];

htmlFiles.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, dest));
    console.log(`✅ Copied ${dest}`);
  } else {
    console.log(`⚠️  Missing ${src}`);
  }
});

// Copy inventory images
console.log('🖼️  Copying inventory images...');
const inventoryDir = path.join(outDir, 'inventory');
fs.mkdirSync(inventoryDir, { recursive: true });
if (fs.existsSync('public/inventory')) {
  copyDir('public/inventory', inventoryDir);
}

console.log('✨ Static build complete!');
console.log(`📦 Output directory: ${outDir}`);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
