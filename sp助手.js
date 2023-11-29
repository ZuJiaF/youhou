// ==UserScript==
// @name         sp查商品价格3.1 分页导demo
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://shopee.co.th/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xiapibuy.com
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://scriptcat.org/lib/1167/1.0.0/%E8%84%9A%E6%9C%AC%E7%8C%ABUI%E5%BA%93.js
// @require      https://cdn.staticfile.org/xlsx/0.15.1/xlsx.core.min.js
// @grant        none
// ==/UserScript==

(function() {
    let shop_name="x1gj1oxbyg";
    let shop_id=607032669;
    let item_id=22346379044;
    let item_idArray=[];//存放商品id
    let array1Head=["品类代码","品牌","标题","商品描述","sku名称","变体1","变体2","sku图像","sku价格","打折前sku价格","主要产品图片","产品图片2","产品图片3","产品图片4","产品图片5","产品图片6","产品图片7","产品图片8","产品图片9","sku代码","来源","库存","是否预购"];
    let array1;//存放商品信息
    let describeErrorWord=["Shopee","SHOPEE","shopee","เอง","หี","เอง","https","เอง,ตัวเอง","บุหรี่"];//商品描述违禁词库
    let VariationErrorWord=["寸"];//变体违禁词库
    let VariationErrorWord_Change=["นิ้ว"];//变体违禁替换词库
    let offset;//开端
    let getItemInformationIndex;//索引
    let getItemInformationCount;//计数
    let limit;//上限
    let abcCount=0;
    let total;//总数
    let page=1;//默认页码
    let mode;//模式(1:全店 2:整页 3:单个 4:同店多个 5:跨店多个)
    let othersArray;//跨店多个存储数组

    let afAcEncDat=[
        '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',
    ];
    let afAcEncSzToken=[
        'ycMBHB68abwisuenF0QQuQ==|TGEng2U8rkQDuYwi0ZTHuxb93uO3Zg11gy4va6WnNH8uJt9BppgNkpk8mCu/aBhbmU31obOmkIY=|tLgwSKKww1ebbBvr|08|3',
        'oPjeFCzFJIuWaNLLcUpblQ==|TmEng2U8rkQDuYwi0ZTHuxb93uO3Zg11gy4vaxaIOH8uJt9BppgNkpk8mCu/aBhbmU31obOmkIYYbQ==|tLgwSKKww1ebbBvr|08|3',
        'sAwI2+a5EDHHBYMEAmD3KQ==|T2Eng2U8rkQDuYwi0ZTHuxb93uO3Zg11gy4va7IqOH8uJt9BppgNkpk8mCu/aBhbmU31obOmkIYYbQ==|tLgwSKKww1ebbBvr|08|3',
        'F4NCJ9pntIEshT+qAINR/A==|QGEng2U8rkQDuYwi0ZTHuxb93uO3Zg11gy4va5G4OX8uJt9BppgNkpk8mCu/aBhbmU31obOmkIYYbQ==|tLgwSKKww1ebbBvr|08|3',

    ];
    let xSapRi=[
        '07f85e65765ef9ed98e49a3f0101b625cc62907887b3febfb490',
        '72f85e6519e2c2223c00813c010141db359d314c5423b0fa7c38',
        '98f85e658b62416fa49e2e3a0101555a0b0b77e4a8ceb262c632',
        'bcf85e6501bbb5e46c3e13310101a7df344f8691c029bcfaf27d',
    ];
    let xSapSec=[
        '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',

    ];

    //面板数据
    const data = {
        input1: shop_id,
        input2: item_id,
        input3:page,
        input4:1,
        input5:"1096120823,18495122261",
        input6:"null",
    };
    //整店(主页)
    function allShop() {
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
                    CAT_UI.Text("请输入shop_id："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            data.input1 = val;
                        },
                        style: {
                            flex: 1,
                        },
                    }),
                    CAT_UI.Button("查询", {
                        type: "primary",
                        onClick() {
                            shop_id=input1;
                            getItemInformationIndex=0;//索引
                            getItemInformationCount=1;//计数
                            limit=30;//极限
                            offset=0;//开端
                            item_idArray=[];
                            array1=[array1Head];
                            //CAT_UI.Message.info("我被点击了,你输入了：" + input+",赋值后shop_id为："+shop_id);
                            abcCount=0;
                            abc(shop_id,1);
                        },
                    }),

                ),
            ],
            {
                direction: "vertical",
            }
        );
    }

    //整页(页面2)
    function Page() {
        const [input1, setInput1] = CAT_UI.useState(data.input1);//商品id
        const [input3, setInput3] = CAT_UI.useState(data.input3);//页码
        const [input4, setInput4] = CAT_UI.useState(data.input4);//模式
        return CAT_UI.Space(
            [
                //                 CAT_UI.createElement(
                //                     "div",
                //                     {
                //                         style: {
                //                             display: "flex",
                //                             justifyContent: "space-between",
                //                             alignItems: "center",
                //                         },
                //                     },
                //                     CAT_UI.Text("模式："),//模式1是
                //                     CAT_UI.Input({
                //                         value: input4,
                //                         onChange(val) {
                //                             setInput4(val);
                //                             data.input4 = val;
                //                         },
                //                         style: {
                //                             flex: 1,
                //                         },
                //                     }),

                //                 ),
                CAT_UI.createElement(
                    "div",
                    {
                        style: {
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        },
                    },
                    CAT_UI.Text("请输入shop_id："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            data.input1 = val;
                        },
                        style: {
                            flex: 1,
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
                    CAT_UI.Text("页码："),
                    CAT_UI.Input({
                        value: input3,
                        onChange(val) {
                            setInput3(val);
                            page=val;
                            data.input3 = val;
                        },
                        style: {
                            flex: 1,
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
                    CAT_UI.Button("查询", {
                        type: "primary",
                        onClick() {
                            shop_id=input1;
                            offset=input3*30-30;//开端
                            limit=30;//上限
                            item_idArray=[];
                            array1=[array1Head];
                            //CAT_UI.Message.info("我被点击了,你输入了：" + input+",赋值后shop_id为："+shop_id);
                            abcCount=0;
                            abc(shop_id,2);
                        },
                    }),
                    CAT_UI.Button("导出", {
                        type: "primary",
                        onClick() {

                        },
                    }),


                ),



            ],
            {
                direction: "vertical",
            }
        );
    }

    //单个(页面3)
    function Single() {
        const [input1, setInput1] = CAT_UI.useState(data.input1);
        const [input2, setInput2] = CAT_UI.useState(data.input2);
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
                    CAT_UI.Text("请输入shop_id："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            data.input1 = val;
                        },
                        style: {
                            flex: 1,
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
                    CAT_UI.Text("请输入item_id："),
                    CAT_UI.Input({
                        value: input2,
                        onChange(val) {
                            setInput2(val);
                            data.input2 = val;
                        },
                        style: {
                            flex: 1,
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
                    CAT_UI.Button("查询", {
                        type: "primary",
                        onClick() {
                            shop_id=input1;
                            item_id=input2;
                            array1=[array1Head];
                            getItemInformation(shop_id,item_id,"single");
                            console.log("shop_id为："+shop_id);
                            console.log("item_id为："+item_id);
                        },
                    }),
                    CAT_UI.Button("此页面导出", {
                        type: "primary",
                        onClick() {
                            //console.log(location.href);
                            let href=location.href;//页面链接
                            console.log(href.indexOf("-i"))
                            let index1=href.indexOf("-i");
                            let index2=href.indexOf("?");
                            console.log(href.indexOf("?"))
                            href=href.slice(index1+3,index2);
                            let index3=href.indexOf(".");

                            shop_id=href.slice(0,index3);
                            item_id=href.slice(index3+1);
                            console.log(item_id);


                            array1=[array1Head];
                            getItemInformation(shop_id,item_id,"single");
                            // console.log("shop_id为："+shop_id);
                            // console.log("item_id为："+item_id);
                        },
                    }),

                ),




            ],
            {
                direction: "vertical",
            }
        );
    }

    //(页面4)
    function Many() {
        const [input1, setInput1] = CAT_UI.useState(data.input1);
        const [input2, setInput2] = CAT_UI.useState(data.input2);
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
                    CAT_UI.Text("请输入shop_id："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            data.input1 = val;
                        },
                        style: {
                            flex: 1,
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
                    CAT_UI.Text("请输入item_id："),
                    CAT_UI.Input({
                        value: input2,
                        onChange(val) {
                            setInput2(val);
                            data.input2 = val;
                        },
                        style: {
                            flex: 1,
                        },
                    }),

                ),
                CAT_UI.Button("查询", {
                    type: "primary",
                    onClick() {
                        shop_id=input1;
                        item_id=input2;
                        array1=[["品类代码","品牌","标题","商品描述","sku名称","变体1","变体2","sku图像","sku价格","打折前sku价格","主要产品图片","产品图片2","产品图片3","产品图片4","产品图片5","产品图片6","产品图片7","产品图片8","产品图片9","sku代码","来源"]];
                        getItemInformation(shop_id,item_id,"single");
                        console.log("shop_id为："+shop_id);
                        console.log("item_id为："+item_id);
                    },
                }),


            ],
            {
                direction: "vertical",
            }
        );
    }

    //跨店多个(页面5)
    function Other() {
        const [input1, setInput1] = CAT_UI.useState(data.input5);
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
                    CAT_UI.Text("请输入shop_id和item_id："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            data.input1 = val;
                            othersArray=val.split(",");
                            console.log(othersArray);
                        },
                        style: {
                            flex: 1,
                        },
                    }),

                ),
                CAT_UI.Button("查询", {
                    type: "primary",
                    onClick() {
                        shop_id=othersArray[0];
                        item_id=othersArray[1];
                        array1=[array1Head];
                        getItemInformation(shop_id,item_id,1,(othersArray.length)/2,5);
                    },
                }),


            ],
            {
                direction: "vertical",
            }
        );
    }

    //线下单个(页面6)
    function OffLine() {
        const [input1, setInput1] = CAT_UI.useState(data.input6);
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
                    CAT_UI.Text("请输入res："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            //console.log(JSON.parse(val));
                            setInput1(val);
                            data.input1 = val;
                        },
                        style: {
                            flex: 1,
                        },
                    }),
                    CAT_UI.Button("查询", {
                        type: "primary",
                        onClick() {
                            //console.log(JSON.parse(input1));
                            array1=[array1Head];
                            offLine_getItemInformation(JSON.parse(input1));
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
                        CAT_UI.Router.Link("整店", { to: "/" }),
                        CAT_UI.Router.Link("整页", { to: "/Page" }),
                        CAT_UI.Router.Link("单个", { to: "/single" }),
                        CAT_UI.Router.Link("同店多个", { to: "/many" }),
                        CAT_UI.Router.Link("跨店多个", { to: "/other" }),
                        CAT_UI.Router.Link("线下单个", { to: "/offLine" }),

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
                Component: allShop,
            },
            {
                path: "/Page",
                Component: Page,
            },
            {
                path: "/single",
                Component: Single,
            },
            {
                path: "/many",
                Component: Many,
            },
            {
                path: "/other",
                Component: Other,
            },
            {
                path: "/offLine",
                Component: OffLine,
            },
        ],
    });




    /*********函数调用区start*********/

    /*********函数调用区end*********/
    function abc(shop_id,mode){
        abcCount++;
        console.log(`abc()执行第${abcCount}次`);
        console.log("开端为："+offset);
        $.ajax({
            url: 'https://shopee.co.th/api/v4/shop/rcmd_items',
            crossDomain: true,
            headers: {
                'authority': 'shopee.co.th',
                'accept': 'application/json',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                /*会变动*/
                //'af-ac-enc-dat': 'AAczLjEuMC0yAAABi8lY2moAABBiAzAAAAAAAAAAAiSDMitpznJWQ4NpdJVoHXaxAt5o8MS3gD4Lv0cZsWDYYHdpR1c3Np8BzcsRRPm/ZZgFLUngG5gdglPRlokHaBO6riuJzOhSEoCDq8ldg+RcTmGj6lzRcbx+u+wuFArvx+zvDDCzMOdK2xGN7mdKcf0ai/FxzOhSEoCDq8ldg+RcTmGj6lzRcbx+u+wuFArvx+zvDDBGV2Ia3yab8r/0vvuJ/GyfpohFHsEFTkPArlIVDn5bBVRiZeaLJCVJU0SfG5dRLyXEplSWPkm3eMEC3t+KLNlvGAt58mjadOCSqdJGJMljclRiZeaLJCVJU0SfG5dRLyURSlSGVlaQoiWqBAVaGFwysvJKMJC0+mL3l7r88kmGwBBPodmt4EdszHIcF4opk6ayiy80xHFMAYy/wnasEQswsc2Xbfdc2gpt/+aJUOqVPH+RElVIBn5MeXS/LyLxjKlllqCm21b2m6kp9Vd0SkMAXR0XEHp7nMd/yK6jJfN2mv439vzknrcdleW6J26R8SlgUIRBDXTXr7nYsbBk4Wfdl/82EyfDx/bVRcPaaRvYm5L8vN1nsB5ywHJ5dl7O9dPfY0EN60QwLnl6HSLwgd/geVtks1BST6eLSS4Vm6Mzx0gD9O1aYGgjmjuYbekv+r9vs85v4y7AEcXy7ddZlL1tkXcnZLzI3a62qq121f78CfpfEq0jPrvEKBOSoYUN9nVIZPuYCCSrRipd9DBfMaxK+wZ2oaw+cJ/3+Ot+PhS2CQscYcBiFSLos/8ny53y5QpeAegpoENX/mRWMfYImHwz2DPmaoICPhSDwuZ8AEVhiVlI6L0SCVp9GInRbDXA+z0OKO+88hsGtVzetFxpshU+Drt29QztyvZEwXGAgZ23hsLQhL44AClwVSB5frT5onMMQFHWPI4J3wMYDsIDF+RwB3h1iawzzhKUj9RdaYXT/itK7p3Wo+2MClTrYSaZE4P5ucxzA6P+HlxI8a0e0EITl/82EyfDx/bVRcPaaRvYm04Az8PQhKncphFDHPwczs+V2jmo2pJrp72Vd2KfQ4LP98jZ/901tpYwiYTjGF/2xK056EMAQXcgHvYq0iVnqqc=',
                /*会变动*/
                //'af-ac-enc-sz-token': 'FzPFDb4QbXOgxjnauSFqag==|8/kiFT0mF3ViPDzE3taee7hKuix4sZ06FnMfK60AJKrwRllZMgv8OlkYNljjltkYKhvOseOA4XA=|34PxI+I7QOZCENLx|08|3',
                'x-api-source': 'pc',
                'x-csrftoken': 'b2XZH5OAG1qm7PfVkRcBB8fQm4J5TP2n',
                'x-requested-with': 'XMLHttpRequest',
                /*会变动*/
                //'x-sap-ri': 'ce435265437d23e2874f76300101e3e7601656d0723a67ea3582',
                /*会变动*/
                //'x-sap-sec': '0QhsQgFo2xJpKxJpL/JrKxcpL/JpKxcpKxJsKxJpwxPpKCmoKxJHKxJpYjalAEFpKxJAKvJpMxPpKjiHrwuo/z1JaUrgu/KIoZP6ez6kEusbQeOZm+wCGUC79gnReE0WvCtpqKyiYmTkdvCMS7Ig5pgBJL0dFWdyZdvu92OWCX9DAb5c0LBpFwkTxKU9h9f2+QDFPZhFxaWkI2fVXLWgpaZJVRly3/xsobWK3vhYAyqatmi9CNkoR1JkC+AUACpY3hWcpGupT4EfOzIcB+emkg/1wIwKc5+45bs1nit6+eQRIqXwq/C9Sy9xE8BYVQotMnvzaSEB4odUW5TKUKa6uazzO+UCGOylNYDm/mEj8HdFYhlCBCWK3I8VWKGGA5/YufRVKXajoNj/KA03a4oKKhYU2qu8TkmIAchfb6a77ZEdbNcE2dN/rCmXaJVvqL6Cnmv/PYJLc1PxXcB/4OLrKxJpOVJidVQ1OHPpKxJpujYlAEFpKxJRKxJp3xJpKjX8ownPo7MOlP39ch2+E3kXydqJ0xJpKb/tOVKtQYMiKxJpKxFp2xJrKxcp0xJpKxFpKxJRKxJp3xJpKmqpsFPed2coO2D7VW/u2h2OATBy0xJpKbewPYciPVciKxJpKC==',
                'x-shopee-language': 'th',
                'x-sz-sdk-version': '3.1.0-2&1.5.1'
            },
            contentType: 'application/json',
            data: {
                'bundle': 'shop_page_category_tab_main',
                'limit': limit,
                'offset': offset,
                'shop_id': shop_id,
                'sort_type': '1',
                'upstream': 'pdp'
            }
        }).success(function(res) {
            console.log(res);
            console.log("商品数量",res.data.total);//商品数量
            total=res.data.total;


            console.log("返回数据长度为："+res.data.items.length);
            let length=res.data.items.length;

            for(let i=0;i<length;i++){
                //console.log(res.data.items[i].itemid);
                item_idArray.push(res.data.items[i].itemid);//遍历到的itemId添加到数组
                offset++;

                //for的最后一次
                if(i==length-1){
                    console.log("更新后的开端为："+offset);
                    console.log("itemId数组长度："+item_idArray.length);

                    //整店
                    if(mode==1){

                        if(total-offset>0){
                            limit=30;//极限
                            setTimeout(function(){
                                abc(shop_id,1);
                            },10000)

                        }else if(total-offset<=0){
                            getItemInformationIndex=0;//索引
                            getItemInformationCount=1;//计数
                            length=item_idArray.length;
                            getItemInformation(shop_id,item_idArray[getItemInformationIndex],getItemInformationCount,length,mode);//开始执行单个sku
                        }
                    }

                    //整页
                    if(mode==2){
                        getItemInformationIndex=0;//索引
                        getItemInformationCount=1;//计数
                        getItemInformation(shop_id,item_idArray[getItemInformationIndex],getItemInformationCount,length,mode);//开始执行单个sku
                    }

                }
            }
        }).error(function(res) {
            console.log("失败失败失败");

        });
    }
    //获取单个商品详情
    function getItemInformation(shop_id,item_id,getItemInformationCount,limit,mode){
        $.ajax({
            url: 'https://shopee.co.th/api/v4/pdp/get_pc',
            crossDomain: true,
            headers: {
                'authority': 'shopee.co.th',
                'accept': 'application/json',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                /*会变动*/
                //'af-ac-enc-dat':'AAczLjEuMC0yAAABjADZ1IsAABB1AzAAAAAAAAAAAiSDMitgC7fJ8Lsf1APFhO9cQ4Gz8MS3gD4Lv0cZsWDYYHdpR1c3Np8BzcsRRPm/ZZgFLUngG5gdglPRlokHaBO6riuJzOhSEoCDq8ldg+RcTmGj6lzRcbx+u+wuFArvx+zvDDCzMOdK2xGN7mdKcf0ai/FxzOhSEoCDq8ldg+RcTmGj6lzRcbx+u+wuFArvx+zvDDBGV2Ia3yab8r/0vvuJ/GyfpohFHsEFTkPArlIVDn5bBVRiZeaLJCVJU0SfG5dRLyXEplSWPkm3eMEC3t+KLNlvGAt58mjadOCSqdJGJMljclRiZeaLJCVJU0SfG5dRLyVQC2vNp6jUpSv3D5U18muvsvJKMJC0+mL3l7r88kmGwBBPodmt4EdszHIcF4opk6b0ZLKniNkzZatfdyqaGoqXsc2Xbfdc2gpt/+aJUOqVPH+RElVIBn5MeXS/LyLxjKlllqCm21b2m6kp9Vd0SkMAXR0XEHp7nMd/yK6jJfN2mv439vzknrcdleW6J26R8SlgUIRBDXTXr7nYsbBk4Wfdl/82EyfDx/bVRcPaaRvYm5L8vN1nsB5ywHJ5dl7O9dPfY0EN60QwLnl6HSLwgd/geVtks1BST6eLSS4Vm6Mzx0gD9O1aYGgjmjuYbekv+r9vs85v4y7AEcXy7ddZlL1ttLdXwCTZlUhB0VUlouCcTSbEt7N9qHhmf2CuFcGcpkd+kXRq38sgxXBMhEb6HyfnvXiVhzhpwl1P5YTiEMOFjQscYcBiFSLos/8ny53y5QqT6QDETK2OO0y6IgTIBlMQxwa9r0x4suGdbmNlP/PPf6R4UmloS8DczDyQrHWGRCEDORnOpfHuH9xEKlYnLTkDXAYQszwY8EVre9vPDaFm8vUl0t8j5JDAIB3JNJ/Aa14p9xiDe2qJPSdrQA1bObThCZIaCNOVzooBUmfWkD+KhWRrNiwph5gHzrOGlk3P+Hy6UKVFBNpQYodVpLSZikUAl/82EyfDx/bVRcPaaRvYm6YYQrr5kgrd9GoJ5bFfZaDdv8J4nqSRm5zsKW/39Y3a4uCgisFY7om8kJPXrmzIjqFBQHpHAWDNJCsfZCYdlkY=' ,
                /*会变动*/
                //'af-ac-enc-sz-token':'mzk2PH9Q5e7v/hPk3H/05Q==|yd+88oZoo/BZTT1pk0XwDcTtAI59iJv1Q5QKac56Kj9s59ghwbj+NQ6yDbNt1IQulqLTSssxeZJ9ag==|YvfNbf1XlfKJbNe1|08|3' ,
                'x-api-source': 'pc',
                'x-csrftoken': 'PEXDoA7pY70v5JuF5EVpfhMgUcGS2iyx',
                'x-requested-with': 'XMLHttpRequest',
                /*会变动*/
                //'x-sap-ri': '4d7960659f4f3f74a7138a3b01019fbdc322263b7e2c8ad72d51',
                /*会变动*/
                //'x-sap-sec': '2JxTLTycvgyRVgyR1My6VgTR1MyRVgTRVgyQVgyRTgaRVbTdVgyNVgyRNaPnBPdRVgmNV8yROgiRVx3tjRLPQsz9gbE5in4eAyGIVu//GQ4x0VwU1GC+qRxMvahOR27lhV8/3qk7Rw+N2REpfWYNfHrUPw0UkV/ZAe+Gh/lcqTVZbKT6whIpjaoMYosIzSIsWYXpgr2t7NKDQ/YCM70kAsh2zd6+mYRUU5hmffKisDsnrTCHMsgsDBdyb6q+RI1F1hu065mFTBRU/YD8igHhb4D6I5QFW4N0UR2byoQW1GL2sxbhMZE1g6tA2l5ywe5c1FOx+jk3oh84I78OwxVq8lni9Wg6uvwf0syMmAXWTTfaxpBoEFmLuHW9zdSLQlOxXD76ZIXb/KHcYuzdbYyoeltu76UwMXYMUFdal8fH/RydYRQX22Cv3+g7U7ZfrHnvvYuduueoyF5EpxKAD6VvsvzqOvsQPgALE+zKxCFQ+86pJNCpxvlShxsb0xt08bIfGJnjsitvUB5/1qbi/RbXLtBqAhQDQYitGe4mJZuKMCcbOTN84+vLYodtgkx/OwK3d/fxlH1PUifrf4SAo18mTC39yBrm0bDr4md+0pTqanaQ2j4ub2n3Ds8seY43UewhCvrJfG/0vSRmGcdoYxrhyrtFmWcSGMdRVgyF99yD89RgzPyRVgm2BShnUgyRVf4RVgyrVgyRm+LnTXFvVtRiCoks94/OQ7l5uy96VgyR89999izgz9aRVgyRUgy2VgdR1gy6VgyRUgyRVf4RVgyrVgyR/dBEz2jvOa9j95aNRMez08p/Mwk6VgyRX9i9X+wlyz1RVgyR',
                'x-shopee-language': 'th',
                'x-sz-sdk-version': '3.1.0-2&1.6.0'
            },
            contentType: 'application/json',
            data: {
                'shop_id': shop_id,
                'item_id': item_id
            }
        }).success(function(res) {
            console.log(`正在执行第${getItemInformationCount}个`);
            console.log(res);


            //console.log("sku数量为："+res.data.item.models.length);
            let length=res.data.item.models.length;//sku数量

            //console.log("类目代码为："+res.data.item.categories[2].catid);
            let catid;

            //console.log("品牌为："+res.data.item.brand);
            let brand;

            //console.log("标题："+res.data.item.title);
            let title;

            //console.log("商品描述："+res.data.item.description);
            let description;

            //console.log("sku名称："+res.data.item.models[0].name);
            let name;

            //console.log("变体1："+res.data.item.models[0].name);
            let name1;

            //console.log("变体2："+res.data.item.models[0].name);
            let name2;

            //console.log("sku图像："+res.data.product_images.first_tier_variations[0].image);
            let image;

            //console.log("sku价格："+res.data.item.models[0].price);
            let price;

            //console.log("打折前sku价格："+res.data.item.models[0].price_before_discount);
            let price_before_discount;

            let skucode;//sku代码

            //console.log("商品图片1",res.data.product_images.images[0]);
            //console.log("商品图片2",res.data.product_images.images[1]);
            //console.log("商品图片3",res.data.product_images.images[2]);
            //console.log("商品图片4",res.data.product_images.images[3]);
            //console.log("商品图片5",res.data.product_images.images[4]);
            //console.log("商品图片6",res.data.product_images.images[5]);
            //console.log("商品图片7",res.data.product_images.images[6]);
            //console.log("商品图片8",res.data.product_images.images[7]);
            //console.log("商品图片9",res.data.product_images.images[8]);
            let images=[];//商品图片

            let linkHead="https://cf.shopee.co.th/file/";//获取图像的链接头部

            let fromHead="https://shopee.co.th/product/";//来源链接头部
            let from;//来源

            let stock;//库存

            let is_pre_order;//预购

            for(let i=0;i<length;i++){
                //console.log(i);
                let categoriesLength=res.data.item.categories.length;
                catid=res.data.item.categories[categoriesLength-1].catid;//类目代码
                brand=res.data.item.brand;//品牌
                if(brand==null){
                    brand="No brand";
                }

                title=res.data.item.title;//标题

                //主图处理
                images[0]=linkHead+res.data.product_images.images[0];
                images[1]=linkHead+res.data.product_images.images[1];
                images[2]=linkHead+res.data.product_images.images[2];
                images[3]=linkHead+res.data.product_images.images[3];
                images[4]=linkHead+res.data.product_images.images[4];
                images[5]=linkHead+res.data.product_images.images[5];
                images[6]=linkHead+res.data.product_images.images[6];
                images[7]=linkHead+res.data.product_images.images[7];
                images[8]=linkHead+res.data.product_images.images[8];
                for(let i1=0;i1<9;i1++){
                    if(res.data.product_images.images[i1]==undefined){
                        images[i1]=null;
                    }
                }

                //sku名称处理
                name=res.data.item.models[i].name;//sku名称
                let index1=name.indexOf(",");

                if(name==""){
                    name1="one";
                    name2="";
                }else if(index1>0){
                    name1=name.split(",")[0];//变体1
                    //console.log("变体1："+name1);
                    name2=name.split(",")[1];//变体2
                    //console.log("变体2："+name2);
                }else if(index1<0){
                    name1=name;//变体1
                    //console.log("变体1："+name1);
                    name2="one";//变体2
                    //console.log("变体2："+name2);
                }

                //去除违禁词
                for(let p=0;p<VariationErrorWord.length;p++){
                    if(name1.includes(VariationErrorWord[p])){
                        let regex2 = new RegExp(VariationErrorWord[p], 'g');
                        name1 = name1.replace(regex2, VariationErrorWord_Change[p]);

                    }
                    if(name2.includes(VariationErrorWord[p])){
                        let regex3 = new RegExp(VariationErrorWord[p], 'g');
                        name2 = name2.replace(regex3, VariationErrorWord_Change[p]);

                    }
                }


                //sku图片处理
                let skuImageLength=res.data.product_images.first_tier_variations.length;//sku图片数量
                for(let j=0;j<skuImageLength;j++){
                    //console.log(res.data.product_images.first_tier_variations[j].name);
                    if(name1==res.data.product_images.first_tier_variations[j].name){
                        image=linkHead+res.data.product_images.first_tier_variations[j].image;//sku图像

                    }

                }
                //如果没有sku图片，用主图替换
                if(image==undefined){
                    image=images[0]
                }
                //商品描述处理
                description=res.data.item.description;//商品描述
                for(let l=0;l<describeErrorWord.length;l++){
                    if(description.includes(describeErrorWord[l])){
                        let regex1 = new RegExp(describeErrorWord[l], 'g');
                        description = description.replace(regex1, '');

                    }
                }
                for(let i2=0;i2<9;i2++){
                    if(i2==8){
                        description=description+"<img src='"+image+"' width='800' height='800'>"
                    }else if(images[i2+1]!=null){
                        description=description+"<img src='"+images[i2+1]+"' width='800' height='800'>"


                    }


                }


                //console.log(`第${i+1}个sku图像:${image}`);
                price=res.data.item.models[i].price/100000;//sku价格
                //console.log("处理后sku价格："+price);

                //如果没有打折，则用打折前的价格替代
                price_before_discount=res.data.item.models[i].price_before_discount/100000;//打折前sku价格
                if(price_before_discount==0){
                    price_before_discount=price;
                }


                //修正sku价格
                if(price>0 && price<=50){
                    price=price+25;
                }else if(price>50 && price<=100){
                    price=price+20;
                }else if(price>100){
                    price=price+10;
                }

                //修正打折前sku价格
                if(price_before_discount>0 && price_before_discount<=50){
                    price_before_discount=price_before_discount*5;
                }else if(price_before_discount>50 && price_before_discount<=100){
                    price_before_discount=price_before_discount*3;
                }else if(price_before_discount>100){
                    price_before_discount=price_before_discount*2;
                }



                //console.log("折扣前sku价格："+price_before_discount);

                from=fromHead+res.data.item.shop_id+"/"+res.data.item.item_id;




                skucode=getNowDate()+"-"+i;//sku代码
                stock=res.data.item.models[i].stock;//库存

                //预购
                is_pre_order=res.data.item.is_pre_order;
                if(is_pre_order==true){
                    is_pre_order="是";
                }else if(is_pre_order==false){
                    is_pre_order="否";
                }

                array1.push([catid,brand,title,description,name,name1,name2,image,price,price_before_discount,images[0],images[1],images[2],images[3],images[4],images[5],images[6],images[7],images[8],skucode,from,stock,is_pre_order]);

                //一个item跑完
                if(i==length-1){
                    //一页跑完
                    if(getItemInformationCount=="single"){
                        ex(array1,`单个产品信息`);
                    }else if(getItemInformationCount==limit){
                        //console.log("最后一个");
                        if(mode==1){
                            ex(array1,`整店产品信息`);
                        }else if(mode==2){
                            ex(array1,`产品信息第${page}页`);
                        }else if(mode==5){
                            ex(array1,`跨店多个`);
                        }


                    }else if(getItemInformationCount!=limit){
                        getItemInformationIndex++;
                        getItemInformationCount++;
                        if(mode==5){

                            setTimeout(function(){
                                getItemInformation(othersArray[(getItemInformationCount-1)*2],othersArray[(getItemInformationCount-1)*2+1],getItemInformationCount,limit,mode)
                            },60000)
                        }else{
                            setTimeout(function(){
                                getItemInformation(shop_id,item_idArray[getItemInformationIndex],getItemInformationCount,limit,mode)
                            },60000)
                        }

                    }



                }
            }

        }).error(function(res) {
            console.log("失败失败失败");
            ex(array1,`整店产品信息(未完成)`);
        });
    }
    //线下获取单个商品详情
    function offLine_getItemInformation(res){

        console.log(`正在执行线下获取`);
        console.log(res);

        //console.log("sku数量为："+res.data.item.models.length);
        let length=res.data.item.models.length;//sku数量

        //console.log("类目代码为："+res.data.item.categories[2].catid);
        let catid;

        //console.log("品牌为："+res.data.item.brand);
        let brand;

        //console.log("标题："+res.data.item.title);
        let title;

        //console.log("商品描述："+res.data.item.description);
        let description;

        //console.log("sku名称："+res.data.item.models[0].name);
        let name;

        //console.log("变体1："+res.data.item.models[0].name);
        let name1;

        //console.log("变体2："+res.data.item.models[0].name);
        let name2;

        //console.log("sku图像："+res.data.product_images.first_tier_variations[0].image);
        let image;

        //console.log("sku价格："+res.data.item.models[0].price);
        let price;

        //console.log("打折前sku价格："+res.data.item.models[0].price_before_discount);
        let price_before_discount;

        let skucode;//sku代码

        //console.log("商品图片1",res.data.product_images.images[0]);
        //console.log("商品图片2",res.data.product_images.images[1]);
        //console.log("商品图片3",res.data.product_images.images[2]);
        //console.log("商品图片4",res.data.product_images.images[3]);
        //console.log("商品图片5",res.data.product_images.images[4]);
        //console.log("商品图片6",res.data.product_images.images[5]);
        //console.log("商品图片7",res.data.product_images.images[6]);
        //console.log("商品图片8",res.data.product_images.images[7]);
        //console.log("商品图片9",res.data.product_images.images[8]);
        let images=[];//商品图片

        let linkHead="https://cf.shopee.co.th/file/";//获取图像的链接头部

        let fromHead="https://shopee.co.th/product/";//来源链接头部
        let from;//来源

        let stock;//库存

        for(let i=0;i<length;i++){
            //console.log(i);
            let categoriesLength=res.data.item.categories.length;
            catid=res.data.item.categories[categoriesLength-1].catid;//类目代码
            brand=res.data.item.brand;//品牌
            if(brand==null){
                brand="No brand";
            }

            title=res.data.item.title;//标题

            //主图处理
            images[0]=linkHead+res.data.product_images.images[0];
            images[1]=linkHead+res.data.product_images.images[1];
            images[2]=linkHead+res.data.product_images.images[2];
            images[3]=linkHead+res.data.product_images.images[3];
            images[4]=linkHead+res.data.product_images.images[4];
            images[5]=linkHead+res.data.product_images.images[5];
            images[6]=linkHead+res.data.product_images.images[6];
            images[7]=linkHead+res.data.product_images.images[7];
            images[8]=linkHead+res.data.product_images.images[8];
            for(let i1=0;i1<9;i1++){
                if(res.data.product_images.images[i1]==undefined){
                    images[i1]=null;
                }
            }

            //sku名称处理
            name=res.data.item.models[i].name;//sku名称
            let index1=name.indexOf(",");

            if(name==""){
                name1="one";
                name2="";
            }else if(index1>0){
                name1=name.split(",")[0];//变体1
                //console.log("变体1："+name1);
                name2=name.split(",")[1];//变体2
                //console.log("变体2："+name2);
            }else if(index1<0){
                name1=name;//变体1
                //console.log("变体1："+name1);
                name2="one";//变体2
                //console.log("变体2："+name2);
            }

            //去除违禁词
            for(let p=0;p<VariationErrorWord.length;p++){
                if(name1.includes(VariationErrorWord[p])){
                    let regex2 = new RegExp(VariationErrorWord[p], 'g');
                    name1 = name1.replace(regex2, VariationErrorWord_Change[p]);

                }
                if(name2.includes(VariationErrorWord[p])){
                    let regex3 = new RegExp(VariationErrorWord[p], 'g');
                    name2 = name2.replace(regex3, VariationErrorWord_Change[p]);

                }
            }


            //sku图片处理
            let skuImageLength=res.data.product_images.first_tier_variations.length;//sku图片数量
            for(let j=0;j<skuImageLength;j++){
                //console.log(res.data.product_images.first_tier_variations[j].name);
                if(name1==res.data.product_images.first_tier_variations[j].name){
                    image=linkHead+res.data.product_images.first_tier_variations[j].image;//sku图像

                }

            }
            //如果没有sku图片，用主图替换
            if(image==undefined){
                image=images[0]
            }

            //商品描述处理
            description=res.data.item.description;//商品描述
            for(let l=0;l<describeErrorWord.length;l++){
                if(description.includes(describeErrorWord[l])){
                    let regex1 = new RegExp(describeErrorWord[l], 'g');
                    description = description.replace(regex1, '');

                }
            }
            for(let i2=0;i2<9;i2++){
                if(i2==8){
                    description=description+"<img src='"+image+"' width='800' height='800'>"
                }else if(images[i2+1]!=null){
                    description=description+"<img src='"+images[i2+1]+"' width='800' height='800'>"


                }


            }



            //console.log(`第${i+1}个sku图像:${image}`);
            price=res.data.item.models[i].price/100000;//sku价格
            //console.log("处理后sku价格："+price);

            //如果没有打折，则用打折前的价格替代
            price_before_discount=res.data.item.models[i].price_before_discount/100000;//打折前sku价格
            if(price_before_discount==0){
                price_before_discount=price;
            }


            //修正sku价格
            if(price>0 && price<=50){
                price=price+25;
            }else if(price>50 && price<=100){
                price=price+20;
            }else if(price>100){
                price=price+10;
            }

            //修正打折前sku价格
            if(price_before_discount>0 && price_before_discount<=50){
                price_before_discount=price_before_discount*5;
            }else if(price_before_discount>50 && price_before_discount<=100){
                price_before_discount=price_before_discount*3;
            }else if(price_before_discount>100){
                price_before_discount=price_before_discount*2;
            }



            //console.log("折扣前sku价格："+price_before_discount);

            from=fromHead+res.data.item.shop_id+"/"+res.data.item.item_id;




            skucode=getNowDate()+"-"+i;//sku代码
            stock=res.data.item.models[i].stock;//库存
            array1.push([catid,brand,title,description,name,name1,name2,image,price,price_before_discount,images[0],images[1],images[2],images[3],images[4],images[5],images[6],images[7],images[8],skucode,from,stock]);

            //一个item跑完
            if(i==length-1){
                //一页跑完
                ex(array1,`线下单个产品信息`);




            }
        }
    }
    //console.log(getNowDate());
    //获取时间
    function getNowDate() {
        let myDate = new Date;
        let year = myDate.getFullYear().toString().slice(2); //获取当前年

        let mon = myDate.getMonth() + 1; //获取当前月
        if (mon >= 0 && mon <= 9) {
            mon = "0" + mon;
        }

        let date = myDate.getDate(); //获取当前日
        if (date >= 0 && date <= 9) {
            date = "0" + date;
        }

        let hours = myDate.getHours(); //获取当前小时
        if (hours >= 0 && hours <= 9) {
            hours = "0" + hours;
        }


        let minutes = myDate.getMinutes(); //获取当前分钟
        if (minutes >= 0 && minutes <= 9) {
            minutes = "0" + minutes;
        }


        let seconds = myDate.getSeconds(); //获取当前秒
        if (seconds >= 0 && seconds <= 9) {
            seconds = "0" + seconds;
        }

        let now = year+mon+date+ hours+minutes+seconds;
        return now;
    }

    //导出表格函数
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
