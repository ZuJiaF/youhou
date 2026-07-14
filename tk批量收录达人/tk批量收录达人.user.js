// ==UserScript==
// @name         TK批量收录达人
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  TikTok Shop 批量收录达人
// @author       fjh
// @match        https://affiliate.tiktokshopglobalselling.com/connection/creator*
// @match        https://affiliate.tiktok.com/connection/creator*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // ===== 样式 =====
  const style = document.createElement('style');
  style.textContent = `
    #tk-batch-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 360px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      overflow: hidden;
    }
    #tk-batch-panel .panel-header {
      background: #fe2c55;
      color: #fff;
      padding: 12px 16px;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
    }
    #tk-batch-panel .panel-header .toggle-btn {
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
    }
    #tk-batch-panel .panel-body {
      padding: 16px;
    }
    #tk-batch-panel .panel-body.collapsed {
      display: none;
    }
    #tk-batch-panel textarea {
      width: 100%;
      height: 180px;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px;
      font-size: 13px;
      resize: vertical;
      box-sizing: border-box;
      line-height: 1.5;
      outline: none;
      transition: border-color 0.2s;
    }
    #tk-batch-panel textarea:focus {
      border-color: #fe2c55;
    }
    #tk-batch-panel .panel-hint {
      color: #999;
      font-size: 12px;
      margin: 8px 0;
    }
    #tk-batch-panel .panel-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
      font-size: 12px;
      color: #666;
    }
    #tk-batch-panel .btn-start {
      background: #fe2c55;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    #tk-batch-panel .btn-start:hover {
      background: #e02549;
    }
    #tk-batch-panel .btn-start:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    #tk-batch-panel .btn-export {
      background: #16a34a;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 16px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      margin-left: 8px;
    }
    #tk-batch-panel .btn-export:hover {
      background: #15803d;
    }
    #tk-batch-panel .btn-export:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    #tk-batch-panel .log-area {
      margin-top: 12px;
      max-height: 120px;
      overflow-y: auto;
      background: #f8f8f8;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      display: none;
    }
    #tk-batch-panel .log-area.visible {
      display: block;
    }
    #tk-batch-panel .log-item.success { color: #16a34a; }
    #tk-batch-panel .log-item.error { color: #dc2626; }
    #tk-batch-panel .log-item.info { color: #2563eb; }
  `;
  document.head.appendChild(style);

  // ===== 面板 HTML =====
  const panel = document.createElement('div');
  panel.id = 'tk-batch-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <span>TK批量收录达人</span>
      <span class="toggle-btn">−</span>
    </div>
    <div class="panel-body">
      <textarea id="tk-creator-input" placeholder="请输入达人ID，每行一个&#10;&#10;示例：&#10;creator_id_1&#10;creator_id_2&#10;creator_id_3"></textarea>
      <div class="panel-hint">每行一个达人ID，支持粘贴批量数据</div>
      <div class="panel-stats">
        <span id="tk-id-count">已输入: 0 个</span>
        <div>
          <button class="btn-start" id="tk-btn-start">开始收录</button>
          <button class="btn-export" id="tk-btn-export" disabled>导出Excel</button>
        </div>
      </div>
      <div class="log-area" id="tk-log-area"></div>
    </div>
  `;
  document.body.appendChild(panel);

  // ===== 折叠/展开 =====
  const toggleBtn = panel.querySelector('.toggle-btn');
  const panelBody = panel.querySelector('.panel-body');
  toggleBtn.addEventListener('click', () => {
    panelBody.classList.toggle('collapsed');
    toggleBtn.textContent = panelBody.classList.contains('collapsed') ? '+' : '−';
  });

  // ===== 拖拽 =====
  const header = panel.querySelector('.panel-header');
  let isDragging = false, offsetX, offsetY;
  header.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('toggle-btn')) return;
    isDragging = true;
    offsetX = e.clientX - panel.offsetLeft;
    offsetY = e.clientY - panel.offsetTop;
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (e.clientX - offsetX) + 'px';
    panel.style.top = (e.clientY - offsetY) + 'px';
    panel.style.right = 'auto';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  // ===== 输入计数 =====
  const textarea = document.getElementById('tk-creator-input');
  const countEl = document.getElementById('tk-id-count');

  function getCreatorIds() {
    return textarea.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  textarea.addEventListener('input', () => {
    const ids = getCreatorIds();
    countEl.textContent = `已输入: ${ids.length} 个`;
  });

  // ===== 日志 =====
  const logArea = document.getElementById('tk-log-area');
  function addLog(msg, type = 'info') {
    logArea.classList.add('visible');
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    item.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logArea.appendChild(item);
    logArea.scrollTop = logArea.scrollHeight;
  }

  // ===== 工具函数 =====
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  // 模拟 React 输入（绕过虚拟 DOM）
  function setReactInputValue(input, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    nativeInputValueSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 查找搜索输入框
  function findSearchInput() {
    return document.querySelector(
      '[id^="garfish_app_for_connection"] div.mb-16.rounded-8 .core-input-search input'
    ) || document.querySelector(
      '[id^="garfish_app_for_connection"] .pulse-input-search input'
    );
  }

  // 触发搜索（用 Enter 键）
  function triggerSearch(input) {
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
    });
    input.dispatchEvent(enterEvent);
  }

  // 从搜索结果中采集数据（匹配指定 ID）
  function collectResultData(targetId) {
    const table = document.querySelector('#creator-list-content .core-table-body tbody');
    if (!table) return null;

    const rows = table.querySelectorAll('tr');
    for (const row of rows) {
      const td = row.querySelector('td:nth-child(2)');
      if (!td) continue;

      // 达人 handle
      const handleEl = td.querySelector('span.text-body-s-regular.text-neutral-text4.text-overflow-single');
      const handle = handleEl ? handleEl.textContent.trim() : '';

      // 匹配
      const normalizedHandle = handle.replace(/^@/, '').toLowerCase();
      const normalizedTarget = targetId.replace(/^@/, '').toLowerCase();

      if (normalizedHandle && (normalizedHandle === normalizedTarget
        || normalizedHandle.includes(normalizedTarget)
        || normalizedTarget.includes(normalizedHandle))) {

        // 类目信息（mt-4 区域）
        const categoryEl = td.querySelector('span.flex.items-center.mt-4 span span span');
        // 粉丝数（mt-2 区域，格式如 "451, 女性 65%, 25-34"）
        const followersEl = td.querySelector('span.flex.items-center.mt-2 > span > span');
        const followersRaw = followersEl ? followersEl.textContent.trim() : '';
        // 拆分为：粉丝数、主要群体占比、年龄段
        const parts = followersRaw.split(/[,，]\s*/);
        const followers = parts[0] || '';
        const audienceGender = parts[1] || '';
        const ageRange = parts[2] || '';

        // 其他列数据（粉丝群体占比、年龄段等）
        const tds = row.querySelectorAll('td');
        const extraCols = [];
        for (let i = 2; i < tds.length; i++) {
          const text = tds[i] ? tds[i].textContent.trim() : '';
          extraCols.push(text);
        }

        return {
          handle: handle,
          followers: followers,
          audienceGender: audienceGender,
          ageRange: ageRange,
          category: categoryEl ? categoryEl.textContent.trim() : '',
          extraCols: extraCols
        };
      }
    }
    return null;
  }

  // 等待搜索结果加载（轮询，最多等 10 秒）
  async function waitForResult(targetId, maxWait = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWait) {
      const result = collectResultData(targetId);
      if (result) return result;
      await sleep(500);
    }
    return null;
  }
  const collectedData = [];

  // ===== 导出 Excel =====
  function exportToExcel() {
    if (collectedData.length === 0) {
      alert('暂无数据可导出');
      return;
    }
    // 用 HTML table 格式生成 xls
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>';
    html += '<tr><th>输入ID</th><th>匹配Handle</th><th>粉丝数</th><th>主要群体</th><th>年龄段</th><th>类目</th><th>其他信息</th><th>状态</th></tr>';
    for (const d of collectedData) {
      const extra = d.extraCols ? d.extraCols.join('</td><td>') : '';
      html += `<tr><td>${d.inputId}</td><td>${d.handle}</td><td>${d.followers}</td><td>${d.audienceGender}</td><td>${d.ageRange}</td><td>${d.category}</td><td>${extra}</td><td>${d.status}</td></tr>`;
    }
    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TK达人收录_${new Date().toLocaleDateString().replace(/\//g, '-')}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== 开始收录 =====
  const btnStart = document.getElementById('tk-btn-start');
  const btnExport = document.getElementById('tk-btn-export');

  btnExport.addEventListener('click', exportToExcel);

  btnStart.addEventListener('click', async () => {
    console.log('[debug][2026-07-11][btnStart.click] 按钮被点击');
    const ids = getCreatorIds();
    console.log('[debug][2026-07-11][btnStart.click] 解析到ID数量:', ids.length, 'IDs:', ids);
    if (ids.length === 0) {
      alert('请输入至少一个达人ID');
      return;
    }

    const input = findSearchInput();
    console.log('[debug][2026-07-11][btnStart.click] 搜索输入框:', input);
    if (!input) {
      alert('未找到页面搜索框，请确认页面已加载完成');
      return;
    }

    btnStart.disabled = true;
    btnStart.textContent = '收录中...';
    collectedData.length = 0;
    addLog(`开始收录 ${ids.length} 个达人`, 'info');

    for (let i = 0; i < ids.length; i++) {
      const creatorId = ids[i];
      addLog(`(${i + 1}/${ids.length}) 搜索: ${creatorId}`, 'info');

      // 1. 填入达人ID
      input.focus();
      setReactInputValue(input, creatorId);
      await sleep(300);

      // 2. 触发搜索
      triggerSearch(input);

      // 3. 等待搜索结果加载并采集（轮询最多 10 秒）
      await sleep(1000); // 先等 1 秒让旧结果清除
      const result = await waitForResult(creatorId);
      if (result && result.handle) {
        collectedData.push({
          inputId: creatorId,
          handle: result.handle,
          followers: result.followers,
          audienceGender: result.audienceGender,
          ageRange: result.ageRange,
          category: result.category,
          extraCols: result.extraCols,
          status: '已采集'
        });
        addLog(`${creatorId} → ${result.handle} | ${result.followers} | ${result.audienceGender} | ${result.ageRange}`, 'success');
      } else {
        collectedData.push({
          inputId: creatorId,
          handle: '',
          followers: '',
          audienceGender: '',
          ageRange: '',
          category: '',
          extraCols: [],
          status: '未找到'
        });
        addLog(`${creatorId} - 未找到结果`, 'error');
      }

      // 间隔避免频率限制
      if (i < ids.length - 1) await sleep(1500);
    }

    addLog(`全部完成，共 ${ids.length} 个，成功 ${collectedData.filter(d => d.status === '已采集').length} 个`, 'success');
    btnStart.disabled = false;
    btnStart.textContent = '开始收录';
    btnExport.disabled = false;
  });
})();
