# 小程序前端上传提醒规范

## 核心原则

**修改 uni-app/微信小程序的前端代码后，必须立即提醒用户重新上传小程序到微信公众平台。不论修改大小，只要改了前端文件就必须提醒。**

不要假设用户知道要上传，必须每次明确告知。

## 适用项目

- uni-app 项目（微信小程序、支付宝小程序等）
- 原生微信小程序项目
- Taro 小程序项目
- 其他小程序框架项目

## 触发条件

以下任何一种情况都必须提醒：
- 修改了 `pages/` 下任何页面文件（`.vue`、`.uvue`、`.js`、`.ts`、`.wxml`、`.wxss` 等）
- 修改了 `components/` 下任何组件文件
- 修改了应用入口文件（`App.vue`、`App.uvue`、`app.js` 等）
- 修改了配置文件（`pages.json`、`manifest.json`、`app.json` 等）
- 修改了全局样式（`uni.scss`、`app.wxss` 等）
- 修改了静态资源（`static/` 目录下的图片、字体等）
- 添加了调试代码（console.log）到前端文件
- 修复了前端 Bug
- 新增了页面或组件

## 提醒格式

### 标准格式（仅前端修改）

```
代码已修改完成。

--- 需要重新上传小程序 ---
修改文件：pages/overview/index.uvue

上传方式：
1. 使用 /miniprogram-upload 技能命令行上传体验版
2. 或在 HBuilderX/开发者工具中手动上传到微信公众平台
```

### 多文件修改

```
代码已修改完成。

--- 需要重新上传小程序 ---
修改文件：
- pages/add/index.uvue
- pages/overview/index.uvue
- components/item-card/item-card.uvue

上传方式：
1. 使用 /miniprogram-upload 技能命令行上传体验版
2. 或在 HBuilderX/开发者工具中手动上传到微信公众平台
```

### 同时修改前端和后端（uni-app + uniCloud）

当一次改动同时涉及前端和云对象/云函数时，分别列出：

```
代码已修改完成。

--- 需要重新上传 ---
云对象：uniCloud-alipay/cloudfunctions/item-center

--- 需要重新上传小程序 ---
修改文件：pages/add/index.uvue

建议顺序：
1. 先使用 /unicloud-deploy 部署云对象
2. 再使用 /miniprogram-upload 上传小程序
（避免接口不匹配）
```

## 文件类型识别

### uni-app 项目
- 页面：`.vue`、`.uvue`
- 脚本：`.js`、`.ts`、`.uts`
- 样式：`.css`、`.scss`、`.sass`、`.less`
- 配置：`pages.json`、`manifest.json`、`uni.config.js`

### 原生微信小程序
- 页面：`.wxml`、`.wxss`、`.js`、`.json`
- 配置：`app.json`、`project.config.json`

### Taro 项目
- 页面：`.jsx`、`.tsx`
- 配置：`app.config.js`、`project.config.json`

## 上传方式说明

### 1. 命令行上传（推荐）

uni-app 项目使用 `/miniprogram-upload` 技能：
- 自动读取配置
- 自动上传到微信公众平台
- 可设置版本号和描述

### 2. 手动上传

#### HBuilderX（uni-app）
- 发行 → 小程序-微信
- 上传到微信公众平台

#### 微信开发者工具（原生小程序）
- 右上角"上传"按钮
- 填写版本号和备注
- 上传到微信公众平台

## AI 助手工作规范

1. **修改前端代码后必须立即提醒上传** — 不论修改大小
2. **不要假设用户知道要上传** — 每次都明确告知
3. **使用标准格式列出修改的文件**
4. **多文件修改时逐一列出**
5. **前后端同时修改时，提醒上传顺序**
6. **在回复末尾添加提醒，确保用户看到**
7. **当用户确认要上传时，立即调用 `/miniprogram-upload` 技能执行上传，而不是只给操作指引**

## 区分前端和后端

### 前端代码（需要上传小程序）
- `pages/`、`components/` — 页面和组件
- `static/` — 静态资源
- `App.vue`、`App.uvue` — 应用入口
- `pages.json`、`manifest.json` — 配置文件
- `uni.scss` — 全局样式

### 后端代码（需要部署云端）
- `uniCloud-*/cloudfunctions/` — 云对象/云函数
- `uniCloud-*/database/` — 数据库 Schema
- 云对象的 `index.obj.js`、云函数的 `index.js`

## 注意事项

- HBuilderX 自动编译只是本地预览，用户端（已发布的小程序）不会更新
- 必须重新上传到微信公众平台，用户才能在体验版/正式版中看到修改
- 上传体验版后，需要在微信公众平台设置体验者才能扫码体验
- 正式发布需要提交审核，审核通过后才能发布到线上

## 例外情况

以下情况可以不提醒上传：
- 仅讨论、询问，未实际修改代码
- 只读取文件查看
- 计划功能但未实现
- 用户明确说"只是看看，不用上传"
