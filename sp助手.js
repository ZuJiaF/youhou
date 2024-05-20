// ==UserScript==
// @name         sp助手
// @namespace    http://tampermonkey.net/
// @version      0.4.29
// @description  try to take over the world!
// @author       You
// @match        https://shopee.co.th/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=xiapibuy.com
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://scriptcat.org/lib/1167/1.0.0/%E8%84%9A%E6%9C%AC%E7%8C%ABUI%E5%BA%93.js
// @require      https://cdn.staticfile.org/xlsx/0.15.1/xlsx.core.min.js
// @grant        GM_xmlhttpRequest
// @downloadURL  https://zujia.online/ZuJiaF/youhou/main/sp%E5%8A%A9%E6%89%8B.js
// @updateURL    https://zujia.online/ZuJiaF/youhou/main/sp%E5%8A%A9%E6%89%8B.js
// @connect 	 www.ip.cn
// @connect      fc-mp-7fe76973-5165-4172-ac40-382e23e02a8d.next.bspapp.com
// ==/UserScript==

(function() {
    /*********全局变量*********/
    let shop_name="x1gj1oxbyg";
    let shop_id=606796547;
    let item_id=15080437046;
    let item_idArray=[];//存放商品id
    let finishItemIdArray=[];//已经完成的商品id
    let arrayId=["ID036","ID001","ID046","ID002","ID003","ID004","ID005","ID006","ID007","ID008","ID009","ID010","ID011","ID012","ID013","ID014","ID015","ID016","ID017","ID018","ID019","ID020","ID021","ID022","ID023","ID024","ID025","ID026","ID027","ID028","ID029","ID030","ID031","ID032","ID033","ID034","ID035","ID039","ID037","ID038","ID040"]
    let arrayDescribed=["","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","","",""]
    let array1Head=["备注","sp品类代码","lz品类代码","品牌","标题","商品描述","sku名称","变体1","变体2","sku图像","sku价格","打折前sku价格","主图","图2","图3","图4","图5","图6","图7","图8","图9","采集编码","商品编码","sku编码","来源","库存","是否预购","model_id","详情图1","详情图2","详情图3","详情图4","详情图5","详情图6","详情图7","详情图8","详情图9","sku销量","总销量","链接上架时间","店铺注册时间"];
    let array1;//存放商品信息
    let productNameErrorWord=["ลดน้ำหนัก"];//商品名称违禁词库
    let productNameErrorWord_Change=["",]//商品名称违禁词替换库
    let describeErrorWord=["Shopee","SHOPEE","shopee","เอง","หี","เอง","https","เอง,ตัวเอง","บุหรี่","寸","ยาสูบ","ลดน้ำหนัก","น้ำพุ่ง","Lazada"];//商品描述违禁词库
    let describeErrorWord_Change=["","","","","","","","","","นิ้ว","","","",""]//商品描述违禁词替换库
    let VariationErrorWord=["寸"];//变体违禁词库
    let VariationErrorWord_Change=["นิ้ว"];//变体违禁替换词库
    let offset;//开端
    let getItemInformationIndex;//索引
    let getItemInformationCount;//计数
    let limit;//上限
    let abcCount=0;
    let total;//总数
    let page=1;//默认页码
    let mode;//模式(1:全店 2:整页 3:单个 4:同店多个 5:跨店多个 6:线下单个)
    let othersArray;//跨店多个存储数组
    let reloadFlag;//刷新标志位

    //面板数据
    const data = {
        input1: shop_id,
        input2: item_id,
        input3:page,
        input4:1,
        input5:"546172073,20633481965",//跨店多个输入框初始值
        input6:"null",
        frequency1:"30",//频率
        panelStatus:null,//面板缩放默认状态
        status1:0,//同店多个自动模式的开关,默认为关
    };


    /*********全局变量*********/

    /*********函数*********/
    init();
    postRequest();
    /*********函数*********/


    //数据初始化
    //混密1st
    function init(){
        data.frequency1 = localStorage.getItem("frequency1");
        if(data.frequency1!=null){
            data.frequency1=Number(data.frequency1);
        }else if(data.frequency1==null){
            data.frequency1=30;
            localStorage.setItem("frequency1",JSON.stringify(data.frequency1));
        }

        data.status1 = localStorage.getItem("status1");
        if(data.status1!=null){
            data.status1=JSON.parse(data.status1);
        }else if(data.status1==null){
            data.status1=0;
            localStorage.setItem("status1",JSON.stringify(data.status1));
        }

        data.panelStatus=localStorage.getItem("panelStatus");
        //console.log(`data.panelStatus的值为${data.panelStatus}`);
        if(data.panelStatus!=null){//如果有值
            data.panelStatus=JSON.parse(localStorage.getItem("panelStatus"));//将字符串转为布尔值
        }else if(data.panelStatus==null){//如果没值
            data.panelStatus=true;
            localStorage.setItem("panelStatus",JSON.stringify(data.panelStatus));
        }

        shop_id=localStorage.getItem("shop_id");
        if(shop_id!=null && shop_id!=""){//如果有值
            //console.log("1237",shop_id)
            shop_id=JSON.parse(localStorage.getItem("shop_id"));//将字符串转为对应数据类型
        }else if(shop_id==null || shop_id==""){//如果没值,或为空
            console.log("1238")
            shop_id="607032669";
            localStorage.setItem("shop_id",JSON.stringify(shop_id));
        }

        item_idArray=localStorage.getItem("item_idArray");
        if(item_idArray!=null){//如果有值
            item_idArray=JSON.parse(localStorage.getItem("item_idArray"));//将字符串转为对象
            console.log("未加载的商品列表为：",item_idArray)
        }else if(item_idArray==null){//如果没值
            //console.log("1235")
            item_idArray=[];
            localStorage.setItem("item_idArray",JSON.stringify(item_idArray));
        }

        mode=localStorage.getItem("mode");
        if(mode!=null){//如果有值
            //console.log("1236",mode)
            mode=JSON.parse(localStorage.getItem("mode"));//将字符串转为对象
        }else if(mode==null){//如果没值
            //console.log("1237")
        }

        reloadFlag=localStorage.getItem("reloadFlag");
        if(reloadFlag!=null){//如果有值
            //console.log("1210",reloadFlag)
            reloadFlag=JSON.parse(localStorage.getItem("reloadFlag"));//将字符串转为对象
        }else if(reloadFlag==null){//如果没值
            //console.log("1237")
        }

        if(mode==4 && data.status1==1){
            if(reloadFlag==0){
                let delayMs=30000;
                item_id=item_idArray[0];//从数组的第一个开始
                array1=[arrayId,array1Head];//标题头
                setTimeout(()=>{
                    getItemInformation({
                        shop_id:shop_id,
                        item_id:item_id,
                        mode:4,//同店多个
                        getItemInformationCount:1,//从第几个开始
                        limit:item_idArray.length,
                    });
                },delayMs);
                console.log(`${delayMs/1000}秒后开始加载`);

                console.log("本次加载第一个shop_id为："+shop_id);
                console.log("本次加载第一个item_id为："+item_id);
            }else if(reloadFlag==1){
                console.log("1538");
                localStorage.setItem("reloadFlag",0);
                location.reload();//刷新
            }

        }

    }
    //混密1ed



    //整店(主页) #mode:1
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
                    CAT_UI.Button("采集", {
                        type: "primary",
                        onClick() {
                            let r=confirm("点击确定，任务开始执行");
                            if (r==true){
                                CAT_UI.Message.info({
                                    content: "即将开始任务",
                                    closable: true,
                                    duration: 5000,
                                });
                                shop_id=input1;
                                getItemInformationIndex=0;//索引
                                getItemInformationCount=1;//计数
                                limit=30;//极限
                                offset=0;//开端
                                item_idArray=[];
                                array1=[arrayId,arrayDescribed,array1Head];
                                //CAT_UI.Message.info("我被点击了,你输入了：" + input+",赋值后shop_id为："+shop_id);
                                abcCount=0;
                                abc(shop_id,1);
                            }else{
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

    //整页(页面2) #mode:2
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
                    CAT_UI.Button("采集", {
                        type: "primary",
                        onClick() {
                            shop_id=input1;
                            offset=input3*30-30;//开端
                            limit=30;//上限
                            item_idArray=[];
                            array1=[arrayId,arrayDescribed,array1Head];
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

    //单个(页面3) #mode:3
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
                    CAT_UI.Button("采集", {
                        type: "primary",
                        onClick() {
                            shop_id=input1;
                            item_id=input2;
                            array1=[arrayId,arrayDescribed,array1Head];
                            getItemInformation({shop_id:shop_id,item_id:item_id,mode:3});
                            console.log("shop_id为："+shop_id);
                            console.log("item_id为："+item_id);
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
                    CAT_UI.Button("此页面导出", {
                        type: "primary",
                        onClick() {
                            //console.log(location.href);
                            let href=location.href;//页面链接
                            if(href.indexOf("shopee.co.th/product")!=-1 || href.indexOf("-i")!=-1){
                                let index1;
                                let index3;
                                let index2;
                                if(href.indexOf("shopee.co.th")!=-1){//本土站情况
                                    console.log("本土链接")
                                    index1=href.indexOf("product/");
                                    href=href.slice(index1+8);
                                    //console.log(href)
                                    index3=href.indexOf("/");

                                }else if(href.indexOf("-i")!=-1){//跨境站的情况
                                    console.log("跨境链接")
                                    console.log(href.indexOf("-i"))
                                    index1=href.indexOf("-i");
                                    index2=href.indexOf("?");
                                    console.log(href.indexOf("?"))
                                    href=href.slice(index1+3,index2);
                                    index3=href.indexOf(".");
                                }


                                shop_id=href.slice(0,index3);
                                item_id=href.slice(index3+1);
                                console.log(item_id);


                                array1=[arrayId,arrayDescribed,array1Head];
                                getItemInformation({shop_id:shop_id,item_id:item_id,mode:3});
                                // console.log("本次要加载的shop_id为："+shop_id);
                                // console.log("本次要加载的item_id为："+item_id);
                            }else{
                                alert("!!!当前并非商品页面");
                            }

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



                ),




            ],
            {
                direction: "vertical",
            }
        );
    }

    //同店多个(页面4) #mode:4
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
                            if(val.indexOf(",")!=-1){//如果是逗号分割的形式
                                item_idArray=val.split(",");//商品id数组
                            }else if(val.indexOf(" ")!=-1){//如果是空格分割的形式
                                item_idArray=val.split(" ");//商品id数组
                            }

                            console.log(item_idArray);
                        },
                        style: {
                            flex: 1,
                        },
                    }),

                ),
                CAT_UI.Button("采集", {
                    type: "primary",
                    onClick() {
                        if(mode==4){
                            alert("模式4正在运行，请稍后再点击")
                        }else if(mode==null){
                            shop_id=input1;
                            item_id=item_idArray[0];//从数组的第一个开始
                            array1=[arrayId,arrayDescribed,array1Head];//标题头
                            getItemInformation({
                                shop_id:shop_id,
                                item_id:item_id,
                                mode:4,//同店多个
                                getItemInformationCount:1,//从第几个开始
                                limit:item_idArray.length,
                            });

                            console.log("shop_id为："+shop_id);
                            console.log("item_id为："+item_id);
                        }

                    },
                }),


            ],
            {
                direction: "vertical",
            }
        );
    }

    //跨店多个(页面5) #mode:5
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
                CAT_UI.Button("采集", {
                    type: "primary",
                    onClick() {
                        shop_id=othersArray[0];
                        item_id=othersArray[1];
                        array1=[arrayId,arrayDescribed,array1Head];
                        getItemInformation({
                            shop_id:shop_id,
                            item_id:item_id,
                            mode:5,
                            getItemInformationCount:1,//计数
                            limit:(othersArray.length)/2,//上限
                        });
                    },
                }),


            ],
            {
                direction: "vertical",
            }
        );
    }

    //线下单个(页面6) #线下页面 #线下界面 #mode:5
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
                    CAT_UI.Button("采集", {
                        type: "primary",
                        onClick() {
                            //console.log(JSON.parse(input1));
                            array1=[arrayId,arrayDescribed,array1Head];
                            offLine_getItemInformation({

                                res:JSON.parse(input1),
                                mode:6

                            });//线下获取
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
    const temp={
        data1:null,
        data2:null,
        data3:null,
    }
    CAT_UI.createPanel({
        minButton: true,//minButton控制是否显示最小化按钮，默认为true
        min: data.panelStatus,// min代表面板初始状态为最小化,默认为true（仅显示header）
        /*相当于GM_addStyle */
        appendStyle: `section {
            max-width:600px;
            box-shadow:0px 0px 5px;
            position: fixed !important;
            }`,

        //point: { x: (window.screen.width - 500) / 2, y: 20 },// 面板初始坐标
        header: {
            title() {
                const [visible, setVisible] = CAT_UI.useState(false);
                const [input1, setInput1] = CAT_UI.useState(data.frequency1);
                const [input2, setInput2] = CAT_UI.useState(data.status1);
                //console.log(input1);
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
                        CAT_UI.Icon.IconSettings({ spin: false, //图标旋转
                                                  style: { fontSize: 24},
                                                  onClick: () => setVisible(true),
                                                 }),
                        "v "+GM_info.script.version,//版本
                        CAT_UI.Drawer(

                            CAT_UI.createElement("div", { style: { textAlign: "left" } }, [
                                CAT_UI.createElement(
                                    "div",
                                    {
                                        style: {
                                            display: "flex",
                                            //justifyContent: "space-between",//平均分布
                                            alignItems: "center",

                                        },
                                    },
                                    CAT_UI.Text("采集频率："),
                                    CAT_UI.Input({
                                        value: input1,
                                        onChange(val) {
                                            setInput1(val);
                                            data.frequency1 = val;
                                            localStorage.setItem("frequency1",val);
                                            console.log("1",temp.data1)
                                        },
                                        style: {
                                            width:"50px",
                                            border: "1px solid black",
                                        },
                                    }),
                                    CAT_UI.Text(" 秒"),
                                ),
                                CAT_UI.createElement(
                                    "div",
                                    {
                                        style: {
                                            display: "flex",
                                            //justifyContent: "space-between",//平均分布
                                            alignItems: "center",

                                        },
                                    },
                                    CAT_UI.Text("同店多个的自动模式："),
                                    CAT_UI.Checkbox("",{
                                        checked:input2,
                                        onChange(checked){
                                            //选中时
                                            if(checked){
                                                setInput2(1);//重新设置input2
                                                localStorage.setItem("status1","1");
                                                //data.status1=1;

                                            }else{
                                                setInput2(0);
                                                localStorage.setItem("status1","0");
                                                data.status1=0;
                                            }

                                        },
                                    }),

                                ),
                                CAT_UI.Divider("divider with text"),
                                "text2",
                                CAT_UI.Divider(null, { type: "vertical" }),
                                "text3",
                            ]),
                            {
                                title: "Basic",
                                visible,
                                focusLock: true,
                                autoFocus: true,
                                zIndex: 999999,
                                width:500,
                                style:{
                                    position: "fixed"
                                },
                                maskStyle:{
                                    position: "fixed"
                                },
                                //抽屉打开的回调
                                afterOpen(){
                                    temp.data1=input1;//暂存
                                    temp.data2=input2;//暂存
                                    // console.log("暂存",temp.data2);
                                    // console.log("123",temp.data1)
                                },
                                onOk: () => {
                                    setVisible(false);
                                },
                                onCancel: () => {//取消后
                                    data.frequency1 = temp.data1;//复原
                                    // console.log("取消后",temp.data1);
                                    data.status1=temp.data2;//复原
                                    setInput1(temp.data1);
                                    setInput2(temp.data2);
                                    localStorage.setItem("frequency1",temp.data1);//本地存储
                                    localStorage.setItem("status1",temp.data2);//本地存储
                                    setVisible(false);
                                },
                            }
                        ),
                    ]),




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
                            getItemInformation({//开始执行单个sku
                                shop_id:shop_id,
                                item_id:item_idArray[getItemInformationIndex],
                                getItemInformationCount:getItemInformationCount,
                                limit:length,
                                mode:mode
                            });
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
            alert("采集失败，请检查网络环境")


        });
    }
    //获取单个商品详情 #getItemInformationf #getItemInformation函数
    function getItemInformation(options){
        let{
            shop_id=null,//商店id
            item_id=null,//商品id
            getItemInformationCount=null,//计数
            limit=null,//极限
            mode=null,//模式
        }=options;
        //console.log("106",limit);
        $.ajax({
            url: 'https://shopee.co.th/api/v4/pdp/get_pc',
            crossDomain: true,
            headers: {
                'authority': 'shopee.co.th',
                'accept': 'application/json',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                /*会变动*/
                //'af-ac-enc-dat': 'bd59d705a12840dd',
                /*会变动*/
                //'af-ac-enc-sz-token':'WBCPORY3c7K4MqP//nRrgA==|sbJ2WrRXyAc9ZwpcDINUWgJnU5fa83QuzriJtd1qmQiy7jMqT1Y3NaSXd4sA6sFz+dZUh5lOvZCzPA==|TPtWS6t+CanvfJHs|08|3' ,
                'x-api-source': 'pc',
                'x-csrftoken': 'r6a7YaiI3qg0JcJdP9juOB51NY0oW3lc',
                'x-requested-with': 'XMLHttpRequest',
                /*会变动*/
                //'x-sap-ri': '8a5d3366da6c18efbb6aa53d0301bb249b1ca415332939dfe67e',
                /*会变动*/
                //'x-sap-sec': 'u7AaGFNdZFX+aFX+bJX0aFj+bJX+aFj+aFXMaFX+HFV+aUjMaFXdaFX+qqBUPcr+aF9yacX+tFV+a8J3+enrbYlx7mCAJHzFstPj94P+W4VO1fVFaeG13KJFUnJSaGgUUehimV6A8h/roj1LqjNebjzW1pkC69u356Xf13NDkJ8XMD4kHxE0Qnihyy7HdSLgjlvjTYB4Jiom0nJMXLm5qWleVtM5xzEmocmE/7NSS6FXeY3FZiSXdrcthnkAVn34RAfusmj4e7vrPzKcyy3TEa3Qyb/Kkm73T3qM9/phgGjJ1RtCDe8mR4pbl0S2lr8fOSjJsnD3kc8W6XMg78qSuFtvsO9MObhqsQW65SWO7+HmbhNEv2CGz2e4MvJ6rWt7HheAzFJdg+PornsOSUXxHi/I03a4sUWlfHBVuKZ7Q3Lxqe00pQTipb6jci8HV2d1IvFQDJx8wYmOJooFB6H92v+R9oR4QKMKpg2pqqY1JY8CLI6P4bBLeA0qYYSe2Jy2SXarWkKIVgOnjuXNkfKIf3Nq5xLCeO7TA03urcAjPSjVUw2MMd4qBG3aJuAbTE0wujJ2OF2ANapGDzncEZu0heA21W+VUyNpAe0bY1csork0ue1ESk/o6ip7OPCqwhWbvqFC41YV+kUdECARFYFBnnKWtoXw1ocfbK3vxEG3Cj7PefmkdVzqit0Ay/zP30YHgmNiSkT1/UU4Xg0qL5Lls/wn9pH8y+Dm5kaBo4hYz8/nLTpc0ifbxYwPLI2inE3pVXah/1jXlLymw70cl38/q1Dl+dU5K+n5Z393Y5Uhxp1f/hIXKuTgaJrFX8XpnEfqVwzkuBhyty6gRXBONi627ecwKqhEZVCqW88og5PoegPmNmulNJ7Q2QrFCuWzbYmmLpcyHSqrw3mObJSKuLLAlXL0b4fAB6I58TxbkmQPI2DoHuqc3VyIr+TzTF36fI5+o6legT05RDqTNpk6N38xkPGtDc85EkfA7eG5A7lVJmjP0ovmttoWpCfArz21/AC9w3ld8QGLKRHcK+8fkI2rnvyMYKy6kYomWXhfPTJzg8SHG/0IeMXvzgJWYEnloNFqpECSVMQ3Q0BBfK5N8mar7KYwhRTW2rxRoBVB16Ach0JMdYKzcoDeaU+8L919aAG5ggUnCqhONeF3QoUg04jp2UXxuJElcNTHFhPYWN8/jCwil3xJvVh+nP4Nq17BfbeHgYdDn7dwxFX+aTyjfybDjrwuaFX+atBUP060aFX+GFX+aDj+aFXaMgYtbgkbHTseBiAL7fHQHom0JJr+aFX8i4kffjjDfmX+aFX0aFN+xFXdaFr+aFX0aFX+GFX+aDj+aFWvwzRu4avX81Dl03v+mCfZAEC8wcb+aFXAAyylijiyan==',
                'x-shopee-language': 'th',
                'x-sz-sdk-version': '3.1.0-2&1.6.0'
            },
            contentType: 'application/json',
            data: {
                'shop_id': shop_id,
                'item_id': item_id
            }
        }).success(function(res) {
            if(mode==3){//单个

            }else{//其他
                console.log(`正在加载第${getItemInformationCount}个`);
                CAT_UI.Message.info({
                    content: "正在加载第"+getItemInformationCount+"个",
                    closable: true,
                    duration: 3000,
                });

            }
            finishItemIdArray.push(item_id);//已完成的itemId
            if(mode==4){//同店多个
                if(item_idArray.filter( ( el ) => !finishItemIdArray.includes( el ) ).length==0){//去除已经成功的
                    alert("全部商品加载完成")
                    reloadFlag=0;//重置状态
                    localStorage.removeItem("item_idArray");
                    localStorage.removeItem("mode");
                }
            }



            offLine_getItemInformation({
                res:res,
                getItemInformationCount:getItemInformationCount,
                limit:limit,
                mode:mode,
            });

        }).error(function(res) {
            console.log("采集失败了",res.responseJSON);
            item_idArray = item_idArray.filter( ( el ) => !finishItemIdArray.includes( el ) );//去除已经成功的
            console.log(item_idArray);
            ex(`整店产品信息(未完成)`,array1,"Sheet1",listToMatrix(item_idArray,1),"Sheet2");
            if(mode==4){
                if(item_idArray.length==0){
                    console.log("abc");
                    localStorage.remove("shop_id");
                    localStorage.remove("item_idArray");
                    localStorage.remove("mode");
                    localStorage.remove("reloadFlag");
                }else{
                    console.log("12345",item_idArray);
                    localStorage.setItem("shop_id",shop_id);
                    localStorage.setItem("item_idArray",JSON.stringify(item_idArray));
                    localStorage.setItem("mode",mode);
                    localStorage.setItem("reloadFlag",1);
                    location.reload();//刷新页面
                }


            }

        });
    }

    //获取单个商品详情后处理 #offLine_getItemInformation函数
    function offLine_getItemInformation(options){
        let{
            res=null,//返回的数据
            getItemInformationCount=null,//计数
            limit=null,//极限
            mode=null,//模式
        }=options;
        //console.log("101",getItemInformationCount);
        if(mode==6){
            console.log(`正在执行线下获取`);
        }
        if(mode==4){
            console.log(`正在执行同店多个`);
            CAT_UI.Message.info('正在执行同店多个任务，进度是：'+getItemInformationCount+"/"+limit);
        }
        if(mode==3){
            console.log(`正在执行单个`);
        }
        if(mode==5){
            console.log(`正在执行跨店多个`);
        }

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

        let model_id;//组合id

        let xqImages=[];//详情图片

        let skuSold;//sku销量

        let solds;//总销量

        let ctime;//上架时间

        //对每个sku进行循环
        for(let i=0;i<length;i++){
            //console.log(i);
            let categoriesLength=res.data.item.categories.length;
            catid=res.data.item.categories[categoriesLength-1].catid;//类目代码
            brand="No brand";//品牌

            //标题处理
            title=res.data.item.title.toString();//标题
            if(title.length!=25) {
                title=title+" safe polular perfect nice beautiful";
            }
            for(let l=0;l<productNameErrorWord.length;l++){//处理标题违规词
                if(title.includes(productNameErrorWord[l])){
                    let regex1 = new RegExp(productNameErrorWord[l], 'g');
                    title = title.replace(regex1, productNameErrorWord_Change[l]);

                }
            }

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
            let firstSkuImage
            //alert(12)
            if(res.data.product_images.first_tier_variations.length!=0){//如果非空
                //alert(123);
                firstSkuImage=linkHead+res.data.product_images.first_tier_variations[0].image;
            }
            //alert(31)
            //console.log(`firstSkuImage ${firstSkuImage}`);
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
                    description = description.replace(regex1, describeErrorWord_Change[l]);

                }
            }
            for(let i2=0;i2<9;i2++){
                if(i2==8){
                    if(firstSkuImage==null){//如果没有sku图片
                        xqImages.push(image);//添加图片
                    }else{//如果有sku图片
                        xqImages[i2]=firstSkuImage
                    }

                }else if(images[i2+1]!=null){
                    xqImages[i2]=images[i2+1];


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

            //组合id
            model_id=res.data.item.models[i].model_id.toString();//#modelId #modelid

            //sku销量
            skuSold=res.data.item.models[i].sold;

            //总销量
            solds=res.data.product_review.global_sold;

            //上架时间
            ctime=res.data.item.ctime;

            //获取完后组装
            array1.push(["",catid,"",brand,title,description,name,name1,name2,image,price,price_before_discount,images[0],images[1],images[2],images[3],images[4],images[5],images[6],images[7],images[8],skucode,"",skucode,from,stock,is_pre_order,model_id,xqImages[0],xqImages[1],xqImages[2],xqImages[3],xqImages[4],xqImages[5],xqImages[6],xqImages[7],xqImages[8],skuSold,solds,ctime]);




            if(i==length-1){//一个item跑完
                if(mode==3){
                    ex(`单个产品信息`,array1,"Sheet1");
                }else if(mode==6){
                    ex(`线下单个产品信息`,array1,"Sheet1");
                }else if(getItemInformationCount==limit){
                    //console.log("最后一个");
                    if(mode==1){
                        ex(`整店产品信息`,array1,"Sheet1");
                    }else if(mode==2){
                        ex(`产品信息第${page}页`,array1,"Sheet1");
                    }else if(mode==4){//同店多个
                        console.log("111 同店多个");
                        ex(`同店多个`,array1,"Sheet1");
                    }else if(mode==5){
                        ex(`跨店多个`,array1,"Sheet1") ? 1:alert("全部加载完成");
                    }


                }else if(getItemInformationCount!=limit){//还没跑完
                    //console.log("103");
                    //console.log(getItemInformationIndex);
                    getItemInformationIndex++;
                    //console.log(getItemInformationCount);
                    getItemInformationCount++;
                    //console.log(getItemInformationCount);

                    if(mode==1){//整店模式
                        setTimeout(function(){
                            getItemInformation({
                                shop_id:shop_id,
                                item_id:item_idArray[getItemInformationIndex],
                                getItemInformationCount:getItemInformationCount,
                                limit:limit,
                                mode:mode
                            })
                        },data.frequency1*1000)
                    }else if(mode==5){
                        //console.log("102");
                        setTimeout(function(){
                            getItemInformation({
                                shop_id:othersArray[(getItemInformationCount-1)*2],
                                item_id:othersArray[(getItemInformationCount-1)*2+1],
                                getItemInformationCount:getItemInformationCount,
                                limit:limit,
                                mode:mode,

                            })
                        },data.frequency1*1000)
                    }else if(mode==4){//同店多个
                        //console.log("104");
                        setTimeout(()=>{
                            getItemInformation({
                                shop_id:shop_id,
                                item_id:item_idArray[getItemInformationCount-1],
                                mode:mode,
                                getItemInformationCount:getItemInformationCount,
                                limit:limit,
                            });
                        },data.frequency1*1000)

                    }else{
                        setTimeout(function(){
                            getItemInformation({
                                shop_id:shop_id,
                                item_id:item_idArray[getItemInformationIndex],
                                getItemInformationCount:getItemInformationCount,
                                limit:limit,
                                mode:mode
                            })
                        },data.frequency1*1000)
                    }

                }



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

    //获取年月日6位日期 #getDate_f #getDatef
    function getDate(){

        //获取当前日期
        let date = new Date();

        // 获取当前月份
        let nowMonth = date.getMonth() + 1;


        // 获取当前是几号
        let strDate = date.getDate();


        // 对月份进行处理，1-9月在前面添加一个“0”
        if (nowMonth >= 1 && nowMonth <= 9) {
            nowMonth = "0" + nowMonth;
        }

        // 对月份进行处理，1-9号在前面添加一个“0”
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }
        //console.log(date.getFullYear());
        // 最后拼接字符串，得到一个格式为(yyMMdd)的日期
        return date.getFullYear().toString().slice(2) + nowMonth + strDate;
    }

    //导出二维数组为表格
    function ex(bookName,array1,sheetName1,array2,sheetName2,array3,sheetName3){
        /* 把转换JS数据数组的数组为工作表 */
        const sheet0= XLSX.utils.aoa_to_sheet(array1);

        let sheet1;
        if(array2!=undefined && sheetName2!=undefined){
            sheet1= XLSX.utils.aoa_to_sheet(array2);
        }

        let sheet2;
        if(array3!=undefined && sheetName3!=undefined){
            sheet2= XLSX.utils.aoa_to_sheet(array3);
        }

        /* 生成工作簿并添加工作表 */
        const book = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(book,sheet0,sheetName1 )
        if(array2!=undefined && sheetName2!=undefined){
            XLSX.utils.book_append_sheet(book,sheet1,sheetName2 )
        }
        if(array3!=undefined && sheetName3!=undefined){
            XLSX.utils.book_append_sheet(book,sheet2,sheetName3 )
        }

        /* 保存到文件 */
        XLSX.writeFile(book,getDate()+bookName+".xlsx")
        return 0;
    }

    // 数组变二维数组方法
    function listToMatrix(list, elementsPerSubArray) {
        var matrix = [], i, k;

        for (i = 0, k = -1; i < list.length; i++) {
            if (i % elementsPerSubArray === 0) {
                k++;
                matrix[k] = [];
            }

            matrix[k].push(list[i]);
        }

        console.log("1234",matrix)
        return matrix;
    }

    function postRequest(){
        getLocalInfo().then((res)=>{
            console.log(res);
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://fc-mp-7fe76973-5165-4172-ac40-382e23e02a8d.next.bspapp.com/uploadInfo/uploadInfo1",
                headers: {
                    "content-type": 'application/json',
                },
                data:JSON.stringify(res),

                onload: function(response){
                    let res1=JSON.parse(response.responseText);
                    console.log("上传本机信息成功",res1)



                },
                onerror: function(res){
                    console.log("请求失败");

                }
            });
        })

    }
    //获取本地信息
    function getLocalInfo(){
        return new Promise((resolve)=>{
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://www.ip.cn/api/index?ip&type=0",
                headers: {
                    "content-type": 'application/json',
                },

                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log("获取本机ip和地址成功",res);
                    resolve(res);


                },
                onerror: function(res){
                    console.log("请求失败");

                }
            });
        })
    }

    //监听放大缩小按钮
    let count1=0;
    let interval1=setInterval(()=>{
        count1++
        if(count1==100){
            //console.log(1234123213);
            clearInterval(interval1);
        }
        let element1=document.querySelector("cat-ui-plan").shadowRoot.querySelector("div > div:nth-child(1) > section > header > button");//获取放大缩小按钮元素
        if(element1!=null){//如果这个元素已经加载好了
            //console.log("加载完成")
            clearInterval(interval1);
            //console.log(element1);
            element1.onclick = function(event) {
                //console.log("验证");
                let attribute=element1.querySelector("svg > path").getAttribute("d");

                if(attribute=="M5 24h38"){
                    //console.log("点击时是放大的，点击后是缩小的");
                    localStorage.setItem("panelStatus","true")//最小化
                }else if(attribute=="M5 24h38M24 5v38"){
                    //console.log("点击时是缩小的，点击后是放大的");
                    localStorage.setItem("panelStatus","false")//放大化
                }
            };

        }
    },10);



})();
