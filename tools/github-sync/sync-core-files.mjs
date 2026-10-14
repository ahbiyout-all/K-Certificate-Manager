#!/usr/bin/env node
/**
 * ==============================================================================
 *  K-Certificate Manager - GitHub 전용 핵심 파일 선별 동기화 도구 (Node.js)
 *  빌드에 꼭 필요한 핵심 파일만 'deploy/github-core' 전용 폴더에 선별 복사합니다.
 *  Developer: AhBiYout (GitHub: AhBiYout-all)
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');
const targetDir = path.resolve(rootDir, 'deploy/github-core');

console.log('='.repeat(78));
console.log('  K-Certificate Manager - 깃허브 전용 핵심 파일 선별 동기화 (Node.js)');
console.log(`  소스 루트: ${rootDir}`);
console.log(`  전용 대상: ${targetDir}`);
console.log('='.repeat(78));

// 1. 대상 폴더 준비
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
} else {
  // .git 폴더 보존하며 정리
  const entries = fs.readdirSync(targetDir);
  for (const entry of entries) {
    if (entry === '.git') continue;
    fs.rmSync(path.join(targetDir, entry), { recursive: true, force: true });
  }
}

// 2. 필수 개별 파일 목록
const coreFiles = [
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'index.html',
  'metadata.json',
  'KCertManager.sln',
  'nuget.config',
  'installer.iss',
  'build.bat',
  'build.ps1',
  'run-web.cmd',
  'launch-web.vbs',
  'push_to_github.bat',
  'push_to_github.ps1',
  'LICENSE.txt',
  'LICENSE_KR.txt',
  'LICENSE_EN.txt',
  'README.md',
  '.gitignore',
  '.gitattributes'
];

console.log('\n[1/3] 핵심 설정 파일 복사 중...');
for (const file of coreFiles) {
  const src = path.join(rootDir, file);
  const dest = path.join(targetDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  + ${file}`);
  }
}

// 3. 디렉터리 필터링 복사 함수
function copyDirFiltered(srcDir, destDir, ignoreSubdirs = []) {
  if (!fs.existsSync(srcDir)) return;
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      if (ignoreSubdirs.includes(entry.name)) continue;
      copyDirFiltered(srcPath, destPath, ignoreSubdirs);
    } else {
      // 위험 파일 필터링
      const ext = path.extname(entry.name).toLowerCase();
      if (['.pfx', '.p12', '.key', '.pri', '.der', '.cer', '.pem', '.credentials', '.pdb', '.user', '.suo'].includes(ext)) {
        continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('\n[2/3] 핵심 소스 디렉터리 선별 복사 중...');
copyDirFiltered(path.join(rootDir, '.github'), path.join(targetDir, '.github'));
console.log('  + .github/ (CI/CD 워크플로)');

copyDirFiltered(path.join(rootDir, 'src'), path.join(targetDir, 'src'));
console.log('  + src/ (React 웹 콘솔)');

copyDirFiltered(path.join(rootDir, 'public'), path.join(targetDir, 'public'));
console.log('  + public/ (웹 에셋)');

copyDirFiltered(path.join(rootDir, 'src-wpf'), path.join(targetDir, 'src-wpf'), ['bin', 'obj', '.vs', 'packages']);
console.log('  + src-wpf/ (C# WPF 데스크톱 소스, bin/obj 제외 완료)');

copyDirFiltered(path.join(rootDir, 'docs'), path.join(targetDir, 'docs'));
console.log('  + docs/ (공식 기술 문서)');

// 4. 보안 점검 및 파일 집계
console.log('\n[3/3] 전용 폴더 보안 점검 및 집계...');
let fileCount = 0;
let totalSizeBytes = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else {
      fileCount++;
      totalSizeBytes += fs.statSync(fullPath).size;
    }
  }
}
walkDir(targetDir);

const totalMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
console.log('\n' + '='.repeat(78));
console.log('  [성공] deploy/github-core 동기화 완료!');
console.log(`  * 대상 경로: deploy/github-core`);
console.log(`  * 총 파일수: ${fileCount}개`);
console.log(`  * 총 용량  : ${totalMB} MB (대용량 빌드 파일 제외)`);
console.log('='.repeat(78) + '\n');
