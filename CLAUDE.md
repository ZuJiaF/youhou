# 油猴脚本项目规则

## 版本号规范

每次修改油猴脚本代码后，必须根据修改量更新 UserScript 元数据中的 `@version` 字段。

- 版本号格式：`主版本.次版本.补丁版本`（如 `0.0.1`）
- 初始版本：`0.0.1`
- 版本递增规则（任何代码修改至少补丁版本 +1）：
  - **补丁版本 +1**：任何代码改动的最低增量，包括修改选择器、调整样式、bug 修复、文案调整、修改参数值等
  - **次版本 +1**：新增功能模块（如新增弹窗、新增按钮功能）、增加新的 API 调用
  - **主版本 +1**：重大重构、架构重写、不兼容的变更
  - 注意：补丁版本可以超过 9（如 `0.0.10`、`0.0.11`），不需要因此进位到次版本

示例：
```javascript
// ==UserScript==
// @version      0.0.1
// ==/UserScript==
```

## 云端后端

- **项目路径**：`C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端`
- **平台**：支付宝云（uniCloud-alipay）
- **云函数目录**：`uniCloud-alipay/cloudfunctions/`
- **数据库 Schema 目录**：`uniCloud-alipay/database/`
- **Bigseller换货相关**：
  - 云函数：`uniCloud-alipay/cloudfunctions/bigsellerSwap/index.obj.js`
  - 数据库集合：`bigseller-swap-record`
  - Schema：`uniCloud-alipay/database/bigseller-swap-record.schema.json`
  - 接口基础 URL：`https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/bigsellerSwap`
  - 唯一键：`orderNo + rootSku`（rootSku 是平台原始 varSku，不随换货变化）

## 部署提醒规范

当修改涉及云对象或数据库 Schema 文件时，必须在回复末尾列出需要部署的文件清单，格式如下：

```
【需要部署的文件】
- 云对象：C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端\uniCloud-alipay\cloudfunctions\<函数名>\index.obj.js
- 数据库Schema：C:\Users\Administrator\Desktop\聚树erp项目\聚树erp-支付宝云后端\uniCloud-alipay\database\<集合名>.schema.json
```

这样用户可以直接定位文件并在支付宝云控制台部署。

## 发行加密提醒规范

每次修改油猴脚本代码后，必须在回复末尾附上以下提示：

```
如果需要发行请告诉我，我将调用脚本生成一份加密过的文件，以便供用户使用。
```

当用户确认需要加密时，执行以下命令：

```bash
node encrypt.js "<脚本文件路径>"
```

加密后的文件会自动生成在原文件同级目录，文件名为 `正式版-<原文件名>`。

## 接口文档维护规范

项目采用文件夹层级管理子项目，每个子项目文件夹中会维护目标网站的原生接口文档（接口 URL、请求体、响应体等）。

当用户在开发过程中提供了接口的请求体、响应体或网络请求流水时，AI 需要：

1. **查找对应接口文档**：在当前子项目文件夹中查找是否已有该接口的记录文件
2. **有记录则查漏补缺**：对比用户提供的数据与已有文档，补充缺失的字段、更新变化的值、添加新发现的状态枚举等
3. **无记录则新建**：在对应子项目文件夹中记录该接口信息，包括：
   - 接口 URL
   - 请求方法（GET/POST 等）
   - 请求体结构及关键字段说明
   - 响应体结构及关键字段说明
   - 重要的枚举值（如状态码、state 字段的可能值等）

这样后续调用相关接口时，无需重新测试或盲猜接口的各项参数和返回值。
