// ==UserScript==
// @name         甩手助手
// @namespace    http://tampermonkey.net/
// @version      0.1.2
// @description  try to take over the world!
// @author       You
// @match        https://dz.shuaishou.com/*
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://scriptcat.org/lib/1167/1.0.0/%E8%84%9A%E6%9C%AC%E7%8C%ABUI%E5%BA%93.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shuaishou.com
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/ZuJiaF/youhou/main/%E7%94%A9%E6%89%8B%E5%8A%A9%E6%89%8B.js?token=GHSAT0AAAAAACK2HOJVK7RMKG2SNC5OMDF2ZLENJ3A
// @updateURL    https://raw.githubusercontent.com/ZuJiaF/youhou/main/%E7%94%A9%E6%89%8B%E5%8A%A9%E6%89%8B.js?token=GHSAT0AAAAAACK2HOJVK7RMKG2SNC5OMDF2ZLENJ3A
// ==/UserScript==

(function() {
    let allCount=0;
    //面板数据
    const data = {
        input1: 11,

    };
    //主页
    function firstPage() {
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
                    CAT_UI.Button("一键审核", {
                        type: "primary",
                        onClick() {
                            getOrderList();
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
                    CAT_UI.Button("手工单填写地址", {
                        type: "primary",
                        onClick() {
                            document.querySelector("#app > div.app-wrapper > div.app-container > section > div > div.h-100.overflow-y > div.container.manual-wrap > div > div:nth-child(2) > div.el-card__body > div > form > div:nth-child(1) > div:nth-child(1) > div > div > div.el-input.el-input--small.el-input--suffix > input").value="บจก.เฟริส์คราสอินเตอร์เนชั่นแนล";
                        document.querySelector("#app > div.app-wrapper > div.app-container > section > div > div.h-100.overflow-y > div.container.manual-wrap > div > div:nth-child(2) > div.el-card__body > div > form > div:nth-child(1) > div:nth-child(2) > div > div > div.input-with-select > div > input").value="0982939452";
                        document.querySelector("#app > div.app-wrapper > div.app-container > section > div > div.h-100.overflow-y > div.container.manual-wrap > div > div:nth-child(2) > div.el-card__body > div > form > div:nth-child(2) > div > div > div > div > textarea").value="21/6 ม .3  ต.คอกกระบือ อ.เมือง จ.สมุทรสาคร 74000";
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
                'code': '304dd00f-816a-4c05-a9e6-3390f890a058',
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
                    getDetail(e.orderCode,e.id,0);//获取订单详情
                }




            });
        });
    }


    //获取订单详情
    function getDetail(orderCode,orderId,flag){
        $.ajax({
            url: 'https://dz.shuaishou.com/api/orderPrint/orderHead/detail',
            crossDomain: true,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                'Authorization': 'bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3MDEwNDMxMDMsInVzZXJfbmFtZSI6IjMwNGRkMDBmLTgxNmEtNGMwNS1hOWU2LTMzOTBmODkwYTA1OCIsImF1dGhvcml0aWVzIjpbIlJPTEVfVVNFUiJdLCJqdGkiOiI0ZmJiZTVkZi00NGM5LTQ2NGQtOGI1OC01ODg5MzdiYzU0YWIiLCJjbGllbnRfaWQiOiJtaW5pLWFwaSIsInNjb3BlIjpbImFsbCJdfQ.PmfKiAgxJcFfvZkzAhvPuUQOPsM3KAIfcn6JJ2EGVomjcXksPqKPUBBbvFsWBIPPeOtvLYJLoSX_BZVvRdB0FUcvfPWWaKmPIwildVga9eZMlOltLCIhwpABfqhzTDXdVXx-lrDJAZo2K4EBzsp1s-EfAvc2lmwGUrMZ1FZm5loyo_XszE55HCEOwzBZw1wdaETTxSdicRbJOJRRUVAqjv2xRPRRGhDB13-D-xTnEaNgCTlGhcG5txTMi66o-aszMtXF_eGcc-Jg38zaUm78mbG5lEWF1vdI_i2o9VACef11_VOTWwy3EX85nF6VvcnmXRvANO_MbQ-fe1-MUhxwLw',

            },
            data: {
                'orderCode': orderCode,
                'orderId': orderId,
                'code': '304dd00f-816a-4c05-a9e6-3390f890a058'
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
                'code': '304dd00f-816a-4c05-a9e6-3390f890a058',
                'id': orderId,
                'wareHouseId': wareHouseId,//仓库代码
                'itemSkuModels': itemSkuModels
            })
        }).done(function(res) {
            console.log("getAvailableStock",res);
            let flag1=0;
            res.data.forEach(function(e){
                //最小库存小于5
                if(e.stockQuantities>=0 && e.stockQuantities<=5){
                    flag1=1;
                }
            })
            //第一次
            if(flag==0){
                if(flag1==0){
                    allCount--;
                    console.log("减少")
                    createPackageNo(orderId);//审单
                    if(allCount==0){
                        location.reload();//刷新页面
                    }
                }else if(flag1=1 && wareHouseId!=1688497351560474625){//没库存并且非新仓
                    batchUpdateWareHouse(orderId,orderCode,1)//换仓
                }else if(flag1=1 && wareHouseId==1688497351560474625){
                    allCount--;
                    console.log("减少")
                    if(allCount==0){
                        location.reload();//刷新页面
                    }
                }
            }
            //第二次
            else if(flag==1){
                if(flag1==0){
                    allCount--;
                    console.log("减少")
                    createPackageNo(orderId);//审单
                    if(allCount==0){
                        location.reload();//刷新页面
                    }
                }else if(flag1=1){
                    allCount--;
                    console.log("减少")
                    if(allCount==0){
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
                'code': '304dd00f-816a-4c05-a9e6-3390f890a058',
                'ids': [
                    orderId
                ]
            })
        }).done(function(response) {
            console.log(response);
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
                'code': '304dd00f-816a-4c05-a9e6-3390f890a058',
                'wareHouseId': '1688497351560474625',
                'ids': [
                    orderId
                ],
                'wareHouseType': 3,
                'wareHouseName': '\u4E07\u9091\u901A/\u6CF0\u56FD\u66FC\u8C37\u4ED3'
            })
        }).done(function(res) {
            console.log(res);
            getDetail(orderCode,orderId,flag);//再尝试
        });
    }



})();
