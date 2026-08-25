# 生成货物清单（WPS AirScript）

原为独立仓库 `wpsJs`（`https://github.com/ZuJiaF/wpsJs.git`），2026-08-25 用 `git subtree`
并入 `油猴脚本` 仓库统一纳管，源仓库提交历史已一并保留。

## 这是什么

跑在 **WPS AirScript 2.0**（金山表格内置的脚本环境）里的脚本，不是油猴脚本：

- 从「功能表」读数据 → 生成「采购表」→ 写入远端目标工作簿
- 货物清单 PDF 由云端云对象 `wps/generatePdf` 用 pdfkit + 思源黑体排版后返回下载链接，
  脚本本身只负责整理数据

## 怎么用

把 `生成货物清单.js` 的内容贴进 WPS 表格的 AirScript 编辑器里运行。
**不需要**跑 `node encrypt.js` 加密 —— 那个命令只针对本仓库里的油猴脚本。

## 版本号

写在 `生成货物清单.js` **第一行注释**，格式 `//vX.Y.Z`，beta 阶段用 `//vX.Y.Z-beta.N`。
不要去找 `@version`，AirScript 没有 UserScript 元数据。

## 其他约定

数据结构、关键变量、列 ID 查找方式见同目录 `CLAUDE.md`。
