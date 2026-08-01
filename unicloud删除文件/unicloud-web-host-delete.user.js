// ==UserScript==
// @name         uniCloud 网页托管批量删除
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  在 uniCloud 网页托管页面添加悬浮面板，一键删除所有文件
// @author       fjh
// @match        https://unicloud.dcloud.net.cn/pages/web-host/web-host*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ─── 工具函数 ───────────────────────────────────────────────

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /**
   * 点击一个元素：优先点 uni-button 内部的原生 <button>，兜底直接 .click()
   */
  function clickElement(el) {
    const inner = el.shadowRoot
      ? el.shadowRoot.querySelector('button')
      : el.querySelector('button');
    if (inner) {
      inner.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    } else {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  }

  /**
   * 获取表格中所有行的"删除"按钮（排除表头行）
   * 每次调用都重新查询 DOM，保证列表刷新后拿到最新状态
   */
  function getDeleteButtons() {
    // 所有行中 td.uni-table-button 里的 uni-button / button
    const cells = document.querySelectorAll(
      '#pane-0 table td.uni-table-button'
    );
    const result = [];
    cells.forEach(cell => {
      // 找含"删除"文字的按钮
      const candidates = cell.querySelectorAll('uni-button, button');
      candidates.forEach(btn => {
        if (btn.textContent.trim() === '删除') {
          result.push(btn);
        }
      });
    });
    return result;
  }

  /**
   * 等待并点击弹窗里的"确定/确认/OK"按钮
   * uniCloud 控制台弹窗是普通 DOM，不在 shadow root 里
   */
  async function confirmDialog(timeout = 3000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      // 优先用截图确认的精确选择器：el-dialog footer 里的 danger 按钮（"确定删除"）
      // 路径：#pane-0 > uni-view > div:nth-child(2) > div > div > footer > span > button.el-button.el-button--danger
      const precise = document.querySelector(
        '#pane-0 button.el-button.el-button--danger'
      );
      if (precise && isVisible(precise)) {
        precise.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        return true;
      }

      // 兜底：找任何可见的 danger 按钮，文字含"确定"
      const dangerBtns = document.querySelectorAll('button.el-button--danger');
      for (const btn of dangerBtns) {
        if (btn.textContent.includes('确定') && isVisible(btn)) {
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          return true;
        }
      }

      await sleep(150);
    }
    return false;
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 &&
      getComputedStyle(el).display !== 'none' &&
      getComputedStyle(el).visibility !== 'hidden';
  }

  // ─── 面板 UI ────────────────────────────────────────────────

  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'tm-batch-delete-panel';
    panel.style.cssText = `
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 99999;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px 18px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      min-width: 210px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      user-select: none;
    `;
    panel.innerHTML = `
      <div style="font-size:14px;font-weight:600;margin-bottom:10px;color:#222;display:flex;align-items:center;gap:6px;">
        🗑️ 批量删除工具
      </div>
      <div id="tm-status" style="
        font-size:12px;color:#666;margin-bottom:12px;
        min-height:16px;word-break:break-all;line-height:1.5;
      ">就绪</div>
      <button id="tm-delete-btn" style="
        display:block;width:100%;padding:7px 0;
        background:#ff4d4f;color:#fff;border:none;border-radius:5px;
        cursor:pointer;font-size:13px;font-weight:500;
        transition:opacity .2s;
      ">删除所有文件</button>
      <button id="tm-stop-btn" style="
        display:block;width:100%;padding:7px 0;margin-top:8px;
        background:#f0f0f0;color:#555;border:none;border-radius:5px;
        cursor:pointer;font-size:13px;
      " disabled>停止</button>
    `;
    document.body.appendChild(panel);
    return panel;
  }

  // ─── 删除逻辑 ───────────────────────────────────────────────

  let running = false;
  let stopFlag = false;

  function setStatus(msg) {
    const el = document.getElementById('tm-status');
    if (el) el.textContent = msg;
    console.log('[uniCloud删除]', msg);
  }

  async function deleteAll() {
    if (running) return;
    running = true;
    stopFlag = false;

    const deleteBtn = document.getElementById('tm-delete-btn');
    const stopBtn = document.getElementById('tm-stop-btn');
    if (deleteBtn) deleteBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;

    let count = 0;
    try {
      while (!stopFlag) {
        const buttons = getDeleteButtons();
        if (buttons.length === 0) {
          setStatus(`✅ 完成！共删除 ${count} 个文件`);
          break;
        }

        setStatus(`剩余 ${buttons.length} 个，正在删除第 ${count + 1} 个…`);

        // 每次点第一个（删完后列表自动刷新，始终取新的第一个）
        clickElement(buttons[0]);
        await sleep(600);

        // 处理确认弹窗
        const confirmed = await confirmDialog(2500);
        if (confirmed) {
          count++;
        } else {
          // 弹窗没有出现或没找到确认按钮，暂停并报错
          setStatus(`⚠️ 第 ${count + 1} 个文件未找到确认弹窗，已停止`);
          break;
        }

        // 等待列表刷新
        await sleep(1200);
      }

      if (stopFlag) {
        setStatus(`🛑 已手动停止，共删除 ${count} 个文件`);
      }
    } catch (e) {
      setStatus('❌ 出错：' + e.message);
      console.error('[uniCloud删除] 异常', e);
    } finally {
      running = false;
      if (deleteBtn) deleteBtn.disabled = false;
      if (stopBtn) stopBtn.disabled = true;
    }
  }

  // ─── 初始化 ─────────────────────────────────────────────────

  async function init() {
    // 等 uni-app 页面渲染完
    await sleep(1800);

    createPanel();

    document.getElementById('tm-delete-btn').addEventListener('click', () => {
      if (!confirm('确定要删除当前服务空间下的 所有 文件吗？\n\n此操作不可逆！')) return;
      deleteAll();
    });

    document.getElementById('tm-stop-btn').addEventListener('click', () => {
      stopFlag = true;
      setStatus('正在停止，等待当前操作结束…');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
