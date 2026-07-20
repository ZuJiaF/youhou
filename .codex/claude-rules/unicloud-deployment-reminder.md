---
name: unicloud-deployment-reminder
description: UniCloud 后端修改后的部署提醒规范（强制）
version: 1.1.0
updated: 2026-07-01
type: rule
---

# UniCloud 后端部署提醒规范（强制）

## 核心原则

**每次修改云对象/云函数代码后，必须立即提醒用户部署。不论修改大小、不论是调试代码还是正式代码，只要改了后端文件就必须提醒。**

不要假设用户知道要部署，必须每次明确告知。

## 触发条件

以下任何一种情况都必须提醒：
- 修改了 `cloudfunctions/` 下任何 `.js` 文件
- 添加了调试日志（console.log）
- 修复了 bug
- 新增了方法
- 修改了参数解析逻辑
- 修改了数据库 Schema 文件
- 修改了云函数依赖（package.json）

## 需要提醒的文件类型

### 1. 修改云对象代码
- 入口文件：`index.obj.js`
- 提醒：云对象文件夹路径（精确到云对象文件夹名）

### 2. 修改云函数代码
- 入口文件：`index.js`
- 提醒：云函数文件夹路径（精确到云函数文件夹名）

### 3. 修改数据库 Schema
- 文件：`.schema.json`
- 提醒：Schema 文件完整路径（精确到文件名）

### 4. 修改云函数依赖
- 文件：`package.json`
- 提醒：需要重新上传并安装依赖

## 提醒格式

### 标准格式（单服务空间）

```
--- 需要重新上传 ---
云对象：uniCloud-aliyun/cloudfunctions/user-center
云函数：uniCloud-aliyun/cloudfunctions/send-sms
数据库Schema：uniCloud-aliyun/database/users.schema.json
```

### 多服务空间格式

当项目存在多个服务空间时，需标注服务空间名称：

```
--- 需要重新上传的云对象 ---
阿里云：项目名/uniCloud-aliyun/cloudfunctions/account

--- 需要重新上传的云函数 ---
支付宝云：项目名/uniCloud-alipay/cloudfunctions/recalcSales

--- 需要重新上传的 Schema ---
阿里云：项目名/uniCloud-aliyun/database/accountList.schema.json
```

## 路径精度要求

### 云对象/云函数
- ✅ **只写到文件夹名**：`cloudfunctions/user-center`
- ❌ **不要写到具体文件**：`cloudfunctions/user-center/index.obj.js`

原因：上传单位是文件夹，HBuilderX 会自动上传文件夹内所有文件。

### 数据库 Schema
- ✅ **写完整文件路径**：`database/users.schema.json`
- ❌ **不要只写目录**：`database/`

原因：Schema 文件需要单独上传，必须精确到文件名。

## 多文件处理

当同时修改多个云对象、云函数或 Schema 时，**逐行列出**：

```
--- 需要重新上传 ---
云对象：uniCloud-aliyun/cloudfunctions/user-center
云对象：uniCloud-aliyun/cloudfunctions/product
云函数：uniCloud-aliyun/cloudfunctions/sync-data
数据库Schema：uniCloud-aliyun/database/users.schema.json
数据库Schema：uniCloud-aliyun/database/products.schema.json
```

## 区分云对象与云函数

在提醒时必须区分：

| 类型 | 入口文件 | 调用方式 |
|------|---------|----------|
| 云对象 | `index.obj.js` | `uniCloud.importObject()` 或 URL化 |
| 云函数 | `index.js` | `uniCloud.callFunction()` 或 HBuilderX 本地运行 |

## 项目特定配置

不同项目可能有不同的服务空间配置，在项目的 CLAUDE.md 中指定：
- 服务空间名称（阿里云、支付宝云等）
- 项目路径前缀
- 特殊的部署流程

## AI 助手工作规范

1. **修改后端代码后必须立即提醒部署** — 不论修改大小
2. **不要假设用户知道要部署** — 每次都明确告知
3. **使用标准格式列出路径**
4. **路径精确到云对象/云函数文件夹名，Schema 精确到文件名**
5. **多服务空间时标注服务空间名称**
6. **区分云对象和云函数**
7. **如果一次修改了多个云对象，逐一列出需要部署的云对象名称**
8. **在回复末尾添加提醒，确保用户看到**
9. **当用户确认要上传/部署时，立即调用 `unicloud-deploy` 技能（Skill 工具）执行 CLI 部署，而不是只给操作指引**

## 示例

### 示例 1：修改单个云对象

```
代码已修改完成。

--- 需要重新上传 ---
云对象：uniCloud-aliyun/cloudfunctions/user-center
```

### 示例 2：修改云对象 + Schema

```
数据库字段和云对象方法已更新。

--- 需要重新上传 ---
云对象：uniCloud-aliyun/cloudfunctions/account
数据库Schema：uniCloud-aliyun/database/accountList.schema.json
```

### 示例 3：多服务空间

```
已同步更新阿里云和支付宝云的云对象。

--- 需要重新上传的云对象 ---
阿里云：项目名/uniCloud-aliyun/cloudfunctions/payment
支付宝云：项目名/uniCloud-alipay/cloudfunctions/payment
```
