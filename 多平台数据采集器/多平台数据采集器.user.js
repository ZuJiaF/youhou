// ==UserScript==
// @name         多平台数据采集器
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @description  采集TikTok和Shopee商品页面的销量、评价数、评分等数据，并发送到ERP系统
// @author       聚树ERP
// @match        https://www.tiktok.com/shop/*/pdp/*
// @match        https://shopee.co.th/*
// @match        https://shopee.com.my/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      localhost
// @connect      127.0.0.1
// @connect      env-00jy671a213o.dev-hz.cloudbasefunction.cn
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_VERSION = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '2.2';

    // 平台检测
    const PLATFORM = window.location.href.includes('tiktok.com') ? 'tk' : 'sp';
    console.log('[数据采集器] 当前平台:', PLATFORM);

    // ERP 系统地址
    const ERP_URL = 'http://localhost:5173';
    const API_BASE = 'https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/competitor';

    // 添加样式
    GM_addStyle(`
        #tiktok-not-entered-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9998;
            width: 320px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        #tiktok-not-entered-header {
            padding: 12px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        }
        #tiktok-header-main {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
        }
        #tiktok-version {
            font-size: 11px;
            line-height: 1;
            opacity: 0.8;
            font-weight: normal;
        }
        #tiktok-header-title {
            font-weight: bold;
            font-size: 14px;
            line-height: 1.2;
        }
        #tiktok-refresh-btn {
            cursor: pointer;
            margin-left: 8px;
            font-size: 16px;
            opacity: 0.8;
            transition: all 0.3s;
        }
        #tiktok-refresh-btn:hover {
            opacity: 1;
            transform: rotate(180deg);
        }
        #tiktok-refresh-btn.loading {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        #tiktok-not-entered-toggle {
            font-size: 18px;
            transition: transform 0.3s;
        }
        #tiktok-not-entered-toggle.collapsed {
            transform: rotate(-90deg);
        }
        #tiktok-not-entered-content {
            max-height: 150px;
            overflow-y: auto;
            transition: max-height 0.3s ease;
        }
        #tiktok-not-entered-content.collapsed {
            max-height: 0;
        }
        #tiktok-collector-btn {
            width: 100%;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-top: 1px solid rgba(255,255,255,0.2);
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        #tiktok-collector-btn:hover {
            background: linear-gradient(135deg, #7c8ef5 0%, #8a5bb8 100%);
        }
        #tiktok-collector-btn.loading {
            background: #999;
            cursor: not-allowed;
        }
        #tiktok-collector-status {
            padding: 10px 16px;
            background: white;
            border-radius: 6px;
            margin: 10px;
            font-size: 13px;
            display: none;
        }
        #tiktok-collector-status.success {
            display: block;
            color: #52c41a;
            border-left: 3px solid #52c41a;
        }
        #tiktok-collector-status.error {
            display: block;
            color: #ff4d4f;
            border-left: 3px solid #ff4d4f;
        }
        .tiktok-link-item {
            padding: 10px 16px;
            border-bottom: 1px solid #f0f0f0;
            cursor: pointer;
            transition: background 0.2s;
        }
        .tiktok-link-item:hover {
            background: #f5f5f5;
        }
        .tiktok-link-item.current {
            background: #e6f7ff;
            border-left: 3px solid #1890ff;
        }
        .tiktok-link-name {
            font-size: 13px;
            color: #333;
            margin-bottom: 4px;
        }
        .tiktok-link-info {
            font-size: 11px;
            color: #999;
        }
        .tiktok-empty {
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 13px;
        }
        .tiktok-loading {
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 13px;
        }
        #tiktok-preview-section {
            border-top: 1px solid #f0f0f0;
            padding: 10px 14px 6px;
            background: #fafafa;
        }
        #tiktok-preview-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #888;
            margin-bottom: 8px;
        }
        #tiktok-preview-refresh {
            cursor: pointer;
            font-size: 13px;
            color: #667eea;
            opacity: 0.85;
            transition: opacity 0.2s, transform 0.3s;
            user-select: none;
        }
        #tiktok-preview-refresh:hover {
            opacity: 1;
        }
        #tiktok-preview-refresh.loading {
            animation: spin 1s linear infinite;
            pointer-events: none;
        }
        #tiktok-preview-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 6px;
        }
        .preview-item {
            background: white;
            border: 1px solid #e8e8e8;
            border-radius: 6px;
            padding: 6px 8px;
        }
        .preview-item.full-width {
            grid-column: 1 / -1;
        }
        .preview-item-label {
            font-size: 10px;
            color: #aaa;
            margin-bottom: 2px;
        }
        .preview-item-value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
        }
        .preview-item-value.not-found {
            color: #ccc;
            font-size: 12px;
            font-weight: normal;
        }
        #tiktok-preview-hint {
            font-size: 11px;
            color: #bbb;
            text-align: center;
            padding: 2px 0 4px;
        }
    `);

    let notEnteredList = [];
    let isPanelCollapsed = false;
    let isDragging = false;
    let hasDragged = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // 创建未录入链接面板（集成按钮）
    function createNotEnteredPanel() {
        const panel = document.createElement('div');
        panel.id = 'tiktok-not-entered-panel';
        panel.innerHTML = `
            <div id="tiktok-not-entered-header">
                <div id="tiktok-header-main">
                    <span id="tiktok-version">v${SCRIPT_VERSION}</span>
                    <span id="tiktok-header-title">📋 今日待采集 (<span id="tiktok-count">0</span>)</span>
                </div>
                <div>
                    <span id="tiktok-refresh-btn" title="刷新列表">🔄</span>
                    <span id="tiktok-not-entered-toggle">▼</span>
                </div>
            </div>
            <div id="tiktok-not-entered-content">
                <div class="tiktok-loading">正在加载...</div>
            </div>
            <div id="tiktok-collector-status"></div>
            <div id="tiktok-preview-section">
                <div id="tiktok-preview-title">
                    <span>📋 当前页面采集预览</span>
                    <span id="tiktok-preview-refresh" title="重新采集">🔄 刷新</span>
                </div>
                <div id="tiktok-preview-grid">
                    <div class="preview-item preview-item--loading" style="grid-column:1/-1;text-align:center;color:#bbb;font-size:12px;padding:10px;">正在读取...</div>
                </div>
                <div id="tiktok-preview-hint"></div>
            </div>
            <button id="tiktok-collector-btn">📊 发送到 ERP</button>
        `;
        document.body.appendChild(panel);

        const header = document.getElementById('tiktok-not-entered-header');

        // 拖动功能
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            // 点击刷新或折叠按钮时不触发拖动
            if (e.target.id === 'tiktok-refresh-btn' || e.target.id === 'tiktok-not-entered-toggle') {
                return;
            }
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            hasDragged = false;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            isDragging = true;
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                setTranslate(currentX, currentY, panel);

                // 判断是否真的拖动了（移动超过5px）
                const distance = Math.sqrt(
                    Math.pow(e.clientX - dragStartX, 2) +
                    Math.pow(e.clientY - dragStartY, 2)
                );
                if (distance > 5) {
                    hasDragged = true;
                }
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
        }

        function setTranslate(xPos, yPos, el) {
            el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
        }

        // 点击标题折叠/展开（只在未拖动时触发）
        header.onclick = function(e) {
            if (e.target.id === 'tiktok-refresh-btn') return;
            if (e.target.id === 'tiktok-not-entered-toggle') return;
            if (!hasDragged) {
                togglePanel();
            }
        };

        // 点击折叠/展开按钮
        document.getElementById('tiktok-not-entered-toggle').onclick = function(e) {
            e.stopPropagation();
            togglePanel();
        };

        // 点击刷新按钮
        document.getElementById('tiktok-refresh-btn').onclick = function(e) {
            e.stopPropagation();
            refreshPendingList();
        };

        // 点击发送按钮
        document.getElementById('tiktok-collector-btn').onclick = collectAndSend;

        // 刷新预览按钮
        document.getElementById('tiktok-preview-refresh').onclick = function(e) {
            e.stopPropagation();
            refreshPreview();
        };

        // 加载未录入链接列表
        loadNotEnteredList();

        // 初始自动刷新预览（等页面渲染稳定后再采集）
        setTimeout(refreshPreview, 1500);
    }

    // 折叠/展开面板
    function togglePanel() {
        isPanelCollapsed = !isPanelCollapsed;
        const content = document.getElementById('tiktok-not-entered-content');
        const toggle = document.getElementById('tiktok-not-entered-toggle');

        if (isPanelCollapsed) {
            content.classList.add('collapsed');
            toggle.classList.add('collapsed');
        } else {
            content.classList.remove('collapsed');
            toggle.classList.remove('collapsed');
        }
    }

    // 刷新待采集列表
    function refreshPendingList() {
        const btn = document.getElementById('tiktok-refresh-btn');
        if (!btn) return;

        btn.classList.add('loading');
        console.log('[TikTok采集器] 手动刷新待采集列表...');

        loadNotEnteredList();

        // 1秒后移除加载状态
        setTimeout(() => {
            btn.classList.remove('loading');
        }, 1000);
    }

    // 加载未录入链接列表
    function loadNotEnteredList() {
        console.log(`[${PLATFORM}采集器] ========== 开始加载未录入链接列表 ==========`);
        console.log(`[${PLATFORM}采集器] 当前平台:`, PLATFORM);
        console.log(`[${PLATFORM}采集器] 当前URL:`, window.location.href);

        GM_xmlhttpRequest({
            method: 'POST',
            url: `${API_BASE}/getTodayNotEntered`,
            headers: {
                'Content-Type': 'application/json',
                'token': 'sk-e2ac92a27e75a54299313839fe6a78a7d9f82eb3d0f26f68'
            },
            data: JSON.stringify({}),
            onload: function(response) {
                console.log(`[${PLATFORM}采集器] API响应状态:`, response.status);
                console.log(`[${PLATFORM}采集器] API响应内容:`, response.responseText);
                try {
                    const result = JSON.parse(response.responseText);
                    console.log(`[${PLATFORM}采集器] 解析后的结果:`, result);

                    if (result.code === 200) {
                        // 过滤出当前平台的链接
                        const allLinks = result.data || [];
                        console.log(`[${PLATFORM}采集器] 所有链接数量:`, allLinks.length);
                        console.log(`[${PLATFORM}采集器] 所有链接详情:`, allLinks);

                        // 打印每个链接的平台信息
                        allLinks.forEach((link, index) => {
                            console.log(`[${PLATFORM}采集器] 链接${index + 1}:`, {
                                name: link.name,
                                platform: link.platform,
                                product_id: link.product_id,
                                shop_id: link.shop_id,
                                country: link.country
                            });
                        });

                        notEnteredList = allLinks.filter(link => link.platform === PLATFORM);
                        console.log(`[${PLATFORM}采集器] 过滤后的链接数量:`, notEnteredList.length);
                        console.log(`[${PLATFORM}采集器] 过滤后的链接详情:`, notEnteredList);

                        renderNotEnteredList();
                    } else {
                        console.error(`[${PLATFORM}采集器] API返回错误:`, result.msg);
                        showError('加载失败: ' + result.msg);
                    }
                } catch (e) {
                    console.error(`[${PLATFORM}采集器] 解析响应失败:`, e);
                    console.error(`[${PLATFORM}采集器] 原始响应:`, response.responseText);
                    showError('解析数据失败');
                }
            },
            onerror: function(error) {
                console.error(`[${PLATFORM}采集器] 请求失败:`, error);
                showError('网络请求失败');
            }
        });
    }

    // 渲染未录入链接列表
    function renderNotEnteredList() {
        console.log(`[${PLATFORM}采集器] ========== 开始渲染列表 ==========`);
        const content = document.getElementById('tiktok-not-entered-content');
        const countEl = document.getElementById('tiktok-count');
        const currentInfo = getProductInfo();

        console.log(`[${PLATFORM}采集器] 当前商品信息:`, currentInfo);
        console.log(`[${PLATFORM}采集器] 待渲染列表数量:`, notEnteredList.length);

        countEl.textContent = notEnteredList.length;

        if (notEnteredList.length === 0) {
            console.log(`[${PLATFORM}采集器] 列表为空，显示空状态`);
            content.innerHTML = '<div class="tiktok-empty">✅ 今日所有链接已录入</div>';
            return;
        }

        let html = '';
        notEnteredList.forEach((link, index) => {
            let isCurrent = false;
            let url = '';

            if (PLATFORM === 'tk') {
                // TikTok链接
                isCurrent = link.product_id === currentInfo.productId;
                url = `https://www.tiktok.com/shop/${link.country?.toLowerCase() || 'th'}/pdp/${link.product_id}?region=${link.country || 'TH'}`;
                console.log(`[${PLATFORM}采集器] TikTok链接${index + 1}:`, {
                    name: link.name,
                    product_id: link.product_id,
                    current_product_id: currentInfo.productId,
                    isCurrent,
                    url
                });
            } else {
                // Shopee链接
                isCurrent = link.shop_id === currentInfo.shopId && link.product_id === currentInfo.productId;
                const domainMap = {
                    'TH': 'shopee.co.th',
                    'MY': 'shopee.com.my'
                };
                const domain = domainMap[link.country] || 'shopee.co.th';
                url = `https://${domain}/product/${link.shop_id}/${link.product_id}`;
                console.log(`[${PLATFORM}采集器] Shopee链接${index + 1}:`, {
                    name: link.name,
                    shop_id: link.shop_id,
                    product_id: link.product_id,
                    current_shop_id: currentInfo.shopId,
                    current_product_id: currentInfo.productId,
                    isCurrent,
                    url
                });
            }

            const idInfo = PLATFORM === 'tk'
                ? `ID: ${link.product_id || '-'}`
                : `店铺: ${link.shop_id || '-'} | 商品: ${link.product_id || '-'}`;

            html += `
                <div class="tiktok-link-item ${isCurrent ? 'current' : ''}" data-url="${url}">
                    <div class="tiktok-link-name">${link.name}${isCurrent ? ' 👈 当前' : ''}</div>
                    <div class="tiktok-link-info">${idInfo} | ${link.country || '-'}</div>
                </div>
            `;
        });

        console.log(`[${PLATFORM}采集器] 生成的HTML长度:`, html.length);
        content.innerHTML = html;
        console.log(`[${PLATFORM}采集器] 列表渲染完成`);

        // 添加点击事件
        content.querySelectorAll('.tiktok-link-item').forEach(item => {
            item.onclick = function() {
                const url = this.getAttribute('data-url');
                window.location.href = url;
            };
        });
    }

    // 刷新数据预览
    function refreshPreview() {
        const grid = document.getElementById('tiktok-preview-grid');
        const hint = document.getElementById('tiktok-preview-hint');
        const refreshBtn = document.getElementById('tiktok-preview-refresh');
        if (!grid) return;

        refreshBtn && refreshBtn.classList.add('loading');
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#bbb;font-size:12px;padding:10px;">正在读取...</div>';
        if (hint) hint.textContent = '';

        // 稍作延迟，确保动画显示出来
        setTimeout(() => {
            const data = extractData();
            renderPreview(data);
            refreshBtn && refreshBtn.classList.remove('loading');
        }, 300);
    }

    // 渲染预览区
    function renderPreview(data) {
        const grid = document.getElementById('tiktok-preview-grid');
        const hint = document.getElementById('tiktok-preview-hint');
        if (!grid) return;

        // 根据平台决定展示哪些字段
        const isTk = PLATFORM === 'tk';

        const fields = isTk
            ? [
                { label: '销量', value: data.soldCount },
                { label: '评分', value: data.productRating },
                { label: '本地评价数', value: data.reviewCount },
                { label: '全球评价数', value: data.globalReviewCount, full: true },
            ]
            : [
                { label: '销量', value: data.soldCount },
                { label: '评分', value: data.productRating },
                { label: '评价数', value: data.reviewCount },
                { label: '喜欢数', value: data.likes },
                { label: '店铺评价数', value: data.shopReviewCount, full: true },
            ];

        const hasAny = fields.some(f => f.value !== null && f.value !== undefined);

        grid.innerHTML = fields.map(f => {
            const hasVal = f.value !== null && f.value !== undefined;
            return `
                <div class="preview-item${f.full ? ' full-width' : ''}">
                    <div class="preview-item-label">${f.label}</div>
                    <div class="preview-item-value${hasVal ? '' : ' not-found'}">${hasVal ? f.value.toLocaleString() : '未采集到'}</div>
                </div>
            `;
        }).join('');

        if (hint) {
            hint.textContent = hasAny
                ? '⚠️ 请确认数据正确后再发送'
                : '❌ 页面数据未能读取，请确认页面已加载完成';
            hint.style.color = hasAny ? '#faad14' : '#ff4d4f';
        }
    }

    // 显示错误
    function showError(message) {
        const content = document.getElementById('tiktok-not-entered-content');
        content.innerHTML = `<div class="tiktok-empty" style="color:#ff4d4f;">❌ ${message}</div>`;
    }

    // 显示状态消息
    function showStatus(message, type = 'success') {
        const status = document.getElementById('tiktok-collector-status');
        status.textContent = message;
        status.className = type;
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }

    // 从 URL 提取商品信息
    function getProductInfo() {
        const url = window.location.href;

        if (PLATFORM === 'tk') {
            // TikTok: /pdp/{product_id}?region={region}
            const match = url.match(/\/pdp\/(\d+)/);
            const productId = match ? match[1] : null;
            const urlParams = new URLSearchParams(window.location.search);
            const region = urlParams.get('region') || 'TH';
            return { productId, shopId: null, region };
        } else {
            // Shopee: /product/{shop_id}/{product_id}
            const match = url.match(/\/product\/(\d+)\/(\d+)/);
            const shopId = match ? match[1] : null;
            const productId = match ? match[2] : null;
            // 从域名判断国家
            const region = url.includes('shopee.com.my') ? 'MY' : 'TH';
            return { productId, shopId, region };
        }
    }

    // XPath 辅助函数
    function getElementByXPath(xpath) {
        try {
            const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue;
        } catch (e) {
            console.error('[TikTok采集器] XPath 查询失败:', e);
            return null;
        }
    }

    // 提取TikTok页面数据
    function extractTikTokData() {
        console.log('[TikTok采集器] 开始提取数据...');

        let soldCount = null;
        let reviewCount = null;
        let globalReviewCount = null;
        let productRating = null;
        let likes = null;

        try {
            // 评分 - 优先使用 XPath
            const ratingXPath = '//*[@id="root"]/div/div/div/div[2]/div/div[2]/div[2]/div/div[1]/div[4]/div[1]/span[1]';
            const ratingEl = getElementByXPath(ratingXPath);
            if (ratingEl) {
                const text = ratingEl.textContent.trim();
                const rating = parseFloat(text);
                if (!isNaN(rating) && rating <= 5) {
                    productRating = rating;
                    console.log('[TikTok采集器] XPath找到评分:', productRating, '原文:', text);
                }
            }

            // 评分 - 备用方案（class选择器）
            if (productRating === null) {
                const ratingElements = document.querySelectorAll('[class*="rating"], [class*="Rating"], [class*="star"], [data-e2e*="rating"]');
                for (const el of ratingElements) {
                    const text = el.textContent.trim();
                    const match = text.match(/(\d+\.?\d*)\s*(?:\/\s*5)?/);
                    if (match && parseFloat(match[1]) <= 5) {
                        productRating = parseFloat(match[1]);
                        console.log('[TikTok采集器] Class选择器找到评分:', productRating, '原文:', text);
                        break;
                    }
                }
            }

            // 评价数 - 优先使用 XPath
            const reviewXPath = '//*[@id="root"]/div/div/div/div[2]/div/div[2]/div[2]/div/div[1]/div[4]/div[1]/span[2]';
            const reviewEl = getElementByXPath(reviewXPath);
            if (reviewEl) {
                const text = reviewEl.textContent.trim();
                // 移除括号，如 "(1.2K)" -> "1.2K"
                const cleanText = text.replace(/[()]/g, '');
                const count = parseNumber(cleanText);
                if (count !== null) {
                    reviewCount = count;
                    console.log('[TikTok采集器] XPath找到评价数:', reviewCount, '原文:', text);
                }
            }

            // 评价数 - 备用方案（class选择器）
            if (reviewCount === null) {
                const reviewElements = document.querySelectorAll('[class*="review"], [class*="Review"], [data-e2e*="review"]');
                for (const el of reviewElements) {
                    const text = el.textContent.trim();
                    const match = text.match(/([\d.]+[KkMm]?)\s*(?:review|Review)/i) || text.match(/\(([\d.]+[KkMm]?)\)/);
                    if (match) {
                        reviewCount = parseNumber(match[1]);
                        console.log('[TikTok采集器] Class选择器找到评价数:', reviewCount, '原文:', text);
                        break;
                    }
                }
            }

            // 全球评价数 - 使用 XPath
            const globalReviewXPath = '//*[@id="pdp-review-section"]/div[1]/div[1]/div[4]';
            console.log('[TikTok采集器] [全球评价] 开始查找，XPath:', globalReviewXPath);
            const globalReviewEl = getElementByXPath(globalReviewXPath);
            console.log('[TikTok采集器] [全球评价] 元素是否找到:', !!globalReviewEl, globalReviewEl);
            if (globalReviewEl) {
                const text = globalReviewEl.textContent.trim();
                console.log('[TikTok采集器] [全球评价] 原始文本:', JSON.stringify(text));
                // 提取数字，兼容简体"13021 条全球评价"和繁体"310 全球評論"
                const match = text.match(/([\d.]+[KkMm]?)\s*(?:条全球评价|全球評論|Global Reviews?)/i);
                console.log('[TikTok采集器] [全球评价] 正则匹配结果:', match);
                if (match) {
                    globalReviewCount = parseNumber(match[1]);
                    console.log('[TikTok采集器] [全球评价] ✅ 解析成功:', globalReviewCount);
                } else {
                    console.warn('[TikTok采集器] [全球评价] ⚠️ 正则未匹配，实际内容:', text);
                }
            } else {
                // 尝试找 pdp-review-section 父节点，帮助定位真实结构
                const section = document.getElementById('pdp-review-section');
                console.warn('[TikTok采集器] [全球评价] ❌ 元素未找到');
                console.log('[TikTok采集器] [全球评价] pdp-review-section 是否存在:', !!section);
                if (section) {
                    const div1 = section.querySelector('div:first-child');
                    console.log('[TikTok采集器] [全球评价] div[1] 内容:', div1?.innerHTML?.substring(0, 300));
                }
            }

            // 销量 - 优先使用 XPath
            const soldXPath = '//*[@id="root"]/div/div/div/div[2]/div/div[2]/div[2]/div/div[1]/div[4]/div[2]/span';
            const soldEl = getElementByXPath(soldXPath);
            if (soldEl) {
                const text = soldEl.textContent.trim();
                // 提取数字，支持中文"已售"和英文"sold"，如 "已售 213.4K" 或 "1.2K sold"
                const match = text.match(/([\d.]+[KkMm]?)\s*(?:sold|Sold|已售)/i) ||
                             text.match(/(?:sold|Sold|已售)\s*([\d.]+[KkMm]?)/i);
                if (match) {
                    soldCount = parseNumber(match[1]);
                    console.log('[TikTok采集器] XPath找到销量:', soldCount, '原文:', text);
                }
            }

            // 销量 - 备用方案（class选择器）
            if (soldCount === null) {
                const soldElements = document.querySelectorAll('[class*="sold"], [class*="Sold"], [data-e2e*="sold"]');
                for (const el of soldElements) {
                    const text = el.textContent.trim();
                    const match = text.match(/([\d.]+[KkMm]?)\s*(?:sold|Sold|已售)/i) ||
                                 text.match(/(?:sold|Sold|已售)\s*([\d.]+[KkMm]?)/i);
                    if (match) {
                        soldCount = parseNumber(match[1]);
                        console.log('[TikTok采集器] Class选择器找到销量:', soldCount, '原文:', text);
                        break;
                    }
                }
            }
        } catch (e) {
            console.error('[TikTok采集器] DOM提取失败:', e);
        }

        return { soldCount, reviewCount, globalReviewCount, productRating, likes };
    }

    // 提取Shopee页面数据
    function extractShopeeData() {
        console.log('[Shopee采集器] ========== 开始提取数据 ==========');

        let soldCount = null;
        let reviewCount = null;
        let productRating = null;
        let likes = null;
        let shopReviewCount = null;

        try {
            // 喜欢数
            console.log('[Shopee采集器] 尝试提取喜欢数...');
            const likesXPath = '//*[@id="sll2-normal-pdp-main"]/div/div/div/div[2]/section/section[1]/div[2]/div[2]/button/div';
            const likesEl = getElementByXPath(likesXPath);
            console.log('[Shopee采集器] 喜欢数元素:', likesEl);
            if (likesEl) {
                const text = likesEl.textContent.trim();
                console.log('[Shopee采集器] 喜欢数原始文本:', text);
                const count = parseNumber(text);
                console.log('[Shopee采集器] 喜欢数解析结果:', count);
                if (count !== null) {
                    likes = count;
                    console.log('[Shopee采集器] ✅ XPath找到喜欢数:', likes);
                } else {
                    console.warn('[Shopee采集器] ⚠️ 喜欢数解析失败');
                }
            } else {
                console.warn('[Shopee采集器] ⚠️ 未找到喜欢数元素');
            }

            // 评分
            console.log('[Shopee采集器] 尝试提取评分...');
            const ratingXPath = '//*[@id="sll2-normal-pdp-main"]/div/div/div/div[2]/section/section[2]/div/div[2]/button[1]/div[1]';
            const ratingEl = getElementByXPath(ratingXPath);
            console.log('[Shopee采集器] 评分元素:', ratingEl);
            if (ratingEl) {
                const text = ratingEl.textContent.trim();
                console.log('[Shopee采集器] 评分原始文本:', text);
                const rating = parseFloat(text);
                if (!isNaN(rating) && rating <= 5) {
                    productRating = rating;
                    console.log('[Shopee采集器] ✅ XPath找到评分:', productRating);
                } else {
                    console.warn('[Shopee采集器] ⚠️ 评分解析失败');
                }
            } else {
                console.warn('[Shopee采集器] ⚠️ 未找到评分元素');
            }

            // 评价数
            console.log('[Shopee采集器] 尝试提取评价数...');
            const reviewXPath = '//*[@id="sll2-normal-pdp-main"]/div/div/div/div[2]/section/section[2]/div/div[2]/button[2]/div[1]';
            const reviewEl = getElementByXPath(reviewXPath);
            console.log('[Shopee采集器] 评价数元素:', reviewEl);
            if (reviewEl) {
                const text = reviewEl.textContent.trim();
                console.log('[Shopee采集器] 评价数原始文本:', text);
                const count = parseNumber(text);
                console.log('[Shopee采集器] 评价数解析结果:', count);
                if (count !== null) {
                    reviewCount = count;
                    console.log('[Shopee采集器] ✅ XPath找到评价数:', reviewCount);
                } else {
                    console.warn('[Shopee采集器] ⚠️ 评价数解析失败');
                }
            } else {
                console.warn('[Shopee采集器] ⚠️ 未找到评价数元素');
            }

            // 销量
            console.log('[Shopee采集器] 尝试提取销量...');
            const soldXPath = '//*[@id="sll2-normal-pdp-main"]/div/div/div/div[2]/section/section[2]/div/div[2]/div/div/span';
            const soldEl = getElementByXPath(soldXPath);
            console.log('[Shopee采集器] 销量元素:', soldEl);
            if (soldEl) {
                const text = soldEl.textContent.trim();
                console.log('[Shopee采集器] 销量原始文本:', text);
                const count = parseNumber(text);
                console.log('[Shopee采集器] 销量解析结果:', count);
                if (count !== null) {
                    soldCount = count;
                    console.log('[Shopee采集器] ✅ XPath找到销量:', soldCount);
                } else {
                    console.warn('[Shopee采集器] ⚠️ 销量解析失败');
                }
            } else {
                console.warn('[Shopee采集器] ⚠️ 未找到销量元素');
            }

            // 店铺评价数
            console.log('[Shopee采集器] 尝试提取店铺评价数...');
            const shopReviewXPath = '//*[@id="sll2-pdp-product-shop"]/section/div/div[2]/div[1]/span';
            const shopReviewEl = getElementByXPath(shopReviewXPath);
            console.log('[Shopee采集器] 店铺评价数元素:', shopReviewEl);
            if (shopReviewEl) {
                const text = shopReviewEl.textContent.trim();
                console.log('[Shopee采集器] 店铺评价数原始文本:', text);
                const count = parseNumber(text);
                console.log('[Shopee采集器] 店铺评价数解析结果:', count);
                if (count !== null) {
                    shopReviewCount = count;
                    console.log('[Shopee采集器] ✅ XPath找到店铺评价数:', shopReviewCount);
                } else {
                    console.warn('[Shopee采集器] ⚠️ 店铺评价数解析失败');
                }
            } else {
                console.warn('[Shopee采集器] ⚠️ 未找到店铺评价数元素');
            }

            console.log('[Shopee采集器] ========== 数据提取完成 ==========');
            console.log('[Shopee采集器] 最终结果:', {
                soldCount,
                reviewCount,
                productRating,
                likes,
                shopReviewCount
            });
        } catch (e) {
            console.error('[Shopee采集器] DOM提取失败:', e);
        }

        return { soldCount, reviewCount, globalReviewCount: null, productRating, likes, shopReviewCount };
    }

    // 根据平台提取数据
    function extractData() {
        if (PLATFORM === 'tk') {
            return extractTikTokData();
        } else {
            return extractShopeeData();
        }
    }

    // 解析数字（支持 K, M 后缀，支持从文本中提取数字）
    function parseNumber(str) {
        if (!str) return null;
        str = str.toString().trim();

        // 尝试从文本中提取数字（支持括号内的数字，如 "Favorite (6.1k)" -> "6.1k"）
        const patterns = [
            /\(([0-9,.]+[KkMm]?)\)/,  // 括号内的数字，如 (6.1k)
            /([0-9,.]+[KkMm]?)/        // 任意位置的数字，如 6.1k 或 1,234
        ];

        let numStr = null;
        for (const pattern of patterns) {
            const match = str.match(pattern);
            if (match) {
                numStr = match[1];
                break;
            }
        }

        if (!numStr) return null;

        // 移除逗号
        numStr = numStr.replace(/,/g, '').toUpperCase();

        // 处理 K, M 后缀
        let multiplier = 1;
        if (numStr.endsWith('K')) {
            multiplier = 1000;
            numStr = numStr.slice(0, -1);
        } else if (numStr.endsWith('M')) {
            multiplier = 1000000;
            numStr = numStr.slice(0, -1);
        }

        const num = parseFloat(numStr);
        return isNaN(num) ? null : Math.round(num * multiplier);
    }

    // 采集并发送数据
    async function collectAndSend() {
        const btn = document.getElementById('tiktok-collector-btn');
        btn.classList.add('loading');
        btn.textContent = '⏳ 采集中...';

        try {
            const { productId, shopId, region } = getProductInfo();
            if (!productId) {
                throw new Error('无法获取商品ID');
            }

            console.log(`[${PLATFORM}采集器] 商品ID:`, productId, 'shopId:', shopId, '区域:', region);

            // 从待采集列表中找到对应的 competitor_id
            let competitor;
            if (PLATFORM === 'tk') {
                competitor = notEnteredList.find(item => item.product_id === productId);
            } else {
                competitor = notEnteredList.find(item => item.shop_id === shopId && item.product_id === productId);
            }

            if (!competitor) {
                throw new Error('当前商品不在待采集列表中，可能已录入或不是竞品链接');
            }

            console.log(`[${PLATFORM}采集器] ========== 开始提取页面数据 ==========`);
            const data = extractData();
            console.log(`[${PLATFORM}采集器] ========== 提取的数据详情 ==========`);
            console.log(`[${PLATFORM}采集器] 销量 (soldCount):`, data.soldCount);
            console.log(`[${PLATFORM}采集器] 评价数 (reviewCount):`, data.reviewCount);
            console.log(`[${PLATFORM}采集器] 全球评价数 (globalReviewCount):`, data.globalReviewCount);
            console.log(`[${PLATFORM}采集器] 评分 (productRating):`, data.productRating);
            console.log(`[${PLATFORM}采集器] 喜欢数 (likes):`, data.likes);
            console.log(`[${PLATFORM}采集器] 完整数据对象:`, JSON.stringify(data));

            if (!data.soldCount && !data.reviewCount && !data.productRating && !data.likes) {
                throw new Error('未能提取到任何数据，请检查页面是否完全加载');
            }

            // 步骤1: 更新链接表的评分
            if (data.productRating !== null) {
                console.log(`[${PLATFORM}采集器] 更新评分:`, data.productRating);
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: `${API_BASE}/updateCompetitor`,
                    headers: {
                        'Content-Type': 'application/json',
                        'token': 'sk-e2ac92a27e75a54299313839fe6a78a7d9f82eb3d0f26f68'
                    },
                    data: JSON.stringify({
                        _id: competitor._id,
                        rating: data.productRating
                    }),
                    onload: function(response) {
                        console.log(`[${PLATFORM}采集器] 更新评分响应:`, response.responseText);
                    },
                    onerror: function(error) {
                        console.error(`[${PLATFORM}采集器] 更新评分失败:`, error);
                    }
                });
            }

            // 步骤2: 添加每日数据
            console.log(`[${PLATFORM}采集器] ========== 准备每日数据 ==========`);
            const dailyPayload = {
                competitor_id: competitor._id,
                record_time: Date.now(),
                sales_count: data.soldCount,
                review_count: data.reviewCount,
                remark: ''
            };

            // 根据平台添加不同的字段
            if (PLATFORM === 'tk') {
                dailyPayload.global_review_count = data.globalReviewCount;
                console.log(`[${PLATFORM}采集器] TikTok平台，添加 global_review_count:`, data.globalReviewCount);
            } else {
                dailyPayload.likes = data.likes;
                dailyPayload.shop_review_count = data.shopReviewCount;
                console.log(`[${PLATFORM}采集器] Shopee平台，添加 likes:`, data.likes);
                console.log(`[${PLATFORM}采集器] Shopee平台，添加 shop_review_count:`, data.shopReviewCount);
            }

            console.log(`[${PLATFORM}采集器] ========== 最终发送的payload ==========`);
            console.log(`[${PLATFORM}采集器] payload详情:`, JSON.stringify(dailyPayload, null, 2));
            console.log(`[${PLATFORM}采集器] payload.likes 值:`, dailyPayload.likes);
            console.log(`[${PLATFORM}采集器] payload.sales_count 值:`, dailyPayload.sales_count);
            console.log(`[${PLATFORM}采集器] payload.review_count 值:`, dailyPayload.review_count);

            console.log(`[${PLATFORM}采集器] ========== 发送API请求 ==========`);
            console.log(`[${PLATFORM}采集器] API地址:`, `${API_BASE}/addDailyData`);
            console.log(`[${PLATFORM}采集器] 请求方法: POST`);
            console.log(`[${PLATFORM}采集器] 请求体:`, JSON.stringify(dailyPayload));

            GM_xmlhttpRequest({
                method: 'POST',
                url: `${API_BASE}/addDailyData`,
                headers: {
                    'Content-Type': 'application/json',
                    'token': 'sk-e2ac92a27e75a54299313839fe6a78a7d9f82eb3d0f26f68'
                },
                data: JSON.stringify(dailyPayload),
                onload: function(response) {
                    console.log(`[${PLATFORM}采集器] ========== API响应 ==========`);
                    console.log(`[${PLATFORM}采集器] 响应状态:`, response.status);
                    console.log(`[${PLATFORM}采集器] 响应内容:`, response.responseText);
                    try {
                        const result = JSON.parse(response.responseText);
                        console.log(`[${PLATFORM}采集器] 解析后的响应:`, result);
                        console.log(`[${PLATFORM}采集器] 响应code:`, result.code);
                        console.log(`[${PLATFORM}采集器] 响应msg:`, result.msg);
                        if (result.code === 200) {
                            let successMsg = `✅ 录入成功！销量: ${data.soldCount || '-'}, 评价: ${data.reviewCount || '-'}`;
                            if (PLATFORM === 'tk') {
                                successMsg += `, 全球评价: ${data.globalReviewCount || '-'}`;
                            } else {
                                successMsg += `, 喜欢: ${data.likes || '-'}, 店铺评价: ${data.shopReviewCount || '-'}`;
                            }
                            successMsg += `, 评分: ${data.productRating || '-'}`;
                            showStatus(successMsg, 'success');
                            // 重新加载未录入列表
                            setTimeout(() => loadNotEnteredList(), 1000);
                        } else {
                            showStatus(`❌ 录入失败: ${result.msg}`, 'error');
                        }
                    } catch (e) {
                        console.error(`[${PLATFORM}采集器] 解析响应失败:`, e);
                        showStatus('❌ 录入失败: 解析响应失败', 'error');
                    }
                    btn.classList.remove('loading');
                    btn.textContent = '📊 发送到 ERP';
                },
                onerror: function(error) {
                    console.error(`[${PLATFORM}采集器] 请求失败:`, error);
                    showStatus('❌ 录入失败: 网络请求失败', 'error');
                    btn.classList.remove('loading');
                    btn.textContent = '📊 发送到 ERP';
                }
            });

        } catch (error) {
            console.error(`[${PLATFORM}采集器] 错误:`, error);
            showStatus(`❌ 采集失败: ${error.message}`, 'error');
            btn.classList.remove('loading');
            btn.textContent = '📊 发送到 ERP';
        }
    }

    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createNotEnteredPanel();
            });
        } else {
            createNotEnteredPanel();
        }
        console.log(`[${PLATFORM}采集器] 插件已加载`);
    }

    init();
})();
