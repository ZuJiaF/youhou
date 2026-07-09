# TikTok SSR Direct 接口（商品详情页数据）

## 基本信息

- **URL**: `https://www.tiktok.com/shop/{region}/pdp/{product_id}?region={REGION}&__loader=shop%2F%28region%29%2Fpdp%2F%28product_name_slug%24%29%2F%28product_id%29%2Fpage&__ssrDirect=true&X-Tts-Oec-Bsid={bsid_token}`
- **方法**: GET
- **说明**: TikTok Shop 商品详情页的 SSR 数据接口，页面加载后由前端 JS 自动发起，返回商品完整数据（含价格、SKU 信息等）
- **触发时机**: 页面首次加载 / 硬刷新时由 TikTok 前端框架自动 fetch

## 请求

### 关键参数

| 参数 | 类型 | 说明 |
|------|------|------|
| region | string | 国家代码，如 `MY`（马来西亚）、`TH`（泰国） |
| __loader | string | 路由 loader 标识，固定值 `shop/(region)/pdp/(product_name_slug$)/(product_id)/page`（URL 编码） |
| __ssrDirect | string | 固定 `true`，标识这是 SSR 直出数据请求 |
| X-Tts-Oec-Bsid | string | 会话令牌，每次请求不同，由前端生成 |

### 请求头

```
Accept: */*
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
Referer: https://www.tiktok.com/shop/{region}/pdp/{product_id}?region={REGION}
```

## 响应

### 响应格式

- **Content-Type**: `application/json`
- **编码**: 响应体为 JSON（浏览器 fetch 直接可 `JSON.parse`）
- **注意**: HAR 文件中显示为 base64 是 HAR 格式自身的存储方式，实际 fetch 得到的是明文 JSON

### 顶层结构

```json
{
  "basic_info": { "lang": "zh-TW", "device_system": "windows", ... },
  "waf_decision": { ... },
  "region_info": { ... },
  "ab_test": { ... },
  "route_info": { ... }
}
```

### 价格相关字段路径

价格数据位于：`route_info` > ... > `promotion_model` > `promotion_product_price`

#### promotion_product_price 结构

| 字段 | 类型 | 说明 |
|------|------|------|
| min_price | object | 最低价 SKU 的价格详情 |
| skus_price | object/array | 所有 SKU 的价格详情（key 为 SKU ID） |
| range_price | object | 价格区间汇总信息 |
| feature | object | 其他特性 |

#### 单个 SKU 价格对象（min_price / skus_price 中的每项）

```json
{
  "sku_id": "1731058937046795612",
  "symbol_position": 1,
  "show_currency_space": false,
  "currency_show_mode": 1,
  "currency_name": "MYR",
  "currency_symbol": "RM",
  "sale_price_decimal": "0.01",
  "origin_price_decimal": "23.8",
  "sale_price_format": "0.01",
  "origin_price_format": "23.80",
  "discount_format": "99%",
  "discount_decimal": "0.99",
  "reduce_price_format": "可省 RM23.79",
  "single_product_price_format": "11.88",
  "single_product_price_decimal": "11.88",
  "sale_price_integer_part_format": "0",
  "sale_price_decimal_part_format": "01",
  "decimal_point_symbol": ".",
  "promotion_deduction_details": {
    "seller_subtotal_deduction": "13.92",
    "seller_subtotal_deduction_decimal": "13.92"
  }
}
```

#### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| origin_price_format | string | 商品原价（卖家设定的标价） |
| sale_price_format | string | 促销后的最终售价（消费者支付价） |
| single_product_price_format | string | 单品价格 |
| discount_format | string | 折扣比例 |
| reduce_price_format | string | 节省金额描述 |
| promotion_deduction_details.seller_subtotal_deduction | string | 平台补贴/扣减金额 |
| currency_symbol | string | 货币符号（如 `RM`） |
| currency_name | string | 货币名称（如 `MYR`） |

#### range_price 汇总对象

```json
{
  "min_price_sku_id": "1731058937046795612",
  "max_price_sku_id": "1731058937047254364",
  "symbol_position": 1,
  "currency_name": "MYR",
  "currency_symbol": "RM",
  "range_price": "0.01 - 0.28",
  "max_discount_decimal": "0.99",
  "discount_txt": "最高可节省 99%",
  "origin_range_price": "23.80 - 59.80",
  "min_price_integer_part_format": "0",
  "min_price_decimal_part_format": "01",
  "max_price_integer_part_format": "0",
  "max_price_decimal_part_format": "28",
  "decimal_point_symbol": "."
}
```

## 真实卖家定价计算

### 公式

```
真实卖家定价 = origin_price_format - seller_subtotal_deduction
```

### 说明

- `origin_price_format`：卖家设定的原价
- `seller_subtotal_deduction`：平台侧的补贴/扣减（平台承担的促销成本）
- 差值即为卖家实际收到的金额 / 卖家的真实定价意图

### 示例

```
origin_price_format = 23.80
seller_subtotal_deduction = 13.92
真实卖家定价 = 23.80 - 13.92 = 9.88
```

### 价格区间获取方式

遍历 `skus_price` 中所有 SKU，逐一计算真实卖家定价，取 min 和 max 构成区间：

```
所有 SKU 真实定价: [9.88, 19.92, 15.88, 9.88, 29.88, 19.92, 29.88]
价格区间: 9.88 - 29.88
```

## 备注

- 该接口仅在页面首次加载/硬刷新时触发，SPA 内部导航可能使用缓存不再请求
- `X-Tts-Oec-Bsid` 是动态生成的会话令牌，无法预构造，但可复用同页面 URL（不带 Bsid）主动 fetch
- 主动 fetch 时需携带 `credentials: 'include'` 以传递登录态 Cookie
- 数据采集器脚本中通过 fallback 机制处理：hook 拦截优先，3秒后未获取则主动请求
