# 油猴脚本项目规则

## 版本号配置

**注：通用的版本号管理规范已提取到用户级规则，此处仅指定项目特定配置。**

版本号位置：UserScript 元数据中的 `@version` 字段

示例：
```javascript
// ==UserScript==
// @version      0.0.1
// ==/UserScript==
```

⚠️ **例外：`生成货物清单/` 不是油猴脚本**，它跑在 WPS AirScript 里，没有 UserScript 元数据。
版本号写在 `生成货物清单.js` **第一行的注释**里，格式 `//vX.Y.Z` 或 `//vX.Y.Z-beta.N`。
改它的版本号不要去找 `@version`，见下方「生成货物清单子项目」。

## 云端后端

- **项目路径**：`C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端`
- **平台**：支付宝云（uniCloud-alipay）
- **云函数目录**：`uniCloud-alipay/cloudfunctions/`
- **数据库 Schema 目录**：`uniCloud-alipay/database/`
- **Bigseller换货相关**：
  - 云对象：`uniCloud-alipay/cloudfunctions/bigsellerSwap/index.obj.js`（旧地址兼容）
  - HTTP 兼容代理：`uniCloud-alipay/cloudfunctions/bigsellerSwap-api/index.obj.js`（新地址转发）
  - 数据库集合：`bigseller-swap-record`
  - Schema：`uniCloud-alipay/database/bigseller-swap-record.schema.json`
  - 接口基础 URL：`https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/api/bigsellerSwap`
  - 唯一键：`orderNo + rootSku`（rootSku 是平台原始 varSku，不随换货变化）

## 部署提醒规范

**注：通用的 UniCloud 部署提醒规范已提取到用户级规则，此处仅保留项目特定配置。**

当修改涉及云对象或数据库 Schema 文件时，使用以下路径格式：

```
【需要部署的文件】
- 云对象：C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端\uniCloud-alipay\cloudfunctions\<函数名>\index.obj.js
- 数据库Schema：C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端\uniCloud-alipay\database\<集合名>.schema.json
```

这样用户可以直接定位文件并在支付宝云控制台部署。

## 发行加密配置

**注：通用的发行加密提醒规范已提取到用户级规则，此处仅指定项目特定配置。**

**本项目"发行"= 跑下面的混淆命令产出 `正式版-` 文件，不是 git commit / push。**
用户只说"发行"时不要去提交代码；要提交会另外说"提交"。

加密命令：
```bash
node encrypt.js "<脚本文件路径>"
```

输出文件：同目录下 `正式版-<原文件名>`

注意：
- 脚本源码是 `.txt` 后缀（如 `Bigseller相关/Bigseller助手.txt`），路径要带引号
- 发行前先确认源码 `@version` 已更新为本次新版本，否则产物带的是旧版号，油猴不会提示更新
- 产物体积 400KB+ 且不可读，**不要 cat 整个文件**，只校验头部版本号和 `node --check`
- 本项目习惯把 `正式版-*` 一起提交入库（见 git 历史）

## 生成货物清单子项目（WPS AirScript，不是油猴脚本）

2026-08-25 用 `git subtree` 从独立仓库 `wpsJs`（`https://github.com/ZuJiaF/wpsJs.git`）并入，
源仓库的提交历史已一并保留在本仓库里。

- **目录**：`生成货物清单/`
- **运行环境**：WPS AirScript 2.0（金山表格里的脚本环境），提供 `Application`、`ActiveWorkbook`、
  `HTTP`、`KSDrive`、`xlCenter`、`RGB()` 等全局对象 —— **不是 Node.js，也不是浏览器**，
  所以既不能用 `require`，也没有 `document` / `window` / `GM_*`
- **主脚本**：`生成货物清单/生成货物清单.js`，从「功能表」读数据，生成「采购表」并写入远端目标工作簿
- **版本号**：文件第一行 `//vX.Y.Z`，进 beta 用 `//vX.Y.Z-beta.N`（当前 `v0.6.0-beta.7`）
- **不参与加密发行**：`node encrypt.js` 只针对油猴脚本，AirScript 是贴进 WPS 网页里跑的，不要混淆它
- **详细约定**（数据结构 `huoWuQingDanData` 的列式布局、`arrayObj` 等关键变量、列 ID 查找方式）
  见 `生成货物清单/CLAUDE.md`

货物清单 PDF **不是脚本自己画的**，是把数据 POST 给云端云对象生成：

- 云对象：`聚树erp-支付宝云后端/uniCloud-alipay/cloudfunctions/wps/index.obj.js`
- 接口地址：`https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/api/wps/generatePdf`
  （2026-08-25 已从旧地址 `/wps/generatePdf` 切到 `/api` 前缀，修 CrashError）
- 后端用 `pdfkit` + 思源黑体排版，传云存储后返回临时下载链接

## 接口文档维护配置

**注：通用的接口文档维护规范已提取到用户级规则，此处仅指定项目特定配置。**

文档组织方式：按子项目文件夹层级管理

每个子项目文件夹中维护目标网站的原生接口文档（接口 URL、请求体、响应体等）。
