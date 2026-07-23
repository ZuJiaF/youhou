// 获取页面信息的辅助脚本
const path = require('path');

// 使用聚树erp项目中已安装的 playwright
const playwrightPath = path.join('C:', 'Users', 'Administrator', 'Desktop', '聚树erp项目', '聚树erp-前端', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

(async () => {
  // 连接到已经运行的浏览器实例
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const contexts = browser.contexts();

  if (contexts.length === 0) {
    console.log('没有找到运行中的浏览器上下文');
    return;
  }

  const context = contexts[0];
  const pages = context.pages();

  if (pages.length === 0) {
    console.log('没有打开的页面');
    return;
  }

  const page = pages[0];

  // 获取页面信息
  const url = page.url();
  const title = await page.title();

  console.log('=== 页面信息 ===');
  console.log('URL:', url);
  console.log('标题:', title);

  // 获取页面文本内容（前 500 字符）
  const bodyText = await page.locator('body').textContent();
  console.log('\n=== 页面内容预览 ===');
  console.log(bodyText.substring(0, 500));

  // 获取主要元素
  console.log('\n=== 页面结构 ===');
  const h1Count = await page.locator('h1').count();
  const buttonCount = await page.locator('button').count();
  const inputCount = await page.locator('input').count();
  console.log(`标题数量: ${h1Count}`);
  console.log(`按钮数量: ${buttonCount}`);
  console.log(`输入框数量: ${inputCount}`);

  await browser.close();
})();
