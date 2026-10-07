// ==UserScript==
// @name         多平台数据采集器
// @namespace    http://tampermonkey.net/
// @version      2.6.15
// @description  采集TikTok和Shopee商品页面的销量、评价数、评分等数据，并发送到ERP系统
// @author       聚树ERP
// @match        https://www.tiktok.com/shop/*/pdp/*
// @match        https://shopee.co.th/*
// @match        https://shopee.com.my/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// @connect      localhost
// @connect      127.0.0.1
// @connect      env-00jy671a213o.dev-hz.cloudbasefunction.cn
// ==/UserScript==

// 调试信息收集器（不依赖 console，直接写到面板）
const _debugLogs = [];
function _debug(msg) {
    _debugLogs.push('[' + new Date().toLocaleTimeString() + '] ' + msg);
    // 尝试写到页面 console
    try { unsafeWindow.console.log('[采集器debug]', msg); } catch(e) {}
    // 尝试更新面板中的调试区
    try {
        const el = document.getElementById('tiktok-debug-area');
        if (el) el.textContent = _debugLogs.slice(-5).join('\n');
    } catch(e) {}
}

// [debug][2026-09-26] 记录价格链路关键节点，只输出价格字段和商品编号，不输出完整响应、Cookie 或令牌
function _debugPricePoint(stage, data) {
    try {
        _debug('[debug][2026-09-26][' + stage + '] ' + JSON.stringify(data));
    } catch (e) {
        _debug('[debug][2026-09-26][' + stage + '] 结构化日志序列化失败: ' + e.message);
    }
}

function _getCurrentTikTokProductId() {
    const match = window.location.pathname.match(/\/pdp\/(\d+)/);
    return match ? match[1] : '';
}

_debug('脚本开始执行, URL: ' + window.location.href);

(function() {
    'use strict';

    _debug('IIFE 进入');

    const SCRIPT_VERSION = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '2.2';

    // 平台检测
    const PLATFORM = window.location.href.includes('tiktok.com') ? 'tk' : 'sp';
    console.log('[数据采集器] 当前平台:', PLATFORM);

    // ERP 系统地址
    const ERP_URL = 'http://localhost:5173';
    const API_BASE = 'https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/api/competitor';

    // 拦截到的价格数据（TikTok SSR 响应）
    let interceptedPriceData = null;

    // Hook fetch 拦截 TikTok SSR Direct 请求，提取价格区间
    if (PLATFORM === 'tk') {
        _debug('开始安装 fetch hook...');
        const originalFetch = unsafeWindow.fetch;
        unsafeWindow.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            try {
                const url = (typeof args[0] === 'string') ? args[0] : args[0]?.url || '';
                if (url.includes('__ssrDirect=true')) {
                    _debug('fetch 捕获 ssrDirect: ' + url.substring(0, 80));
                    if (url.includes('/pdp/')) {
                        _debug('✅ 匹配 /pdp/ SSR Direct');
                        const cloned = response.clone();
                        cloned.text().then(text => {
                            _debug('响应长度: ' + text.length + ', 前80字符: ' + text.substring(0, 80));
                            try {
                                // 先尝试直接解析JSON（浏览器可能已解码）
                                let json;
                                try {
                                    json = JSON.parse(text);
                                    _debug('直接JSON解析成功');
                                } catch(e1) {
                                    // 尝试清理后base64解码
                                    const cleaned = text.replace(/[\s\r\n]/g, '');
                                    const decoded = atob(cleaned);
                                    json = JSON.parse(decoded);
                                    _debug('base64解码后JSON解析成功');
                                }
                                _debug('顶层key: ' + Object.keys(json).slice(0, 5).join(','));
                                const priceInfo = findPriceInSSR(json);
                                _debugPricePoint('SSR响应解析完成', {
                                    product_id: _getCurrentTikTokProductId(),
                                    parsed_price: priceInfo ? priceInfo.rangePrice : null,
                                    parser_source: priceInfo ? priceInfo.source : null
                                });
                                _debug('价格结果: ' + JSON.stringify(priceInfo));
                                if (priceInfo) {
                                    interceptedPriceData = priceInfo;
                                    updatePricePreview();
                                }
                            } catch (e) {
                                _debug('解析失败: ' + e.message);
                            }
                        });
                    }
                }
            } catch (e) {
                _debug('fetch hook异常: ' + e.message);
            }
            return response;
        };
        _debug('fetch hook 已安装');

        // 同时 hook XMLHttpRequest
        const originalXHROpen = unsafeWindow.XMLHttpRequest.prototype.open;
        const originalXHRSend = unsafeWindow.XMLHttpRequest.prototype.send;
        unsafeWindow.XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._interceptUrl = url;
            return originalXHROpen.call(this, method, url, ...rest);
        };
        unsafeWindow.XMLHttpRequest.prototype.send = function(...args) {
            if (this._interceptUrl && this._interceptUrl.includes('__ssrDirect=true') && this._interceptUrl.includes('/pdp/')) {
                _debug('XHR 捕获 SSR Direct');
                this.addEventListener('load', function() {
                    _debug('XHR 响应到达, 长度: ' + this.responseText.length);
                    try {
                        let json;
                        try {
                            json = JSON.parse(this.responseText);
                        } catch(e1) {
                            const cleaned = this.responseText.replace(/[\s\r\n]/g, '');
                            const decoded = atob(cleaned);
                            json = JSON.parse(decoded);
                        }
                        const priceInfo = findPriceInSSR(json);
                        _debugPricePoint('XHR响应解析完成', {
                            product_id: _getCurrentTikTokProductId(),
                            parsed_price: priceInfo ? priceInfo.rangePrice : null,
                            parser_source: priceInfo ? priceInfo.source : null
                        });
                        _debug('XHR 价格结果: ' + JSON.stringify(priceInfo));
                        if (priceInfo) {
                            interceptedPriceData = priceInfo;
                            updatePricePreview();
                        }
                    } catch (e) {
                        _debug('XHR 解析失败: ' + e.message);
                    }
                });
            }
            return originalXHRSend.apply(this, args);
        };
        _debug('XHR hook 已安装');

        // Fallback: 如果3秒后仍未拦截到价格数据，主动发起 SSR 请求
        setTimeout(() => {
            if (interceptedPriceData) return;
            _debug('拦截超时，主动发起 SSR 请求...');
            const currentUrl = window.location.href.split('?')[0];
            const region = new URLSearchParams(window.location.search).get('region') || 'MY';
            const ssrUrl = currentUrl + '?region=' + region + '&__loader=shop%2F%28region%29%2Fpdp%2F%28product_name_slug%24%29%2F%28product_id%29%2Fpage&__ssrDirect=true';
            _debug('SSR URL: ' + ssrUrl.substring(0, 80));
            unsafeWindow.fetch(ssrUrl, {
                credentials: 'include',
                headers: { 'Accept': '*/*' }
            }).then(r => r.text()).then(text => {
                _debug('主动请求响应长度: ' + text.length);
                try {
                    let json;
                    try { json = JSON.parse(text); } catch(e1) {
                        const cleaned = text.replace(/[\s\r\n]/g, '');
                        json = JSON.parse(atob(cleaned));
                    }
                    const priceInfo = findPriceInSSR(json);
                    _debugPricePoint('主动SSR响应解析完成', {
                        product_id: _getCurrentTikTokProductId(),
                        parsed_price: priceInfo ? priceInfo.rangePrice : null,
                        parser_source: priceInfo ? priceInfo.source : null
                    });
                    _debug('主动请求价格结果: ' + JSON.stringify(priceInfo));
                    if (priceInfo) {
                        interceptedPriceData = priceInfo;
                        updatePricePreview();
                    }
                } catch(e) {
                    _debug('主动请求解析失败: ' + e.message);
                }
            }).catch(e => {
                _debug('主动请求失败: ' + e.message);
            });
        }, 3000);
    }

    // MY 实测商品售价单位为 1/100000 MYR；监听商品详情和主商品优惠接口，按商品编号取区间。
    if (PLATFORM === 'sp') installShopeePriceProbe();

    function logShopeePrice(stage, data) {
        _debug('[debug][2026-10-07][ShopeePrice] ' + JSON.stringify({ stage, data }));
    }

    // [debug][2026-10-07] 排查：页面有 RM9.20 - RM55.80，预览却没有价格。
    // 仅观察主商品金额和请求路径；不记录完整页面、查询参数、Cookie 或令牌。
    function logShopeePriceSnapshot() {
        if (PLATFORM !== 'sp' || window.location.hostname !== 'shopee.com.my' || getCurrentPriceData()) return;
        const diagnostics = installShopeePriceProbe.diagnostics;
        if (!diagnostics || diagnostics.snapshots >= 8) return;
        const root = document.getElementById('sll2-normal-pdp-main');
        const currencyTexts = root ? (root.textContent || '').match(/RM\s*[\d,]+(?:\.\d{1,2})?/g) : [];
        let requestPaths = [];
        try {
            requestPaths = Array.from(new Set(unsafeWindow.performance.getEntriesByType('resource')
                .map(entry => new URL(entry.name, window.location.href))
                .filter(url => url.origin === window.location.origin && /^\/api\/(?:v\d+\/)?(?:pdp|item|add_on_deal)\//.test(url.pathname))
                .map(url => url.pathname))).slice(0, 20);
        } catch (e) {}
        diagnostics.snapshots++;
        logShopeePrice('预览缺价现场', {
            ...getProductInfo(), elapsedMs: Date.now() - diagnostics.startedAt,
            requestsSeen: diagnostics.requests, responsesSeen: diagnostics.responses,
            fetchHookIntact: unsafeWindow.fetch === diagnostics.fetchHook,
            xhrHookIntact: !!unsafeWindow.XMLHttpRequest && unsafeWindow.XMLHttpRequest.prototype.send === diagnostics.xhrHook,
            pageRootFound: !!root, currencyTexts: (currencyTexts || []).slice(0, 30), requestPaths,
            cachedProductId: interceptedPriceData ? interceptedPriceData.productId : null
        });
    }

    function getShopeePriceProbeTarget(requestUrl) {
        try {
            const url = new URL(requestUrl, window.location.href);
            const product = getProductInfo();
            if (!product.productId || url.origin !== window.location.origin ||
                !['/api/v4/pdp/get_pc', '/api/v2/add_on_deal/get_main_item_info'].includes(url.pathname)) return null;
            return { endpoint: url.pathname, productId: product.productId, shopId: product.shopId };
        } catch (e) { return null; }
    }

    function collectShopeePriceEvidence(json, productId) {
        const candidates = [];
        const stack = [{ node: json, path: '$', depth: 0, matched: false, priceContext: false }];
        const seen = new Set();
        let visited = 0;
        while (stack.length && visited < 3000 && candidates.length < 24) {
            const current = stack.pop();
            const node = current.node;
            if (!node || typeof node !== 'object' || seen.has(node)) continue;
            seen.add(node);
            visited++;
            const itemId = node.itemid != null ? node.itemid :
                           (node.item_id != null ? node.item_id :
                           (node.product_id != null ? node.product_id : node.productid));
            // 推荐商品或上一个商品的响应不可混入当前商品；无编号的候选明确标为待确认。
            if (itemId != null && String(itemId) !== String(productId)) continue;
            const matched = current.matched || (itemId != null && String(itemId) === String(productId));
            if (!Array.isArray(node)) {
                const models = Array.isArray(node.models) ? node.models :
                               (Array.isArray(node.skus) ? node.skus : null);
                const fields = {};
                Object.keys(node).forEach(key => {
                    const value = node[key];
                    if (/currency/i.test(key) && typeof value === 'string' && /^(?:[A-Z]{2,4}|RM|฿|\$)$/.test(value)) {
                        fields[key] = value;
                    } else if ((/price|amount/i.test(key) || (current.priceContext && /^(?:min|max|minimum|maximum|value)$/.test(key))) &&
                               ((typeof value === 'number' && Number.isFinite(value)) ||
                                (typeof value === 'string' && /^(?:(?:RM|MYR|THB|฿|\$)\s*)?[\d,.]+$/.test(value)))) {
                        fields[key] = value;
                    }
                });
                if (Object.keys(fields).length || models) {
                    const candidate = { path: current.path, itemMatch: matched, fields };
                    if (itemId != null) candidate.itemId = String(itemId);
                    if (models) {
                        candidate.modelCount = models.length;
                        const prices = models.slice(0, 1000).map(model => model && model.price)
                            .filter(price => typeof price === 'number' && Number.isFinite(price));
                        if (prices.length) candidate.modelRawPrices = {
                            count: prices.length, min: Math.min.apply(null, prices), max: Math.max.apply(null, prices),
                            samples: prices.slice(0, 5), partial: models.length > 1000
                        };
                    }
                    candidates.push(candidate);
                }
            }
            if (current.depth >= 12) continue;
            const keys = Object.keys(node).slice(0, 1000);
            for (let i = keys.length - 1; i >= 0; i--) {
                const key = keys[i];
                if (node[key] && typeof node[key] === 'object') stack.push({
                    node: node[key], path: current.path + '.' + key, depth: current.depth + 1, matched,
                    priceContext: current.priceContext || /price/i.test(key)
                });
            }
        }
        return { candidates, visited, truncated: stack.length > 0 };
    }

    function installShopeePriceProbe() {
        const reported = new Set();
        const diagnostics = { startedAt: Date.now(), requests: 0, responses: 0, snapshots: 0 };
        installShopeePriceProbe.diagnostics = diagnostics;
        function inspect(json, target, transport, status) {
            diagnostics.responses++;
            if (getProductInfo().productId !== target.productId) {
                logShopeePrice('已跳过旧商品响应', { responseProductId: target.productId, currentProductId: getProductInfo().productId });
                return;
            }
            const price = findShopeePriceRange(json, target);
            // [debug-done][2026-10-06] 由这组探测确认 MY 币种、100000 倍单位和全部11个规格售价。
            // [debug][2026-10-07] 新商品缺价时复用历史探测，区分响应结构、商品匹配和金额字段问题。
            const evidence = price ? null : collectShopeePriceEvidence(json, target.productId);
            const signature = target.endpoint + JSON.stringify(price || evidence);
            if (reported.has(signature) || reported.size >= 30) return;
            reported.add(signature);
            if (price) {
                interceptedPriceData = price;
                updatePricePreview();
            }
            logShopeePrice(price ? '价格区间已读取' : '未找到匹配商品的有效价格', {
                endpoint: target.endpoint, productId: target.productId, shopId: target.shopId,
                transport, status, price
            });
            if (!price) logShopeePrice('商品响应价格候选', {
                endpoint: target.endpoint,
                responseKeys: json && typeof json === 'object' ? Object.keys(json).slice(0, 20) : [],
                dataKeys: json && json.data && typeof json.data === 'object' ? Object.keys(json.data).slice(0, 20) : [],
                ...evidence
            });
        }
        const originalFetch = unsafeWindow.fetch;
        if (typeof originalFetch === 'function') {
            unsafeWindow.fetch = function() {
                const input = arguments[0];
                const url = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));
                const target = getShopeePriceProbeTarget(url);
                if (target) {
                    diagnostics.requests++;
                    logShopeePrice('捕获商品请求', { ...target, transport: 'fetch' });
                }
                const request = originalFetch.apply(this, arguments);
                if (target) request.then(response => {
                    if (response.status < 200 || response.status >= 300) {
                        logShopeePrice('商品响应状态', { endpoint: target.endpoint, status: response.status });
                        return;
                    }
                    return response.clone().json().then(json => inspect(json, target, 'fetch', response.status));
                }).catch(error => logShopeePrice('响应探测失败', { endpoint: target.endpoint, errorType: error.name }));
                return request;
            };
        }
        if (unsafeWindow.XMLHttpRequest) {
            const urls = new WeakMap();
            const prototype = unsafeWindow.XMLHttpRequest.prototype;
            const originalOpen = prototype.open;
            const originalSend = prototype.send;
            prototype.open = function(method, url) {
                urls.set(this, url);
                return originalOpen.apply(this, arguments);
            };
            prototype.send = function() {
                const target = getShopeePriceProbeTarget(urls.get(this));
                if (target) {
                    diagnostics.requests++;
                    logShopeePrice('捕获商品请求', { ...target, transport: 'xhr' });
                }
                if (target) this.addEventListener('load', function() {
                    try {
                        if (this.status < 200 || this.status >= 300) {
                            logShopeePrice('商品响应状态', { endpoint: target.endpoint, status: this.status });
                        } else if (this.responseType === 'json') {
                            inspect(this.response, target, 'xhr', this.status);
                        } else if (!this.responseType || this.responseType === 'text') {
                            inspect(JSON.parse(this.responseText), target, 'xhr', this.status);
                        }
                    } catch (error) {
                        logShopeePrice('响应探测失败', { endpoint: target.endpoint, errorType: error.name });
                    }
                }, { once: true });
                return originalSend.apply(this, arguments);
            };
        }
        diagnostics.fetchHook = unsafeWindow.fetch;
        diagnostics.xhrHook = unsafeWindow.XMLHttpRequest && unsafeWindow.XMLHttpRequest.prototype.send;
        logShopeePrice('价格采集已安装', { fetch: typeof originalFetch === 'function', xhr: !!unsafeWindow.XMLHttpRequest });
        // [debug-done][2026-10-06] 页面 RM8.74 与接口 874000 已核对，保留原文比对方法供后续站点探测。
        // const root = document.getElementById('sll2-normal-pdp-main');
        // logShopeePrice('页面金额对照', { currencyTexts: root ? root.textContent.match(/(?:RM|฿)\s*[\d,]+(?:\.\d{1,2})?/g) : [] });
    }

    function findShopeePriceRange(json, target) {
        // 只使用已实测的 MY 数据口径，其他币种待单独核对。
        if (window.location.hostname !== 'shopee.com.my' || !json || !json.data) return null;
        let items = [];
        if (target.endpoint === '/api/v4/pdp/get_pc' && json.data.item) items = [json.data.item];
        if (target.endpoint === '/api/v2/add_on_deal/get_main_item_info' && Array.isArray(json.data.item_details)) {
            items = json.data.item_details;
        }
        const item = items.find(value => value && String(value.itemid) === String(target.productId) &&
            (value.shopid == null || String(value.shopid) === String(target.shopId)));
        if (!item || item.currency !== 'MYR') return null;
        function rawPrice(value) {
            if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value))) return null;
            const number = Number(value);
            return Number.isFinite(number) && number >= 0 ? number : null;
        }
        let min = rawPrice(item.price_min);
        let max = rawPrice(item.price_max);
        let source = 'item.price_min/price_max';
        if (min === null || max === null) {
            // 汇总缺失时要求每个规格都提供有效售价，避免只取得部分规格就声称区间完整。
            if (!Array.isArray(item.models) || !item.models.length || item.models.length > 1000) return null;
            const prices = item.models.map(model => rawPrice(model && model.price));
            if (prices.some(price => price === null)) return null;
            min = Math.min.apply(null, prices);
            max = Math.max.apply(null, prices);
            source = 'item.models[*].price';
        }
        if (min > max) return null;
        const minRealPrice = min / 100000;
        const maxRealPrice = max / 100000;
        return {
            productId: String(item.itemid), shopId: String(target.shopId), currency: item.currency,
            rangePrice: min === max ? minRealPrice.toFixed(2) : minRealPrice.toFixed(2) + ' - ' + maxRealPrice.toFixed(2),
            minRealPrice, maxRealPrice, source, modelCount: Array.isArray(item.models) ? item.models.length : null
        };
    }

    function getCurrentPriceData() {
        if (PLATFORM === 'tk') return interceptedPriceData;
        const product = getProductInfo();
        return interceptedPriceData && interceptedPriceData.productId === product.productId &&
            interceptedPriceData.shopId === product.shopId ? interceptedPriceData : null;
    }

    function getPricePreviewValue() {
        const price = getCurrentPriceData();
        return price ? (price.currency === 'MYR' ? 'RM ' : '') + price.rangePrice : null;
    }

    // 从 SSR JSON 中递归查找价格字段
    // 兼容旧版 promotion_product_price 和新版 product_info.price / skus[*].price
    // 真实卖家定价 = origin_price_format - seller_subtotal_deduction
    function findPriceInSSR(obj) {
        if (!obj || typeof obj !== 'object') return null;

        // TikTok 新版响应把商品价格放在 product_info.price，SKU 价格放在 skus[*].price。
        // 优先使用汇总字段，拿不到汇总时再从 SKU 价格中计算区间。
        if (obj.price && typeof obj.price === 'object') {
            const priceNode = obj.price;
            const summaryPrices = [
                priceNode.min_sku_price,
                priceNode.max_sku_price
            ].map(value => parseFloat(String(value || '').replace(/[^0-9.-]/g, '')))
                .filter(value => !isNaN(value));

            if (summaryPrices.length > 0 || priceNode.real_price) {
                const prices = summaryPrices.length > 0
                    ? summaryPrices
                    : [parseFloat(String(priceNode.real_price).replace(/[^0-9.-]/g, ''))];
                const validPrices = prices.filter(value => !isNaN(value));
                if (validPrices.length > 0) {
                    const minReal = Math.min(...validPrices);
                    const maxReal = Math.max(...validPrices);
                    _debugPricePoint('命中商品价格汇总', {
                        product_id: _getCurrentTikTokProductId(),
                        real_price: priceNode.real_price || null,
                        min_sku_price: priceNode.min_sku_price || null,
                        max_sku_price: priceNode.max_sku_price || null,
                        original_price: priceNode.original_price || null,
                        discount: priceNode.discount || null,
                        calculated_range: minReal.toFixed(2) + ' - ' + maxReal.toFixed(2),
                        has_skus: Array.isArray(obj.skus),
                        sku_count: Array.isArray(obj.skus) ? obj.skus.length : 0
                    });
                    _debug('命中新版 product_info.price，字段: ' + Object.keys(priceNode).join(', '));
                    _debug('新版价格区间: ' + minReal.toFixed(2) + ' - ' + maxReal.toFixed(2));
                    return {
                        rangePrice: minReal === maxReal
                            ? minReal.toFixed(2)
                            : minReal.toFixed(2) + ' - ' + maxReal.toFixed(2),
                        originRangePrice: priceNode.original_price || null,
                        minRealPrice: minReal,
                        maxRealPrice: maxReal,
                        source: 'product_info.price.min_sku_price/max_sku_price'
                    };
                }
            }

            const salePrice = parseFloat(String(
                priceNode.sale_price_format || priceNode.sale_price_decimal || ''
            ).replace(/[^0-9.-]/g, ''));
            if (!isNaN(salePrice)) {
                _debug('命中新版 SKU price，售价: ' + salePrice.toFixed(2));
                return {
                    rangePrice: salePrice.toFixed(2),
                    originRangePrice: priceNode.origin_price_format || null,
                    minRealPrice: salePrice,
                    maxRealPrice: salePrice
                };
            }
        }

        // 新版响应没有价格汇总时，从同一 product_info 节点下的 SKU 价格计算区间。
        if (Array.isArray(obj.skus) && obj.skus.length > 0) {
            const skuPrices = obj.skus.map(sku => {
                const priceNode = sku && sku.price;
                if (!priceNode || typeof priceNode !== 'object') return NaN;
                return parseFloat(String(
                    priceNode.sale_price_format || priceNode.sale_price_decimal || ''
                ).replace(/[^0-9.-]/g, ''));
            }).filter(value => !isNaN(value));

            if (skuPrices.length > 0) {
                const minReal = Math.min(...skuPrices);
                const maxReal = Math.max(...skuPrices);
                _debugPricePoint('命中SKU价格区间', {
                    product_id: _getCurrentTikTokProductId(),
                    sku_count: skuPrices.length,
                    min_sku_price: minReal,
                    max_sku_price: maxReal,
                    first_sku_price: skuPrices[0],
                    last_sku_price: skuPrices[skuPrices.length - 1]
                });
                _debug('命中新版 skus[*].price，SKU数量: ' + skuPrices.length);
                _debug('SKU价格区间: ' + minReal.toFixed(2) + ' - ' + maxReal.toFixed(2));
                return {
                    rangePrice: minReal === maxReal
                        ? minReal.toFixed(2)
                        : minReal.toFixed(2) + ' - ' + maxReal.toFixed(2),
                    originRangePrice: null,
                    minRealPrice: minReal,
                    maxRealPrice: maxReal,
                    source: 'product_info.skus[*].price.sale_price_format'
                };
            }
        }

        // 查找 promotion_product_price 节点
        if (obj.promotion_product_price) {
            const ppp = obj.promotion_product_price;
            _debug('promotion_product_price keys: ' + Object.keys(ppp).join(', '));

            // 计算单个 SKU 的价格。优先按原价减平台扣减计算真实卖家价；
            // 新版响应可能只返回 sale_price，此时回退到页面实际售价。
            function calcRealPrice(skuObj) {
                if (!skuObj || typeof skuObj !== 'object') return null;
                const originValue = skuObj.origin_price_format || skuObj.origin_price_decimal;
                const originPrice = parseFloat(originValue);
                const deduction = skuObj.promotion_deduction_details
                    ? parseFloat(skuObj.promotion_deduction_details.seller_subtotal_deduction)
                    : 0;
                if (!isNaN(originPrice)) {
                    const realPrice = originPrice - (isNaN(deduction) ? 0 : deduction);
                    return {
                        value: Math.round(realPrice * 100) / 100,
                        source: 'origin_price - deduction'
                    };
                }

                // 部分响应没有 origin_price_*，但会提供 sale_price_*。
                const saleValue = skuObj.sale_price_format || skuObj.sale_price_decimal;
                const salePrice = parseFloat(saleValue);
                if (!isNaN(salePrice)) {
                    return {
                        value: Math.round(salePrice * 100) / 100,
                        source: 'sale_price'
                    };
                }

                return null;
            }

            // 从 skus_price 遍历所有 SKU，计算真实价格
            let allRealPrices = [];
            if (ppp.skus_price) {
                const skusList = Array.isArray(ppp.skus_price) ? ppp.skus_price : Object.values(ppp.skus_price);
                _debug('skus_price 数量: ' + skusList.length);
                _debug('首个SKU字段: ' + Object.keys(skusList[0] || {}).join(', '));
                const priceSources = {};
                let invalidPriceCount = 0;
                for (const sku of skusList) {
                    const result = calcRealPrice(sku);
                    if (result !== null) {
                        allRealPrices.push(result.value);
                        priceSources[result.source] = (priceSources[result.source] || 0) + 1;
                    } else {
                        invalidPriceCount++;
                    }
                }
                _debug('价格字段来源: ' + JSON.stringify(priceSources) + ', 无效SKU: ' + invalidPriceCount);
                _debug('所有SKU价格: ' + allRealPrices.join(', '));
            }

            // fallback: 如果 skus_price 没拿到，用 min_price
            if (allRealPrices.length === 0 && ppp.min_price) {
                const result = calcRealPrice(ppp.min_price);
                if (result !== null) {
                    allRealPrices.push(result.value);
                    _debug('min_price 字段来源: ' + result.source);
                }
            }

            if (allRealPrices.length === 0) return null;

            const minReal = Math.min(...allRealPrices);
            const maxReal = Math.max(...allRealPrices);

            _debug('价格区间: ' + minReal.toFixed(2) + ' - ' + maxReal.toFixed(2));

            let priceRange = '';
            if (minReal !== maxReal) {
                priceRange = minReal.toFixed(2) + ' - ' + maxReal.toFixed(2);
            } else {
                priceRange = minReal.toFixed(2);
            }

            return {
                rangePrice: priceRange,
                originRangePrice: null,
                minRealPrice: minReal,
                maxRealPrice: maxReal
            };
        }

        // 递归查找
        for (const key of Object.keys(obj)) {
            if (obj[key] && typeof obj[key] === 'object') {
                const result = findPriceInSSR(obj[key]);
                if (result) return result;
            }
        }
        return null;
    }

    // 更新预览面板中的价格显示
    function updatePricePreview() {
        const el = document.getElementById('tiktok-price-range-value');
        if (el && getCurrentPriceData()) {
            const display = getPricePreviewValue() || '';
            el.textContent = display || '未获取';
            el.classList.remove('not-found');
        }
    }

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
            <pre id="tiktok-debug-area" style="font-size:10px;color:#999;padding:6px 10px;margin:0;max-height:80px;overflow-y:auto;background:#f9f9f9;border-top:1px solid #eee;white-space:pre-wrap;word-break:break-all;"></pre>
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

        // 刷新调试区（显示之前积累的日志）
        const debugEl = document.getElementById('tiktok-debug-area');
        if (debugEl && _debugLogs.length) debugEl.textContent = _debugLogs.slice(-5).join('\n');

        // 初始自动刷新预览（等页面渲染稳定后再采集）
        setTimeout(refreshPreview, 1500);
        if (PLATFORM === 'sp' && window.location.hostname === 'shopee.com.my' && getProductInfo().productId) {
            const pageUrl = window.location.href;
            // 马来站商品统计会在首屏之后继续填充；静默重读，避免预览永久停在「No ratings yet」。
            [4500, 9000, 16000].forEach(delay => setTimeout(() => {
                if (window.location.href !== pageUrl) return;
                const data = extractData();
                renderPreview(data);
            }, delay));
        }
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
                { label: '价格区间', value: getPricePreviewValue(), valueId: 'tiktok-price-range-value' },
                { label: '全球评价数', value: data.globalReviewCount, full: true },
            ]
            : [
                { label: '销量', value: data.soldCount },
                { label: '评分', value: data.productRating },
                { label: '评价数', value: data.reviewCount },
                { label: '喜欢数', value: data.likes },
                { label: '价格区间', value: getPricePreviewValue(), valueId: 'tiktok-price-range-value', full: true },
                { label: '店铺评价数', value: data.shopReviewCount, full: true },
            ];

        const hasAny = fields.some(f => f.value !== null && f.value !== undefined);

        grid.innerHTML = fields.map(f => {
            const hasVal = f.value !== null && f.value !== undefined;
            const idAttr = f.valueId ? ` id="${f.valueId}"` : '';
            return `
                <div class="preview-item${f.full ? ' full-width' : ''}">
                    <div class="preview-item-label">${f.label}</div>
                    <div class="preview-item-value${hasVal ? '' : ' not-found'}"${idAttr}>${hasVal ? (typeof f.value === 'number' ? f.value.toLocaleString() : f.value) : '未采集到'}</div>
                </div>
            `;
        }).join('');

        if (hint) {
            hint.textContent = hasAny
                ? '⚠️ 请确认数据正确后再发送'
                : '❌ 页面数据未能读取，请确认页面已加载完成';
            hint.style.color = hasAny ? '#faad14' : '#ff4d4f';
        }
        logShopeePriceSnapshot();
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
            // Shopee 同时使用 /product/{shop_id}/{product_id} 和商品标题-i.{shop_id}.{product_id}
            const match = url.match(/\/product\/(\d+)\/(\d+)/) ||
                          url.match(/-i\.(\d+)\.(\d+)(?:[/?#]|$)/);
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
                    const match = text.match(/([\d,.]+\s*[KkMm千万萬]?)\s*\+?\s*(?:review|Review)/i) || text.match(/\(\s*([\d,.]+\s*[KkMm千万萬]?)\s*\+?\s*\)/);
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
                const match = text.match(/([\d,.]+\s*[KkMm千万萬]?)\s*\+?\s*(?:条全球评价|全球評論|Global Reviews?)/i);
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
                // 提取数字并保留中英文数量单位，如 "已售 5千+" 或 "1.2K sold"。
                const match = text.match(/([\d,.]+\s*[KkMm千万萬]?)\s*\+?\s*(?:sold|已售出?)/i) ||
                             text.match(/(?:sold|已售出?)\s*([\d,.]+\s*[KkMm千万萬]?)/i);
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
                    const match = text.match(/([\d,.]+\s*[KkMm千万萬]?)\s*\+?\s*(?:sold|已售出?)/i) ||
                                 text.match(/(?:sold|已售出?)\s*([\d,.]+\s*[KkMm千万萬]?)/i);
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

            // 马来站商品头部与泰国站的 section 层级不同；按可见标签补读，避免 XPath 读到空位。
            if (window.location.hostname === 'shopee.com.my') {
                const productRoot = document.getElementById('sll2-normal-pdp-main');
                const shopRoot = document.getElementById('sll2-pdp-product-shop');
                const reviewStat = findShopeeLabeledStat(productRoot, /\b(?:Ratings?|Reviews?)\b/i);
                const favoriteStat = findShopeeLabeledStat(productRoot, /\b(?:Favourites?|Favorites?|Likes?)\b/i) ||
                                     findShopeeLabeledStat(document, /\b(?:Favourites?|Favorites?|Likes?)\b/i);
                const soldStat = findShopeeLabeledStat(productRoot, /\bSold\b/i);
                const shopRatingStat = findShopeeLabeledStat(shopRoot, /\b(?:Ratings?|Reviews?)\b/i);

                if (reviewStat) {
                    reviewCount = reviewStat.count;
                    const nearbyRating = findShopeeRatingNear(reviewStat.element);
                    if (nearbyRating !== null) productRating = nearbyRating;
                }
                if (favoriteStat) likes = favoriteStat.count;
                if (soldStat) soldCount = soldStat.count;
                // MY 实测：加载后原 XPath 已读到 94.9k，标签补读为空时应保留该结果。
                // 刚加载时原位置曾返回临时 0；没有标签确认的 0 仍按未采集处理。
                const shopReviewXPathCount = shopReviewCount;
                shopReviewCount = shopRatingStat ? shopRatingStat.count :
                                  (shopReviewXPathCount > 0 ? shopReviewXPathCount : null);

                // [debug][2026-10-06][extractShopeeData] 序列化日志，复制控制台时不会丢失折叠对象的内容。
                console.log('[debug][2026-10-06][extractShopeeData] MY统计探测: ' + JSON.stringify({
                    productRootFound: !!productRoot,
                    shopRootFound: !!shopRoot,
                    review: reviewStat ? reviewStat.text : null,
                    favorite: favoriteStat ? favoriteStat.text : null,
                    sold: soldStat ? soldStat.text : null,
                    shopRating: shopRatingStat ? shopRatingStat.text : null,
                    shopReviewXPathText: shopReviewEl ? shopReviewEl.textContent.trim() : null,
                    shopReviewXPathCount,
                    productCandidates: getShopeeStatSamples(productRoot),
                    shopCandidates: getShopeeStatSamples(shopRoot),
                    globalFavoriteCandidates: getShopeeStatSamples(document).filter(text => /\b(?:Favourites?|Favorites?|Likes?)\b/i.test(text)).slice(0, 8),
                    result: { soldCount, reviewCount, productRating, likes, shopReviewCount }
                }));
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

    function findShopeeLabeledStat(root, labelPattern) {
        if (!root) return null;
        // 先读可点击统计项，再读短文本元素；长容器容易把不同统计数字混在一起。
        const candidates = Array.from(root.querySelectorAll('button, a, [role="button"], span, div'))
            .map(element => ({ element, text: element.textContent.replace(/\s+/g, ' ').trim() }))
            .filter(item => item.text.length <= 60 && labelPattern.test(item.text));
        candidates.sort((a, b) => a.text.length - b.text.length);
        for (const item of candidates) {
            const match = item.text.match(/([\d,.]+\s*[KkMm千万萬]?)\s*\+?\s*(?:Ratings?|Reviews?|Favourites?|Favorites?|Likes?|Sold)\b/i) ||
                          item.text.match(/(?:Ratings?|Reviews?|Favourites?|Favorites?|Likes?|Sold)\s*:?\s*\(?\s*([\d,.]+\s*[KkMm千万萬]?)/i);
            const count = match ? parseNumber(match[1]) : null;
            if (count !== null) return { element: item.element, text: item.text, count };
        }
        return null;
    }

    function getShopeeStatSamples(root) {
        if (!root) return [];
        const texts = Array.from(root.querySelectorAll('button, a, [role="button"], span, div'))
            .map(element => element.textContent.replace(/\s+/g, ' ').trim())
            .filter(text => text.length <= 60 && /\b(?:Ratings?|Reviews?|Favourites?|Favorites?|Likes?|Sold)\b/i.test(text));
        return Array.from(new Set(texts)).slice(0, 12);
    }

    function findShopeeRatingNear(reviewElement) {
        // 评分与「Ratings」通常同处商品标题下的一行，限定邻近范围以免混入下方评论。
        let container = reviewElement;
        for (let depth = 0; depth < 3 && container; depth++, container = container.parentElement) {
            const scores = Array.from(container.querySelectorAll('button, span, div'))
                .filter(element => element.children.length === 0)
                .map(element => element.textContent.trim())
                .filter(text => /^[0-5](?:\.\d{1,2})?$/.test(text))
                .map(Number);
            if (scores.length) return scores[0];
        }
        return null;
    }

    // 根据平台提取数据
    function extractData() {
        if (PLATFORM === 'tk') {
            return extractTikTokData();
        } else {
            return extractShopeeData();
        }
    }

    // 解析数量：支持 K/M、千/万/萬、单位间空格与末尾 +；+ 按展示的数量下限采集。
    function parseNumber(str) {
        if (!str) return null;
        str = str.toString().trim();

        // 尝试从文本中提取数字（支持括号内的数字，如 "Favorite (6.1k)" -> "6.1k"）
        const patterns = [
            /\(\s*([0-9,.]+\s*[KkMm千万萬]?)\s*\+?\s*\)/,  // 括号内的数量，如 (1.2千+)
            /([0-9,.]+\s*[KkMm千万萬]?)/                     // 任意位置的数量，如 已售出 1万+
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

        // 移除千位分隔符和数量与单位之间的空格。
        numStr = numStr.replace(/[,\s]/g, '').toUpperCase();

        // 中英文单位统一换算成完整数量。
        let multiplier = 1;
        if (/[K千]$/.test(numStr)) {
            multiplier = 1000;
            numStr = numStr.slice(0, -1);
        } else if (/[万萬]$/.test(numStr)) {
            multiplier = 10000;
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

            if (!data.soldCount && !data.reviewCount && !data.productRating && !data.likes && !getCurrentPriceData()) {
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
                // 价格区间（从 SSR 拦截获取）
                _debug('发送时 interceptedPriceData: ' + JSON.stringify(interceptedPriceData));
                if (interceptedPriceData) {
                    dailyPayload.price_range = interceptedPriceData.rangePrice || '';
                    _debugPricePoint('提交ERP前价格确认', {
                        product_id: _getCurrentTikTokProductId(),
                        parser_source: interceptedPriceData.source || null,
                        parsed_min: interceptedPriceData.minRealPrice,
                        parsed_max: interceptedPriceData.maxRealPrice,
                        final_price_range: dailyPayload.price_range,
                        api_method: 'addDailyData'
                    });
                    _debug('添加 price_range: ' + dailyPayload.price_range);
                } else {
                    _debug('⚠️ interceptedPriceData 为空，price_range 未添加');
                }
                console.log(`[${PLATFORM}采集器] TikTok平台，添加 global_review_count:`, data.globalReviewCount);
            } else {
                dailyPayload.likes = data.likes;
                dailyPayload.shop_review_count = data.shopReviewCount;
                const price = getCurrentPriceData();
                if (price) {
                    dailyPayload.price_range = price.rangePrice;
                    logShopeePrice('提交前价格确认', {
                        productId, currency: price.currency, rangePrice: price.rangePrice, source: price.source
                    });
                }
                console.log(`[${PLATFORM}采集器] Shopee平台，添加 likes:`, data.likes);
                console.log(`[${PLATFORM}采集器] Shopee平台，添加 shop_review_count:`, data.shopReviewCount);
            }

            console.log(`[${PLATFORM}采集器] ========== 最终发送的payload ==========`);
            _debug('最终payload.price_range: ' + (dailyPayload.price_range || '(无)'));
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
