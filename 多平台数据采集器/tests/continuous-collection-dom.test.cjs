const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
let chromium;
try { ({ chromium } = require('playwright')); } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
}
const source = fs.readFileSync(path.resolve(__dirname, '../多平台数据采集器.user.js'), 'utf8');

test('完整脚本浏览器回放：复选框持久化、慢加载等待、跳页恢复与同国家批次结束', {
    skip: chromium ? false : '安装 Playwright 或设置 NODE_PATH 后运行浏览器回归'
}, async t => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.PRICE_TEST_BROWSER_PATH ? { executablePath: process.env.PRICE_TEST_BROWSER_PATH } : {}) });
    t.after(() => browser.close());
    const page = await browser.newPage();
    const pending = [
        { _id: 'one', platform: 'sp', country: 'MY', shop_id: '10', product_id: '20', name: '马来商品一' },
        { _id: 'other-country', platform: 'sp', country: 'TH', shop_id: '10', product_id: '21', name: '泰国商品' },
        { _id: 'other-platform', platform: 'tk', country: 'MY', product_id: '22', name: '另一平台商品' },
        { _id: 'two', platform: 'sp', country: 'MY', shop_id: '11', product_id: '23', name: '马来商品二' }
    ];
    const completed = new Set(), writes = [];
    await page.exposeFunction('__fixtureRequest', (url, payload) => {
        const method = url.split('/').at(-1);
        if (method === 'getTodayNotEntered') return { code: 200, data: pending.filter(row => !completed.has(row._id)) };
        if (method === 'addDailyData') { const data = JSON.parse(payload); writes.push(data); completed.add(data.competitor_id); }
        return { code: 200 };
    });
    await page.route('**/*', route => route.request().isNavigationRequest() ? route.fulfill({
        contentType: 'text/html; charset=utf-8', body: `<!doctype html><html><head><meta charset="utf-8"></head><body>
        <div id="sll2-normal-pdp-main">
          <div><span>4.9</span><button>994 Ratings</button><span>5千 Sold</span></div>
          <button>Favorite (1.4千)</button>
          <section aria-live="polite"><div class="pyzxvq pw3J3G">RM9.20 - RM55.80</div></section>
        </div>
        <div id="sll2-pdp-product-shop"></div>
        </body></html>`
    }) : route.abort());
    await page.addInitScript(() => {
        window.unsafeWindow = window;
        window.GM_info = { script: { version: '2.7.0' } };
        window.GM_addStyle = css => {
            const append = () => { const style = document.createElement('style'); style.textContent = css; document.head.append(style); };
            if (document.head) append(); else document.addEventListener('DOMContentLoaded', append);
        };
        window.GM_xmlhttpRequest = request => {
            window.__fixtureRequest(request.url, request.data).then(result =>
                request.onload({ status: 200, responseText: JSON.stringify(result) })).catch(() => request.onerror());
        };
    });
    await page.addInitScript({ content: source });
    await page.goto('https://shopee.com.my/product/10/20');
    const checkbox = page.locator('#tiktok-continuous-checkbox');
    await page.waitForFunction(() => document.querySelectorAll('.tiktok-link-item').length === 3);
    assert.equal(await checkbox.isChecked(), false);
    assert.equal(await page.locator('#tiktok-collector-btn').textContent(), '📊 采集');
    await checkbox.check();
    await page.reload();
    await page.waitForFunction(() => document.querySelectorAll('.tiktok-link-item').length === 3);
    assert.equal(await checkbox.isChecked(), true);
    assert.equal(writes.length, 0); // 只恢复偏好，重新打开页面需要点击开始。
    await page.locator('#tiktok-collector-btn').click();
    await page.waitForFunction(() => document.getElementById('tiktok-collector-status').textContent.includes('店铺评价数'));
    assert.equal(writes.length, 0);
    await page.locator('#sll2-pdp-product-shop').evaluate(node => { node.innerHTML = '<span>6.4千 Ratings</span>'; });
    await page.waitForURL('https://shopee.com.my/product/11/23', { timeout: 15000 });
    await page.waitForFunction(() => document.getElementById('tiktok-collector-status')?.textContent.includes('店铺评价数'));
    assert.equal(await checkbox.isChecked(), true);
    assert.equal(writes.length, 1);
    await page.locator('#sll2-pdp-product-shop').evaluate(node => { node.innerHTML = '<span>6.4千 Ratings</span>'; });
    await page.waitForFunction(() => document.getElementById('tiktok-collector-status')?.textContent.includes('已全部完成'),
        null, { timeout: 15000 });
    assert.deepEqual(writes.map(data => data.competitor_id), ['one', 'two']);
    assert.ok(writes.every(data => data.sales_count === 5000 && data.review_count === 994 && data.likes === 1400 &&
        data.shop_review_count === 6400 && data.price_range === '9.20 - 55.80'), JSON.stringify(writes));
    assert.equal(page.url(), 'https://shopee.com.my/product/11/23');
    assert.equal(await page.locator('#tiktok-collector-btn').isDisabled(), false);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('erp-collector:continuous-run:v1')), null);
    await checkbox.uncheck();
    await page.reload();
    await checkbox.waitFor();
    assert.equal(await checkbox.isChecked(), false);
});
