---
name: version-management
description: 项目版本号管理规范 - 语义化版本与 Beta 版本流程
version: 1.1.0
updated: 2026-07-05
type: rule
---

# 版本号管理规范

## 核心原则

**版本号必须反映代码变更，遵循语义化版本规范，便于追踪和回退。**

## 语义化版本格式

`主版本.次版本.补丁版本` (例如：`1.2.3`)

### 递增规则

**重要：任何代码改动至少递增补丁版本 +1**

#### 补丁版本 +1（Patch）
最小变更单位，包括：
- 修改选择器、样式调整
- Bug 修复
- 文案调整
- 修改参数值、配置项
- 代码格式化、注释更新（如果影响功能理解）

**注意**：补丁版本可以超过 9（如 `0.0.10`、`0.0.11`），不需要因此进位

#### 次版本 +1（Minor）
功能性增强，向后兼容：
- 新增功能模块（如新增弹窗、按钮功能）
- 新增 API 调用
- 新增配置选项
- 改进现有功能

#### 主版本 +1（Major）
重大变更，可能不兼容：
- 重大重构、架构重写
- 不兼容的 API 变更
- 移除已废弃功能
- 改变核心行为逻辑

## Beta 版本管理

### 进入 Beta 测试

当功能开发完成，进入测试阶段：
- 版本号从 `X.Y.Z` 更新为 `X.Y.(Z+1)-beta.1`
- 示例：`1.2.3` → `1.2.4-beta.1`

### Beta 版本迭代

在 Beta 期间的每次代码改动：
- 版本号从 `X.Y.Z-beta.N` 更新为 `X.Y.Z-beta.(N+1)`
- 示例：`1.2.4-beta.1` → `1.2.4-beta.2`

### 退出 Beta（正式发布）

测试通过后，手动移除 `-beta.N` 后缀：
- 版本号从 `X.Y.Z-beta.N` 回到 `X.Y.Z`
- 示例：`1.2.4-beta.3` → `1.2.4`

### 再次进入 Beta

正式版发布后，下次进入 Beta 时：
- 使用当前版本号的 Z，从 `-beta.1` 开始
- 示例：`1.2.4` → 下次新功能测试 → `1.2.5-beta.1`（或 `1.3.0-beta.1`，取决于变更类型）

## 项目类型适配

不同项目类型，版本号位置不同：

### UserScript（油猴脚本）
在文件头部的 UserScript 元数据中：
```javascript
// ==UserScript==
// @version      0.0.1
// @name         脚本名称
// ==/UserScript==
```

### JavaScript/TypeScript 文件
在文件首行作为注释：
```javascript
//v1.2.3
// 或
//v1.2.3-beta.1

// 其他代码...
```

### package.json
在 `version` 字段：
```json
{
  "name": "project-name",
  "version": "1.2.3"
}
```

### uniCloud / uniApp 项目
在项目根目录的 `manifest.json` 中（uniApp/uniCloud 项目的版本号入口），修改 `versionName` 字段（对应用户可见的语义化版本号）；如需同步递增 `versionCode`（数字型版本号，主要用于 App 升级判断），也一并更新：
```json
{
  "name": "项目名",
  "appid": "__UNI__XXXXXX",
  "versionName": "1.2.3",
  "versionCode": "100"
}
```
注意：uniApp/uniCloud 项目**优先**在 `manifest.json` 更新版本号，而不是 `package.json`。

### Python 模块
在 `__version__` 变量：
```python
__version__ = "1.2.3"
```

### uniCloud / uniapp 项目
在项目根目录的 `manifest.json` 中的 `version` 字段：
```json
{
  "name": "项目名称",
  "appid": "__UNI__XXXXXXX",
  "version": {
    "name": "1.2.3",
    "code": "100"
  }
}
```

- `version.name`（版本名称）：语义化版本号，用户可见
- `version.code`（版本号）：整数，用于版本比对，每次发布 App 需递增
- **优先修改 `version.name`**，若涉及 App 发布则同步递增 `version.code`

### uniCloud / uniApp 项目
版本号在**项目根目录的 `manifest.json`** 中，而不是 `package.json`。

```json
{
  "name" : "项目名称",
  "appid" : "__UNI__XXXXXXX",
  "description" : "",
  "versionName" : "1.2.3",
  "versionCode" : "100"
}
```

- **versionName**：语义化版本号（用户可见），按本规范递增
- **versionCode**：整数版本号（用于应用市场比对新旧），每次发布递增 +1

注意：即使项目里同时存在 `package.json`，**以 `manifest.json` 为准**，`package.json` 的 version 字段通常不代表 uni-app 项目的真实版本。

### 其他项目
在项目的 CLAUDE.md 或 README.md 中指定版本号位置。

## 更新时机

### 何时更新版本号

**仅当本对话中发生了代码改动（已实际修改并保存到文件）时，才更新版本号。**

✅ **需要更新版本号**：
- 修改了代码并保存
- 修复了 Bug
- 新增了功能
- 调整了配置

❌ **不需要更新版本号**：
- 仅讨论、询问，未实际修改代码
- 只读取文件查看
- 计划功能但未实现

### 更新流程

1. 完成代码修改并保存
2. 根据修改类型确定版本号递增规则
3. 更新版本号（在对应位置）
4. 在回复中说明版本号变更：`版本号已更新：1.2.3 → 1.2.4`

## AI 助手工作规范

1. **修改代码后必须立即更新版本号** — 在同一个回复中完成代码修改和版本号更新，不能只说"已更新"而不实际修改文件
2. **版本号更新必须写入文件** — 使用 Edit 工具修改版本号所在位置（UserScript 头部的 @version 字段、package.json 的 version 字段等），不能只在回复中声称更新了
3. **在回复中明确说明版本号变更** — 格式：`版本号已更新：1.2.3 → 1.2.4`
4. **根据修改类型选择合适的递增规则** — 参考语义化版本格式章节
5. **Beta 版本必须遵循迭代规则** — 参考 Beta 版本管理章节
6. **如果项目未指定版本号位置，询问用户**

## 初始版本号

新项目的初始版本号建议：
- 开发阶段：`0.1.0`
- 首个稳定版：`1.0.0`
- 实验性项目：`0.0.1`
