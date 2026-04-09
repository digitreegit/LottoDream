#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');

function normalizeBasePath(input) {
  if (!input) {
    throw new Error('Base path is required. Example: /lottodream');
  }

  let value = input.trim();
  if (!value.startsWith('/')) value = `/${value}`;
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
  return value;
}

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function patchContent(content, basePath) {
  return content
    .replace(/(href|src)=\"\/(?!\/)/g, `$1=\"${basePath}/`)
    .replace(/(["'])\/_expo\//g, `$1${basePath}/_expo/`)
    .replace(/(["'])\/assets\//g, `$1${basePath}/assets/`)
    .replace(/(["'])\/favicon\.ico/g, `$1${basePath}/favicon.ico`);
}

function isTextLikeFile(filePath) {
  return /\.(html|js|css|json|map|txt)$/i.test(filePath);
}

function writeHtaccess(basePath) {
  const htaccessPath = path.join(distDir, '.htaccess');
  const content = `DirectoryIndex index.html
RewriteEngine On
RewriteBase ${basePath}/

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

RewriteRule ^ index.html [L]
`;
  fs.writeFileSync(htaccessPath, content, 'utf8');
}

function main() {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir}`);
  }

  const basePath = normalizeBasePath(process.argv[2]);
  const allFiles = walk(distDir);

  let changedCount = 0;
  for (const file of allFiles) {
    if (!isTextLikeFile(file)) continue;

    const original = fs.readFileSync(file, 'utf8');
    const patched = patchContent(original, basePath);

    if (patched !== original) {
      fs.writeFileSync(file, patched, 'utf8');
      changedCount += 1;
    }
  }

  writeHtaccess(basePath);

  console.log(`Patched ${changedCount} files with base path: ${basePath}`);
  console.log('Generated dist/.htaccess for SPA routing.');
}

main();
