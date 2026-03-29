#!/usr/bin/env node

/**
 * 云边小铺 - Git 自动提交脚本
 * 用法: node scripts/git-commit.js [提交消息]
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const COMMIT_MSG = process.argv.slice(2).join(' ') || `更新 ${new Date().toLocaleString('zh-CN')}`;

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (color, prefix, message) => {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
};

const run = (cmd, options = {}) => {
  try {
    return execSync(cmd, { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      ...options 
    }).trim();
  } catch (error) {
    return null;
  }
};

const question = (text) => new Promise((resolve) => {
  rl.question(text, resolve);
});

async function main() {
  console.log('\n======================================');
  console.log('    云边小铺 - Git 自动提交脚本');
  console.log('======================================\n');

  // 检查 git
  if (!run('git --version')) {
    log(colors.red, '✗ 错误:', 'Git 未安装');
    process.exit(1);
  }

  // 检查仓库
  if (!run('git rev-parse --git-dir')) {
    log(colors.red, '✗ 错误:', '当前目录不是 Git 仓库');
    process.exit(1);
  }

  // 显示状态
  log(colors.yellow, '📊', '当前状态:');
  console.log(run('git status --short') || '无更改');
  console.log();

  // 检查更改
  const hasChanges = run('git diff --stat') && run('git diff --stat') !== '';
  if (!hasChanges) {
    log(colors.yellow, '⚠️', '没有检测到更改，无需提交');
    rl.close();
    return;
  }

  // 添加文件
  log(colors.green, '📦', '添加更改...');
  execSync('git add -A', { encoding: 'utf-8' });

  // 显示暂存文件
  const staged = run('git diff --cached --name-only');
  if (staged) {
    console.log();
    log(colors.yellow, '📁', '暂存的文件:');
    staged.split('\n').forEach(f => console.log(`   • ${f}`));
    console.log();
  }

  // 提交
  log(colors.green, '✓', '提交更改...');
  try {
    execSync(`git commit -m "${COMMIT_MSG}"`, { encoding: 'utf-8' });
  } catch (e) {
    log(colors.red, '✗', '提交失败');
    process.exit(1);
  }

  // 显示结果
  console.log();
  log(colors.green, '✅', '提交成功!');
  log(colors.yellow, '📋', '最近提交:');
  console.log(`   ${run('git log -1 --oneline')}`);

  console.log();
  const answer = await question('是否推送到远程仓库? (y/n): ');
  
  if (answer.toLowerCase() === 'y') {
    console.log();
    log(colors.green, '🚀', '推送中...');
    try {
      execSync('git push', { encoding: 'utf-8' });
      log(colors.green, '✅', '推送成功!');
    } catch (e) {
      log(colors.red, '✗', '推送失败，请检查网络或权限');
    }
  }

  console.log('\n======================================\n');
  rl.close();
}

main();
