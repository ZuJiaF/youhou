//v0.6.0-beta.5
/********************************动之前记得备份********************************/
/********************************动之前记得备份********************************/
/********************************动之前记得备份********************************/
/********************************动之前记得备份********************************/
/********************************动之前记得备份********************************/
/********************************动之前记得备份********************************/
/********************************动之前记得备份********************************/

















/********************************基础配置-start********************************/
/********************************基础配置-start********************************/
/********************************基础配置-start********************************/

// 调试模式开关：true=调试，不写入目标簿（避免“弄进目标簿”影响正式数据）
let debugMode = false

let caigoubiao = "采购表" //"采购表"的表名
let gnSheetName = "功能表" //"功能表"的表名
let caigoubiaosheet = Application.Sheets.Item(caigoubiao)//采购表对象
let gnSheet = Application.Sheets.Item(gnSheetName) //功能表对象

let colNumID018 = getCol("ID018", 1, "功能表")//储存着"行ID"的列号字母
let colNumID014 = getCol("ID014", 1, "功能表")//存储着"脚本配置"的值的列号字母
let finishFlag//是否已经生成的标志位


/********************************调试模式的值 #测试********************************/
// 根据值和字母列号及表名找行号(需要提交表名)
let row44 = getRow("017", colNumID018, "功能表")
let testModel = gnSheet.Range(colNumID014 + row44).Value2
// 顶部开关优先：debugMode=true 时强制进入调试模式
if (debugMode) {
  testModel = "是"
}
//console.log("testModel",testModel)
/********************************调试模式的值 #测试********************************/

/********************************货物清单版本的值********************************/
// 根据值和字母列号及表名找行号(需要提交表名)
let row51 = getRow("016", colNumID018, "功能表")
let huoWuQingDanVer = gnSheet.Range(colNumID014 + row51).Value2
//console.log("testModel",testModel)
/********************************货物清单版本的值********************************/

// 根据值和字母列号及表名找行号(需要提交表名)
let row20 = getRow("001", colNumID018, "功能表")
let qiShu21 = gnSheet.Range(colNumID014 + row20).Value2 //备货期数
//console.log("qiShu", qiShu21)


/********************************生成状态提示区对象********************************/
// 根据值和列号及表名找行号(需要提交表名)
let row17 = getRow("014", colNumID018, "功能表")
let tisArea = gnSheet.Range(colNumID014 + row17) //生成状态提示区finishFlag//主表提示区
/********************************生成状态提示区对象********************************/

// 根据值和列号及表名找行号(需要提交表名)
let row25 = getRow("002", colNumID018, "功能表")
let postMothod26 = gnSheet.Range(colNumID014 + row25).Value2 //运输方式
//console.log("postMothod", postMothod26)

// 根据值和列号及表名找行号(需要提交表名)
let row30 = getRow("012", colNumID018, "功能表")
let gongYingShang = gnSheet.Range(colNumID014 + row30).Value2 //供应商
//console.log("gongYingShang", gongYingShang)

// 根据值和列号及表名找行号(需要提交表名) #国家参数 #RD023 #国家值
let rowRD023 = getRow("RD023", colNumID018, "功能表")
let guoJia = gnSheet.Range(colNumID014 + rowRD023).Value2 //国家值，为"马来"/"泰国"
//console.log("guoJia", guoJia)

//备货数据，参与运算
/*
有些sku是同款式编码，但是是新款，需要临时走陆运，就需要识别备货编码来区分
 */
let beiHuoData = [
  {//暗无天日
    "name": "暗无天日",
    "id": "003",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-010",//款式编码
    "beiHuoCode": "JS-010",//备货编码，通常和款式编码相同
  },
  {//单面光
    "name": "单面光",
    "id": "004",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-009",//款式编码
    "beiHuoCode": "JS-009",//备货编码，通常和款式编码相同
  },
  {//银涂层
    "name": "烫银窗帘",
    "id": "005",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-011",//款式编码
    "beiHuoCode": "JS-011",//备货编码，通常和款式编码相同
  },
  {//暗无天日李
    "name": "暗无天日李魔术",
    "id": "007",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-016",//款式编码
    "beiHuoCode": "JS-016",//备货编码，通常和款式编码相同
  },
  {//暗无天日李
    "name": "暗无天日李打孔",
    "id": "015",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-019",//款式编码
    "beiHuoCode": "JS-019",//备货编码，通常和款式编码相同
  },
  {//暗无天日李
    "name": "暗无天日李印花魔术贴",
    "id": "020",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-017",//款式编码
    "beiHuoCode": "JS-017",//备货编码，通常和款式编码相同
  },
  {//暗无天日李
    "name": "暗无天日李印花打孔",
    "id": "021",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-022",//款式编码
    "beiHuoCode": "JS-022",//备货编码，通常和款式编码相同
  },
  {//伸缩杆
    "name": "伸缩杆",
    "id": "013",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-023",//款式编码
    "beiHuoCode": "JS-023",//备货编码，通常和款式编码相同
  },
  {//纱帘李魔术
    "name": "纱帘李魔术",
    "id": "018",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-025",//款式编码
    "beiHuoCode": "JS-025",//备货编码，通常和款式编码相同
  },
  {//纱帘李魔术
    "name": "纱帘李魔术",
    "id": "018",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-026",//款式编码
    "beiHuoCode": "JS-026",//备货编码，通常和款式编码相同
  },
  {//纱帘李打孔
    "name": "纱帘李打孔",
    "id": "019",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-027",//款式编码
    "beiHuoCode": "JS-027",//备货编码，通常和款式编码相同
  },
  {//纱帘李打孔
    "name": "纱帘李打孔",
    "id": "019",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-028",//款式编码
    "beiHuoCode": "JS-028",//备货编码，通常和款式编码相同
  },
  {//暗无天日李魔术贴印花新款
    "name": "暗无天日李印花魔术贴",
    "id": "RD022",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-017",//款式编码
    "beiHuoCode": "JS-017X1",//备货编码，通常和款式编码相同
  },
  {//桌布
    "name": "桌布纯色基础款",
    "id": "RD024",
    "chooseflag": "", //用"行id"去获取此备货编码需不需要备货的"1/0"值，用来运算赋值
    "kuanShiCode": "JS-029",//款式编码
    "beiHuoCode": "JS-029-056",//备货编码，通常和款式编码相同
  }
]


//初始总数据配置
let arrayObj = [
  {
    "Name": "产品配置",
    "ID": "ID001",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "图片",
    "ID": "ID003",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "sku",
    "ID": "ID005",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "尺寸",
    "ID": "ID006",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "数量/片",
    "ID": "ID007",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "单价",
    "ID": "ID008",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "合计",
    "ID": "ID009",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "实到/片",
    "ID": "ID020",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "差额/片",
    "ID": "ID021",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "实到合计",
    "ID": "ID022",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "备注",
    "ID": "ID010",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "款式",
    "ID": "ID023",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "品名",
    "ID": "ID002",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "颜色",
    "ID": "ID004",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "空白列",
    "ID": "ID019",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "采购数量留档",
    "ID": "ID026",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "支付方式",
    "ID": "ID029",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "货物状态",
    "ID": "ID030",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "快递公司",
    "ID": "ID031",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "快递单号",
    "ID": "ID032",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "点击我下载货物清单",
    "ID": "ID033",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "存储行ID的列",
    "ID": "ID018",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "采购编码",
    "ID": "ID034",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "款式编码",
    "ID": "ID036",
    "colNum": "",
    "value2Arr": "",
  }

]

//采购表配置
let caigoubiaoArrayObj = [
  {
    "Name": "产品配置",
    "ID": "ID001",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "图片",
    "ID": "ID003",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "颜色",
    "ID": "ID004",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "sku",
    "ID": "ID005",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "尺寸",
    "ID": "ID006",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "数量/片",
    "ID": "ID007",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "单价",
    "ID": "ID008",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "合计",
    "ID": "ID009",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "实到/片",
    "ID": "ID020",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "差额/片",
    "ID": "ID021",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "实到合计",
    "ID": "ID022",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "备注",
    "ID": "ID010",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "空白列",
    "ID": "ID019",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "采购数量留档",
    "ID": "ID026",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "支付方式",
    "ID": "ID029",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "货物状态",
    "ID": "ID030",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "快递公司",
    "ID": "ID031",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "快递单号",
    "ID": "ID032",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "点击我下载货物清单",
    "ID": "ID033",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "存储行ID的列",
    "ID": "ID018",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "品名",
    "ID": "ID002",
    "colNum": "",
    "value2Arr": "",
  }, {
    "Name": "款式",
    "ID": "ID023",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "采购编码",
    "ID": "ID034",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "款式编码",
    "ID": "ID036",
    "colNum": "",
    "value2Arr": "",
  }
]

//货物清单配置
let huoWuQingDanArrayObj = [
  {
    "Name": "品名",
    "ID": "ID002",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "款式",
    "ID": "ID023",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "sku",
    "ID": "ID005",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "数量",
    "ID": "ID007",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "空白列",
    "ID": "ID019",
    "colNum": "",
    "value2Arr": "",
  },
  {
    "Name": "款式编码",
    "ID": "ID036",
    "colNum": "",
    "value2Arr": "",
  }
]

let caigoubiaoData = []//储存采购表数据
let huoWuQingDanData = []//存储货物清单数据
let caigoubiaoDataMax = []//扁平化后的采购数据
let dataQingXi1Array = []//储存要清理的品的下标
let imageRowsArray = []//储存图片行的下标
let num0RowsArray = []//储存数量为0的sku的下标
let heJiIndex//存储合计的行id的下标
let startRow = 4//生成后数据开始行
let aimSheet//远程链接的表格
let pdfLink//储存pdf的链接
let pdfLinkEmpty//储存无数量版pdf的链接


main()//执行主函数


//处理数据
async function main() {

  await beforeRunCheck()//生成前检测是否重复生成

  await reCreateCaiGouSheet()//新建采购表

  await getGoodsChooseflag(colNumID018, colNumID014)//获取要品的备货flag，传入"行ID"和"脚本配置"的值的英文列号

  await getAlldata()//获取功能表全部数据,有处理边界

  await delBlankRow()//删除空白行第四行

  await dataQingXi1()//获取要清理的品的下标

  await caigouSheetFuncPart1()//整合需要的数据

  await caigouSheetFuncPart2()//清洗不需要的品

  await doImageRowsArray()//把图片复制到有数量的行,如果此款式没有数量，就删除图片 #处理图片 #图片处理

  await dataQingXi2()//获取数量为0的sku的下标

  await caigouSheetFuncPart2_2()//处理数量为0的行

  huoWuQingDanFunc()//货物清单专属线程 #货物清单分支 #生成货物清单生成 #huoWuQingDanFuncy

  await caigouSheetFuncPart2_3()//处理公式

  await setImgRowNum()//储存图片行号


  await addAimSheet()//添加表格

  // console.log("aimSheet.Name", aimSheet ? aimSheet.Name : null) // 调试噪声：只在排查空表时需要

  await caigouSheetFuncPart3(aimSheet)//数据扁平化处理并赋值

  //最后处理 #进一步处理 #后续处理
  await aimSheet ? caigouSheetFuncPart4() : null//如果识别到了目标表格就合并单元格

  //输出tis
  await printTips()
}

async function delBlankRow() {
  //console.log("493", arrayObj[0].value2Arr[3])//arrayObj[x]
  arrayObj.forEach(item => {
    if (item.value2Arr && item.value2Arr.length > 3) {
      item.value2Arr.splice(3, 1); // 删除索引3的元素
    }
  });

}

//先把采购表删除并新建
function reCreateCaiGouSheet() {
  //先把采购表删除并新建
  if (caigoubiaosheet) {
    caigoubiaosheet.Delete()
  }
  caigoubiaosheet = ActiveWorkbook.Sheets.Add(null, ActiveWorkbook.Worksheets.Item(Worksheets.Count), null)
  caigoubiaosheet.Name = "采购表"
}

//输出tis
function printTips() {
  //非调试模式才正常执行
  if (testModel == "否") {
    console.log(`${qiShu21}期主函数执行完成`)
    tisArea.Value2 = `${qiShu21}期生成完成`
  } else if (testModel == "是") {
    tisArea.Value2 = `正在调试模式中`
  }
}

//生成前检测是否重复生成
function beforeRunCheck() {
  if (testModel == "否") {//非调试模式才检测重复生成
    if (finishFlag) {
      return
    }
  } else if (testModel == "是") {//调试模式就不检测
    return
  }
  // console.log("tisArea", tisArea.Value2, qiShu21,) // 调试噪声：只用于排查重复生成
  finishFlag = tisArea.Value2.includes(qiShu21)
  if (finishFlag) {
    tisArea.Value2 = `已生成过${qiShu21}期`//重复生成
  } else {
    tisArea.Value2 = `${qiShu21}期正在生成...`//先清空
    // console.log(`tisArea的值为${tisArea.Value2}`) // 调试噪声
  }
}

//货物清单专属线程 #货物清单f #货物清单函数 #huoWuQingDanFuncf #货物清单线程 #货物清单进程 #货物清单流程
async function huoWuQingDanFunc() {
  huoWuQingDanData = JSON.parse(JSON.stringify(caigoubiaoData)) //把采购表数据给一份给货物清单 #复制一份 #货物清单数据转移

  huoWuQingDanFuncPart0_1()//清洗出货物清单需要的数据

  //如果要求了隔品同行则执行
  if (huoWuQingDanVer == "隔品隔行") {
    const kuanShiItem = arrayObj.find(item => item.Name === "款式编码");
    const kuanShiCodeColId = kuanShiItem ? kuanShiItem.ID : null;
    huoWuQingDanNewVer(kuanShiCodeColId)//货物清单隔品空行处理
  }

  delHuoQingDanDuoYuLie()//删除货物清单多余列 #删除多余列

  //把货物清单数据发送到后端云对象生成PDF
  let respGeneratePdf = HTTP.post('https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/wps/generatePdf', {
    "huoWuQingDanData": huoWuQingDanData,
    "qiShu": qiShu21,
    "guoJia": guoJia,
    "postMothod": postMothod26
  })
  let generatePdfResult = respGeneratePdf.json()
  console.log("后端generatePdf返回:", JSON.stringify(generatePdfResult))
  if (generatePdfResult.result) {
    pdfLink = generatePdfResult.result
    console.log("PDF链接:", pdfLink)
  }

  //生成无数量版PDF #无数量版 #空数量
  let huoWuQingDanDataEmpty = JSON.parse(JSON.stringify(huoWuQingDanData))
  //通过ID定位"数量"列并清空数据行
  let shuLiangColIndex = huoWuQingDanDataEmpty.findIndex(col => col[0] && col[0][0] === "ID007")
  console.log("【调试-无数量版】shuLiangColIndex:", shuLiangColIndex)
  console.log("【调试-无数量版】各列[0][0]:", huoWuQingDanDataEmpty.map(col => col[0] && col[0][0]))
  if (shuLiangColIndex !== -1) {
    console.log("【调试-无数量版】清空前数量列前5行:", JSON.stringify(huoWuQingDanDataEmpty[shuLiangColIndex].slice(0, 8)))
    for (let k = 3; k < huoWuQingDanDataEmpty[shuLiangColIndex].length; k++) {
      huoWuQingDanDataEmpty[shuLiangColIndex][k] = [""]
    }
    console.log("【调试-无数量版】清空后数量列前5行:", JSON.stringify(huoWuQingDanDataEmpty[shuLiangColIndex].slice(0, 8)))
  } else {
    console.log("【调试-无数量版】未找到ID007列！")
  }
  let respGeneratePdfEmpty = HTTP.post('https://env-00jy671a213o.dev-hz.cloudbasefunction.cn/wps/generatePdf', {
    "huoWuQingDanData": huoWuQingDanDataEmpty,
    "qiShu": qiShu21 + "(无数量)",
    "guoJia": guoJia,
    "postMothod": postMothod26
  })
  let generatePdfEmptyResult = respGeneratePdfEmpty.json()
  console.log("后端generatePdf(无数量版)返回:", JSON.stringify(generatePdfEmptyResult))
  if (generatePdfEmptyResult.result) {
    pdfLinkEmpty = generatePdfEmptyResult.result
    console.log("【调试-无数量版】PDF链接:", pdfLinkEmpty)
    console.log("【调试-对比】正常版链接:", pdfLink)
    console.log("【调试-对比】两链接是否相同:", pdfLink === pdfLinkEmpty)
  } else {
    console.log("【调试-无数量版】后端未返回result！完整响应:", JSON.stringify(generatePdfEmptyResult))
  }
}

//删除货物清单多余列 #货物清单删除多余列
async function delHuoQingDanDuoYuLie() {
  // console.log("删除货物清单多余列开始") // 调试噪声
  // 要删除的ID列表
  const idsToDelete = ["ID034", "ID036"];

  idsToDelete.forEach(id => {
    // console.log("634", id) // 调试噪声
    removeItemById(huoWuQingDanData, id);//删除单个ID的函数
  });

}

// 1. 封装删除单个ID的函数
function removeItemById(dataArray, targetId) {
  const index = dataArray.findIndex(item =>
    item?.[0]?.[0] === targetId
  );

  if (index !== -1) {
    dataArray.splice(index, 1);
    // console.log(`已删除 ID: ${targetId} (索引: ${index})`); // 调试噪声
    return true; // 删除成功
  }

  // console.log(`未找到 ID: ${targetId}`); // 调试噪声
  return false; // 未找到
}

//货物清单隔品则隔行处理 #跳过处理
function huoWuQingDanNewVer(kuanShiCodeColId1) {
  let columnId = kuanShiCodeColId1//"款式编码"的列id
  //找"款式编码"所在列的数组index
  const foundX = huoWuQingDanData.findIndex(item =>
    item?.[0]?.[0] === kuanShiCodeColId1 // 使用可选链防止报错
  );

  //console.log("635", foundX)
  //console.log("540", huoWuQingDanData)
  let kuanShiCode637 = huoWuQingDanData[foundX][2][0]//按理说这个值应该是款式编码，如果不是，则数据不对
  // console.log("542", kuanShiCode637) // 调试噪声


  //遍历"款式编码"列，从i大于等于3开始，如果i+1和i不一样，则在huoWuQingDanData[x][i]的i和i+1之间都加上一个空值
  let jumpFlag;//跳过标志
  huoWuQingDanData[foundX].forEach((e, i, s) => {
    //console.log("548",e[0])
    //先划定界限，避免出错
    if (i >= 3 && i + 1 <= s.length - 1) {
      //如果品名不一样，就要考虑加空行了
      if (e[0] != huoWuQingDanData[foundX][i + 1][0]) {
        if (jumpFlag || huoWuQingDanData[foundX][i + 1][0] == "总计:") {
          jumpFlag = 0
          return
        }
        // console.log(`当前款式编码"${e[0]}"，下个款式编码"${huoWuQingDanData[0][i + 1][0]}"`) // 调试噪声：循环刷屏
        //遍历每列，然后插入空行
        huoWuQingDanData.forEach((e1, i1, s1) => {
          //插入
          e1.splice(i + 1, 0, [""])
          jumpFlag = 1//赋值跳过
        })

      }

    }
  })

}

//清洗出货物清单需要的数据
function huoWuQingDanFuncPart0_1() {
  // console.log("开始清洗出货物清单需要的数据") // 阶段日志：噪声，排查时再开
  let tempArray = []
  //从采购表那边复制给货物清单拿的数据
  huoWuQingDanArrayObj.forEach((e, i, s) => {
    // 要查找的ID值
    let targetID = e.ID
    const index = huoWuQingDanData.findIndex((x) => x[0][0] === targetID);


    if (index) {
      //货物清单表头和合计 #货物清单标题 #货物清单格式
      if (targetID == "ID002") {
        //console.log("huoWuQingDanData[index][0][0]", huoWuQingDanData[index][0][0])
        huoWuQingDanData[index][0][0] = `货物清单(第${qiShu21}期${guoJia}${postMothod26}）`
        // 注意：源数据里通常已经有“总计:”行；这里如果强行把“最后一行”改成总计，
        // 会导致 Find("总计:") 命中尾部假总计（例如跑到798行）并造成 SUM 翻倍。
        // 只有当整列里不存在“总计:”时，才补一个到最后一行。
        let hasTotal = false
        for (let k = 0; k < huoWuQingDanData[index].length; k++) {
          if (huoWuQingDanData[index][k] && huoWuQingDanData[index][k][0] === "总计:") {
            hasTotal = true
            break
          }
        }
        if (!hasTotal) {
          huoWuQingDanData[index].splice(huoWuQingDanData[index].length - 1, 1, ["总计:"]);
        }

      }
      if (targetID == "ID019") {
        huoWuQingDanData[index][2][0] = `装袋`//2代表第二行

      }

      //console.log("427", index, huoWuQingDanData[index])
      tempArray.push(huoWuQingDanData[index])
    } else {
      //没找到就是不需要
      console.log("未找到ID为" + targetID + "的对象");
    }

    if (i + 1 == s.length) {
      huoWuQingDanData = tempArray
    }
  })
  //console.log("清洗出货物清单需要的数据结束")
}

//添加目标表格
async function addAimSheet() {
  // console.log("添加目标表格开始") // 阶段日志：噪声，排查时再开
  // 调试模式：只在当前工作簿创建调试用的 aimSheet，不打开外部目标簿（避免写入目标簿）
  if (debugMode) {
    let targetSheetName = qiShu21 + "期(未下单)"

    // 如果当前工作簿里已有同名sheet，先删掉避免重复创建报错
    for (let i = 0; i < ActiveWorkbook.Sheets.Count; i++) {
      let sh = ActiveWorkbook.Sheets.Item(i + 1)
      if (sh.Name === targetSheetName) {
        sh.Delete()
        break
      }
    }

    let newSheet = ActiveWorkbook.Sheets.Add(
      null,
      ActiveWorkbook.Worksheets.Item(Worksheets.Count),
      null
    )
    newSheet.Name = targetSheetName
    aimSheet = newSheet
    return
  }

  //打开文件
  let file;
  if (gongYingShang == "李欢") {
    file = KSDrive.openFile("https://wps365.kdocs.cn/l/csKaqmUYCACv")
  } else if (gongYingShang == "王姐") {
    file = KSDrive.openFile("https://wps365.kdocs.cn/l/cc6IZvaEXlvu")
  }
  // 遍历并打印所有工作表的名称 
  let sheets = file.Application.Sheets

  for (let i = 0; i < sheets.Count; i++) {
    let sheet = sheets.Item(i + 1)
    //console.log(sheet.Name) // 打印每个工作表的名称 
    //非测试情况就判断是否存在目标表，存在跳出，测试则无视
    if (sheet.Name.includes(qiShu21) && testModel == "否") {
      console.log(`${qiShu21}期已存在目标簿中`)
      return
    }
  }

  let firstSheetName = file.Application.Sheets.Item(1).Name
  //console.log("firstSheetName", firstSheetName)
  // 在当前Sheet之前新增名称为'新工作表(左)'的Sheet
  let newSheet = sheets.Add(null, sheets(firstSheetName), 1)
  newSheet.Name = qiShu21 + "期(未下单)"
  //console.log("374", newSheet.Name)
  //  sheets.Item(newSheet.Name).Range("A2").Value2=1234
  // newSheet.Range("A1").Value2="1234"
  //console.log("377", newSheet.Name)
  aimSheet = newSheet
  // file.close()
  //return newSheet
  //console.log(file.Application.Sheets.Item(1).Name)
  console.log("添加目标表格结束")
}

//最后处理
function caigouSheetFuncPart4() {
  console.log("采购表最后处理开始")
  heBingImg()//合并图片
  copyFunction()//处理支付方式
  setStyle()//设置样式
  DeleteColumns()//删除多余列 #删除不需要的列
  //隐藏行
  aimSheet.UsedRange.Rows(`1:2`).EntireRow.Hidden = true

  console.log("采购表最后处理结束")
}
//删除多余列 #多余列删除
function DeleteColumns() {
  console.log("删除多余列开始")
  //从右往左删
  let array991 = ["ID034", "ID036", "ID023", "ID002", "ID018"]//要删除的的列id，顺序有讲究
  array991.forEach((e) => {
    let colNumID913 = getCol(e, 1, "采购表")//储存着"行id"的列号字母
    aimSheet.UsedRange.Columns.Item(colNumID913).Delete()
  })
  // //先记录
  // let colNumID340 = getCol("ID018", 1, "采购表")//储存着"行id"的列号字母
  // //console.log("caigoubiaosheet",caigoubiaosheet.UsedRange.Columns.Item("T").Value2)
  // aimSheet.UsedRange.Columns.Item(colNumID340).Delete()
  // //aimSheet.UsedRange.Save()
  // let colNumID441 = getCol("ID018", 1, "采购表")//储存着"品名"的列号字母
  // //console.log("caigoubiaosheet",caigoubiaosheet.UsedRange.Columns.Item("T").Value2)
  // aimSheet.UsedRange.Columns.Item(colNumID441).Delete()
  // let colNumID503 = getCol("ID018", 1, "采购表")//储存着支付方式的列号字母
  // //console.log("caigoubiaosheet",caigoubiaosheet.UsedRange.Columns.Item("T").Value2)
  // // aimSheet.UsedRange.Columns.Item(colNumID503).Delete()
  console.log("删除多余列结束")
}

//设置样式
async function setStyle() {
  let range = aimSheet.UsedRange
  // 设置对齐方式：居中
  range.HorizontalAlignment = xlCenter
  // 设置自动列宽
  range.Columns.AutoFit()
  //设置第一行字体
  range.Rows.Item(1).Font.Color = RGB(255, 255, 255)
  range.Rows.Item(1).Font.Color = RGB(255, 255, 255)
  range.Rows.Item(1).Font.Bold = true
  range.Rows.Item(1).Interior.Color = RGB(0, 0, 0)
  //设置第二行字体
  range.Rows.Item(2).Font.Bold = true
  let length = range.Rows.Item(2).Cells.Count
  console.log("351", length)
  for (let i = 0; i < length; i++) {
    let e = range.Rows.Item(2).Cells.Item(i + 1)
    //console.log("e355", e.Value2)
    e.Font.Color = RGB(255, 255, 255)
    if (e.Value2 == "固定") {
      e.Interior.Color = RGB(255, 192, 0)
    } else if (e.Value2 == "输出") {
      e.Interior.Color = RGB(146, 208, 80)
    } else if (e.Value2 == "自动") {
      e.Interior.Color = RGB(0, 176, 240)
    } else if (e.Value2 == "输入") {
      e.Interior.Color = RGB(255, 0, 0)
    }
  }

  //设置第三行字体
  range.Rows.Item(3).Font.Bold = true

  //设置第四行填充
  range.Rows.Item(3).Interior.Color = RGB(255, 255, 0)
}
//处理支付方式
async function copyFunction() {
  let colNumID336 = getCol("ID029", 1, "采购表")//储存着支付方式的列号字母
  console.log("${colNumID336}${heJiIndex+1}", `${colNumID336}${startRow}`)
  aimSheet.Range(`${colNumID336}${startRow}`).Validation.Add(xlValidateList, null, null, "支付宝,拼多多,微信")
}

//合并图片
function heBingImg() {
  let colNumID334 = getCol("ID003", 1, "采购表")//储存着行ID的列号字母
  imageRowsArray.forEach((e, i, s) => {
    if (i + 1 == s.length) {
      aimSheet.Range(`${colNumID334}${e + 1}:${colNumID334}${heJiIndex}`).Merge()
      console.log("最后一次342", `${colNumID334}${e + 1}:${colNumID334}${heJiIndex}`)
      // console.log("dataQingXi1Array", JSON.stringify(dataQingXi1Array))


    } else {
      //console.log("345", `${colNumID334}${e + 1}:${colNumID334}${s[i + 1]}`)
      aimSheet.Range(`${colNumID334}${e + 1}:${colNumID334}${s[i + 1]}`).Merge()
    }
  })

}
//储存图片行号
function setImgRowNum() {
  // console.log("储存图片行号开始") // 阶段日志：噪声，排查时再开
  // 要查找的ID值
  let targetID = "ID003"
  // 查找三维数组中ID为"ID003"的数组
  //console.log("717", caigoubiaoData)
  let targetObject = caigoubiaoData.find(subArray => subArray[0][0] === "ID003")
  //console.log("721", targetObject)
  if (targetObject) {
    //console.log("335", value2Arr); // 输出: [4, 5, 6]
    targetObject.forEach((e, i, s) => {
      if (e[0]) {
        //console.log("338", i)
        if (e[0].includes("DISPIM")) {
          imageRowsArray.push(i)
          //console.log("339", i, e)
        }
      }

      if (i + 1 == s.length) {
        //console.log("最后一次342")
        //console.log("dataQingXi1Array", JSON.stringify(dataQingXi1Array))


      }
    })
  } else {
    console.log("未找到ID为" + targetID + "的对象");
  }
}

//处理公式 顺便储存合计行号
function caigouSheetFuncPart2_3() {
  let targetID244 = "ID009"//合计列
  let targetID245 = "ID021"//差额列
  let targetID246 = "ID022"//实到合计列
  let targetID247 = "ID007"//数量列
  let targetID248 = "ID008"//单价列
  let targetID249 = "ID020"//单价列

  let index1 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID244);//合计列
  let index2 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID245);//差额列
  let index3 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID246);//实到合计列
  let index4 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID247);//数量列
  let index5 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID248);//单价列
  let index6 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID249);//实到列

  let ziMu1 = numberToLetters(index4 + 1)//数量列
  let ziMu2 = numberToLetters(index5 + 1)//单价列
  let ziMu3 = numberToLetters(index6 + 1)//实到列
  let ziMu4 = numberToLetters(index1 + 1)//合计列
  let ziMu5 = numberToLetters(index2 + 1)//差额列
  let ziMu6 = numberToLetters(index3 + 1)//实到合计列

  //console.log("字母", numberToLetters(index2 + 1))
  caigoubiaoDataLength = caigoubiaoData.length
  //console.log("caigoubiaoData.length",caigoubiaoData.length)
  // 要查找的ID值
  let targetID = "ID018"
  // 查找数组中ID为"ID002"的对象
  let targetObject = arrayObj.find(obj => obj.ID === targetID);
  // 如果找到了该对象，引用其"value2Arr"属性的值
  if (targetObject) {
    var value2Arr = targetObject.value2Arr;
    //console.log("250", value2Arr); // 输出: [4, 5, 6]
    let debug006Printed = false
    // 首款/尾款两行（对应 Excel 中 006 行下方的两行）
    let heJiPayRow1 = -1
    let heJiPayRow2 = -1

    value2Arr.forEach((e, i, s) => {
      //console.log("262", caigoubiaoData[3][i])
      // console.log("e", e)

      //caigoubiaoData[13][i][0] = "123"
      if (i >= (startRow - 1) && e[0] != "006" && i != heJiPayRow1 && i != heJiPayRow2) {
        caigoubiaoData[index1][i][0] = `=IF(${ziMu1}${i + 1}="","",${ziMu1}${i + 1}*${ziMu2}${i + 1})`//合计列
        caigoubiaoData[index2][i][0] = `=IFS(${ziMu3}${i + 1}="","",${ziMu3}${i + 1}=${ziMu1}${i + 1},0,${ziMu3}${i + 1}-${ziMu1}${i + 1}<0,${ziMu3}${i + 1}-${ziMu1}${i + 1},${ziMu3}${i + 1}-${ziMu1}${i + 1}>0,${ziMu3}${i + 1}-${ziMu1}${i + 1})`//差额列
        caigoubiaoData[index3][i][0] = `=IF(${ziMu3}${i + 1}="","",${ziMu2}${i + 1}*${ziMu3}${i + 1})`//实到合计列
      } else if (e[0] == "006") {
        //console.log("256", e[0])
        heJiIndex = i
        caigoubiaoData[index4][i][0] = `=SUM(${ziMu1}${startRow}:${ziMu1}${i})`//数量列总计行
        caigoubiaoData[index1][i][0] = `=SUM(${ziMu4}${startRow}:${ziMu4}${i})`//合计列总计行

        // 直接写入“006下一行/下一下一行”，不要 push 新行（否则会跑到表末尾）
        // 注意：i 是 value2Arr 的下标，Excel 行号通常是 i+1
        let writeRow1 = i + 1
        let writeRow2 = i + 2
        heJiPayRow1 = writeRow1
        heJiPayRow2 = writeRow2
        let weiKuang = addDaysToCompactDate(qiShu21, 60) // 尾款一般60后还

        caigoubiaoData.forEach((e1, i1, s1) => {
          // 确保目标行存在，避免 undefined 下标报错
          if (!e1[writeRow1]) e1[writeRow1] = [""]
          if (!e1[writeRow2]) e1[writeRow2] = [""]

          if (i1 != index1 && i1 != index5) {
            // 其它列在首款/尾款两行保持空白
            e1[writeRow1][0] = ""
            e1[writeRow2][0] = ""
          } else if (i1 == index1) {
            // 合计列首款/尾款：取 006 合计列总计的一半
            e1[writeRow1][0] = `=${ziMu4}${i + 1}/2`
            e1[writeRow2][0] = `=${ziMu4}${i + 1}/2`
          } else if (i1 == index5) {
            // 单价列首款/尾款：写入文本
            e1[writeRow1][0] = "首款"
            e1[writeRow2][0] = `尾款${weiKuang}前结`
          }
        })

        //实到列总计行
        caigoubiaoData[index6][i][0] = `=if(SUM(${ziMu3}${startRow}:${ziMu3}${i})=0,"",SUM(${ziMu3}${startRow}:${ziMu3}${i}))`
        //差额列总计行
        caigoubiaoData[index2][i][0] = `=let(ss,SUM(${ziMu5}${startRow}:${ziMu5}${i}),ifs(ss=0,"",ss>0,"多"&ss&"片",ss<0,"少"&-ss&"片"))`
        //实到合计列总计行
        caigoubiaoData[index3][i][0] = `=if(SUM(${ziMu6}${startRow}:${ziMu6}${i})=0,"",SUM(${ziMu6}${startRow}:${ziMu6}${i}))`
        //SUM(H3:H100)
      } else if (i == (startRow - 2)) {
        //console.log("286")


        //caigoubiaoData[caigoubiaoDataLength+1][i][0]="采购数量留档"
      }

      if (i + 1 == s.length) {
        //console.log("最后一次239")
        // console.log("dataQingXi1Array", JSON.stringify(dataQingXi1Array))


      }
    })
  } else {
    console.log("未找到ID为" + targetID + "的对象");
  }

}
//dataQingXi2获取数量为0的sku的下标
async function dataQingXi2() {
  // 要查找的ID值
  let targetID = "ID007"

  // 查找数组中ID为"ID002"的对象
  let targetObject = arrayObj.find(obj => obj.ID === targetID);

  // 如果找到了该对象，引用其"value2Arr"属性的值
  if (targetObject) {
    var value2Arr = targetObject.value2Arr;
    //console.log("227", value2Arr); // 输出: [4, 5, 6]
    value2Arr.forEach((e, i, s) => {
      // console.log("e", e)


      if (e[0] == 0) {
        //console.log("233", e[0])
        num0RowsArray.push(i)

      }

      if (i + 1 == s.length) {
        //console.log("最后一次239")
        // console.log("dataQingXi1Array", JSON.stringify(dataQingXi1Array))


      }
    })
  } else {
    console.log("未找到ID为" + targetID + "的对象");
  }
}
//处理数量为0的行
async function caigouSheetFuncPart2_2() {
  caigoubiaoData.forEach((e, i, s) => {
    let count = 0
    //console.log("220", e)
    num0RowsArray.forEach((e1, i1, s1) => {
      e.splice(e1 - count, 1);
      count++
    })
  })
}

//把图片赋值给数量非0的行，如果此款没有数量则删除图片 #图片处理图片
function doImageRowsArray() {
  // console.log("把图片赋值给数量非0的行开始") // 阶段日志：噪声，排查时再开
  // 要查找的ID值
  let targetID003 = "ID003"//"图片"列id
  let targetID225 = "ID007"//"数量"列id
  let targetID866 = "ID018"//"行id"列id
  let index1 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID003);//"图片"列的列号
  let index2 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID225);//"数量"列的列号
  let index3 = caigoubiaoArrayObj.findIndex(obj => obj.ID === targetID866);//"行id"列的列号

  let rowNum873//行ID为006的行的行号

  caigoubiaoData[index3].forEach((e, i) => {
    if (e[0] === "006") {
      rowNum873 = i
    }
  })

  // 如果找到了该对象
  if (index1 && index2) {
    //遍历采购表图片列
    caigoubiaoData[index1].forEach((e, i, s) => {
      //console.log(i)
      //console.log("e228", e[0])
      let flag1100
      if (e[0]) { flag1100 = 1 } else { return }//判断有无元素
      if (e[0].includes("DISPIM")) { flag1100 = 1 } else { return }//判断有无图片
      //console.log(`${i + 1}行，${e[0].includes("DISPIM")}`)
      //如果条件达成
      if (flag1100) {
        let i1 = i//行号
        if (caigoubiaoData[index2][i1][0] > 0) {
          //如果有图片的这行刚好有数量，那就什么都不用做
        } else if (caigoubiaoData[index2][i1][0] == 0) {
          //如果有图片的行数量又为0就得处理一下了
          //console.log("1138", s[i1][0])
          //console.log(`${i1}行和${i}行验证1`)
          for (let i1144 = 0; i1144 < 999999; i1144++) {
            if (i1 == i) {
              //console.log(`${i1+1}行和${i+1}行验证`)
              i1++
            } else if (caigoubiaoData[index2][i1][0] == 0 && s[i1][0] == undefined) {
              i1++
              //console.log("1149", i1, s[i1][0])
            } else if (caigoubiaoData[index2][i1][0] != 0 || s[i1][0] != undefined) {
              //console.log("1152")
              break
            }
          }
          //图片有的调的情况下
          if (i1 <= rowNum873 - 1) {
            //如果图片和数量不为零不在同行，则把图片行调到有数量的行，并且那行有数量的没有图片,并且不是复制到合计行
            //console.log("1116", s[index3][0].includes("DISPIM"))

            //图片和数量非0不在同行
            if (i != i1) {
              //等于null或者undefined就是没图片，也是0,此时可以把需要调换的调了，有图片且有图片则不用操作
              if (!s[i1][0]) {
                s[i1][0] = e[0]
                e[0] = ""//顺便把原来的图片行清零
                //console.log(`成功把第${i + 1}行图片调到第${i1 + 1}行`)
              }
              // && s[i1][0].includes("DISPIM")==false
            }
          } else if (i1 > rowNum873 - 1) {
            //调无可调时，说明这个颜色没下单数量，直接清空图片
            e[0] = ""
          }
        }
      }
      // console.log(i) // 调试用：会刷屏（对应你日志里 3/27/51...）
    })

  } else {

    console.log("未找到ID为" + targetID + "的对象");
  }

  //console.log("878",caigoubiaoData[0])
  // 查找数组中ID为"ID002"的对象

  // console.log("把图片赋值给数量非0的行结束") // 阶段日志：噪声，排查时再开
}
//获取要品的备货flag
async function getGoodsChooseflag(colIdNum1, jsJson1) {
  let sheetName = "功能表" //所在表名
  let colIdNum = colIdNum1 //存储着"行ID"的列的英文列号
  let jsJson = jsJson1 //存储着"脚本配置"的值的英文列号

  // console.log("获取要备货的品flag开始") // 阶段日志：噪声，排查时再开
  //运算赋值
  beiHuoData.forEach((e, i, s) => {
    let rowNum = getRow(e.id, colIdNum, sheetName)
    e.chooseflag = gnSheet.Range(jsJson + rowNum).Value2

    //最后一次运算
    if (i + 1 == s.length) {

    }
  })
  // console.log("获取要备货的品flag结束") // 阶段日志：噪声，排查时再开
}

//获取功能表全部数据
async function getAlldata() {
  // console.log("获取功能表全部数据开始") // 阶段日志：噪声，排查时再开
  // 行ID=006 作为边界：只保留该行及以上（排除其下方所有行）
  const rowNum006 = Number(getRow("006", colNumID018, "功能表")) // 1-based
  //处理数据
  arrayObj.forEach((e, i, s) => {
    e.colNum = getCol(e.ID, 1, gnSheetName)
    // 从“功能表”的已使用区域（UsedRange）里，取出当前字段对应的那一整列的所有值
    // - e.colNum：列字母（例如 "A"/"B"/...），由 getCol(e.ID, 1, gnSheetName) 计算得到
    // - Value2：读取单元格值；通常返回二维数组：[[第1行值],[第2行值],...]
    const colValues = gnSheet.UsedRange.Columns.Item(e.colNum).Value2

    // 以“行ID=006所在行”为边界，把 006 行以下的数据排除掉
    // - rowNum006：getRow("006", colNumID018, "功能表") 的结果，属于 1-based 行号（第1行=1）
    // - Array.isArray(colValues)：确保 Value2 读取结果确实是数组，避免非数组时 slice 报错
    // - slice(0, rowNum006)：保留数组的前 rowNum006 个元素 => 对应 Excel/WPS 的第1行~第rowNum006行（包含006那行）
    // - 若 rowNum006 不存在/异常 或 colValues 不是数组，则不截断，直接保留整列原值
    e.value2Arr = (rowNum006 && Array.isArray(colValues)) ? colValues.slice(0, rowNum006) : colValues
    //console.log(e.value2Arr)

    if (i + 1 == s.length) {
      //最后一次遍历
    }
  })
  // console.log("获取功能表全部数据结束") // 阶段日志：噪声，排查时再开
}

//获取要清理的品的下标 #dataQingXi1f
function dataQingXi1() {
  // console.log("获取要清理的品下标开始") // 阶段日志：噪声，排查时再开
  // 要查找的ID值
  let targetID = "ID034"//储存着"采购编码"的列的ID

  // 查找数组中ID为targetID的对象
  let targetObject = arrayObj.find(obj => obj.ID === targetID);

  // 如果找到了该对象，引用其"value2Arr"属性的值
  if (targetObject) {
    var value2Arr = targetObject.value2Arr;
    //console.log("291", value2Arr); // 输出: [4, 5, 6]
    value2Arr.forEach((e, i, s) => {
      //console.log("921",i)
      // console.log("e", e)
      beiHuoData.forEach((e1) => {
        //console.log("926", i,e1.name, e1.chooseflag, e[0])
        //"chooseflag"代表该"款"要不要备货，如果是0的话，就是不参与备货，则存起来，准备删掉
        if ((e[0] == e1.beiHuoCode && e1.chooseflag == 0)) {
          //console.log("926", i, e1.beiHuoCode, e1.chooseflag, e[0])
          dataQingXi1Array.push(i)
        }
      })
      if (i + 1 == s.length) {
        //console.log(`最后一行${i + 1}`)
        //console.log("dataQingXi1Array", JSON.stringify(dataQingXi1Array))
      }
    })
  } else {
    console.log("未找到ID为" + targetID + "的对象");
  }
  // console.log("获取要清理的品下标结束") // 阶段日志：噪声，排查时再开
}

//整合所有数据,处理出采购表需要的数据part1添加不需要的品到数组
function caigouSheetFuncPart1() {
  //拿到采购表数据
  caigoubiaoArrayObj.forEach((e, i, s) => {
    // 要查找的ID值
    let targetID = e.ID

    // 查找数组中ID为"ID012"的对象
    let targetObject = arrayObj.find(obj => obj.ID === targetID);

    // 如果找到了该对象，引用其"value2Arr"属性的值
    if (targetObject) {
      var value2Arr = targetObject.value2Arr;
      //console.log(value2Arr); // 输出: [4, 5, 6]
    } else {
      console.log("未找到ID为" + targetID + "的对象");
    }

    caigoubiaoData.push(value2Arr)

    if (i + 1 == s.length) {
      //console.log("最后一个285", caigoubiaoData[0].length)


    }
  })


}
//清洗掉不需要的品part2
function caigouSheetFuncPart2() {
  dataQingXi1Array.sort((a, b) => a - b);
  //console.log("dataQingXi1Array973",dataQingXi1Array.length)
  caigoubiaoData.forEach((e, i, s) => {
    let count = 0
    dataQingXi1Array.forEach((e1, i1, s1) => {
      //console.log("978",e1,count,e[e1],e1-count)
      e.splice(e1 - count, 1);
      //console.log("979",e.length)
      count++
    })
  })

  //console.log("caigoubiaoData984",caigoubiaoData[0].length)

}

//数据扁平化处理并赋值
function caigouSheetFuncPart3(aimSheet) {

  // console.log(958) // 调试噪声数字
  if (aimSheet) {
    //console.log(761, aimSheet.Name)
  }

  //数组扁平处理
  caigoubiaoDataMax = arraysFunc(caigoubiaoData)
  //console.log(962)
  //赋值
  //console.log("扁平化处理后的数据", caigoubiaoDataMax[1])
  let weight = caigoubiaoDataMax[0].length
  let height = caigoubiaoDataMax.length
  let columnZm = numberToLetters(weight)
  //console.log("A1:" + columnZm + height)
  //aimSheet.Range("A1").Value2=1231


  caigoubiaosheet.UsedRange.Clear()
  caigoubiaosheet.UsedRange.EntireRow.Hidden = false
  //console.log(974)
  caigoubiaosheet.Range("A1:" + columnZm + height).Value2 = caigoubiaoDataMax
  //在采购表写入无数量版PDF链接到S4 #无数量版链接
  if (pdfLinkEmpty) {
    let colNum1025Local = getCol("ID033", 1, "采购表")
    let titleCellLocal = caigoubiaosheet.Range(`${colNum1025Local}${startRow}`)
    let titleTextEmpty = `货物清单-无数量(第${qiShu21}期${guoJia}${postMothod26}）`
    titleCellLocal.Hyperlinks.Add(titleCellLocal, pdfLinkEmpty, "", "", titleTextEmpty)
  }
  //console.log("1023", pdfLink)
  let colNum1025 = getCol("ID033", 1, "采购表")//储存着行ID的列号字母
  if (aimSheet) {
    aimSheet.UsedRange.Clear()
    aimSheet.UsedRange.EntireRow.Hidden = false
    aimSheet.Range("A1:" + columnZm + height).Value2 = caigoubiaoDataMax
    let titleCell = aimSheet.Range(`${colNum1025}3`)
    let titleText = `货物清单(第${qiShu21}期${guoJia}${postMothod26}）`//期数和运输情况 #货物清单标题 #货物清单格式
    titleCell.Hyperlinks.Add(titleCell, pdfLink, "", "", titleText)
    //在aimSheet写入无数量版PDF链接到第4行 #无数量版链接
    if (pdfLinkEmpty) {
      let titleCellEmpty = aimSheet.Range(`${colNum1025}${startRow}`)
      let titleTextEmpty = `货物清单-无数量(第${qiShu21}期${guoJia}${postMothod26}）`
      titleCellEmpty.Hyperlinks.Add(titleCellEmpty, pdfLinkEmpty, "", "", titleTextEmpty)
    }
  }


}

//console.log("caigoubiaoData", caigoubiaoData)



// 根据值和行号及表名找列号(需要提交表名)
// getCol(值,行号,表名)
function getCol(Value, row, Sheet) {
  //去获取列号(英文格式)
  const thirdRow = Application.Sheets.Item(Sheet).Rows(row)
  const searchRange = thirdRow.EntireRow
  const foundCell = searchRange.Find(Value)
  //找到单元格对象，处理后获取地址
  if (foundCell) {
    const address = foundCell.Address(false, false)
    //console.log(`查找到"${Value}"的单元格地址为${address}`)
    var str = address
    var txl = str.replace(/\d+/g, "");
    //console.log(`对应的列名为"${txl}`)
    return txl
  } else {
    //console.log(`未找到内容为"${Value}"的单元格`)
  }
}

// 根据值和列号及表名找行号(需要提交表名)
// getRow(值,列号,表名)
function getRow(Value, Col, Sheet) {
  //去获取行号
  const thirdCol = Application.Sheets.Item(Sheet).Columns(Col)
  const searchRange = thirdCol.EntireColumn
  //console.log("searchRange",searchRange)
  const foundCell = searchRange.Find(Value)
  //找到单元格对象，处理后获取地址
  if (foundCell) {
    const address = foundCell.Address(false, false)
    //console.log(`查找到"${Value}"的单元格地址为${address}`)
    var str = address
    var txl = str.replace(/[A-Z]+/g, "");
    //console.log(`对应的行号为"${txl}`)
    return txl
  } else {
    //console.log(`未找到内容为"${Value}"的单元格`)
  }
}

//数字转列字母
function numberToLetters(n) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  while (n > 0) {
    // 使用模运算找到当前位对应的字母
    const letterIndex = (n - 1) % 26;
    // 将数字转换为字母并添加到结果字符串的前面
    result = alphabet[letterIndex] + result;
    // 处理进位
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

//数组扁平化处理
function arraysFunc(arrays) {

  //console.log("扁平处理1306", arrays)
  // 初始化一个空数组来存储结果
  let resultArray = [];
  //console.log("扁平处理1309",JSON.stringify(...arrays[2]))
  // 计算所有二维数组中最长的长度
  let maxLength = Math.max(...arrays.map(arr => arr.length));
  //console.log("扁平处理1312")
  // 遍历每个索引，直到最长的二维数组的长度
  for (let i = 0; i < maxLength; i++) {
    // 遍历每个二维数组
    arrays.forEach(arr => {
      // 如果当前二维数组的长度大于当前索引，则添加元素到结果数组
      if (arr.length > i) {
        resultArray.push(arr[i][0]);
      }
    });
  }
  // console.log("扁平处理1323")
  // 将结果数组扁平化，使其成为二维数组
  let flatResultArray = [];
  while (resultArray.length > 0) {
    flatResultArray.push(resultArray.splice(0, arrays.length));
  }
  //console.log("1329", flatResultArray); // 输出: [["1","4"],["2","5"],["3","6"]]
  return flatResultArray

}
//6位日期加天数
function addDaysToCompactDate(compactDate, daysToAdd) {
  // 将输入的紧凑日期字符串转换为年份、月份、日期
  const year = parseInt(compactDate.substring(0, 2), 10) + 2000;
  const month = parseInt(compactDate.substring(2, 4), 10) - 1; // 月份从0开始
  const day = parseInt(compactDate.substring(4, 6), 10);

  // 创建Date对象
  const date = new Date(year, month, day);

  // 添加天数
  date.setDate(date.getDate() + daysToAdd);

  // 格式化为紧凑日期字符串
  const newYear = date.getFullYear() - 2000;
  const newMonth = (date.getMonth() + 1).toString().padStart(2, '0');
  const newDay = date.getDate().toString().padStart(2, '0');

  return `${newYear}${newMonth}${newDay}`;
}