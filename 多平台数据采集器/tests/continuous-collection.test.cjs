const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '../多平台数据采集器.user.js'), 'utf8');
const section = (start, end) => source.slice(source.indexOf(start), source.indexOf(end));
const code = section('    // 连续采集：', '    // 刷新数据预览') +
    section('    async function collectAndSend(', '    // 初始化');
const runKey = 'erp-collector:continuous-run:v1';
const store = (values = new Map()) => ({ getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key), values });
function fixture({ platform = 'sp', region = 'MY', productId = '20', shopId = '10',
    session = store(), local = store(), pending, automaticResponses = true } = {}) {
    const info = { productId, shopId: platform === 'tk' ? null : shopId, region };
    const link = (id, extra = {}) => ({ _id: `row-${id}`, platform, country: region,
        product_id: id, shop_id: shopId, ...extra });
    let now = 100000;
    let serial = 0;
    const timers = new Map(), requests = [], navigation = [], messages = [];
    const checkbox = { checked: true };
    const button = { disabled: false, classList: { add() {}, remove() {} } };
    const hostname = platform === 'tk' ? 'www.tiktok.com' : region === 'MY' ? 'shopee.com.my' : 'shopee.co.th';
    const location = { hostname, origin: `https://${hostname}` };
    Object.defineProperty(location, 'href', { get: () => navigation.at(-1) || location.origin,
        set: value => navigation.push(value) });
    const c = { PLATFORM: platform, URL, window: { location }, Date: { now: () => now },
        localStorage: local, sessionStorage: session,
        document: { readyState: 'complete', getElementById: id => id === 'tiktok-continuous-checkbox' ? checkbox : button },
        getProductInfo: () => info,
        notEnteredList: pending || [link(productId), link('21', { country: 'TH' }),
            link('22', { platform: platform === 'sp' ? 'tk' : 'sp' }), link('23'), link('24')],
        API_BASE: 'https://fixture.invalid',
        data: { soldCount: 0, reviewCount: 0, productRating: 0, globalReviewCount: 0, likes: 0, shopReviewCount: 0 },
        price: { rangePrice: '0.00', currency: 'MYR' }, interceptedPriceData: null,
        extractData: () => c.data, getCurrentPriceData: () => c.price,
        renderPreview() {}, renderNotEnteredList() {}, loadNotEnteredList() {},
        _debug() {}, _debugPricePoint() {}, _getCurrentTikTokProductId: () => info.productId, logShopeePrice() {},
        showStatus: message => messages.push(message), console: { log() {}, error() {} },
        setTimeout(callback, delay) { const id = ++serial; timers.set(id, { callback, time: now + delay }); return id; },
        clearTimeout(id) { timers.delete(id); },
        GM_xmlhttpRequest(request) {
            requests.push(request);
            if (automaticResponses) request.onload({ status: 200, responseText: '{"code":200}' });
        } };
    vm.createContext(c);
    vm.runInContext(code, c);
    async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); }
    return { c, session, local, requests, navigation, messages, checkbox, button, info,
        async advance(ms) {
            const until = now + ms;
            while (true) {
                const next = [...timers].filter(([, timer]) => timer.time <= until)
                    .sort((a, b) => a[1].time - b[1].time)[0];
                if (!next) break;
                const [id, timer] = next; timers.delete(id); now = timer.time; timer.callback(); await flush();
            }
            now = until; await flush();
        }, flush };
}

test('同平台同国家连续两次跳页，已完成商品和其他国家/平台被跳过，最后自动结束', async () => {
    const first = fixture();
    first.c.startContinuousCollection();
    await first.advance(3999);
    assert.equal(first.requests.length, 0);
    await first.advance(1);
    assert.equal(first.requests.length, 2);
    assert.equal(first.navigation[0], 'https://shopee.com.my/product/10/23');
    assert.equal(JSON.parse(first.requests[1].data).sales_count, 0);
    const second = fixture({ productId: '23', session: first.session });
    second.c.resumeContinuousCollection();
    await second.advance(4000);
    assert.equal(second.navigation[0], 'https://shopee.com.my/product/10/24');
    const third = fixture({ productId: '24', session: first.session });
    third.c.resumeContinuousCollection();
    await third.advance(4000);
    assert.equal(third.navigation.length, 0);
    assert.equal(third.session.getItem(runKey), null);
    assert.ok(third.messages.at(-1).includes('已全部完成'));
});

test('TikTok 按路径国家连续采集，等待全球评价和价格；跨国家的相同商品不匹配', async () => {
    const f = fixture({ platform: 'tk' });
    f.c.data.globalReviewCount = null; f.c.price = null;
    f.c.startContinuousCollection(); await f.advance(10000);
    assert.equal(f.requests.length, 0);
    f.c.data.globalReviewCount = 120; f.c.price = { rangePrice: '8.00 - 9.00' };
    await f.advance(4000);
    assert.equal(f.navigation[0], 'https://www.tiktok.com/shop/my/pdp/23?region=MY');
    assert.equal(JSON.parse(f.requests[1].data).global_review_count, 120);
    assert.equal(f.c.isCurrentCompetitor({ platform: 'tk', country: 'TH', product_id: '20' }), false);
});

test('缺失字段、未完成页面、变动数据均延后提交，稳定后只提交一次', async () => {
    const f = fixture(); f.c.data.shopReviewCount = null;
    f.c.startContinuousCollection(); await f.advance(12000);
    assert.equal(f.requests.length, 0);
    f.c.data.shopReviewCount = 10; f.c.document.readyState = 'interactive';
    await f.advance(4000); assert.equal(f.requests.length, 0);
    f.c.document.readyState = 'complete'; await f.advance(1000);
    f.c.data.soldCount = 100; await f.advance(2000);
    assert.equal(f.requests.length, 0);
    await f.advance(2000); assert.equal(f.requests.length, 2);
    assert.equal(f.navigation.length, 1);
});

test('缺失信息达到90秒后停止，保留复选框偏好，零值为有效信息', async () => {
    const f = fixture(); f.c.data.likes = null;
    f.c.startContinuousCollection(); await f.advance(90000);
    assert.equal(f.requests.length, 0); assert.equal(f.button.disabled, false);
    assert.equal(f.session.getItem(runKey), null);
    assert.ok(f.messages.at(-1).includes('喜欢数'));
    assert.equal(f.checkbox.checked, true);
    assert.deepEqual(Array.from(f.c.missingCollectionFields({ ...f.c.data, likes: 0 }, f.c.price)), []);
});

test('等待时取消勾选、切换页面、手动打开或过期续采进度都不自动提交', async () => {
    const f = fixture(); f.c.startContinuousCollection(); f.checkbox.checked = false;
    f.c.stopContinuousCollection(); await f.advance(90000); assert.equal(f.requests.length, 0);
    const changed = fixture(); changed.c.startContinuousCollection(); changed.info.productId = '999';
    await changed.advance(1000); assert.equal(changed.requests.length, 0);
    const fresh = fixture(); fresh.c.resumeContinuousCollection(); await fresh.advance(10000);
    assert.equal(fresh.requests.length, 0);
    for (const update of [{ expected: 'sp:MY:10:999' }, { region: 'TH' }, { platform: 'tk' }, { updatedAt: -2000000 }]) {
        const f = fixture(); f.session.setItem(runKey, JSON.stringify({ platform: 'sp', region: 'MY', expected: 'sp:MY:10:20',
            completed: [], updatedAt: 100000, ...update }));
        f.c.resumeContinuousCollection(); await f.advance(10000);
        assert.equal(f.requests.length, 0); assert.equal(f.session.getItem(runKey), null);
    }
});

test('重复点击不重复请求，只有评分和每日数据都确认成功后才跳转', async () => {
    const f = fixture({ automaticResponses: false });
    f.c.startContinuousCollection(); await f.advance(4000);
    f.c.startContinuousCollection(); f.c.collectAndSend(true);
    assert.equal(f.requests.length, 1); assert.equal(f.navigation.length, 0);
    f.requests[0].onload({ status: 200, responseText: '{"code":200}' }); await f.flush();
    assert.equal(f.requests.length, 2); assert.equal(f.navigation.length, 0);
    f.requests[1].onload({ status: 200, responseText: '{"code":200}' }); await f.flush();
    assert.equal(f.navigation.length, 1);
});

test('提交时取消勾选：评分确认后不提交每日数据；每日数据在途时成功也不跳页', async () => {
    for (const phase of ['rating', 'daily']) {
        const f = fixture({ automaticResponses: false }); f.c.startContinuousCollection(); await f.advance(4000);
        if (phase === 'daily') { f.requests[0].onload({ status: 200, responseText: '{"code":200}' }); await f.flush(); }
        f.checkbox.checked = false; f.c.stopContinuousCollection();
        f.requests.at(-1).onload({ status: 200, responseText: '{"code":200}' }); await f.flush();
        assert.equal(f.requests.length, phase === 'rating' ? 1 : 2); assert.equal(f.navigation.length, 0);
        assert.equal(f.button.disabled, false);
    }
});

test('评分或每日提交报错、超时、断网、响应损坏时停在当前页，不自动重试', async () => {
    for (const phase of ['rating', 'daily']) for (const failure of ['business', 'http', 'timeout', 'network', 'json']) {
        const f = fixture({ automaticResponses: false }); f.c.startContinuousCollection(); await f.advance(4000);
        if (phase === 'daily') { f.requests[0].onload({ status: 200, responseText: '{"code":200}' }); await f.flush(); }
        const req = f.requests.at(-1);
        if (failure === 'timeout') req.ontimeout();
        else if (failure === 'network') req.onerror();
        else req.onload({ status: failure === 'http' ? 500 : 200,
            responseText: failure === 'json' ? '<html>' : JSON.stringify({ code: failure === 'business' ? 500 : 200 }) });
        await f.flush(); await f.advance(10000);
        assert.equal(f.navigation.length, 0); assert.equal(f.session.getItem(runKey), null);
        assert.equal(f.requests.length, phase === 'rating' ? 1 : 2); assert.equal(f.button.disabled, false);
    }
});

test('同国家不同店铺的商品号单独匹配，本机偏好按平台和国家隔离', () => {
    const f = fixture();
    assert.equal(f.c.isCurrentCompetitor({ platform: 'sp', country: 'my', product_id: 20, shop_id: 10 }), true);
    assert.equal(f.c.isCurrentCompetitor({ platform: 'sp', country: 'MY', product_id: 20, shop_id: 11 }), false);
    f.local.setItem(f.c.continuousPreferenceKey(), 'true');
    assert.equal(f.c.readContinuousPreference(), true);
    const reload = fixture({ local: f.local }); assert.equal(reload.c.readContinuousPreference(), true);
    f.info.region = 'TH'; assert.equal(f.c.readContinuousPreference(), false);
});

test('下一条国家未知、链接编号非法或进度存储失败时不跳转', async () => {
    const f = fixture(); f.c.notEnteredList.splice(1, 4,
        { platform: 'sp', country: null, product_id: '23', shop_id: '10' },
        { platform: 'sp', country: 'MY', product_id: '23/path', shop_id: '10' });
    f.c.startContinuousCollection(); await f.advance(4000); assert.equal(f.navigation.length, 0);
    const failed = fixture(); failed.session.setItem = () => { throw new Error('quota'); };
    failed.c.startContinuousCollection(); await failed.advance(10000);
    assert.equal(failed.navigation.length, 0); assert.equal(failed.requests.length, 0);
});
