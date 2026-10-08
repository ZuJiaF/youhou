const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');

// 有 Playwright 时运行真实浏览器回归；浏览器路径由执行环境提供，不写死本机路径。
let chromium;
try { ({ chromium } = require('playwright')); } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
}
const source = fs.readFileSync(path.resolve(__dirname, '../多平台数据采集器.user.js'), 'utf8');
function section(start, end) { return source.slice(source.indexOf(start), source.indexOf(end)); }
const code = section('    // 连续采集：', '    // 刷新数据预览') +
    section('    function logShopeePrice(', '    // 从 SSR JSON 中递归查找价格字段') +
    section('    function updatePricePreview(', '    // 添加样式') +
    section('    function renderPreview(', '    // 显示错误') +
    section('    async function collectAndSend(', '    // 初始化');
const html = fs.readFileSync(process.env.PRICE_TEST_HTML || path.resolve(__dirname, 'fixtures/shopee-my-curtain-price.html'), 'utf8');
const mainPrice = '#sll2-normal-pdp-main section[aria-live="polite"] .pyzxvq.pw3J3G';
const harness = `
    const PLATFORM = 'sp', SCRIPT_VERSION = '2.6.18';
    let interceptedPriceData = null;
    const unsafeWindow = window, replayLogs = [], replayRequests = [];
    function _debug(value) { replayLogs.push(value); }
    function getProductInfo() {
        const parts = location.pathname.split('/');
        return { productId: parts[3], shopId: parts[2], region: 'MY' };
    }
    let notEnteredList = [{ _id: 'fixture', product_id: '28487872335', shop_id: '1549429165', platform: 'sp', country: 'MY' }];
    const API_BASE = 'https://fixture.invalid';
    function GM_xmlhttpRequest(request) {
        replayRequests.push({ url: request.url, data: request.data });
        request.onload({ status: 200, responseText: '{"code":200}' });
    }
    function extractData() { return { soldCount: 5000, productRating: 4.9, reviewCount: 992, likes: 1400, shopReviewCount: 6300 }; }
    function showStatus() {}
    function renderNotEnteredList() {}
    function loadNotEnteredList() {
        notEnteredList = [{ _id: 'fixture', product_id: '28487872335', shop_id: '1549429165', platform: 'sp', country: 'MY' }];
    }
    function _debugPricePoint() {}
`;

test('Shopee 用户回传页面售价：真实浏览器验证预览、提交与延迟填充', {
    skip: chromium ? false : '安装 Playwright 或设置 NODE_PATH 后运行浏览器回归'
}, async t => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.PRICE_TEST_BROWSER_PATH ? { executablePath: process.env.PRICE_TEST_BROWSER_PATH } : {}) });
    t.after(() => browser.close());
    async function pageFixture() {
        const page = await browser.newPage();
        // 所有请求只回放本地 HTML，没有真实商品请求，也不向 ERP 发送数据。
        await page.route('**/*', route => route.request().isNavigationRequest()
            ? route.fulfill({ contentType: 'text/html', body: html }) : route.abort());
        await page.goto('https://shopee.com.my/product/1549429165/28487872335');
        // 回放用户整页 HTML 时也可复用测试；采集器预览控件属于测试宿主。
        await page.evaluate(() => {
            for (const id of ['tiktok-preview-grid', 'tiktok-preview-hint', 'tiktok-price-range-value', 'tiktok-collector-btn']) {
                if (!document.getElementById(id)) {
                    const element = document.createElement('div'); element.id = id; document.body.append(element);
                }
            }
        });
        await page.addScriptTag({ content: harness + code });
        return page;
    }
    async function payload(page) {
        return page.evaluate(async () => {
            loadNotEnteredList();
            await collectAndSend();
            return JSON.parse(replayRequests.find(request => request.url.endsWith('/addDailyData')).data);
        });
    }
    await t.test('接口没有价格时，从原始售价节点预览及提交9.20至55.80', async () => {
        const page = await pageFixture();
        try {
            assert.equal(await page.locator(mainPrice).textContent(), 'RM9.20 - RM55.80');
            await page.evaluate(() => renderPreview(extractData()));
            assert.match(await page.locator('#tiktok-preview-grid').textContent(), /RM 9\.20 - 55\.80/);
            const price = await page.evaluate(() => getCurrentPriceData());
            assert.equal(price.source, 'page.primary_price');
            assert.equal(price.minRealPrice, 9.2);
            assert.equal(price.maxRealPrice, 55.8);
            assert.equal((await payload(page)).price_range, '9.20 - 55.80');
            assert.ok(await page.evaluate(() => replayLogs.some(line => line.includes('price-dom-v3') && line.includes('页面售价已读取'))));
        } finally { await page.close(); }
    });
    await t.test('接口解析拒绝仍有页面售价，不依赖响应编号字段', async () => {
        const page = await pageFixture();
        try {
            assert.equal(await page.evaluate(() => findShopeePriceRange({ data: { item: { currency: 'MYR', price_min: 920000, price_max: 5580000 } } },
                { endpoint: '/api/v4/pdp/get_pc', productId: '28487872335', shopId: '1549429165' })), null);
            assert.equal((await payload(page)).price_range, '9.20 - 55.80');
        } finally { await page.close(); }
    });
    await t.test('售价延迟插入和文字更新时，观察器自动刷新价格预览', async () => {
        const page = await pageFixture();
        try {
            await page.evaluate(selector => {
                const node = document.querySelector(selector);
                window.savedPrice = node.outerHTML;
                node.remove();
                installShopeePagePriceObserver();
            }, mainPrice);
            assert.equal(await page.evaluate(() => getCurrentPriceData()), null);
            await page.locator('#sll2-normal-pdp-main .nt0EaI').evaluate(node => node.insertAdjacentHTML('afterbegin', window.savedPrice));
            await page.waitForFunction(() => document.getElementById('tiktok-price-range-value').textContent === 'RM 9.20 - 55.80');
            await page.locator(mainPrice).evaluate(node => { node.firstChild.data = 'RM10.00 - RM60.00'; });
            await page.waitForFunction(() => document.getElementById('tiktok-price-range-value').textContent === 'RM 10.00 - 60.00');
            assert.equal((await payload(page)).price_range, '10.00 - 60.00');
            await page.locator(mainPrice).evaluate(node => node.remove());
            await page.waitForFunction(() => document.getElementById('tiktok-price-range-value').textContent === '未采集到');
        } finally { await page.close(); }
    });
    await t.test('售价隐藏、划线或移除时不取会员、运费、优惠券和原价', async () => {
        for (const condition of ['hidden', 'strike', 'removed']) {
            const page = await pageFixture();
            try {
                await page.locator(mainPrice).evaluate((node, condition) => {
                    if (condition === 'hidden') node.parentElement.style.display = 'none';
                    if (condition === 'strike') node.style.textDecoration = 'line-through';
                    if (condition === 'removed') node.remove();
                }, condition);
                assert.equal(await page.evaluate(() => getCurrentPriceData()), null);
                assert.ok(!Object.hasOwn(await payload(page), 'price_range'));
            } finally { await page.close(); }
        }
    });
    await t.test('已有完整接口区间时，选择单一规格不缩窄采集区间', async () => {
        const page = await pageFixture();
        try {
            await page.evaluate(() => {
                interceptedPriceData = findShopeePriceRange({ data: { item: { item_id: '28487872335', currency: 'MYR', price_min: 920000, price_max: 5580000 } } },
                    { endpoint: '/api/v4/pdp/get_pc', productId: '28487872335', shopId: '1549429165' });
            });
            await page.locator(mainPrice).evaluate(node => { node.textContent = 'RM25.50'; });
            assert.equal((await payload(page)).price_range, '9.20 - 55.80');
        } finally { await page.close(); }
    });
    await t.test('地址换商品而旧页面还在时，拒绝把旧售价绑定到新商品', async () => {
        const page = await pageFixture();
        try {
            assert.equal(await page.evaluate(() => getCurrentPriceData().rangePrice), '9.20 - 55.80');
            await page.evaluate(() => history.pushState({}, '', '/product/1549429165/99999999999'));
            assert.equal(await page.evaluate(() => getCurrentPriceData()), null);
        } finally { await page.close(); }
    });
    await t.test('支持单价和千位小数，拒绝倒置或混有文案的金额', async () => {
        const page = await pageFixture();
        try {
            for (const [text, expected] of [['RM9.20', '9.20'], ['RM1,200.00 – RM3,500.50', '1200.00 - 3500.50'],
                ['RM55.80 - RM9.20', null], ['Join VIP to buy at RM4.60', null]]) {
                await page.locator(mainPrice).evaluate((node, text) => { node.textContent = text; }, text);
                assert.equal(await page.evaluate(() => getCurrentPriceData()?.rangePrice || null), expected);
            }
        } finally { await page.close(); }
    });
});
