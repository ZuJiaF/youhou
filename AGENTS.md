# 油猴脚本项目规则

本文件是从同目录 `CLAUDE.md` 复制并适配给 Codex 的项目指导。Claude 原文件保留不变。

## 版本号配置

版本号位于 UserScript 元数据中的 `@version` 字段：

```javascript
// ==UserScript==
// @version      0.0.1
// ==/UserScript==
```

代码实际改动并保存后，必须按语义化版本更新补丁版本，并在最终回复中说明版本号变化。详细规则见 `.codex/claude-rules/version-management.md`。

## 云端后端

- 项目路径：`C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端`
- 平台：支付宝云（uniCloud-alipay）
- 云函数目录：`uniCloud-alipay/cloudfunctions/`
- 数据库 Schema 目录：`uniCloud-alipay/database/`
- Bigseller 换货相关：
  - 云对象：`uniCloud-alipay/cloudfunctions/bigsellerSwap/index.obj.js`（旧地址兼容）
  - HTTP 兼容代理：`uniCloud-alipay/cloudfunctions/bigsellerSwap-api/index.obj.js`（新地址转发）
  - 数据库集合：`bigseller-swap-record`
  - Schema：`uniCloud-alipay/database/bigseller-swap-record.schema.json`
  - 接口基础 URL：`https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/api/bigsellerSwap`
  - 唯一键：`orderNo + rootSku`（`rootSku` 是平台原始 `varSku`，不随换货变化）

## 部署提醒

修改云对象或数据库 Schema 后，在最终回复中按以下格式列出需要部署的文件：

```text
【需要部署的文件】
- 云对象：C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端\uniCloud-alipay\cloudfunctions\<函数名>\index.obj.js
- 数据库Schema：C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端\uniCloud-alipay\database\<集合名>.schema.json
```

需要执行部署时，使用 `unicloud-deploy` 技能；详细提醒规则见 `.codex/claude-rules/unicloud-deployment-reminder.md`。

## 发行加密配置

**本项目"发行"= 跑下面的混淆命令产出 `正式版-` 文件，不是 git commit / push。**
用户只说"发行"时不要去提交代码；要提交会另外说"提交"。

发行加密命令：

```bash
node encrypt.js "<脚本文件路径>"
```

输出文件：同目录下 `正式版-<原文件名>`。详细提醒要求见 `.codex/claude-rules/release-encryption-reminder.md`。

注意：

- 脚本源码是 `.txt` 后缀（如 `Bigseller相关/Bigseller助手.txt`），路径要带引号
- 发行前先确认源码 `@version` 已更新为本次新版本，否则产物带的是旧版号，油猴不会提示更新
- 产物体积 400KB+ 且不可读，不要 cat 整个文件，只校验头部版本号和 `node --check`
- 本项目习惯把 `正式版-*` 一起提交入库（见 git 历史）

## 接口文档维护

接口文档按子项目文件夹层级管理。每个子项目文件夹维护目标网站的原生接口文档，包括接口 URL、请求体和响应体等。

用户提供接口请求、响应或网络流水时，读取并遵循 `.codex/claude-rules/api-documentation-maintenance.md`；敏感 Token、密码和 Cookie 不写入文档。

## 已复制的 Claude 全局规则

完整副本在 `.codex/claude-rules/`。根据任务触发条件读取相应文件，不必在每次任务中加载全部规则：

- 报 Bug、异常、数据不一致或性能问题：`debug-by-logging.md`
- 需要维护第三方接口文档：`api-documentation-maintenance.md`
- 创建复杂项目、规划或多角色协作文档：使用 `write-doc` 技能，并读取 `complex-doc-skill-index.md`
- 修改小程序前端或要上传体验版：`miniprogram-upload-reminder.md`，并使用 `miniprogram-upload` 技能
- 提到手机接力、手机互联或同步会话：`mobile-relay-bridge.md`
- 希望输出更清晰、精简或适合手机阅读：`output-clarity.md`
- 处理 picker 默认值或 value 绑定：`picker-value-binding.md`
- 需要临时文件、下载或导出文件：`temp-file-naming.md`
- 修改 uniCloud 项目：`unicloud-dev.md`、`unicloud-loading-mechanism.md` 和 `unicloud-deployment-reminder.md`
- 需要更新版本号：`version-management.md`

将原规则中提到的 `CLAUDE.md` 理解为本文件 `AGENTS.md`，将 `.claude` 路径理解为本项目的 `.codex` 路径或 `C:\Users\Administrator\.codex`。
