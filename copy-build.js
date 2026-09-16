import fs from 'fs';
import path from 'path';

// ─── Copy offline build (single-file) ───
try {
  fs.copyFileSync('dist-offline/index.html', 'preview_offline.html');
  console.log('✅ preview_offline.html updated.');

  if (!fs.existsSync('deploy_ready')) fs.mkdirSync('deploy_ready');
  fs.copyFileSync('dist-offline/index.html', 'deploy_ready/index.html');
  console.log('✅ deploy_ready/index.html ready for upload.');
} catch (err) {
  // Offline build is optional; only warn
  console.warn('⚠️  Offline build not found, skipping:', err.message);
}

// ─── Copy .htaccess into dist/ for DirectAdmin deploy ───
const htaccessSrc = 'public/.htaccess';
const htaccessDst = 'dist/.htaccess';
try {
  if (fs.existsSync(htaccessSrc)) {
    fs.copyFileSync(htaccessSrc, htaccessDst);
    console.log('✅ .htaccess copied to dist/');
  } else {
    console.warn('⚠️  public/.htaccess not found, skipping.');
  }
} catch (err) {
  console.warn('⚠️  Could not copy .htaccess:', err.message);
}

// ─── Copy robots.txt into dist/ ───
const robotsSrc = 'public/robots.txt';
const robotsDst = 'dist/robots.txt';
try {
  if (fs.existsSync(robotsSrc)) {
    fs.copyFileSync(robotsSrc, robotsDst);
    console.log('✅ robots.txt copied to dist/');
  }
} catch (err) {
  console.warn('⚠️  Could not copy robots.txt:', err.message);
}

// ─── Print dist/ structure summary ───
try {
  const distFiles = fs.readdirSync('dist');
  const assetsFiles = fs.existsSync('dist/assets') ? fs.readdirSync('dist/assets') : [];
  console.log('\n📦 dist/ structure:');
  distFiles.forEach(f => console.log('   ' + f));
  if (assetsFiles.length) {
    console.log('   assets/');
    assetsFiles.forEach(f => {
      const size = fs.statSync(path.join('dist/assets', f)).size;
      const kb = (size / 1024).toFixed(1);
      console.log(`     ${f}  (${kb} KB)`);
    });
  }
  console.log('\n✅ Build complete! Upload contents of dist/ to public_html/');
} catch (err) {
  // Non-critical
}
