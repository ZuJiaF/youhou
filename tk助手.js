// ==UserScript==
// @name         tk助手
// @namespace    http://tampermonkey.net/
// @version      1.0.6
// @description  try to take over the world!
// @author       You
// @match        https://seller-th.tiktok.com/*
// @match        https://seller.tiktokglobalshop.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shopee.co.th
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://cdn.staticfile.org/xlsx/0.15.1/xlsx.core.min.js
// @require      https://scriptcat.org/lib/1167/1.0.0/%E8%84%9A%E6%9C%AC%E7%8C%ABUI%E5%BA%93.js
// @grant        GM_xmlhttpRequest
// @downloadURL  https://raw.githubusercontent.com/ZuJiaF/youhou/main/tk%E5%8A%A9%E6%89%8B.js
// @updateURL    https://raw.githubusercontent.com/ZuJiaF/youhou/main/tk%E5%8A%A9%E6%89%8B.js
// ==/UserScript==

(function() {
    let end_flag1=0;//tk被锁库存结束标志位
    let FlashDealProtect_EndFlag=0;//tk闪购商品id结束标志位
    let getInactiveEndFlag=0;//tk不活跃商品id结束标志位
    let getDeletedEndFlag=0;//tk被删除商品id结束标志位
    let array1=[];//tk被锁库存
    let array2=[];//tk闪购商品id
    let array3=[];//tk不活跃商品id
    let array4=[];//tk被删除商品id
    let count=0;//加载计数
    let count1;
    let array5;//查类目属性的类目id
    let array6=[["类目id","属性id_1","属性名称_1"]];//存放id和属性
    let content;//内容
    let href=location.href;//获取当前页面网址链接
    let mode;//1为本土，2为跨境

    //综合面板
    const data = {
        input1: "a",//闪购报名尾缀
        input2: getDate(),//闪购报名日期
        input3: "1",
        input4:"700789,600017",
        input5:"null",//闪购报名内容
        input6:"a",//折扣报名尾缀
        input7: getDate(),//折扣报名日期
        input8:"null",//折扣报名内容
        panelStatus:true,//面板缩放默认状态,默认为true，缩小
        autoPanelStatus:0,//自动记录面板缩放状态
        autoSyncPromotionStarus:0,//自动同步折扣


    };

    //
    /**********************************函数执行区**********************************/
    get_0();//tk被锁库存
    getFlashDealProtect();//获取tk闪购商品id
    getInactive();//获取不活跃商品id
    getDeleted(); //获取被删除商品id
    init();//数据初始化
    /**********************************函数执行区**********************************/
    (()=>{
        console.log("网址为：",href);
        if(href.indexOf("https://seller-th.tiktok.com")!=-1){//泰国本土
            mode=1;
        }else if(href.indexOf("https://seller.tiktokglobalshop.com")!=-1){//跨境
            mode=2;
        }
    })()

    //数据初始化
    function init(){
        data.autoSyncPromotionStarus = localStorage.getItem("autoSyncPromotionStarus");//自动同步折扣
        if(data.autoSyncPromotionStarus!=null){
            data.autoSyncPromotionStarus=JSON.parse(data.autoSyncPromotionStarus);
        }else if(data.autoSyncPromotionStarus==null){
            data.autoSyncPromotionStarus=0;
            localStorage.setItem("autoSyncPromotionStarus",JSON.stringify(data.autoSyncPromotionStarus));
        }

        data.autoPanelStatus = localStorage.getItem("autoPanelStatus");//自动记录面板缩放状态
        if(data.autoPanelStatus!=null){
            data.autoPanelStatus=JSON.parse(data.autoPanelStatus);
        }else if(data.autoPanelStatus==null){
            data.autoPanelStatus=0;
            localStorage.setItem("autoPanelStatus",JSON.stringify(data.autoPanelStatus));
        }

        if(data.autoPanelStatus){
            data.panelStatus=localStorage.getItem("panelStatus");//面板缩放默认状态
            //console.log(`data.panelStatus的值为${data.panelStatus}`);
            if(data.panelStatus!=null){//如果有值
                data.panelStatus=JSON.parse(localStorage.getItem("panelStatus"));//将字符串转为布尔值
            }else if(data.panelStatus==null){//如果没值
                data.panelStatus=true;
                localStorage.setItem("panelStatus",JSON.stringify(data.panelStatus));
            }
        }



    }



    function Home() {

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
                    CAT_UI.Button("导出被锁库存", {
                        type: "primary",
                        onClick() {
                            if(end_flag1==1){
                                ex("tk被锁库存",array1,"Sheet1");//导出表格
                            }
                            else if(end_flag1==0){
                                alert('加载中，请稍等');
                            }
                        },
                        style: {
                            flex: 1,
                        }
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
                    CAT_UI.Button("导出辅助表", {
                        type: "primary",
                        onClick() {
                            if(FlashDealProtect_EndFlag==1 && getInactiveEndFlag==1 && getDeletedEndFlag==1){
                                ex("活动辅助表",array2,"全年闪购的商品id",array3,"不活跃的商品id",array4,"被删除商品id");//导出表格
                            }
                            else if(FlashDealProtect_EndFlag==0 || getInactiveEndFlag==0 || getDeletedEndFlag==0){
                                alert('加载中，请稍等');
                            }
                        },
                        style: {

                            flex: 1,
                        }
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
                    CAT_UI.Button("跨境店导出折扣表", {
                        type: "primary",
                        onClick() {
                            //alert(1);
                            getZK();
                        },
                        style: {

                            flex: 1,
                        }
                    }),


                ),
            ],
            {
                direction: "vertical",
            }
        );
    }

    //闪购(页面2)
    function UI_flashDeal() {
        const [input1, setInput1] = CAT_UI.useState(data.input1);
        const [input2, setInput2] = CAT_UI.useState(data.input2);
        const [input3, setInput3] = CAT_UI.useState(data.input3);
        const [input4, setInput4] = CAT_UI.useState(data.input5);
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
                    CAT_UI.Text("命名尾缀："),
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
                    CAT_UI.Text("日期(例如:"+getDate()+")："),
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
                    CAT_UI.Text("间隔小时(1、2、3、4)："),
                    CAT_UI.Input({
                        value: input3,
                        onChange(val) {
                            setInput3(val);
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
                    CAT_UI.Text("内容："),
                    CAT_UI.Input({
                        value: input4,
                        onChange(val) {
                            setInput4(val);
                            data.input4 = val;
                            content=JSON.parse(val);

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
                    CAT_UI.Button("启动", {
                        type: "primary",
                        onClick() {

                            let yearPart=input2.slice(0,2);
                            let month=input2.slice(2,4);
                            let day=input2.slice(4);
                            let newDate="20"+yearPart+"-"+month+"-"+day+" 00:00:00";
                            //console.log("20"+yearPart+"-"+month+"-"+day+" 00:00:00");
                            newDate=Date.parse(newDate)/1000+3600;
                            //console.log(newDate);
                            let time=24/input3;
                            let frequency=24/time;
                            alert("点击确定，任务开始执行");
                            console.log(content);
                            if(autoSyncPromotionStarus==1){//如果开启了折扣同步
                                discountActivity({//折扣报名
                                    tail:input1+"x",
                                    date:newDate,
                                    content:content,
                                    mode:mode,
                                });
                            }
                            flashDealActivity({//报闪购
                                tail:input1,
                                date:newDate,
                                time:time,
                                frequency:frequency,
                                content:content,
                                mode:mode,
                            });
                        },
                    }),
                    CAT_UI.Button("删除", {
                        type: "primary",
                        onClick() {
                            let r=confirm("确定删除吗?");
                            if (r==true){
                                getFlashDealList({
                                    date:input2.slice(2),
                                    tail:input1,
                                    mode:mode,
                                })
                            }
                            else{
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

    //折扣(页面3)
    function UI_discount(){
        const [input1, setInput1] = CAT_UI.useState(data.input6);
        const [input2, setInput2] = CAT_UI.useState(data.input7);
        const [input3, setInput3] = CAT_UI.useState(data.input8);
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
                    CAT_UI.Text("命名尾缀："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            data.input6 = val;
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
                    CAT_UI.Text("日期(例如:"+getDate()+")："),
                    CAT_UI.Input({
                        value: input2,
                        onChange(val) {
                            setInput2(val);
                            data.input7 = val;
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
                    CAT_UI.Text("内容："),
                    CAT_UI.Input({
                        value: input3,
                        onChange(val) {
                            setInput3(val);
                            data.input8 = val;
                            content=JSON.parse(val);

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
                    CAT_UI.Button("启动", {
                        type: "primary",
                        onClick() {
                            let yearPart=input2.slice(0,2);
                            let month=input2.slice(2,4);
                            let day=input2.slice(4);
                            let newDate="20"+yearPart+"-"+month+"-"+day+" 00:00:00";
                            //console.log("20"+yearPart+"-"+month+"-"+day+" 00:00:00");
                            newDate=Date.parse(newDate)/1000+3600;//+3600是转换成泰国时间
                            //console.log(newDate);
                            alert("点击确定，任务开始执行");
                            console.log(content);
                            discountActivity({
                                tail:input1,
                                date:newDate,
                                content:content,
                                mode:mode,
                            });

                        },
                    }),
                    CAT_UI.Button("删除", {
                        type: "primary",
                        onClick() {
                            let r=confirm("确定删除吗?");
                            if (r==true){
                                delDiscount({//根据日期和尾缀删除折扣
                                    date:input2,
                                    tail:input1,
                                    mode:mode,
                                })
                            }
                            else{
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

    //获取属性(页面4)
    function UI_getAttribute() {
        const [input1, setInput1] = CAT_UI.useState(data.input4);
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
                    CAT_UI.Text("类目id："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            data.input1 = val;
                            array5=val.split(",");
                            console.log(array5);
                        },
                        style: {
                            flex: 1,
                        },
                    }),

                ),
                CAT_UI.Button("启动", {
                    type: "primary",
                    onClick() {
                        count1=0;
                        array5.forEach(function(e,index){
                            if(index!=array5.length-1){
                                setTimeout(function(){
                                    getAttribute(e);//获取类目属性
                                },index*100)

                            }else if(index==array5.length-1){

                                setTimeout(function(){
                                    getAttribute(e,1);
                                },index*100)
                            }

                        })

                    },
                }),


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
    max-width:500px;
    box-shadow:0px 0px 5px;
    position: fixed !important;
  }`,

        //point: { x: (window.screen.width - 500) / 2, y: 20 },// 面板初始坐标
        header: {
            title() {
                const [visible, setVisible] = CAT_UI.useState(false);
                const [input1, setInput1] = CAT_UI.useState(data.autoSyncPromotionStarus);
                const [input2, setInput2] = CAT_UI.useState(data.autoPanelStatus);
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
                        CAT_UI.Router.Link("首页", { to: "/" }),
                        CAT_UI.Router.Link("闪购", { to: "/flashDeal" }),
                        CAT_UI.Router.Link("折扣", { to: "/discount" }),
                        CAT_UI.Router.Link("属性", { to: "/getAttribute" }),
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
                                    CAT_UI.Text("闪购报名是否同步到折扣报名："),
                                    CAT_UI.Checkbox("",{
                                        checked:input1,
                                        onChange(checked){
                                            //选中时
                                            if(checked){
                                                setInput1(1);//重新设置input1
                                                localStorage.setItem("autoSyncPromotionStarus","1");
                                                data.autoSyncPromotionStarus=1;

                                            }else{
                                                setInput1(0);
                                                localStorage.setItem("autoSyncPromotionStarus","0");
                                                data.autoSyncPromotionStarus=0;
                                            }

                                        },
                                    }),
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
                                    CAT_UI.Text("记录面板缩放状态："),
                                    CAT_UI.Checkbox("",{
                                        checked:input2,
                                        onChange(checked){
                                            //选中时
                                            if(checked){
                                                setInput2(1);//重新设置input2
                                                localStorage.setItem("autoPanelStatus","1");
                                                data.autoPanelStatus=1;

                                            }else{
                                                setInput2(0);
                                                localStorage.setItem("autoPanelStatus","0");
                                                data.autoPanelStatus=0;
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
                                    //console.log("123",temp.data1)
                                },
                                onOk: () => {
                                    setVisible(false);
                                },
                                onCancel: () => {//取消后
                                    data.autoSyncPromotionStarus = temp.data1;//复原
                                    data.autoPanelStatus=temp.data2;//复原
                                    setInput1(temp.data1);
                                    setInput2(temp.data2);
                                    localStorage.setItem("autoSyncPromotionStarus",temp.data1);//本地存储
                                    localStorage.setItem("autoPanelStatus",temp.data2);//本地存储
                                    setVisible(false);
                                },
                            }
                        ),
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
                Component: Home,
            },
            {
                path: "/flashDeal",
                Component: UI_flashDeal,
            },
            {
                path: "/discount",
                Component:UI_discount,
            },
            {
                path: "/getAttribute",
                Component: UI_getAttribute,
            },
        ],
    });


    //获取类目属性
    function getAttribute(id,stopFlag){

        $.ajax({
            url: 'https://seller-th.tiktok.com/api/v1/product/category/bind_info/get?category_id='+id,
            crossDomain: true,
            headers: {
                'authority': 'seller-th.tiktok.com',
                'accept': '*/*',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                'x-tt-oec-region': 'TH'
            }
        }).success(function(res) {
            count1++;
            console.log(`第${count1}次,id为${id}`);
            //console.log(res);
            //console.log(res);

            if(res.data.product_properties!=undefined){
                res.data.product_properties.forEach(function(e,index){
                    //console.log(index);

                    //console.log(`id为${e.id}`);
                    //console.log(`name为${e.name}`);
                    array6.push([id,e.id,e.name]);


                })
            }

            if(stopFlag==1){
                ex("类目属性",array6,"Sheet1")
            }
        });
    }

    function get_0(){
        //console.log("开始加载")
        $.ajax({
            url: "https://seller-th.tiktok.com/api/v1/product/local/products/list?tab_id=1&page_number=1&page_size=1000&sku_number=100",
            type: 'GET',
            //async:false,//同步操作
            success: function(res){
                let length_product=res.data.products.length;//商品数量
                //console.log("有"+length_product+"个商品");
                for(let i=0;i<length_product;i++){
                    //console.log("循环次数为第"+(i+1));
                    let length_sku=res.data.products[i].skus.length;//商品对应的sku数量
                    //console.log("sku数量为"+length_sku);
                    for(let j=0;j<length_sku;j++){
                        array1.push([res.data.products[i].skus[j].id+","+res.data.products[i].skus[j].quantities[0].reserved_quantity]);
                        //console.log(res.data.products[i].skus[j].id+","+res.data.products[i].skus[j].quantities[0].reserved_quantity);
                        count++;
                        //console.log("正在加载第"+count+"个");
                    }
                    if(i==length_product-1){
                        end_flag1=1;//结束标志位
                        //console.log("i为"+i+"是最后一个");
                        //console.log(array1);



                    }
                }
            }
        });
    }

    function getFlashDealProtect(){
        $.ajax({
            url: "https://seller-th.tiktok.com/api/v1/promotion/campaign/seller/list_products?campaign_id=7187676173780977414&cursor=0&limit=150",
            type: 'GET',
            //async:false,//同步操作
            success: function(res){
                //console.log("1111",res);
                let length=res.data.campaign_product_approve_infos.length;
                //console.log("长度为："+length);
                for(let i=0;i<length;i++){
                    let statu=res.data.campaign_product_approve_infos[i].product_approve_status;
                    if(statu==2){
                        //console.log(res.data.campaign_product_approve_infos[i].product_info_base.product_id);
                        array2.push([res.data.campaign_product_approve_infos[i].product_info_base.product_id]);
                    }
                    if(i==length-1){
                        //console.log("最后一个");
                        //console.log("all:"+array2);
                        FlashDealProtect_EndFlag=1;//结束标志位
                    }
                    //console.log(res.data.campaign_product_approve_infos[i].product_info_base.product_id);
                }
            }
        });
    }

    //不活跃商品
    function getInactive(){
        $.ajax({
            url: "https://seller-th.tiktok.com/api/v1/product/local/products/list?oec_seller_id=7494978043478772339&tab_id=5&page_number=1&page_size=500&sku_number=1",
            type: 'GET',
            //async:false,//同步操作
            success: function(res){
                //console.log(res);//全部数据
                let length1=res.data.products.length;//产品数量

                for(let i=0;i<length1;i++){
                    //console.log(res.data.products[i].product_id);
                    array3.push([res.data.products[i].product_id]);
                    if(i==length-1){

                        getInactiveEndFlag=1;//结束标志位
                    }
                }



            }
        });

    }

    //被删除商品
    function getDeleted(){
        $.ajax({
            url: "https://seller-th.tiktok.com/api/v1/product/local/products/list?tab_id=10&page_number=1&page_size=1000&sku_number=1",
            type: 'GET',
            //async:false,//同步操作
            success: function(res){
                //console.log(res);//全部数据
                let length1=res.data.products.length;//产品数量

                for(let i=0;i<length1;i++){
                    //console.log(res.data.products[i].product_id);
                    array4.push([res.data.products[i].product_id]);
                    if(i==length-1){

                        getDeletedEndFlag=1;//结束标志位
                    }
                }



            }
        });

    }

    //跨境店获得折扣内容
    function getZK(){
        GM_xmlhttpRequest({
            method: "POST",
            url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/list_products_by_cursor?oec_seller_id=7495143478410054258',
            headers: {
                "Content-Type": 'application/json',
            },
            data: JSON.stringify({
                'promotion_id': '7323186918946604806',
                'cursor': 0,
                'limit': 0
            }),
            onload: function(response){
                let res=JSON.parse(response.responseText);
                console.log("内容为",res);
                let array=[["产品id","skuId","price"]];//数组
                res.data.item_products.forEach((e,index,self)=>{//遍历每个商品
                    e.skus.forEach((e1,index1,self1)=>{//遍历每个sku
                        // console.log(e1);
                        // console.log("数组长度为：",self1.length);//数组长度
                        // console.log(index1);
                        // console.log("产品id为：",e1.product_id);
                        // console.log("skuId为：",e1.sku_id);
                        // console.log("价格为：",e1.fixed_price_value);
                        // console.log("数组",array);
                        array.push([e1.product_id,e1.sku_id,e1.fixed_price_value])
                        if(index==self.length-1 && index1==self1.length-1){//最后一条
                            ex("产品折扣表",array,"Sheet1")
                        }
                    })
                })


            },
            onerror: function(res){
                console.log("请求失败");
            }
        });
    }

    //报闪购
    function flashDealActivity(options){
        let{
            tail=null,
            date=null,
            time=null,
            frequency=null,
            content=null,
            mode=null,//模式，1为本土，2为跨境
        }=options

        console.log(date);
        console.log(date+3600*frequency);

        let startTime=timestampToTime((date-3600)*1000).slice(2);
        let endTime=timestampToTime(((date-3600)+3600*frequency)*1000).slice(7);
        if(time==1){
            endTime="24:00"
        }
        let starDate=date.toString();
        let endDate=(date+3600*frequency).toString();
        console.log(startTime+"-"+endTime+" "+tail);

        //console.log(endTime);
        if(mode==1){//泰国本土
            $.ajax({
                url: 'https://seller-th.tiktok.com/api/v1/promotion/flash_sale/create?',
                crossDomain: true,
                method: 'post',
                headers: {
                    'authority': 'seller-th.tiktok.com',
                    'accept': '*/*',
                    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                    'x-secsdk-csrf-token': '000100000001d04de9dd1e0747c74b503daa0a43886da2f27d31095dd19f8e503d432d05f5151794f6970cac8e89',
                    'x-tt-oec-region': 'TH'
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    'promotion_name': startTime+"-"+endTime+" "+tail,
                    'period': {
                        'start_time': starDate,
                        'end_time': endDate
                    },
                    'pre_launch_day': 0,
                    'flash_sale_products':content,
                    'promotion_limit_dimension': 1
                })
            }).success(function(res) {
                console.log(res);
                flashDealActivitySuccess({
                    res:res,
                    startTime:startTime,
                    endTime:endTime,
                    tail:tail,
                    date:date,
                    time:time,
                    frequency:frequency,
                    mode:mode,

                });//请求成功后要执行的

            });
        }else if(mode==2){//跨境
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/flash_sale/create?oec_seller_id=7495143478410054258",
                headers: {
                    'x-secsdk-csrf-token': '000100000001baa41e98f68a44c055ceaf54be2456ab4d49fbd9ba23c001b1eda3573a1b3e5017ab23c6ad8b1e1f',//会变动
                    "Content-Type": 'application/json',
                },
                data: JSON.stringify({
                    'promotion_name': startTime+"-"+endTime+" "+tail,
                    'period': {
                        'start_time': starDate,
                        'end_time': endDate
                    },
                    'display_channels': [
                        1
                    ],
                    'effective_time_type': 1,
                    'flash_sale_products': content,
                    'promotion_limit_dimension': 1
                }),
                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log(res);
                    flashDealActivitySuccess({
                        res:res,
                        startTime:startTime,
                        endTime:endTime,
                        tail:tail,
                        date:date,
                        time:time,
                        frequency:frequency,
                        mode:mode,

                    });//请求成功后要执行的

                },
                onerror: function(res){
                    console.log("请求失败");
                }
            });
        }

    }

    //报闪购成功后要执行的内容
    function flashDealActivitySuccess(options){
        let{
            res=null,
            startTime=null,
            endTime=null,
            tail=null,
            date=null,
            time=null,
            frequency=null,
            mode=null,

        }=options
        if(res.message=="success" || res.message=="promotion invalid time period"){
            let status;
            if(res.message=="success"){
                status=" 报名成功"
            }else if(res.message=="promotion invalid time period"){
                status=" 时段冲突，跳过"
            }
            CAT_UI.Message.info({
                content: startTime+"-"+endTime+" "+tail+status,
                closable: true,
                duration: 5000,
            });
            if(time!=1){
                flashDealActivity({
                    tail:tail,
                    date:date+3600*frequency,
                    time:time-1,
                    frequency:frequency,
                    content:content,
                    mode:mode,
                })
            }else if(time==1){
                alert("活动报名成功");
            }
        }else if(res.message=="The promotion name already exists"){
            alert("活动名已经存在");

        }else{
            alert("报名失败！！！！！！");
        }
    }

    //删除指定天数指定代号的闪购
    function deactivateFlashDeal(options){
        let{
            promotion_id=null,
            endFlag=null,
            mode=null,
        }=options
        if(mode==1){//本土店
            $.ajax({
                url: 'https://seller-th.tiktok.com/api/v1/promotion/destroy',
                crossDomain: true,
                method: 'post',
                headers: {
                    'authority': 'seller-th.tiktok.com',
                    'accept': '*/*',
                    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                    'x-secsdk-csrf-token': '000100000001637ed3aece474d09aa06a2724fc9f3d494bc4478f1919599cd4b7c62d0d916d51799e179dc111707',
                    'x-tt-oec-region': 'TH'
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    'promotion_id':promotion_id
                })
            }).done(function(response) {
                console.log(response);
                if(endFlag==1){
                    alert("删除完成");
                }
            });
        }else if(mode==2){//跨境店
            GM_xmlhttpRequest({
                method: "POST",
                url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/destroy?oec_seller_id=7495143478410054258',
                headers: {
                    "content-type":'application/json',
                },
                data: JSON.stringify({
                    'promotion_id':promotion_id
                }),
                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log(res);
                    if(endFlag==1){
                        alert("删除完成");
                    }
                },
                onerror: function(res){
                    console.log("请求失败");
                }
            });
        }

    }

    //获取闪购列表
    function getFlashDealList(options){
        let{
            date=null,
            tail=null,
            mode=null,
        }=options;
        let deactivateFlashDealArray=[];//需要删除闪购id数组
        if(mode==1){//本土店
            $.ajax({
                url: 'https://seller-th.tiktok.com/api/v1/promotion/flash_sale/list?page_index=1&page_size=100',
                crossDomain: true,
                headers: {
                    'authority': 'seller-th.tiktok.com',
                    'accept': '*/*',
                    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
                    'x-tt-oec-region': 'TH'
                }
            }).success(function(res) {
                //console.log(res);
                getFlashDealListAfter({
                    res:res,
                    mode:mode,
                    tail:tail,
                    date:date,
                    deactivateFlashDealArray :deactivateFlashDealArray ,
                })
            });
        }else if(mode==2){//跨境店
            GM_xmlhttpRequest({
                method: "GET",
                url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/flash_sale/list?oec_seller_id=7495143478410054258&page_index=1&page_size=100',
                headers: {

                },
                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log("内容为",res);
                    getFlashDealListAfter({
                        res:res,
                        mode:mode,
                        tail:tail,
                        date:date,
                        deactivateFlashDealArray :deactivateFlashDealArray ,
                    })
                },
                onerror: function(res){
                    console.log("请求失败");
                }
            });

        }

    }

    //获得闪购列表后
    function getFlashDealListAfter(options){
        let{
            res=null,
            mode=null,
            tail=null,
            date=null,
            deactivateFlashDealArray=null,
        }=options
        res.data.flash_sales.forEach(function(e,index,self){
            //console.log(e.promotion_id);//活动id
            let id=e.promotion_id;
            //console.log(e.promotion_name);//活动名字
            let name=e.promotion_name;
            //console.log(name.slice(0,4));//日期
            //console.log(name.slice(17));//代号
            //console.log(tail);
            if(date==name.slice(0,4) && tail==name.slice(17)){
                //console.log("11111111111");
                deactivateFlashDealArray.push(id);
            }
            if(index==self.length-1){//最后一次遍历
                deactivateFlashDealArray.forEach(function(e1,index1,self1){
                    if(index1!=self1.length-1){
                        deactivateFlashDeal({
                            promotion_id:e1,
                            mode:mode,
                        });
                    }else if(index1==self1.length-1){//最后一次遍历
                        deactivateFlashDeal({
                            promotion_id:e1,
                            endFlag:1,
                            mode:mode,
                        });
                    }
                });
            }


        })
    }

    //折扣报名
    function discountActivity(options){
        let{
            tail=null,
            date=null,
            content=null,
            mode=null,//模式，1为本土，2为跨境
        }=options

        if(content[0].flash_sale_price!=undefined){//如果是闪购内容
            content=flashExToDis(content);//闪购内容转化为折扣内容
        }

        console.log("日期",date);
        let today=timestampToTime((date-3600)*1000).slice(0,-6);
        console.log("today",today);
        let starDate=date.toString();
        let endDate=(date+31536000).toString();//一年
        console.log(today+" "+tail);

        //console.log(endTime);
        if(mode==1){//泰国本土
            //还没内容
        }else if(mode==2){//跨境
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/fixed_price/create?oec_seller_id=7495143478410054258",
                headers: {
                    "content-type": 'application/json',
                },
                data: JSON.stringify({
                    'period': {
                        'start_time': starDate,
                        'end_time': endDate
                    },
                    'promotion_name': today+" "+tail,
                    'promotion_limit_dimension': 1,
                    'products_fixed_price': content,
                    'check_overlap': true
                }),
                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log("成功后返回",res);
                    alert("活动报名成功");

                },
                onerror: function(res){
                    console.log("请求失败");
                    alert("活动报名失败");
                }
            });
        }
    }

    //将闪购内容转化为折扣内容
    function flashExToDis(obj){
        obj.forEach((e)=>{//同步每个商品的数据
            e.price_limit=e.flash_sale_price;//旧属性的值赋值给新属性
            delete e.flash_sale_price;//删除旧属性
            e.skus.forEach((e1)=>{//删除每个sku中的多余属性
                e1.smart_discount_type_to_value={"1":e1.fixed_price_value,"2":"30"};
                delete e1.fixed_price;
                delete e1.discount_percentage;
                delete e1.flash_sale_price;
            })
        })
        console.log(obj)
        return obj;
    }

    //删除折扣
    function delDiscount(options){
        let{
            date=null,
            tail=null,
            mode=null,
        }=options;

        if(mode==1){//本土店

        }else if(mode==2){//跨境店
            getDiscountList({//获取折扣列表
                date:date,
                tail:tail,
                mode:mode
            })
        }
    }

    //获取折扣列表
    function getDiscountList(options){
        let{
            date=null,
            tail=null,
            mode=null,//模式，1为本土，2为跨境
        }=options

        if(mode==1){//泰国本土

        }else if(mode==2){//跨境
            GM_xmlhttpRequest({
                method: "POST",
                url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/list?oec_seller_id=7495143478410054258',
                headers: {
                    "Content-Type": 'application/json',
                },
                data: JSON.stringify({
                    'index': 0,
                    'size': 100,
                    'status': 1,
                    'promotion_type': 1
                }),
                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log("内容为",res);
                    getDiscountListAfter({
                        res:res,
                        mode:mode,
                        tail:tail,
                        date:date,
                    })
                },
                onerror: function(res){
                    console.log("请求失败");
                }
            });

        }
    }

    //获取折扣列表后的处理
    function getDiscountListAfter(options){
        let{
            res=null,
            mode=null,
            tail=null,
            date=null,
        }=options
        let delDiscountIdArray=[];//需要删除的折扣id数组
        res.data.promotions.forEach(function(e,index,self){
            //console.log(e.id);//活动id
            let id=e.id;
            //console.log(e.name);//活动名字
            let name=e.name;
            //console.log(name.slice(0,6));//日期
            //console.log(name.slice(7));//尾缀
            //console.log(tail);
            if(date==name.slice(0,6) && tail==name.slice(7)){
                //console.log("11111111111");
                delDiscountIdArray.push(id);
            }
            if(index==self.length-1){//最后一次遍历
                delDiscountIdArray.forEach(function(e1,index1,self1){
                    if(index1!=self1.length-1){
                        delDiscountBranch({
                            promotion_id:e1,
                            mode:mode,
                        });
                    }else if(index1==self1.length-1){//最后一次遍历
                        delDiscountBranch({
                            promotion_id:e1,
                            endFlag:1,
                            mode:mode,
                        });
                    }
                });
            }


        })
    }

    //删除折扣-分支
    function delDiscountBranch(options){
        let{
            promotion_id=null,
            endFlag=null,
            mode=null,
        }=options
        if(mode==1){//本土店

        }else if(mode==2){//跨境店
            GM_xmlhttpRequest({
                method: "POST",
                url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/destroy?oec_seller_id=7495143478410054258',
                headers: {
                    "content-type":'application/json',
                },
                data: JSON.stringify({
                    'promotion_id':promotion_id
                }),
                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log(res);
                    if(endFlag==1){
                        alert("删除完成");
                    }
                },
                onerror: function(res){
                    console.log("请求失败");
                }
            });
        }
    }

    /* 时间戳转换为时间 */
    function timestampToTime(timestamp) {
        timestamp = timestamp ? timestamp : null;
        let date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        let Y = date.getFullYear().toString().slice(2);//两位制年份
        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
        let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        return Y + M + D + h + m;
    }

    //获取年月日
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
        if(array2!=undefined&&sheetName2!=undefined){
            sheet1= XLSX.utils.aoa_to_sheet(array2);
        }

        let sheet2;
        if(array3!=undefined&&sheetName3!=undefined){
            sheet2= XLSX.utils.aoa_to_sheet(array3);
        }

        /* 生成工作簿并添加工作表 */
        const book = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(book,sheet0,sheetName1 )
        if(array2!=undefined&&sheetName2!=undefined){
            XLSX.utils.book_append_sheet(book,sheet1,sheetName2 )
        }
        if(array3!=undefined&&sheetName3!=undefined){
            XLSX.utils.book_append_sheet(book,sheet2,sheetName3 )
        }

        /* 保存到文件 */
        XLSX.writeFile(book,bookName+".xlsx")
    }

    //监听放大缩小按钮
    (()=>{
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
                    console.log("天天",data.autoPanelStatus)
                    if(data.autoPanelStatus){//如果data.autoPanelStatus为1
                        //console.log("验证");
                        let attribute=element1.querySelector("svg > path").getAttribute("d");
                        if(attribute=="M5 24h38"){
                            //console.log("点击时是放大的，点击后是缩小的");
                            localStorage.setItem("panelStatus","true")//最小化
                        }else if(attribute=="M5 24h38M24 5v38"){
                            //console.log("点击时是缩小的，点击后是放大的");
                            localStorage.setItem("panelStatus","false")//放大化
                        }
                    }
                };

            }
        },10);
    })()

})();
