# Picker/Selector 必须绑定当前选中值

## 核心原则

**使用 picker / selector / 下拉选择类组件时，必须通过 `:value` 绑定当前选中项的索引（或值），确保打开选择列表时聚焦到已选项。**

## 适用范围

- uni-app `<picker mode="selector">` — 绑定 `:value="当前索引"`
- 原生 `<select>` — 绑定 `:value` 或设置 `selected`
- 自定义下拉组件 — 传入 `currentIndex` / `activeValue` 等 prop

## 正确做法

```vue
<!-- ✅ 绑定了 :value，打开时聚焦到已选项 -->
<picker mode="selector" :range="options" range-key="label" :value="currentIndex" @change="onChange">

<!-- 对应 computed -->
computed: {
  currentIndex() {
    const idx = this.options.findIndex(o => o.value === this.selectedValue)
    return idx >= 0 ? idx : 0
  }
}
```

## 错误做法

```vue
<!-- ❌ 没绑定 :value，打开时永远停在第一项 -->
<picker mode="selector" :range="options" range-key="label" @change="onChange">
```

## AI 助手工作规范

1. **写 picker 时**：必须同时写 `:value` 绑定和对应的索引计算逻辑
2. **审查代码时**：看到没有 `:value` 的 picker/selector，主动指出并修复
3. **新增选择组件时**：确认组件支持的"当前值"prop 名称，正确绑定
