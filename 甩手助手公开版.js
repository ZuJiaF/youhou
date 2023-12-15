// ==UserScript==
// @name         甩手助手公开版
// @namespace    http://tampermonkey.net/
// @version      0.2.8
// @description  try to take over the world!
// @author       You
// @match        https://dz.shuaishou.com/*
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://scriptcat.org/lib/1167/1.0.0/%E8%84%9A%E6%9C%AC%E7%8C%ABUI%E5%BA%93.js
// @require      https://cdn.staticfile.org/xlsx/0.15.1/xlsx.core.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shuaishou.com
// @grant        none
// ==/UserScript==
(function() {
/全局变量/
let allCount=0;
let ArrayHead=["商品sku","商品名称","货架位编号","可用库存","锁定库存","总库存","在途库存","头程天数","安全天数","仓库名称","币种","成本价"];
let oldWarehouseArray=[];//宝函仓数据
let newWarehouseArray=[];//新仓数据
let flag=0;//函数执行时标志位
let flag1=0;//老仓运行flag
let flag2=0;//新仓运行flag
let oldListLength=0;
let newListLength=0;
let Authorization;//Authorization
let code;//code
let key;//key
let reloadAlertFlag;//刷新提示标志
let state1;//临时存储1
let state2;//临时存储2
let stockThreshold;//审单库存阈值
/*********全局变量*********/

/*********函数*********/
init();
/*********函数*********/

//数据初始化
function init(){Authorization=localStorage['\x67\x65\x74\x49\x74\x65\x6d']("\x41\x75\x74\x68\x6f\x72\x69\x7a\x61\x74\x69\x6f\x6e");code=localStorage['\x67\x65\x74\x49\x74\x65\x6d']("\x63\x6f\x64\x65");key=localStorage['\x67\x65\x74\x49\x74\x65\x6d']("\x6b\x65\x79");reloadAlertFlag=window["\x4e\x75\x6d\x62\x65\x72"](localStorage['\x67\x65\x74\x49\x74\x65\x6d']("\x72\x65\x6c\x6f\x61\x64\x41\x6c\x65\x72\x74\x46\x6c\x61\x67"));stockThreshold=window["\x4e\x75\x6d\x62\x65\x72"](localStorage['\x67\x65\x74\x49\x74\x65\x6d']("\x73\x74\x6f\x63\x6b\x54\x68\x72\x65\x73\x68\x6f\x6c\x64"))}
//面板数据
const data = {
    input1: 11,
    input2:Authorization,
    input3:code,
    input4:reloadAlertFlag,
    input5:stockThreshold
};
//主页 #首页 #首页UI #首页ui
function firstPage() {
    const [input1, setInput1] = CAT_UI.useState(data.input1);//商品id
    const [input2, setInput2] = CAT_UI.useState(data.input2);//Authorization
    const [input3, setInput3] = CAT_UI.useState(data.input3);//code
    const [visible, setVisible] = CAT_UI.useState(false);
    const [input4,setInput4] = CAT_UI.useState(data.input4);//刷新标志
    const [input5,setInput5] = CAT_UI.useState(data.input5);//库存标志

    return CAT_UI.Space(
        [

            CAT_UI.createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    },
                },
                CAT_UI.Button("一键审核", {
                    type: "primary",
                    onClick() {
                        //混密2
                        if(key=="\x77\x6f\x73\x68\x69\x73\x68\x75\x61\x69\x67\x65"){window["\x61\x6c\x65\x72\x74"]("\u786e\u8ba4\u540e\u5f00\u59cb\u5ba1\u5355");getOrderList()}else{window["\x61\x6c\x65\x72\x74"]("\u53d1\u751f\u9519\u8bef\uff0c\u8bf7\u8054\u7cfb\u4f5c\u8005")}

                    },
                }),


            ),
            CAT_UI.createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        flexDirection:"row",
                        justifyContent: "space-between",
                        alignItems: "center",

                    },
                },
                CAT_UI.Button("手工单填写地址", {
                    type: "primary",
                    onClick() {
                        document.querySelector("#app > div.app-wrapper > div.app-container > section > div > div.h-100.overflow-y > div.container.manual-wrap > div > div:nth-child(2) > div.el-card__body > div > form > div:nth-child(1) > div:nth-child(1) > div > div > div.el-input.el-input--small.el-input--suffix > input").value="บจก.เฟริส์คราสอินเตอร์เนชั่นแนล";
                        document.querySelector("#app > div.app-wrapper > div.app-container > section > div > div.h-100.overflow-y > div.container.manual-wrap > div > div:nth-child(2) > div.el-card__body > div > form > div:nth-child(1) > div:nth-child(2) > div > div > div.input-with-select > div > input").value="0982939452";
                        document.querySelector("#app > div.app-wrapper > div.app-container > section > div > div.h-100.overflow-y > div.container.manual-wrap > div > div:nth-child(2) > div.el-card__body > div > form > div:nth-child(2) > div > div > div > div > textarea").value="21/6 ม .3  ต.คอกกระบือ อ.เมือง จ.สมุทรสาคร 74000";
                    },
                }),

                CAT_UI.Icon.IconSettings({ spin: false, //图标旋转
                                          style: { fontSize: 24},
                                          onClick: () => setVisible(true),
                                         }),
            ),


            CAT_UI.Drawer(
                CAT_UI.createElement("div", {
                    style: {
                        textAlign: "left"

                    }
                },
                                     CAT_UI.createElement(
                    "div",
                    {
                        style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        },
                    },
                    CAT_UI.Text("code："),
                    CAT_UI.Input({
                        value: input3,
                        onChange(val) {
                            setInput3(val);
                            data.input3 = val;
                            code=val;//赋值
                            localStorage.setItem("code",val);
                        },
                        style: {
                            flex: 1,
                            border: "1px solid black",
                        },
                    }),


                ),
                                     CAT_UI.createElement(
                    "div",
                    {
                        style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",

                        },
                    },
                    CAT_UI.Text("Authorization："),
                    CAT_UI.Input({
                        value: input2,
                        onChange(val) {
                            setInput2(val);
                            data.input2 = val;
                            Authorization=val;//赋值
                            localStorage.setItem("Authorization",val);

                        },
                        style: {
                            flex: 1,
                            border: "1px solid black",
                        },
                    }),


                ),


                                     [

                    CAT_UI.Divider("divider with text"),
                    CAT_UI.createElement(
                    "div",
                    {
                        style: {
                            display: "flex",
                            //justifyContent: "space-between",//平均分布
                            alignItems: "center",

                        },
                    },
                    CAT_UI.Text("库存大于"),
                    CAT_UI.Input({
                        value: input5,
                        onChange(val) {
                            setInput5(val);
                            data.input5 = val;
                            stockThreshold=val;//赋值
                            localStorage.setItem("stockThreshold",val);

                        },
                        style: {
                            //flex: 1,
                            width:"40px",
                            border: "1px solid black",
                        },
                    }),
                        CAT_UI.Text("时自动审单"),


                ),
                    CAT_UI.Checkbox("刷新前是否提示",{
                        checked:input4,
                        onChange(checked){
                            //选中时
                            if(checked){
                                setInput4(1);//重新设置input4
                                reloadAlertFlag=1;
                                localStorage.setItem("reloadAlertFlag","1");
                                data.input4=1;
                            }else{
                                setInput4(0);
                                reloadAlertFlag=0;
                                localStorage.setItem("reloadAlertFlag","0");
                                data.input4=0;
                            }

                        },
                    }),
                ]),
                {
                    title: "设置",
                    visible,
                    focusLock: true,
                    placement:"right",//抽屉方向
                    width:500,//抽屉宽度
                    autoFocus: true,
                    zIndex: 10000,
                    //抽屉打开的回调
                    afterOpen(){
                        state1=input4;
                        state2=input5;


                    },
                    onOk: () => {
                        setVisible(false);
                    },
                    onCancel: () => {
                        setInput4(state1);
                        reloadAlertFlag=state1;
                        localStorage.setItem("reloadAlertFlag",state1);
                        data.input4=state1;

                        setInput5(state2);
                        stockThreshold=state2;
                        localStorage.setItem("stockThreshold",state2);
                        data.input5=state2;
                        setVisible(false);


                    },
                }
            ),
        ],
        {
            direction: "vertical",
        }
    );
}

//库存(页面2)
function stockEx() {
    const [input1, setInput1] = CAT_UI.useState(data.input1);//商品id
    return CAT_UI.Space(
        [
            CAT_UI.createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    },
                },
                CAT_UI.Button("导出宝函库存", {
                    type: "primary",
                    onClick() {

                        //数组没数据时才加载
                        if(flag1==0){
                            alert("确定后开始导出");
                            oldWarehouseArray=[ArrayHead];
                            abc("1629401226010591234");//宝函仓

                        }
                        else if(flag1==1){
                            alert("加载中，等等再点");
                        }
                        console.log("老仓已存好的数据的长度:"+oldWarehouseArray.length);
                        console.log("加载标志",flag1);

                    },
                }),


            ),
            CAT_UI.createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    },
                },
                CAT_UI.Button("导出新仓库存", {
                    type: "primary",
                    onClick() {
                        //数组没数据时才加载
                        if(flag2==0){
                            alert("确定后开始导出");
                            newWarehouseArray=[ArrayHead];
                            abc("1688497351560474625");//新仓
                        }else if(flag2==1){
                            alert("加载中，等等再点");
                        }
                        console.log("新仓已存好的数据的长度:"+newWarehouseArray.length);
                        console.log("加载标志",flag2);
                    },
                }),


            ),
            CAT_UI.createElement(
                "div",
                {
                    style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    },
                },
                CAT_UI.Button("导出两仓库存", {
                    type: "primary",
                    onClick() {
                        console.log("正在导出双仓库存")
                        //数组没数据时才加载
                        if(flag1==0 || flag2==0 ){
                            alert("确定后开始导出");
                            if(flag2==0){
                                newWarehouseArray=[ArrayHead];
                                abc("1688497351560474625");//新仓
                            }
                            if(flag1==0){
                                oldWarehouseArray=[ArrayHead];
                                abc("1629401226010591234");//宝函仓
                            }

                        }else if(flag1==1 || flag2==1){
                            alert("加载中，等等再点");
                        }
                    },
                }),


            ),
        ],
        {
            direction: "vertical",
        }
    );
}

//创造UI
CAT_UI.createPanel({
    minButton: true,//minButton控制是否显示最小化按钮，默认为true
    min: true,// min代表面板初始状态为最小化（仅显示header）
    /*相当于GM_addStyle */
    appendStyle: `section {
max-width:600px;
box-shadow:0px 0px 5px;
position: fixed !important;

}`,
    //point: { x: (window.screen.width - 500) / 2, y: 20 },// 面板初始坐标
    header: {
        title() {
            return CAT_UI.el(
                "div",
                {
                    style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    },
                },
                CAT_UI.Text("Gigar助手", {
                    style: { fontSize: "16px" },
                }),
                CAT_UI.Space([
                    CAT_UI.Router.Link("首页", { to: "/" }),

                    CAT_UI.Router.Link("库存", { to: "/stockEx" }),

                ])
            );
        },
        icon:CAT_UI.Icon.ScriptCat({
            style: { width: "24px"},
            draggable: "true",// 这个class控制图标旋转spin
            className: "arco-icon-loading",
        }),

        style: { background: "#e5e5ff",borderBottom: "1px solid gray" },
    },
    routes: [
        {
            path: "/",
            Component: firstPage,
        },
        {
            path: "/stockEx",
            Component: stockEx,
        },
    ],
});


//获取订单列表
function getOrderList(){
    $.ajax({
        url: 'https://dz.shuaishou.com/api/orderPrint/orderHead/orderList',
        crossDomain: true,
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Authorization': 'bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDEwNDMxMDMsInVzZXJfbmFtZSI6IjMwNGRkMDBmLTgxNmEtNGMwNS1hOWU2LTMzOTBmODkwYTA1OCIsImF1dGhvcml0aWVzIjpbIlJPTEVfVVNFUiJdLCJqdGkiOiI0ZmJiZTVkZi00NGM5LTQ2NGQtOGI1OC01ODg5MzdiYzU0YWIiLCJjbGllbnRfaWQiOiJtaW5pLWFwaSIsInNjb3BlIjpbImFsbCJdfQ.PmfKiAgxJcFfvZkzAhvPuUQOPsM3KAIfcn6JJ2EGVomjcXksPqKPUBBbvFsWBIPPeOtvLYJLoSX_BZVvRdB0FUcvfPWWaKmPIwildVga9eZMlOltLCIhwpABfqhzTDXdVXx-lrDJAZo2K4EBzsp1s-EfAvc2lmwGUrMZ1FZm5loyo_XszE55HCEOwzBZw1wdaETTxSdicRbJOJRRUVAqjv2xRPRRGhDB13-D-xTnEaNgCTlGhcG5txTMi66o-aszMtXF_eGcc-Jg38zaUm78mbG5lEWF1vdI_i2o9VACef11_VOTWwy3EX85nF6VvcnmXRvANO_MbQ-fe1-MUhxwLw',
        },
        contentType: 'application/json',
        data: JSON.stringify({
            'code': code,
            'pageNo': 1,
            'pageSize': 100,
            'wareHouseId': 0,
            'shippingCarrier': 0,
            'channelGroupId': 0,
            'orderPrintStatus': 0,
            'shopIds': [],
            'orderFilter': 0,
            'isManyProducts': false,
            'isMostSingleProduct': false,
            'isSingleProduct': false,
            'subOrderState': 0,
            'orderSortType': 1,
            'paymentMethod': 0,
            'timeType': 1,
            'flag': [],
            'exactSearch': 1,
            'exactSearchAttached': '',
            'orderStatus': '2',
            'platformValue': 0,
            'tradeStartTime': '',
            'tradeEndTime': ''
        })
    }).done(function(res) {
        console.log("getOrderList",res);
        allCount=res.data.list.length;
        console.log(`订单总数为${allCount}`);


        res.data.list.forEach(function(e) {

            //console.log(e.id);//id
            //console.log(e.wareHouseId);//wareHouseId
            //console.log(e.orderCode)//orderCode

            //手工单不处理
            if(e.shopName==" "){
                allCount--;
                console.log("减少")
            }else{
                getDetail(e.orderCode,e.id,0,Authorization,code);//获取订单详情
            }




        });
    });
}


//获取订单详情
function getDetail(orderCode,orderId,flag,Authorization,code){
    //console.log("Authorization",Authorization);
    $.ajax({
        url: 'https://dz.shuaishou.com/api/orderPrint/orderHead/detail',
        crossDomain: true,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Authorization': Authorization,

        },
        data: {
            'orderCode': orderCode,
            'orderId': orderId,
            'code': code
        }
    }).done(function(res) {
        console.log("getDetail",res);

        //console.log(res.data.orderId)//id
        let orderId=res.data.orderId;

        //console.log(res.data.wareHouseId)//wareHouseId
        let wareHouseId=res.data.wareHouseId;


        let itemSkuModels=[];
        res.data.productInfo.forEach(function(e){
            //console.log(res.data.productInfo[0].matchSkuResVO.linkSkuId);//itemSkuModels

            //判断组合sku
            if(e.matchSkuResVO.associateSku==true){
                e.matchSkuResVO.associateSkuList.forEach(function(e){
                    itemSkuModels.push(e.id);
                })
            }else if(e.matchSkuResVO.associateSku==false){
                itemSkuModels.push(e.matchSkuResVO.linkSkuId);
            }

        });

        getAvailableStock(orderId,wareHouseId,itemSkuModels,orderCode,flag);//获得库存

    });
}


//获取订单库存
function getAvailableStock(orderId,wareHouseId,itemSkuModels,orderCode,flag){
    //console.log(itemSkuModels);
    $.ajax({
        url: 'https://dz.shuaishou.com/api/orderPrint/orderWareHouse/getAvailableStock',
        crossDomain: true,
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Authorization': 'bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDEwNDMxMDMsInVzZXJfbmFtZSI6IjMwNGRkMDBmLTgxNmEtNGMwNS1hOWU2LTMzOTBmODkwYTA1OCIsImF1dGhvcml0aWVzIjpbIlJPTEVfVVNFUiJdLCJqdGkiOiI0ZmJiZTVkZi00NGM5LTQ2NGQtOGI1OC01ODg5MzdiYzU0YWIiLCJjbGllbnRfaWQiOiJtaW5pLWFwaSIsInNjb3BlIjpbImFsbCJdfQ.PmfKiAgxJcFfvZkzAhvPuUQOPsM3KAIfcn6JJ2EGVomjcXksPqKPUBBbvFsWBIPPeOtvLYJLoSX_BZVvRdB0FUcvfPWWaKmPIwildVga9eZMlOltLCIhwpABfqhzTDXdVXx-lrDJAZo2K4EBzsp1s-EfAvc2lmwGUrMZ1FZm5loyo_XszE55HCEOwzBZw1wdaETTxSdicRbJOJRRUVAqjv2xRPRRGhDB13-D-xTnEaNgCTlGhcG5txTMi66o-aszMtXF_eGcc-Jg38zaUm78mbG5lEWF1vdI_i2o9VACef11_VOTWwy3EX85nF6VvcnmXRvANO_MbQ-fe1-MUhxwLw',

        },
        contentType: 'application/json',
        data: JSON.stringify({
            'code': code,
            'id': orderId,
            'wareHouseId': wareHouseId,//仓库代码
            'itemSkuModels': itemSkuModels
        })
    }).done(function(res) {
        console.log("getAvailableStock",res);
        let flag1=0;
        res.data.forEach(function(e){
            //最小库存小于5
            if(e.stockQuantities>=0 && e.stockQuantities<=stockThreshold){
                flag1=1;
            }
        })
        //第一次
        if(flag==0){
            //库存大于5
            if(flag1==0){
                createPackageNo(orderId);//审单

            }else if(flag1=1 && wareHouseId!=1688497351560474625){//没库存并且非新仓
                batchUpdateWareHouse(orderId,orderCode,1)//换仓
            }else if(flag1=1 && wareHouseId==1688497351560474625){//没库存并且是新仓
                allCount--;
                console.log("减少")
                if(allCount==0){
                    //刷新页面flag
                    if(reloadAlertFlag==1){
                        alert("确认后刷新页面1");
                    }
                    location.reload();//刷新页面
                }
            }
        }
        //第二次
        else if(flag==1){
            //库存大于5
            if(flag1==0){
                createPackageNo(orderId);//审单

            }else if(flag1=1){
                allCount--;
                console.log("减少")
                if(allCount==0){
                    //刷新页面flag
                    if(reloadAlertFlag==1){
                        alert("确认后刷新页面1");
                    }
                    location.reload();//刷新页面
                }
            }
        }


    });
}

//审单
function createPackageNo(orderId){
    $.ajax({
        url: 'https://dz.shuaishou.com/api/orderPrint/orderHead/createPackageNo',
        crossDomain: true,
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Authorization': 'bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDEwNDMxMDMsInVzZXJfbmFtZSI6IjMwNGRkMDBmLTgxNmEtNGMwNS1hOWU2LTMzOTBmODkwYTA1OCIsImF1dGhvcml0aWVzIjpbIlJPTEVfVVNFUiJdLCJqdGkiOiI0ZmJiZTVkZi00NGM5LTQ2NGQtOGI1OC01ODg5MzdiYzU0YWIiLCJjbGllbnRfaWQiOiJtaW5pLWFwaSIsInNjb3BlIjpbImFsbCJdfQ.PmfKiAgxJcFfvZkzAhvPuUQOPsM3KAIfcn6JJ2EGVomjcXksPqKPUBBbvFsWBIPPeOtvLYJLoSX_BZVvRdB0FUcvfPWWaKmPIwildVga9eZMlOltLCIhwpABfqhzTDXdVXx-lrDJAZo2K4EBzsp1s-EfAvc2lmwGUrMZ1FZm5loyo_XszE55HCEOwzBZw1wdaETTxSdicRbJOJRRUVAqjv2xRPRRGhDB13-D-xTnEaNgCTlGhcG5txTMi66o-aszMtXF_eGcc-Jg38zaUm78mbG5lEWF1vdI_i2o9VACef11_VOTWwy3EX85nF6VvcnmXRvANO_MbQ-fe1-MUhxwLw',

        },
        contentType: 'application/json',
        data: JSON.stringify({
            'code': code,
            'ids': [
                orderId
            ]
        })
    }).done(function(response) {
        console.log(response);
        allCount--;
        console.log("减少")
        if(allCount==0){
            //刷新页面flag
            if(reloadAlertFlag==1){
                alert("确认后刷新页面1");
            }
            location.reload();//刷新页面
        }
    });
}

//更改仓库
function batchUpdateWareHouse(orderId,orderCode,flag){
    $.ajax({
        url: 'https://dz.shuaishou.com/api/orderPrint/orderWareHouse/batchUpdateWareHouse',
        crossDomain: true,
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'Authorization': 'bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDEwNDMxMDMsInVzZXJfbmFtZSI6IjMwNGRkMDBmLTgxNmEtNGMwNS1hOWU2LTMzOTBmODkwYTA1OCIsImF1dGhvcml0aWVzIjpbIlJPTEVfVVNFUiJdLCJqdGkiOiI0ZmJiZTVkZi00NGM5LTQ2NGQtOGI1OC01ODg5MzdiYzU0YWIiLCJjbGllbnRfaWQiOiJtaW5pLWFwaSIsInNjb3BlIjpbImFsbCJdfQ.PmfKiAgxJcFfvZkzAhvPuUQOPsM3KAIfcn6JJ2EGVomjcXksPqKPUBBbvFsWBIPPeOtvLYJLoSX_BZVvRdB0FUcvfPWWaKmPIwildVga9eZMlOltLCIhwpABfqhzTDXdVXx-lrDJAZo2K4EBzsp1s-EfAvc2lmwGUrMZ1FZm5loyo_XszE55HCEOwzBZw1wdaETTxSdicRbJOJRRUVAqjv2xRPRRGhDB13-D-xTnEaNgCTlGhcG5txTMi66o-aszMtXF_eGcc-Jg38zaUm78mbG5lEWF1vdI_i2o9VACef11_VOTWwy3EX85nF6VvcnmXRvANO_MbQ-fe1-MUhxwLw',

        },
        contentType: 'application/json',
        data: JSON.stringify({
            'code': code,
            'wareHouseId': '1688497351560474625',
            'ids': [
                orderId
            ],
            'wareHouseType': 3,
            'wareHouseName': '\u4E07\u9091\u901A/\u6CF0\u56FD\u66FC\u8C37\u4ED3'
        })
    }).done(function(res) {
        console.log(res);
        getDetail(orderCode,orderId,flag,Authorization,code);//再尝试
    });
}

function abc(stockId){
    console.log("开始加载");
    if(stockId=="1629401226010591234"){
        flag1=1;
    }else if(stockId=="1688497351560474625"){
        flag2=1;
    }

    let data={};
    data.code="304dd00f-816a-4c05-a9e6-3390f890a058";
    let condition={};
    condition.warehouseId=stockId;
    data.condition=condition;
    data.pageSize=6000;
    var msg = JSON.stringify(data);
    $.ajax({
        url: "https://dz.shuaishou.com/api/storage/stock/page",
        type: 'POST',
        data:msg,
        //async:false,//同步操作
        headers:{
            "Authorization":"bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2OTc1MjI2MTAsInVzZXJfbmFtZSI6IjMwNGRkMDBmLTgxNmEtNGMwNS1hOWU2LTMzOTBmODkwYTA1OCIsImF1dGhvcml0aWVzIjpbIlJPTEVfVVNFUiJdLCJqdGkiOiJlZWVkYTMxYi0wNGE0LTRkMzEtYWQ3MS1hOTA4Yzk0ZTgwNmQiLCJjbGllbnRfaWQiOiJtaW5pLWFwaSIsInNjb3BlIjpbImFsbCJdfQ.ZvecdLX5-VHbo9Y838elUMhrN5DO2_IY2U7mT8aZOdUN4aasn9Ok12qscCue4gIOQN3O3xORrg87EH-CWRRmYMvOZO09JiIqlDHvl81rRBwQtbo1eq-386UnVo7_DCVcsqhWhnRRc4Tr3dtOOVCjFO_Xrobf3ykMNXj4dJsygFAPcnNTt0JW6wcFOLyE7feyaXcXBTAU-Rw2ld1VSTZiTBNhu60zj7zWwRqEkaP2Dw6FmvHkeqjzxuHpwzPGm7mIeBAwCGf7MIGMF7756xH4Nfy-3hqC_Qlv0ddX5m3MdwsgI9nY_iCpCxeUgBWIKFsauvJrAO4BZbmVC9ChNQL4-w",
            "Content-Type": "application/json"
        },
        success: function(res){

            let listLength=res.data.list.length;
            console.log("长度为："+listLength);
            for(let i=0;i<listLength;i++){
                let itemSku=res.data.list[i].itemSku;//商品sku
                let itemName=res.data.list[i].itemName;//商品名称
                let stockNum="无货架位";//货架位编号
                let availableStock=res.data.list[i].availableStock;///可用库存
                let lockStock=res.data.list[i].lockStock;//锁定库存
                let totalStock=res.data.list[i].totalStock;//总库存
                let onTheWayStock=res.data.list[i].onTheWayStock;//在途库存
                let purchaseCostDays;
                if(res.data.list[i].purchaseCostDays!=null){
                    purchaseCostDays=res.data.list[i].purchaseCostDays;//头程天数

                }else if(res.data.list[i].purchaseCostDays==null){
                    purchaseCostDays=0;
                }
                let safeDays;
                if(res.data.list[i].safeDays!=null){
                    safeDays=res.data.list[i].safeDays;//安全天数
                }else if(res.data.list[i].purchaseCostDays==null){
                    safeDays=0
                }


                let stockName;//仓库名称
                let biZhong="CNY";//币种
                let costPrice=res.data.list[i].costPrice.toFixed(2)//成本价


                if(stockId=="1688497351560474625"){
                    stockName="泰国曼谷仓";
                    newWarehouseArray.push([itemSku,itemName,stockNum,availableStock,lockStock,totalStock,onTheWayStock,purchaseCostDays,safeDays,stockName,biZhong,costPrice]);
                    console.log("新仓");
                    if(i==listLength-1){
                        console.log("新仓最后一个")
                        newListLength=listLength;
                        flag2=1;
                    }

                }else if(stockId=="1629401226010591234"){
                    stockName="泰国北榄2仓";
                    oldWarehouseArray.push([itemSku,itemName,stockNum,availableStock,lockStock,totalStock,onTheWayStock,purchaseCostDays,safeDays,stockName,biZhong,costPrice]);
                    console.log("宝函");
                    if(i==listLength-1){
                        console.log("宝函最后一个")
                        oldListLength=listLength;
                        flag1=1;
                    }

                }

            }

            // console.log(res.data.list.length);//长度
            console.log(res);
            // console.log(res.data.list[0].itemSku);//商品sku
            // console.log(res.data.list[0].itemName);//商品名称
            // //货架位编号
            // console.log(res.data.list[0].availableStock);///可用库存
            // console.log(res.data.list[0].lockStock);//锁定库存
            // console.log(res.data.list[0].totalStock);总库存
            // console.log(res.data.list[0].onTheWayStock);//在途库存
            console.log(res.data.list[0].purchaseCostDays);//头程天数
            console.log(res.data.list[0].safeDays);//安全天数
            // //仓库名称
            // //币种
            // console.log(res.data.list[0].costPrice);//成本价


        },complete:function(){
            console.log("完成");

            if(stockId=="1629401226010591234"){//老仓加载完成，导出
                flag1=0;
                ex(oldWarehouseArray,"baoHanStocks");

            }else if(stockId=="1688497351560474625"){//新仓加载完成，导出
                flag2=0;
                ex(newWarehouseArray,"newStocks");
            }
        }
    });
}
function ex(array,name){
    /* 把转换JS数据数组的数组为工作表 */
    const sheet= XLSX.utils.aoa_to_sheet(array)
    /* 生成工作簿并添加工作表 */
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book,sheet,'Sheet0' )
    /* 保存到文件 */
    XLSX.writeFile(book,name+'.xlsx')
}

})();
