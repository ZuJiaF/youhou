// 浏览器自动化测试脚本
const path = require('path');
const fs = require('fs');

// 使用聚树erp项目中已安装的 playwright
const playwrightPath = path.join('C:', 'Users', 'Administrator', 'Desktop', '聚树erp项目', '聚树erp-前端', 'node_modules', 'playwright');
const { chromium } = require(playwrightPath);

// 读取交互配置
const configPath = path.join(__dirname, '临时', 'interaction-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

(async () => {
  console.log('启动浏览器...');

  // 启动浏览器，headless: false 表示显示浏览器窗口
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  // 尝试加载已保存的会话状态
  const storageStatePath = path.join(__dirname, '临时', 'bigseller-state.json');
  let contextOptions = { viewport: null };

  if (fs.existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
    console.log('已加载保存的会话状态');
  }

  const context = await browser.newContext(contextOptions);

  const page = await context.newPage();

  console.log('打开 Bigseller 页面...');

  // 如果有会话状态，先访问主页让状态生效
  if (fs.existsSync(storageStatePath)) {
    await page.goto('https://www.bigseller.pro');
    await page.waitForLoadState('networkidle');
    console.log('已访问主页，等待会话状态生效...');
    await page.waitForTimeout(2000);
  }

  await page.goto(config.bigseller.url);

  // 等待页面加载
  await page.waitForLoadState('networkidle');

  // 检查是否需要登录
  console.log('检查登录状态...');
  const needLogin = await page.locator('input[type="text"], input[placeholder*="账号"], input[placeholder*="用户名"]').count() > 0;

  if (needLogin) {
    console.log('需要登录，开始自动登录...');

    // 等待登录表单出现
    await page.waitForSelector('input[type="text"], input[placeholder*="账号"], input[placeholder*="用户名"]', { timeout: 5000 });

    // 输入用户名
    const usernameInput = page.locator('input[type="text"], input[placeholder*="账号"], input[placeholder*="用户名"]').first();
    await usernameInput.fill(config.bigseller.username);
    console.log('已输入账号');

    // 输入密码
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(config.bigseller.password);
    console.log('已输入密码');

    console.log('等待人工处理验证码并登录...');
    console.log('请在浏览器窗口中完成验证码和登录操作');

    // 等待登录完成（检测页面 URL 变化或登录表单消失）
    await page.waitForFunction(() => {
      return !document.querySelector('input[type="password"]') ||
             window.location.href.includes('warehouseInventory');
    }, { timeout: 120000 }); // 等待最多 2 分钟

    console.log('检测到登录完成');
  } else {
    console.log('已登录或无需登录');
  }

  console.log('页面已就绪，等待进一步操作...');
  console.log('浏览器将保持打开状态，按 Ctrl+C 关闭');

  // 暴露 page 对象供外部使用
  global.page = page;
  global.browser = browser;
  global.context = context;

  // 添加定时检查，等待用户在配置文件中写入指令
  const checkInterval = setInterval(async () => {
    try {
      const currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const command = currentConfig.command;

      if (command) {
        console.log('\n收到指令:', command);

        if (command === 'get-page-info') {
          const url = page.url();
          const title = await page.title();
          console.log('=== 页面信息 ===');
          console.log('URL:', url);
          console.log('标题:', title);

          const bodyText = await page.locator('body').textContent();
          console.log('\n页面内容预览（前500字符）:');
          console.log(bodyText.substring(0, 500));

        } else if (command === 'get-html') {
          const html = await page.content();
          const outputPath = path.join(__dirname, '临时', 'page-snapshot.html');
          fs.writeFileSync(outputPath, html, 'utf-8');
          console.log('页面HTML已保存到:', outputPath);

        } else if (command === 'get-elements') {
          console.log('\n=== 页面元素信息 ===');

          // 获取所有按钮
          const buttons = await page.locator('button').all();
          console.log(`\n按钮数量: ${buttons.length}`);
          for (let i = 0; i < Math.min(buttons.length, 10); i++) {
            const text = await buttons[i].textContent();
            const classes = await buttons[i].getAttribute('class');
            console.log(`按钮${i + 1}: "${text?.trim()}" (class: ${classes})`);
          }

          // 获取所有输入框
          const inputs = await page.locator('input').all();
          console.log(`\n输入框数量: ${inputs.length}`);
          for (let i = 0; i < Math.min(inputs.length, 10); i++) {
            const type = await inputs[i].getAttribute('type');
            const placeholder = await inputs[i].getAttribute('placeholder');
            const value = await inputs[i].inputValue();
            console.log(`输入框${i + 1}: type="${type}", placeholder="${placeholder}", value="${value}"`);
          }

          // 获取主要文本
          const h1s = await page.locator('h1, h2, h3').all();
          console.log(`\n标题数量: ${h1s.length}`);
          for (let i = 0; i < Math.min(h1s.length, 10); i++) {
            const text = await h1s[i].textContent();
            console.log(`标题${i + 1}: "${text?.trim()}"`);
          }

        } else if (command === 'save-cookies') {
          const cookies = await context.cookies();
          const cookiesPath = path.join(__dirname, '临时', 'bigseller-cookies.json');
          fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2), 'utf-8');
          console.log('Cookies已保存到:', cookiesPath);
          console.log('保存了', cookies.length, '个cookie');

        } else if (command === 'save-state') {
          const storageStatePath = path.join(__dirname, '临时', 'bigseller-state.json');
          await context.storageState({ path: storageStatePath });
          console.log('会话状态已保存到:', storageStatePath);
          console.log('包含 cookies、localStorage、sessionStorage');

        } else if (command.startsWith('click:')) {
          const text = command.replace('click:', '').trim();
          console.log('尝试点击包含文本的元素:', text);
          const element = page.locator(`text="${text}"`).first();
          await element.click({ timeout: 5000 });
          console.log('已点击:', text);
        }

        // 清除指令
        delete currentConfig.command;
        fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2), 'utf-8');
      }
    } catch (err) {
      // 输出错误信息而不是忽略
      if (err.message && !err.message.includes('ENOENT')) {
        console.error('执行指令时出错:', err.message);
      }
    }
  }, 1000);

  // 保持浏览器打开，等待用户操作

})();
