const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');

const source = fs.readFileSync(path.resolve(__dirname, '../多平台数据采集器.user.js'), 'utf8');
const code = source.slice(source.indexOf('    function extractTikTokData('), source.indexOf('    // 采集并发送数据'));
function fixture(texts = {}) {
    const context = {
        window: { location: { hostname: 'shopee.com.my' } },
        document: { getElementById: () => null, querySelectorAll: () => [] },
        getElementByXPath: xpath => {
            const key = xpath.includes('button[2]/div[1]') ? 'review' :
                xpath.includes('button[1]/div[1]') ? 'rating' :
                xpath.endsWith('/div/div/span') ? 'sold' :
                xpath.endsWith('/div[4]/div[2]/span') ? 'tkSold' :
                xpath.includes('pdp-review-section') ? 'globalReview' :
                xpath.includes('sll2-pdp-product-shop') ? 'shopReview' : null;
            return texts[key] == null ? null : { textContent: texts[key] };
        },
        console: { log() {}, warn() {}, error() {} }
    };
    vm.createContext(context);
    vm.runInContext(code, context);
    return context;
}

test('截图中的中文销量和评价数换算为完整数量', () => {
    const c = fixture();
    for (const [text, expected] of [['已售出 5千+', 5000], ['已售出1万+', 10000], ['1.2千 Ratings', 1200]]) {
        const actual = c.parseNumber(text);
        // [debug-done][2026-10-07] 已复现旧结果 5/1/1，修复后核对为 5000/10000/1200。
        // console.log('[debug][2026-10-07][parseNumber]', JSON.stringify({ text, actual, expected }));
        assert.equal(actual, expected, text);
    }
});

test('保留英文缩写、逗号、括号和空值处理，并支持单位间空格和繁体万', () => {
    const c = fixture();
    for (const [text, expected] of [
        ['1.4千', 1400], ['2.3万', 23000], ['1.2萬+', 12000], ['最爱 (1.4 千)', 1400],
        ['Ratings (1.2 千+)', 1200], ['1.2 k Ratings', 1200], ['6.1k', 6100],
        ['1.2M sold', 1200000], ['2m', 2000000], ['1,234', 1234], ['992 Ratings', 992],
        ['Favorite (231)', 231], ['0', 0], ['', null], [null, null], ['No ratings yet', null]
    ]) assert.equal(c.parseNumber(text), expected, String(text));
});

test('按英文标签补读时保留千/万单位，避免覆盖为小数字', () => {
    const c = fixture();
    for (const [text, label, expected] of [
        ['1.2千 Ratings', /Ratings/i, 1200], ['Ratings: 1.2 千+', /Ratings/i, 1200],
        ['5千+ Sold', /Sold/i, 5000], ['Sold 1万+', /Sold/i, 10000],
        ['Favorite (1.4千)', /Favorite/i, 1400], ['Reviews (2.3萬+)', /Reviews/i, 23000],
        ['4.9k Ratings', /Ratings/i, 4900]
    ]) {
        const element = { textContent: text };
        const root = { querySelectorAll: () => [element] };
        assert.equal(c.findShopeeLabeledStat(root, label)?.count, expected, text);
    }
});

test('Shopee 页面提取保留销量、评价数和店铺评价的中文单位', () => {
    const c = fixture({ sold: '已售出1万+', review: '1.2千', rating: '5.0', shopReview: '3万' });
    const result = c.extractShopeeData();
    assert.equal(result.soldCount, 10000);
    assert.equal(result.reviewCount, 1200);
    assert.equal(result.shopReviewCount, 30000);
    assert.equal(result.productRating, 5);
});

test('TikTok 的前缀销量、后缀销量与全球评价保留中文数量单位', () => {
    for (const text of ['已售 5千+', '1.2万+ sold', '已售出 1萬+']) {
        const c = fixture({ tkSold: text, globalReview: '1.2千 条全球评价' });
        const result = c.extractTikTokData();
        assert.equal(result.soldCount, text.includes('5千') ? 5000 : text.includes('1.2万') ? 12000 : 10000, text);
        assert.equal(result.globalReviewCount, 1200);
    }
});
