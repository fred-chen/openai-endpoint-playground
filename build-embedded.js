#!/usr/bin/env node
// build-embedded.js —— 把常用 tokenizer 内嵌进 openai-chat.html（保持单文件）
//
// 用法：node build-embedded.js
// 前置：tokenizers/ 目录下已有 4 个 .json.gz（首次运行会自动从 HuggingFace 下载）
//
// 原理：把每个 tokenizer.json gzip + base64 后，以
//   window.BENCH_EMBEDDED_TOKENIZERS = { "模型ID": "gzip+base64", ... }
// 的形式注入 openai-chat.html 的 <head>。页面加载命中内嵌表时零下载直接解压使用；
// 未命中的 ID 仍走在线拉取（transformers.js），失败再回退 chars/token 校准。

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'openai-chat.html');
const TDIR = path.join(ROOT, 'tokenizers');

const TOKENIZERS = [
  'zai-org/GLM-5.3-Flash',
  'Qwen/Qwen3.8-27B',
  'deepseek-ai/DeepSeek-V4-Flash-0731',
  'Qwen/Qwen3.8-Flash-Next',
];

const MARK_OPEN = '/*__BENCH_EMBEDDED_TOKENIZERS__*/';
const MARK_CLOSE = '/*__/BENCH_EMBEDDED_TOKENIZERS__*/';

function download(url, dest){
  return new Promise((resolve, reject) => {
    const get = (u, redirects) => {
      https.get(u, res => {
        if(res.statusCode >= 300 && res.statusCode < 400 && res.headers.location){
          res.resume();
          return get(res.headers.location, redirects + 1);
        }
        if(res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' for ' + u));
        const ws = fs.createWriteStream(dest);
        res.pipe(ws);
        ws.on('finish', () => ws.close(resolve));
        ws.on('error', reject);
      }).on('error', reject);
    };
    get(url, 0);
  });
}

async function ensureGz(id){
  const fp = path.join(TDIR, id.replace(/\//g, '_') + '.json.gz');
  if(fs.existsSync(fp) && fs.statSync(fp).size > 1000) return fp;
  console.log('下载 ' + id + ' 的 tokenizer.json …');
  if(!fs.existsSync(TDIR)) fs.mkdirSync(TDIR);
  const tmp = fp + '.tmp';
  await download('https://huggingface.co/' + id + '/resolve/main/tokenizer.json', tmp);
  const raw = fs.readFileSync(tmp);
  fs.writeFileSync(fp, zlib.gzipSync(raw, { level: 9 }));
  fs.unlinkSync(tmp);
  console.log('  → ' + fp + '（gzip ' + Math.round(fs.statSync(fp).size / 1024) + ' KB）');
  return fp;
}

async function main(){
  if(!fs.existsSync(SRC)){ console.error('缺少 ' + SRC); process.exit(1); }
  let html = fs.readFileSync(SRC, 'utf8');

  const entries = [];
  for(const id of TOKENIZERS){
    const fp = await ensureGz(id);
    const gz = fs.readFileSync(fp);
    entries.push([id, gz.toString('base64')]);
  }
  const payload = JSON.stringify(Object.fromEntries(entries));

  const inject = MARK_OPEN + '\n' +
    'window.BENCH_EMBEDDED_TOKENIZERS = ' + payload + ';\n' +
    MARK_CLOSE;

  if(html.includes(MARK_OPEN)){
    const re = new RegExp(MARK_OPEN.replace(/[/&*]/g, m => '\\' + m) + '[\\s\\S]*?' + MARK_CLOSE.replace(/[/&*]/g, m => '\\' + m));
    html = html.replace(re, inject);
  }else{
    html = html.replace('</head>', inject + '\n</head>');
  }

  fs.writeFileSync(SRC, html);
  console.log('已内嵌进 ' + SRC + '（总大小 ' + (fs.statSync(SRC).size / 1024 / 1024).toFixed(1) + ' MB）');
  console.log('内嵌 tokenizer：' + TOKENIZERS.join(', '));
}

main().catch(e => { console.error(e); process.exit(1); });