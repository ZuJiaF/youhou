/**
 * 油猴脚本加密工具
 * 用法: node encrypt.js <脚本文件路径>
 * 输出: 在同级目录生成 "正式版-<原文件名>"
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const inputPath = process.argv[2];

if (!inputPath) {
  console.error('用法: node encrypt.js <脚本文件路径>');
  process.exit(1);
}

const resolvedPath = path.resolve(inputPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`文件不存在: ${resolvedPath}`);
  process.exit(1);
}

const code = fs.readFileSync(resolvedPath, 'utf-8');

// 提取 UserScript 头部（必须保留，否则油猴无法识别）
const headerMatch = code.match(/\/\/ ==UserScript==[\s\S]*?\/\/ ==\/UserScript==/);
if (!headerMatch) {
  console.error('未找到 UserScript 头部，请确认是油猴脚本文件');
  process.exit(1);
}

const header = headerMatch[0];
const headerEnd = code.indexOf(header) + header.length;
const body = code.slice(headerEnd);

// 混淆配置
const obfuscationResult = JavaScriptObfuscator.obfuscate(body, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.7,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.3,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  splitStrings: true,
  splitStringsChunkLength: 10,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  renameGlobals: false,
  selfDefending: true,
  debugProtection: false,
  log: false,
});

const outputCode = header + '\n\n' + obfuscationResult.getObfuscatedCode();

// 输出文件：同级目录，加前缀 "正式版-"
const dir = path.dirname(resolvedPath);
const basename = path.basename(resolvedPath);
const outputPath = path.join(dir, `正式版-${basename}`);

fs.writeFileSync(outputPath, outputCode, 'utf-8');
console.log(`加密完成: ${outputPath}`);
