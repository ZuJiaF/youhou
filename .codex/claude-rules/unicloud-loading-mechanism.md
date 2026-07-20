# uniCloud 云对象自动 Loading 机制

## 核心知识

`uniCloud.importObject()` 导入云对象时，**默认会自动显示"加载中"弹窗**（`uni.showLoading`），方法执行完毕后自动隐藏。

```js
// 默认行为：调用方法时自动弹 loading
const obj = uniCloud.importObject('my-object')

// 自定义 loading 文案和遮罩
const obj = uniCloud.importObject('my-object', {
  loadingOptions: {
    title: '加载中...',
    mask: true
  }
})

// 禁用自动 loading
const obj = uniCloud.importObject('my-object', {
  loadingOptions: false
})
```

## 常见异常场景

### 1. Loading 卡住不消失

**可能原因**：
- 云对象方法内部抛错，框架未正确捕获导致 `hideLoading` 未执行
- 网络超时，请求挂起
- 云对象未部署或 URL 化配置有误，请求无响应

**排查方向**：
- 检查云对象方法是否有未捕获的异常
- 检查网络连接和云函数部署状态
- 在前端 `.catch()` 中手动调用 `uni.hideLoading()`

### 2. Loading 闪烁或提前关闭

**可能原因**：
- 多个云对象方法并发调用，第一个完成时就触发了 `hideLoading`，后续方法还在执行
- 业务代码中手动调用了 `uni.showLoading` / `uni.hideLoading`，与自动机制冲突

**排查方向**：
- 并发调用时，考虑对部分调用禁用自动 loading，改为手动控制
- 避免在同一流程中混用自动 loading 和手动 `uni.showLoading`

### 3. 手动 loading 与自动 loading 冲突

**典型场景**：业务代码先 `uni.showLoading({ title: '提交中' })`，然后调用云对象方法，云对象的自动 loading 覆盖了自定义文案，或方法返回后把手动的 loading 也关掉了。

**解决方案**：
- 如果需要自定义 loading 文案/时机，对该云对象实例设置 `loadingOptions: false`，完全手动控制

## AI 助手工作规范

1. **用户反馈"加载中卡住/不消失"时**：第一时间想到 `importObject` 的自动 loading 机制，排查是否是云对象调用异常导致
2. **用户反馈"loading 闪烁/文案不对"时**：检查是否存在自动 loading 与手动 loading 冲突，或并发调用问题
3. **新增云对象调用代码时**：根据业务场景决定是否需要禁用自动 loading（如静默刷新、后台同步等不需要弹窗的场景）
4. **调试 loading 问题时**：注意 `uni.showLoading` 和 `uni.hideLoading` 是全局单例，任何一处调用 hide 都会关闭当前 loading，不区分来源
