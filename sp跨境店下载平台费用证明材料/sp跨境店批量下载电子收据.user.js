// ==UserScript==
// @name         Shopee跨境店批量下载电子收据
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  在Shopee卖家中心发票页面一键批量下载所有电子收据
// @author       You
// @match        https://seller.shopee.cn/portal/finance/income/invoice*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ========== 自适应参数管理 ==========
    const STORAGE_KEY = 'shopee_batch_download_params';
    const DEFAULT_PARAMS = {
        concurrency: 5,
        batchDelay: 800,
        itemDelay: 80,
        successCount: 0,
        failCount: 0
    };

    function loadParams() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return { ...DEFAULT_PARAMS, ...JSON.parse(stored) };
        } catch (e) {}
        return { ...DEFAULT_PARAMS };
    }

    function saveParams(params) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
    }

    function onBatchSuccess(params) {
        params.successCount++;
        params.failCount = 0;
        if (params.successCount % 3 === 0) {
            params.concurrency = Math.min(params.concurrency + 1, 10);
            params.batchDelay = Math.max(params.batchDelay - 100, 300);
            params.itemDelay = Math.max(params.itemDelay - 10, 30);
        }
        saveParams(params);
    }

    function onBatchFail(params) {
        params.failCount++;
        params.successCount = 0;
        params.concurrency = Math.max(params.concurrency - 1, 1);
        params.batchDelay = Math.min(params.batchDelay + 300, 3000);
        params.itemDelay = Math.min(params.itemDelay + 50, 500);
        saveParams(params);
    }

    // ========== 从URL获取参数 ==========
    function getUrlParam(name) {
        const url = new URL(window.location.href);
        return url.searchParams.get(name);
    }

    const SHOP_ID = getUrlParam('cnsc_shop_id') || '';

    // ========== 直接请求模式：调API获取发票列表 ==========
    async function fetchInvoiceList() {
        const spcCds = getCookie('SPC_CDS') || '0a37d772-70c0-4a12-ac7e-d7761b795ef8';
        const url = `https://seller.shopee.cn/api/v4/invoice/cbsc/get_invoice_list?SPC_CDS=${spcCds}&SPC_CDS_VER=2&cnsc_shop_id=${SHOP_ID}&cbsc_shop_region=th`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Accept': 'application/json, text/plain, */*'
            },
            credentials: 'include',
            body: JSON.stringify({
                invoice_type: [1,2,3,4,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,29,30,31,32,33,34,35,36,37,38,40,41,42,43,44,301,302,311,313,314]
            })
        });

        if (!resp.ok) throw new Error(`列表请求失败: ${resp.status}`);
        const json = await resp.json();
        return json.data?.invoice_list || [];
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : '';
    }

    // 构造下载URL
    function getDownloadUrl(invoiceId) {
        const spcCds = getCookie('SPC_CDS') || '';
        return `https://seller.shopee.cn/api/v4/invoice/cbsc/download_invoice?invoice_id=${invoiceId}&format=1&SPC_CDS=${spcCds}&SPC_CDS_VER=2&cnsc_shop_id=${SHOP_ID}&cbsc_shop_region=th`;
    }

    // 通过隐藏iframe下载文件
    function downloadViaIframe(url) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        setTimeout(() => iframe.remove(), 30000);
    }

    let isDownloading = false;
    let stopRequested = false;
    let downloadBtn = null;
    let stopBtn = null;
    let countLabel = null;
    let paramsLabel = null;
    let modeToggle = null;
    let monthSelect = null;
    let useDirectMode = true;
    let cachedInvoiceList = null; // 缓存列表避免重复请求
    let selectedMonth = ''; // 格式 "2026-04"，空串表示全部

    function createDownloadButton() {
        if (document.getElementById('batch-download-btn')) return;

        downloadBtn = document.createElement('button');
        downloadBtn.id = 'batch-download-btn';
        downloadBtn.textContent = '一键下载全部电子收据';
        downloadBtn.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 99999;
            padding: 10px 20px;
            background: #ee4d2d;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        downloadBtn.addEventListener('click', startBatchDownload);
        document.body.appendChild(downloadBtn);

        // 停止按钮
        stopBtn = document.createElement('button');
        stopBtn.id = 'batch-stop-btn';
        stopBtn.textContent = '停止下载';
        stopBtn.style.cssText = `
            position: fixed;
            top: 70px;
            right: 220px;
            z-index: 99999;
            padding: 10px 20px;
            background: #666;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: none;
        `;
        stopBtn.addEventListener('click', () => {
            stopRequested = true;
            stopBtn.textContent = '正在停止...';
        });
        document.body.appendChild(stopBtn);

        // 数量预览
        countLabel = document.createElement('div');
        countLabel.id = 'batch-count-label';
        countLabel.style.cssText = `
            position: fixed;
            top: 108px;
            right: 20px;
            z-index: 99999;
            padding: 4px 12px;
            background: rgba(0,0,0,0.7);
            color: #fff;
            border-radius: 3px;
            font-size: 12px;
        `;
        document.body.appendChild(countLabel);

        // 参数显示
        paramsLabel = document.createElement('div');
        paramsLabel.id = 'batch-params-label';
        paramsLabel.style.cssText = `
            position: fixed;
            top: 130px;
            right: 20px;
            z-index: 99999;
            padding: 4px 12px;
            background: rgba(0,0,0,0.5);
            color: #aaa;
            border-radius: 3px;
            font-size: 11px;
        `;
        document.body.appendChild(paramsLabel);

        // 模式切换
        modeToggle = document.createElement('div');
        modeToggle.id = 'batch-mode-toggle';
        modeToggle.style.cssText = `
            position: fixed;
            top: 150px;
            right: 20px;
            z-index: 99999;
            padding: 4px 12px;
            background: rgba(0,0,0,0.5);
            color: #4fc3f7;
            border-radius: 3px;
            font-size: 11px;
            cursor: pointer;
        `;
        modeToggle.addEventListener('click', () => {
            useDirectMode = !useDirectMode;
            updateModeDisplay();
            updateCount();
        });
        document.body.appendChild(modeToggle);

        // 月份选择器
        monthSelect = document.createElement('select');
        monthSelect.id = 'batch-month-select';
        monthSelect.style.cssText = `
            position: fixed;
            top: 170px;
            right: 20px;
            z-index: 99999;
            padding: 4px 8px;
            border-radius: 3px;
            border: 1px solid #ccc;
            font-size: 12px;
            background: #fff;
            cursor: pointer;
        `;
        monthSelect.innerHTML = '<option value="">加载月份中...</option>';
        monthSelect.addEventListener('change', () => {
            selectedMonth = monthSelect.value;
            updateCount();
        });
        document.body.appendChild(monthSelect);

        updateCount();
        updateParamsDisplay();
        updateModeDisplay();
        loadMonthOptions();
    }

    // 加载月份选项
    async function loadMonthOptions() {
        try {
            const list = await fetchInvoiceList();
            cachedInvoiceList = list;
            // 提取所有月份并排序（降序）
            const months = new Set();
            list.forEach(inv => {
                if (inv.issue_date) {
                    const ym = inv.issue_date.substring(0, 7); // "2026-04"
                    months.add(ym);
                }
            });
            const sorted = [...months].sort().reverse();

            monthSelect.innerHTML = '<option value="">全部月份 (' + list.length + '条)</option>';
            sorted.forEach(ym => {
                const count = list.filter(inv => inv.issue_date && inv.issue_date.startsWith(ym)).length;
                const [y, m] = ym.split('-');
                const label = `${y}年${parseInt(m)}月 (${count}条)`;
                monthSelect.innerHTML += `<option value="${ym}">${label}</option>`;
            });

            // 默认选中当前页面显示的月份（从页面文本猜测）
            const now = new Date();
            const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            if (sorted.includes(currentYm)) {
                monthSelect.value = currentYm;
                selectedMonth = currentYm;
            }
            updateCount();
        } catch (e) {
            monthSelect.innerHTML = '<option value="">加载失败</option>';
        }
    }

    // 根据月份过滤发票列表
    function filterByMonth(list) {
        if (!selectedMonth) return list;
        return list.filter(inv => inv.issue_date && inv.issue_date.startsWith(selectedMonth));
    }

    function updateModeDisplay() {
        if (!modeToggle) return;
        modeToggle.textContent = useDirectMode ? '模式: API直接请求 (点击切换)' : '模式: 模拟点击 (点击切换)';
    }

    function updateCount() {
        if (!countLabel) return;
        if (useDirectMode) {
            if (cachedInvoiceList) {
                const filtered = filterByMonth(cachedInvoiceList);
                countLabel.textContent = `检测到 ${filtered.length} 条发票 (API模式)`;
            } else {
                countLabel.textContent = '加载中...';
                fetchInvoiceList().then(list => {
                    cachedInvoiceList = list;
                    const filtered = filterByMonth(list);
                    countLabel.textContent = `检测到 ${filtered.length} 条发票 (API模式)`;
                }).catch(() => {
                    countLabel.textContent = '⚠ API请求失败，请切换模拟点击模式';
                });
            }
        } else {
            const count = getReceiptLinks().length;
            countLabel.textContent = count > 0 ? `检测到 ${count} 条电子收据 (点击模式)` : '未检测到电子收据';
        }
    }

    function updateParamsDisplay() {
        if (!paramsLabel) return;
        const p = loadParams();
        paramsLabel.textContent = `并发${p.concurrency} | 批间${p.batchDelay}ms | 项间${p.itemDelay}ms`;
    }

    // ========== 备选：模拟点击模式 ==========
    function getReceiptLinks(debug = false) {
        const allElements = document.querySelectorAll('a, span, div, button');
        const rawMatches = [];
        allElements.forEach(el => {
            if (el.textContent.trim() === '电子收据' && el.offsetParent !== null) {
                rawMatches.push(el);
            }
        });
        const leaves = rawMatches.filter(el => {
            return !rawMatches.some(other => other !== el && el.contains(other));
        });
        if (debug) {
            console.log(`[批量下载] 叶子节点（去重后）: ${leaves.length}`);
        }
        return leaves;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== 核心下载逻辑 ==========
    async function startBatchDownload() {
        if (isDownloading) return;

        if (useDirectMode) {
            await startDirectDownload();
        } else {
            await startClickDownload();
        }
    }

    // 直接请求模式
    async function startDirectDownload() {
        isDownloading = true;
        stopRequested = false;
        downloadBtn.textContent = '获取发票列表...';
        downloadBtn.style.background = '#999';
        downloadBtn.style.cursor = 'not-allowed';
        stopBtn.style.display = 'block';

        let invoiceList;
        try {
            const fullList = cachedInvoiceList || await fetchInvoiceList();
            cachedInvoiceList = fullList;
            invoiceList = filterByMonth(fullList);
        } catch (e) {
            alert('获取发票列表失败: ' + e.message + '\n请尝试切换到模拟点击模式');
            resetUI();
            return;
        }

        if (invoiceList.length === 0) {
            alert('当前月份没有发票');
            resetUI();
            return;
        }

        console.log(`[批量下载] API模式: 获取到 ${invoiceList.length} 条发票`);
        const params = loadParams();
        let completed = 0;
        let failedIds = [];

        for (let i = 0; i < invoiceList.length; i += params.concurrency) {
            if (stopRequested) {
                downloadBtn.textContent = `已停止 (${completed}/${invoiceList.length})`;
                downloadBtn.style.background = '#ff9800';
                break;
            }

            const batch = invoiceList.slice(i, i + params.concurrency);

            for (let j = 0; j < batch.length; j++) {
                const invoice = batch[j];
                const url = getDownloadUrl(invoice.invoice_id);
                try {
                    downloadViaIframe(url);
                    onBatchSuccess(params);
                } catch (e) {
                    console.warn(`[批量下载] 下载失败 invoice_id=${invoice.invoice_id}`, e);
                    failedIds.push(invoice.invoice_id);
                    onBatchFail(params);
                }
                if (j < batch.length - 1) {
                    await sleep(params.itemDelay + Math.random() * params.itemDelay);
                }
            }

            completed += batch.length;
            downloadBtn.textContent = `正在下载... ${completed}/${invoiceList.length}`;
            updateParamsDisplay();

            if (i + params.concurrency < invoiceList.length && !stopRequested) {
                await sleep(params.batchDelay + Math.random() * 200);
            }
        }

        if (!stopRequested) {
            const msg = failedIds.length > 0
                ? `完成! ${completed - failedIds.length}成功, ${failedIds.length}失败`
                : `下载完成! 共${invoiceList.length}个`;
            downloadBtn.textContent = msg;
            downloadBtn.style.background = failedIds.length > 0 ? '#ff9800' : '#4caf50';
            if (failedIds.length > 0) {
                console.warn('[批量下载] 失败的invoice_id:', failedIds);
            }
        }

        stopBtn.style.display = 'none';
        updateParamsDisplay();
        setTimeout(resetUI, 3000);
    }

    // 模拟点击模式（备选）
    async function startClickDownload() {
        const links = getReceiptLinks(true);
        if (links.length === 0) {
            alert('未找到电子收据链接，请确保页面已加载完成');
            return;
        }

        isDownloading = true;
        stopRequested = false;
        downloadBtn.textContent = `正在下载... 0/${links.length}`;
        downloadBtn.style.background = '#999';
        downloadBtn.style.cursor = 'not-allowed';
        stopBtn.style.display = 'block';

        const params = loadParams();
        let completed = 0;

        for (let i = 0; i < links.length; i += params.concurrency) {
            if (stopRequested) {
                downloadBtn.textContent = `已停止 (${completed}/${links.length})`;
                downloadBtn.style.background = '#ff9800';
                break;
            }

            const batch = links.slice(i, i + params.concurrency);
            for (let j = 0; j < batch.length; j++) {
                batch[j].click();
                if (j < batch.length - 1) {
                    await sleep(params.itemDelay + Math.random() * params.itemDelay);
                }
            }
            onBatchSuccess(params);

            completed += batch.length;
            downloadBtn.textContent = `正在下载... ${completed}/${links.length}`;
            updateParamsDisplay();

            if (i + params.concurrency < links.length) {
                await sleep(params.batchDelay + Math.random() * 200);
            }
        }

        if (!stopRequested) {
            downloadBtn.textContent = `下载完成! 共${links.length}个`;
            downloadBtn.style.background = '#4caf50';
        }

        stopBtn.style.display = 'none';
        updateParamsDisplay();
        setTimeout(resetUI, 3000);
    }

    function resetUI() {
        isDownloading = false;
        stopRequested = false;
        downloadBtn.textContent = '一键下载全部电子收据';
        downloadBtn.style.background = '#ee4d2d';
        downloadBtn.style.cursor = 'pointer';
    }

    // ========== 初始化 ==========
    function init() {
        let debounceTimer = null;
        const observer = new MutationObserver(() => {
            const hasReceipts = document.body.innerText.includes('电子收据');
            if (hasReceipts) {
                createDownloadButton();
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(updateCount, 500);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        setTimeout(() => {
            createDownloadButton();
        }, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
