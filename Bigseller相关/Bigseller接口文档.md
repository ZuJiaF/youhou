# Bigseller 接口文档

> 来源：c仓助手、Bigseller助手脚本中涉及的接口

---

## 1. 查询库存/货架信息

**POST** `/api/v1/inventory/pageList.json`

### 请求头

| Header       | 值                                  |
| ------------ | ----------------------------------- |
| Content-Type | application/x-www-form-urlencoded   |
| clienttype   | 1                                   |

### 请求参数（form-urlencoded）

| 参数                     | 类型   | 示例值       | 说明                          |
| ------------------------ | ------ | ------------ | ----------------------------- |
| pageNo                   | string | 1            | 页码                          |
| pageSize                 | string | 50           | 每页条数                      |
| searchType               | string | skuName      | 搜索类型（见下方说明）        |
| searchContent            | string | SKU1,SKU2    | 搜索内容，多个用逗号分隔      |
| inquireType              | string | 0            | 匹配模式：0=模糊，1=前缀，2=精准 |
| stockStatus              | string |              | 库存状态（可为空）            |
| isGroup                  | string |              | 是否组合（可为空）            |
| orderBy                  | string |              | 排序字段（可为空）            |
| desc                     | string |              | 排序方向（可为空）            |
| fullCid                  | string |              | 分类ID（可为空）              |
| queryDistribution        | string | 1            | 查询分配                      |
| saleState                | string |              | 销售状态（可为空）            |
| zoneId                   | string |              | 区域ID（可为空）              |
| openFlag                 | string | false        | 开放标志                      |
| hideZeroInventorySku     | string | 0            | 是否隐藏零库存SKU             |
| warehouseIds             | string | 54443        | 仓库ID                        |

### searchType 取值说明

| 值       | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| skuName  | 按SKU编号搜索，多个SKU用逗号分隔                             |
| title    | 按商品标题搜索，可用于搜索同尺寸/同规格的相关SKU             |

### inquireType 匹配模式

| 值 | 说明                     |
| -- | ------------------------ |
| 0  | 模糊匹配                 |
| 1  | 前缀匹配                 |
| 2  | 精准匹配                 |

示例：
- 精确查SKU：`searchType=skuName&searchContent=JS-017-120&inquireType=2`
- 按标题模糊搜索同尺寸：`searchType=title&searchContent=200*250&inquireType=0`

### 响应结构

```json
{
  "code": 0,
  "errorType": 0,
  "msg": "操作成功",
  "msgObjStr": "",
  "data": {
    "currency": "THB",
    "viewCostPremission": true,
    "editCostPremission": true,
    "page": {
      "pageNo": 1,
      "pageToken": null,
      "pageSize": 50,
      "totalPage": 1,
      "totalSize": 1,
      "rows": [
        {
          "warehouseSkuId": 86402307,
          "skuId": 78416474,
          "sku": "JS-017-120",
          "warehouseId": 54443,
          "warehouseName": "CHILL",
          "title": "商品标题",
          "onhand": 10,
          "allocated": 10,
          "promoReservedStock": 0,
          "available": 0,
          "common": 0,
          "onTheWay": 410,
          "transferOnTheWay": null,
          "purchaseOnTheWay": null,
          "onTheWayCost": "0",
          "cost": "0.00",
          "totalCost": "0.00",
          "threshold": 2,
          "thresholdType": 0,
          "image": "https://res.bigseller.pro/sku/images/...",
          "isGroup": 0,
          "shelfId": 3710203,
          "shelfName": "ZM-18-02",
          "isStockCount": 0,
          "merchantSkuId": "36023308",
          "gtinCode": null,
          "commodityLong": 200.00,
          "commodityWide": 250.00,
          "commodityHigh": 0.01,
          "commodityWeight": "0.00",
          "commodityVolume": "200.00*250.00*0.01",
          "avgDailySales": 5.35,
          "purchaseSaleDays": 0,
          "isAreaSeparate": 0,
          "shelfVos": [
            {
              "shelfId": 3710203,
              "shelfName": "ZM-18-02",
              "skuId": 78416474,
              "warehouseSkuId": 86402307,
              "available": 0,
              "zoneId": 2100779,
              "zoneType": 0,
              "shelfType": 0,
              "zoneName": "Z",
              "onhand": 0,
              "shelfSkuRelationId": 61621309,
              "isDefaultShelf": 0
            }
          ],
          "wareType": 0,
          "skuType": 0,
          "distributionSku": 0,
          "classifyName": "Fen",
          "zoneName": "Z",
          "zoneId": 2100779,
          "saleState": 1,
          "unshelved": "--",
          "defective": "--",
          "unshelvedGood": 0,
          "unshelvedDefective": 0,
          "defectiveCost": "--",
          "basicUnitName": "",
          "newAvailable": 0,
          "expiryDateFlag": 0,
          "remark": "",
          "distributionGroupSkuDeleteAppear": false
        }
      ]
    }
  }
}
```

### 字段说明

| 字段 | 说明 |
| --- | --- |
| sku | SKU编码 |
| skuId | SKU内部ID |
| warehouseSkuId | 仓库SKU关联ID |
| warehouseId | 仓库ID |
| warehouseName | 仓库名称 |
| title | 商品标题 |
| onhand | 现有库存 |
| allocated | 已分配库存 |
| promoReservedStock | 促销预留库存 |
| available | 整仓可用库存 |
| common | 通用库存 |
| onTheWay | 在途库存 |
| transferOnTheWay | 调拨在途 |
| purchaseOnTheWay | 采购在途 |
| cost | 单件成本 |
| totalCost | 总成本 |
| threshold | 安全库存阈值 |
| thresholdType | 阈值类型 |
| image | 商品图片URL |
| isGroup | 是否组合商品（0=否） |
| shelfId | 货架ID |
| shelfName | 货架名称 |
| merchantSkuId | 商户SKU ID |
| commodityLong | 长（cm） |
| commodityWide | 宽（cm） |
| commodityHigh | 高（cm） |
| commodityWeight | 重量 |
| commodityVolume | 体积（长*宽*高） |
| avgDailySales | 日均销量 |
| isAreaSeparate | 是否区域分离 |
| shelfVos | 货架详情列表 |
| shelfVos[].shelfName | 货架名称 |
| shelfVos[].zoneName | 区域名称 |
| shelfVos[].available | 该货架可用库存 |
| shelfVos[].onhand | 该货架现有库存 |
| classifyName | 分类名称 |
| zoneName | 区域名称 |
| zoneId | 区域ID |
| saleState | 销售状态（1=在售） |
| unshelved | 未上架数量 |
| defective | 残次品数量 |
| newAvailable | 新可用库存 |
| remark | 备注 |

---

## 2. 查询订单状态统计

**POST** `/api/v1/order/getOrderStatusCount.json`

### 请求头

| Header       | 值               |
| ------------ | ---------------- |
| Content-Type | application/json |
| clienttype   | 1                |

### 请求参数（JSON Body）

与 pageList 共用同一套筛选参数，主要参数如下：

| 参数                | 类型     | 示例值          | 说明                                    |
| ------------------- | -------- | --------------- | --------------------------------------- |
| searchType          | string   | variationSku    | 搜索类型（variationSku/orderNo等）      |
| searchContent       | string   | JS-017-112      | 搜索内容                                |
| inquireType         | number   | 2               | 匹配模式：0=模糊，1=前缀，2=精准       |
| pageWarehouseIds    | string[] | ["54443"]       | 仓库ID列表                              |
| statusList          | string[] | ["new"]         | 订单状态筛选（new/processing/shipped等）|
| allOrder            | boolean  | true            | 是否查所有订单                          |
| historyOrder        | number   | 0               | 是否历史订单（0=否）                    |
| timeType            | number   | 1               | 时间类型                                |
| days                | number   | 30              | 查询天数范围                            |
| desc                | number   | 1               | 降序排列                                |
| orderBy             | string   | printTime       | 排序字段                                |

### 响应结构

```json
{
  "code": 0,
  "data": {
    "mode": 1,
    "warehouseMap": { "54443": "CHILL" },
    "shopLists": [
      { "id": 5297723, "name": "Fen (Fen 11D)", "platform": "tiktok", "site": "MY", "status": 1 }
    ],
    "platformStatusMap": {
      "tiktok": [{ "name": "Awaiting Shipment", "value": "Awaiting Shipment" }],
      "shopee": [{ "name": "Pending", "value": "order.status.shopee.pending" }],
      "lazada": [{ "name": "待处理", "value": "order.status.lazada.pending" }]
    },
    "countMap": { "4657495": 45404, "tiktok": 150778, "shopee": 21397 },
    "statusCountMap": {
      "new": 748, "processing": 574, "shipped": 14580,
      "completed": 120936, "canceled": 35588, "unpaid": 30
    },
    "shipProviderList": [
      { "id": 7872769, "name": "Shopee-TH-J&T Express", "platform": "shopee", "providerChannelId": 85 }
    ],
    "labelList": [
      { "id": 1545, "title": "测评订单", "color": "#4045B2", "category": 1 }
    ],
    "shopGroups": [
      { "id": 80173, "groupName": "Fen" }
    ]
  }
}
```

### 关键字段

| 字段               | 说明                                              |
| ------------------ | ------------------------------------------------- |
| warehouseMap       | 仓库ID→名称映射                                  |
| shopLists          | 当前账号下所有店铺列表                            |
| platformStatusMap  | 各平台的订单状态枚举值                            |
| countMap           | 按店铺ID统计的订单数量，也含平台汇总              |
| statusCountMap     | 按订单状态统计的数量                              |
| shipProviderList   | 可用物流商列表                                    |
| labelList          | 订单标签列表                                      |
| shopGroups         | 店铺分组列表                                      |

### 用途

该接口用于获取订单页面的侧边栏统计数据（各状态订单数量）及筛选选项（店铺、物流商、标签等），通常在进入订单列表页时调用。

---

## 3. 查询订单列表

**POST** `/api/v1/order/new/pageList.json`

### 请求头

| Header       | 值               |
| ------------ | ---------------- |
| Content-Type | application/json |
| clienttype   | 1                |

### 请求参数（JSON Body）

| 参数                | 类型     | 示例值          | 说明                                    |
| ------------------- | -------- | --------------- | --------------------------------------- |
| searchType          | string   | variationSku    | 搜索类型（variationSku/orderNo等）      |
| searchContent       | string   | JS-017-112      | 搜索内容                                |
| inquireType         | number   | 2               | 匹配模式：0=模糊，1=前缀，2=精准       |
| pageWarehouseIds    | string[] | ["54443"]       | 仓库ID列表                              |
| statusList          | string[] | ["new"]         | 订单状态筛选（new/processing/shipped等）|
| allOrder            | boolean  | true            | 是否查所有订单                          |
| historyOrder        | number   | 0               | 是否历史订单（0=否）                    |
| timeType            | number   | 1               | 时间类型                                |
| days                | number   | 30              | 查询天数范围                            |
| pageNo              | number   | 1               | 页码                                    |
| pageSize            | number   | 300             | 每页条数                                |
| desc                | number   | 1               | 降序排列                                |
| orderBy             | string   | printTime       | 排序字段                                |
| shopId              | number   | null            | 店铺ID筛选                              |
| shipProviderId      | number   | null            | 物流商ID筛选                            |
| platformStatus      | string   | null            | 平台状态筛选                            |
| shopGroup           | number   | null            | 店铺分组筛选                            |
| lableIds            | string   | null            | 标签ID筛选                              |
| paymentMethod       | string   | null            | 付款方式筛选                            |

### searchType 取值说明

| 值             | 说明             |
| -------------- | ---------------- |
| variationSku   | 按变体SKU搜索    |
| orderNo        | 按订单号搜索     |

### 响应结构

```json
{
  "code": 0,
  "data": {
    "page": {
      "pageNo": 1,
      "pageSize": 300,
      "totalPage": 1,
      "totalSize": 8,
      "rows": [{ "...订单对象..." }]
    }
  }
}
```

### 订单对象关键字段

| 字段                    | 说明                                    |
| ----------------------- | --------------------------------------- |
| id                      | Bigseller内部订单ID                     |
| platformOrderId         | 平台订单号（即页面显示的号）            |
| shopId                  | 店铺ID                                  |
| shopName                | 店铺名称                                |
| state                   | BS内部状态（new/processing/shipped等）  |
| marketPlaceState        | 平台原始状态                            |
| platform                | 平台（tiktok/shopee/lazada）            |
| packageNo               | 包裹号                                  |
| amount                  | 订单金额                                |
| amountUnit              | 货币单位                                |
| buyerUsername            | 买家用户名                              |
| buyerShippingCarrier    | 买家选择的物流                          |
| trackingNo              | 物流追踪号                              |
| orderCreateTimeStr      | 订单创建时间                            |
| paymentMethod           | 支付方式（Prepaid/COD）                 |
| warehouseId             | 仓库ID                                  |
| shipmentWarehouse       | 发货仓库名称                            |
| error                   | 错误代码（如库存不足）                  |
| errorMsg                | 错误信息                                |
| preOrder                | 是否预售订单                            |

### 订单商品项（orderItemList）关键字段

| 字段                | 说明                              |
| ------------------- | --------------------------------- |
| id                  | 商品项ID                          |
| varSku              | 变体SKU                           |
| varAttr             | 变体属性描述                      |
| quantity            | 数量                              |
| image               | 商品图片URL                       |
| varOriginalPrice    | 原价                              |
| varDiscountedPrice  | 折后价                            |
| amount              | 小计金额                          |
| itemName            | 商品名称                          |
| inventorySku        | 库存SKU（换货后的SKU）            |
| platformItemId      | 平台商品ID                        |
| platformVariationId | 平台变体ID                        |

### 费用明细（feeDetail）关键字段

| 字段                | 说明           |
| ------------------- | -------------- |
| totalAmount         | 订单总金额     |
| discount            | 折扣           |
| commissionFee       | 佣金           |
| serviceFee          | 服务费         |
| estimatedShippingFee| 预估运费       |
| estimatedProfit     | 预估利润       |
| profitRate          | 利润率         |

---

## 4. 查询订单详情

**GET** `/api/v1/order/detail.json`

### 请求头

| Header     | 值 |
| ---------- | -- |
| clienttype | 1  |

### 请求参数（Query String）

| 参数             | 类型    | 示例值 | 说明               |
| ---------------- | ------- | ------ | ------------------ |
| id               | string  | 12345  | 订单内部ID         |
| historyOrder     | number  | 0      | 是否历史订单       |
| viewBuyerMessage | boolean | false  | 是否查看买家留言   |

### 响应结构

```json
{
  "code": 0,
  "data": {
    "orderDetail": {
      "orderItemVoList": [
        {
          "varSku": "原始SKU",
          "inventorySku": "库存SKU（换货后的SKU）"
        }
      ]
    }
  }
}
```

### 关键字段

| 字段         | 说明                                      |
| ------------ | ----------------------------------------- |
| varSku       | 商品原始SKU                               |
| inventorySku | 库存SKU，若与varSku不同则表示发生了换货   |

### 换货判断逻辑

当 `inventorySku` 存在且与 `varSku` 不同时，说明该商品进行了换货操作。

---

## 5. 换货（更换SKU映射关系）

**POST** `/api/v1/inventory/mappingRelation/changeMappingRelation.json`

### 请求头

| Header       | 值                                |
| ------------ | --------------------------------- |
| Content-Type | application/x-www-form-urlencoded |
| clienttype   | 1                                 |

### 请求参数（form-urlencoded）

| 参数        | 类型   | 示例值        | 说明                              |
| ----------- | ------ | ------------- | --------------------------------- |
| orderId     | string | 13711912955   | 订单内部ID                        |
| orderItemId | string | 10105285450   | 订单商品项ID                      |
| orderState  | string | new           | 订单状态                          |
| warehouseId | string | 54443         | 仓库ID                            |
| skuId       | string | 102629109     | 目标SKU的skuId（库存接口返回）    |
| platformSku | string | JS-017-038    | 目标SKU编号                       |
| changeType  | string | only          | 更换类型（only=仅此订单）         |

### 响应结构

```json
{
  "code": 0,
  "errorType": 0,
  "msg": "Successfully",
  "msgObjStr": "",
  "data": 0
}
```

### 关键说明

- `orderId`：需要从订单列表接口获取（接口2的返回值 `id`）
- `orderItemId`：订单中具体商品项的ID，需从订单详情接口获取
- `skuId`：目标SKU的内部ID，从库存查询接口（接口1）的 `skuId` 字段获取
- `changeType`：`only` 表示仅更换当前订单的映射关系
