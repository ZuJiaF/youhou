const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '../多平台数据采集器.user.js'), 'utf8');
const priceCode = source.slice(source.indexOf('    function logShopeePrice('), source.indexOf('    // 从 SSR JSON 中递归查找价格字段'));
const previewCode = source.slice(source.indexOf('    function renderPreview('), source.indexOf('    // 显示错误'));
const sendCode = source.slice(source.indexOf('    async function collectAndSend('), source.indexOf('    // 初始化'));
const itemId = '29377737789';
const shopId = '323536941';
const detailPath = '/api/v4/pdp/get_pc';
const publicPrices = [1990000, 1590000, 2842000, 890000, 1447000, 874000, 890000, 2890000, 874000, 1990000, 874000];
function item(overrides = {}) {
    return { itemid: Number(itemId), shopid: Number(shopId), currency: 'MYR', price_min: 874000, price_max: 2890000,
        price_before_discount: 2000000, price_min_before_discount: 2000000, price_max_before_discount: 6000000,
        models: publicPrices.map(price => ({ itemid: Number(itemId), price })), ...overrides };
}
function fixture(platform = 'sp', hostname = 'shopee.com.my') {
    const elements = { 'tiktok-preview-grid': { innerHTML: '' }, 'tiktok-preview-hint': { style: {} },
        'tiktok-price-range-value': { classList: { remove() {} } },
        'tiktok-collector-btn': { classList: { add() {}, remove() {} } } };
    const requests = [], logs = [];
    let current = { productId: itemId, shopId, region: hostname === 'shopee.co.th' ? 'TH' : 'MY' };
    function XHR() { this.listeners = {}; this.status = 200; this.responseType = 'json'; }
    XHR.prototype.open = function() { return 'open'; };
    XHR.prototype.send = function() { return 'send'; };
    XHR.prototype.addEventListener = function(event, listener) { this.listeners[event] = listener; };
    const context = { PLATFORM: platform, URL, window: { location: { hostname, origin: `https://${hostname}`, href: `https://${hostname}/product/${shopId}/${itemId}` },
        getComputedStyle: node => node.computedStyle || {} },
        unsafeWindow: { XMLHttpRequest: XHR }, interceptedPriceData: null,
        document: { getElementById: id => elements[id] }, getProductInfo: () => current,
        _debug: text => logs.push(text), _debugPricePoint() {}, _getCurrentTikTokProductId: () => itemId,
        console: { log() {}, warn() {}, error() {} }, updatePricePreview() {},
        notEnteredList: [{ _id: 'competitor-fixture', product_id: itemId, shop_id: shopId }], API_BASE: 'https://fixture.invalid',
        extractData: () => ({ soldCount: 20000, productRating: 4.9, reviewCount: 4900, globalReviewCount: null, likes: 5700, shopReviewCount: 94900 }),
        GM_xmlhttpRequest: request => requests.push(request), showStatus(message) { throw new Error(message); } };
    vm.createContext(context);
    vm.runInContext(priceCode + previewCode + sendCode, context);
    return { context, elements, requests, logs, changeProduct: value => { current = value; },
        setPriceNodes(values) {
            const root = { textContent: values.map(value => value.text).join(' ') };
            const nodes = values.map(value => ({ textContent: value.text, parentElement: root,
                closest: () => value.deleted ? {} : null, computedStyle: value.style || {} }));
            root.querySelectorAll = selector => selector === 'div, span' ? nodes : [];
            elements['sll2-normal-pdp-main'] = root;
        } };
}
function parse(f, value, endpoint = detailPath) {
    return f.context.findShopeePriceRange(endpoint === detailPath ? { data: { item: value } } : { data: { item_details: [item({ itemid: 1 }), value] } },
        { endpoint, productId: itemId, shopId });
}

test('用户实测：11个规格，单位换算和售价区间正确，划线价不混入', () => {
    const f = fixture(), result = parse(f, item());
    assert.equal(result.rangePrice, '8.74 - 28.90');
    assert.equal(result.modelCount, 11);
    assert.equal(result.currency, 'MYR');
    assert.equal(result.minRealPrice, 8.74);
    assert.equal(result.maxRealPrice, 28.9);
    assert.equal(parse(f, item(), '/api/v2/add_on_deal/get_main_item_info').rangePrice, result.rangePrice);
});

test('缺少汇总时按全部规格计算，单规格和零售价正确', () => {
    const f = fixture();
    const result = parse(f, item({ price_min: null, price_max: null }));
    assert.equal(result.rangePrice, '8.74 - 28.90');
    assert.equal(result.source, 'item.models[*].price');
    assert.equal(parse(f, item({ price_min: null, price_max: null, models: [{ price: 874000 }] })).rangePrice, '8.74');
    assert.equal(parse(f, item({ price_min: 0, price_max: 0 })).rangePrice, '0.00');
    assert.equal(parse(f, item({ price_min: '874000', price_max: '2890000' })).rangePrice, '8.74 - 28.90');
});

test('探测与正式解析使用相同商品编号别名，候选有价时不再因字段名不同漏采', () => {
    const f = fixture();
    for (const key of ['itemid', 'item_id', 'product_id', 'productid']) {
        const value = item({ itemid: undefined, [key]: Number(itemId) });
        const evidence = f.context.collectShopeePriceEvidence({ data: { item: value } }, itemId);
        assert.equal(evidence.candidates[0].itemMatch, true);
        const result = parse(f, value);
        assert.ok(result, `探测命中 ${key} 后正式解析也必须命中`);
        assert.equal(result.productId, itemId);
        assert.equal(result.rangePrice, '8.74 - 28.90');
        assert.equal(result.productIdField, key);
    }
});

test('编号别名冲突与优惠列表中不匹配的shop_id不会进入价格', () => {
    const f = fixture();
    assert.equal(parse(f, item({ item_id: 1 })), null);
    assert.equal(parse(f, item({ itemid: undefined, item_id: 1 })), null);
    assert.equal(parse(f, item({ shopid: undefined, shop_id: 1 }), '/api/v2/add_on_deal/get_main_item_info'), null);
    assert.equal(parse(f, item({ shopid: undefined, shop_id: Number(shopId) }), '/api/v2/add_on_deal/get_main_item_info').rangePrice, '8.74 - 28.90');
    assert.ok(f.logs.some(line => line.includes('价格解析拒绝') && line.includes('商品编号未匹配')));
});

test('错商品、未实测币种与不完整规格不产生价格，优惠列表仍校验店铺', () => {
    const f = fixture();
    assert.equal(parse(f, item({ shopid: 1 }), '/api/v2/add_on_deal/get_main_item_info'), null);
    for (const value of [item({ itemid: 1 }), item({ currency: 'THB' }),
        item({ price_min: 2890000, price_max: 874000 }), item({ price_min: null, price_max: null, models: [] }),
        item({ price_min: null, price_max: null, models: [{ price: 874000 }, { price: null }] }),
        item({ price_min: null, price_max: null, models: [{ price: true }] }),
        item({ price_min: null, price_max: null, models: [{ price: -1 }] })]) assert.equal(parse(f, value), null);
});

test('详情中同商品售价不因未确认的店铺字段缺失或不同而被丢弃', () => {
    const f = fixture();
    // 店铺字段具体值未在用户日志中回传，以下是边界用例，不冒充实际响应值。
    for (const responseShopId of [undefined, null, 0, '', 1, shopId]) {
        assert.equal(parse(f, item({ shopid: responseShopId })).rangePrice, '8.74 - 28.90');
        assert.equal(parse(f, item({ shopid: responseShopId, itemid: 1 })), null);
    }
});

test('回传窗帘商品的售价进入预览和每日提交，划线价及VIP价不参与区间', async () => {
    const f = fixture();
    const target = { endpoint: detailPath, productId: '28487872335', shopId: '1549429165' };
    f.changeProduct({ productId: target.productId, shopId: target.shopId, region: 'MY' });
    f.context.notEnteredList[0].product_id = target.productId;
    f.context.notEnteredList[0].shop_id = target.shopId;
    // 金额来自用户回传；日志标准化了编号，item_id 是兼容性用例，不宣称原响应字段已经实测。
    const response = { data: { item: { item_id: 28487872335, currency: 'MYR', price: 920000,
        price_min: 920000, price_max: 5580000, price_min_before_discount: 920000,
        price_max_before_discount: 6420000 }, product_price: { vip_price: 460000 } } };
    const promise = Promise.resolve({ status: 200, clone: () => ({ json: async () => response }) });
    f.context.unsafeWindow.fetch = () => promise;
    f.context.installShopeePriceProbe();
    f.context.unsafeWindow.fetch(detailPath);
    await new Promise(resolve => setImmediate(resolve));
    f.context.renderPreview(f.context.extractData());
    assert.match(f.elements['tiktok-preview-grid'].innerHTML, /RM 9\.20 - 55\.80/);
    assert.equal(f.context.interceptedPriceData.source, 'item.price_min/price_max');
    assert.equal(f.context.interceptedPriceData.productIdField, 'item_id');
    assert.ok(f.logs.some(line => line.includes('price-dom-v3') && line.includes('价格区间已读取')));
    await f.context.collectAndSend();
    const payload = JSON.parse(f.requests.find(request => request.url.endsWith('/addDailyData')).data);
    assert.equal(payload.price_range, '9.20 - 55.80');
    f.changeProduct({ productId: 'other', shopId: target.shopId, region: 'MY' });
    assert.equal(f.context.getCurrentPriceData(), null);
});

test('缓存按商品和店铺隔离，预览显示币种，TK保持原格式', () => {
    const f = fixture();
    f.context.interceptedPriceData = parse(f, item());
    f.context.renderPreview(f.context.extractData());
    assert.match(f.elements['tiktok-preview-grid'].innerHTML, /价格区间/);
    assert.match(f.elements['tiktok-preview-grid'].innerHTML, /RM 8\.74 - 28\.90/);
    f.changeProduct({ productId: 'other', shopId, region: 'MY' });
    assert.equal(f.context.getCurrentPriceData(), null);
    f.context.renderPreview(f.context.extractData());
    assert.doesNotMatch(f.elements['tiktok-preview-grid'].innerHTML, /8\.74/);
    const tk = fixture('tk'); tk.context.interceptedPriceData = { rangePrice: '1.00 - 2.00' };
    assert.equal(tk.context.getPricePreviewValue(), '1.00 - 2.00');
});

test('fetch和XHR读取价格同时保留原始请求结果，过滤其他接口与旧商品响应', async () => {
    const f = fixture();
    const response = { status: 200, clone: () => ({ json: async () => ({ data: { item: item() } }) }) };
    const promise = Promise.resolve(response);
    f.context.unsafeWindow.fetch = function() { return promise; };
    f.context.installShopeePriceProbe();
    assert.equal(f.context.unsafeWindow.fetch(`${detailPath}?token=secret-fixture`), promise);
    assert.equal(await promise, response);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.context.interceptedPriceData.rangePrice, '8.74 - 28.90');
    assert.equal(f.context.getShopeePriceProbeTarget('/api/v4/pdp/hot_sales/get_item_cards'), null);
    assert.equal(f.context.getShopeePriceProbeTarget(`https://foreign.invalid${detailPath}`), null);
    assert.ok(f.logs.every(text => !text.includes('secret-fixture')));
    const xhr = new f.context.unsafeWindow.XMLHttpRequest(); xhr.response = { data: { item: item() } };
    assert.equal(xhr.open('GET', detailPath), 'open'); assert.equal(xhr.send(), 'send'); xhr.listeners.load.call(xhr);
    f.changeProduct({ productId: 'other', shopId, region: 'MY' });
    xhr.response = { data: { item: item({ price_min: 100000, price_max: 200000 }) } }; xhr.listeners.load.call(xhr);
    assert.equal(f.context.interceptedPriceData.rangePrice, '8.74 - 28.90');
});

test('提交每日数据带价格区间，切换商品后不提交旧价格', async () => {
    const f = fixture(); f.context.interceptedPriceData = parse(f, item());
    await f.context.collectAndSend();
    const payload = JSON.parse(f.requests.find(request => request.url.endsWith('/addDailyData')).data);
    assert.equal(payload.price_range, '8.74 - 28.90');
    assert.equal(payload.shop_review_count, 94900);
    f.requests.length = 0; f.context.interceptedPriceData.productId = 'other';
    await f.context.collectAndSend();
    const stalePayload = JSON.parse(f.requests.find(request => request.url.endsWith('/addDailyData')).data);
    assert.ok(!Object.hasOwn(stalePayload, 'price_range'));
});

test('泰国截图金额：响应先到时不提交，页面填好后自动预览和提交69至312泰铢', async () => {
    const f = fixture('sp', 'shopee.co.th');
    // 这是按截图金额构造的响应测试，不冒充用户已回传泰国接口原始金额。
    const response = { data: { item: item({ currency: 'THB', price_min: 6900000, price_max: 31200000,
        price_min_before_discount: 19100000, price_max_before_discount: 82900000 }) } };
    const promise = Promise.resolve({ status: 200, clone: () => ({ json: async () => response }) });
    f.context.unsafeWindow.fetch = () => promise;
    f.context.installShopeePriceProbe();
    f.context.unsafeWindow.fetch(detailPath);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(f.context.getCurrentPriceData(), null);
    await f.context.collectAndSend();
    const pendingPayload = JSON.parse(f.requests.find(request => request.url.endsWith('/addDailyData')).data);
    assert.ok(!Object.hasOwn(pendingPayload, 'price_range'));
    f.requests.length = 0;
    f.setPriceNodes([{ text: '฿191 - ฿829', style: { textDecorationLine: 'line-through' } },
        { text: '฿69 - ฿312' }, { text: 'Free shipping up to ฿30' }]);
    f.context.renderPreview(f.context.extractData());
    assert.match(f.elements['tiktok-preview-grid'].innerHTML, /฿ 69\.00 - 312\.00/);
    await f.context.collectAndSend();
    const payload = JSON.parse(f.requests.find(request => request.url.endsWith('/addDailyData')).data);
    assert.equal(payload.price_range, '69.00 - 312.00');
    assert.equal(f.context.interceptedPriceData.pageVerified, true);
    f.changeProduct({ productId: 'other', shopId, region: 'TH' });
    assert.equal(f.context.getCurrentPriceData(), null);
});

test('泰铢换算错误、只有划线价或会员文案时保持未采集，不混入马来币', () => {
    const f = fixture('sp', 'shopee.co.th');
    f.setPriceNodes([{ text: '฿69 - ฿312' }]);
    f.context.interceptedPriceData = parse(f, item({ currency: 'THB', price_min: 69, price_max: 312 }));
    assert.equal(f.context.getCurrentPriceData(), null);
    f.context.interceptedPriceData = parse(f, item({ currency: 'THB', price_min: 19100000, price_max: 82900000 }));
    for (const node of [{ text: '฿191 - ฿829', style: { textDecorationLine: 'line-through' } },
        { text: '฿191 - ฿829', deleted: true }, { text: '฿191 - ฿829', style: { display: 'none' } },
        { text: 'Join VIP to buy at ฿191 - ฿829' }]) {
        f.setPriceNodes([node]);
        assert.equal(f.context.getCurrentPriceData(), null);
    }
    assert.equal(parse(f, item()), null);
    assert.equal(parse(f, item({ currency: 'USD' })), null);
    assert.equal(parse(f, item({ currency: 'THB', itemid: 1 })), null);
});

test('泰国单价、千位分隔和小数可核对，核对通过后规格选择不覆盖完整区间', () => {
    for (const value of [{ text: '฿69', min: 69, max: 69, expected: '฿ 69.00' },
        { text: 'THB 1,200.00 – 3,500.50', min: 1200, max: 3500.5, expected: '฿ 1200.00 - 3500.50' }]) {
        const f = fixture('sp', 'shopee.co.th');
        f.context.interceptedPriceData = parse(f, item({ currency: 'THB', price_min: value.min * 100000, price_max: value.max * 100000 }));
        f.setPriceNodes([{ text: value.text }]);
        assert.equal(f.context.getPricePreviewValue(), value.expected);
        f.setPriceNodes([{ text: '฿100' }]);
        assert.equal(f.context.getPricePreviewValue(), value.expected);
        f.changeProduct({ productId: itemId, shopId: 'other', region: 'TH' });
        assert.equal(f.context.getCurrentPriceData(), null);
    }
});
