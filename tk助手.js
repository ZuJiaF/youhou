// ==UserScript==
// @name         tk助手
// @namespace    http://tampermonkey.net/
// @version      1.2.7
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
    /**********************************全局变量定义区-START**********************************/
    let FlashDealProtect_EndFlag=0;//tk闪购商品id结束标志位
    let getInactiveEndFlag=0;//tk不活跃商品id结束标志位
    let getDeletedEndFlag=0;//tk被删除商品id结束标志位
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
    let syncDelFlag1;//闪购同步为折扣前的删除flag
    let syncDelFlag2;
    /**********************************全局变量定义区-END**********************************/

    /**********************************函数定义区-START**********************************/
    //数据初始化
    function init(){
        homeData.autoSyncPromotionStarus = localStorage.getItem("autoSyncPromotionStarus");//自动同步折扣
        if(homeData.autoSyncPromotionStarus!=null){
            homeData.autoSyncPromotionStarus=JSON.parse(homeData.autoSyncPromotionStarus);
        }else if(homeData.autoSyncPromotionStarus==null){
            homeData.autoSyncPromotionStarus=0;
            localStorage.setItem("autoSyncPromotionStarus",JSON.stringify(homeData.autoSyncPromotionStarus));
        }

        homeData.autoPanelStatus = localStorage.getItem("autoPanelStatus");//自动记录面板缩放状态
        if(homeData.autoPanelStatus!=null){
            homeData.autoPanelStatus=JSON.parse(homeData.autoPanelStatus);
        }else if(homeData.autoPanelStatus==null){
            homeData.autoPanelStatus=0;
            localStorage.setItem("autoPanelStatus",JSON.stringify(data.autoPanelStatus));
        }

        if(homeData.autoPanelStatus){
            homeData.panelStatus=localStorage.getItem("panelStatus");//面板缩放默认状态
            //console.log(`homeData.panelStatus的值为${homeData.panelStatus}`);
            if(homeData.panelStatus!=null){//如果有值
                homeData.panelStatus=JSON.parse(localStorage.getItem("panelStatus"));//将字符串转为布尔值
            }else if(homeData.panelStatus==null){//如果没值
                homeData.panelStatus=true;
                localStorage.setItem("panelStatus",JSON.stringify(homeData.panelStatus));
            }
        }



    }

    //综合面板
    const homeData = {
        input1: "a",//闪购报名尾缀
        input2: getDate(),//闪购报名日期
        input3: "1",
        input4:"700789,600017",
        input6:"a",//折扣报名尾缀
        input7: getDate(),//折扣报名日期
        panelStatus:true,//面板缩放默认状态,默认为true，缩小
        autoPanelStatus:0,//自动记录面板缩放状态
        autoSyncPromotionStarus:null,//自动同步折扣
        discountId:null,
        startDate:"240301",//起始日期
        endDate:"240331",//结束日期
    };
    function Home() {
        const [input1, setInput1] = CAT_UI.useState(homeData.discountId)
        const [input2, setInput2] = CAT_UI.useState(homeData.startDate)
        const [input3, setInput3] = CAT_UI.useState(homeData.endDate)

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
                    CAT_UI.Button("导出部分商品信息", {
                        type: "primary",
                        onClick() {
                            console.log("[]")
                            getProductsInfo().then((res)=>{//tk获取商品信息中的可用库存
                                console.log("ttt")
                                let array=[["skuID","可用库存"]];//数组
                                CAT_UI.Message.info({
                                    content: "正在导出部分商品信息，请稍等",
                                    closable: true,
                                    duration: 5000,
                                });
                                console.log("123",res)
                                res.data.products.forEach((e,index,self)=>{
                                    e.skus.forEach((e1,index1,self1)=>{
                                        array.push([e1.id,e1.quantities[0].open_quantity]);//可用库存
                                    })
                                    if(index==self.length-1){
                                        console.log("look",array)
                                        ex("商品可用库存表",array)
                                    }
                                })

                            })

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
                                ex("活动辅助表",array2,"全年闪购的商品id",array3,"不活跃的商品id",array4,"被删除商品id")
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
                    CAT_UI.Button("导出折扣表", {
                        type: "primary",
                        onClick() {
                            //alert(1);
                            getDiscount({
                                id:input1,
                                mode:mode
                            });//获得折扣表内容
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
                    CAT_UI.Text("折扣活动id："),
                    CAT_UI.Input({
                        value: input1,
                        onChange(val) {
                            setInput1(val);
                            homeData.discountId = val;
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
                            flexDirection:"column",
                        },
                    },
                    CAT_UI.Text("----------根据订单创建日期导出结算数据(未完成)----------"),
                    CAT_UI.createElement(
                        "div",
                        {
                            style: {
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",

                            },
                        },
                        CAT_UI.createElement(
                            "div",
                            {
                                style: {
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexDirection:"column",
                                },
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
                                CAT_UI.Text("起始日期："),
                                CAT_UI.Input({
                                    value: input2,
                                    onChange(val) {
                                        setInput2(val);
                                        homeData.startDate = val;
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
                                        marginTop:"5px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    },
                                },
                                CAT_UI.Text("结束日期："),
                                CAT_UI.Input({
                                    value: input3,
                                    onChange(val) {
                                        setInput3(val);
                                        homeData.endDate = val;
                                    },
                                    style: {
                                        flex: 1,
                                    },
                                }),

                            ),

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
                            CAT_UI.Button("导出", {
                                type: "primary",
                                onClick() {
                                    let startTime=stringToTimestamp(input2)+3600000//时间字符串转化为时间戳，再转化为泰国时间戳
                                    let endTime=stringToTimestamp(input3)+3600000-1//时间字符串转化为时间戳，再转化为泰国时间戳
                                    //console.log(startTime)
                                    //console.log(endTime)
                                    getJiesuanData(startTime,endTime)
                                },
                                style: {

                                    flex: 1,
                                }
                            }),


                        ),

                    ),



                ),

            ],
            {
                direction: "vertical",
            }
        );
    }

    //闪购(页面2) #闪购报名 #闪购报名页面 #闪购页面
    function UI_flashDeal() {
        const [input1, setInput1] = CAT_UI.useState(homeData.input1);
        const [input2, setInput2] = CAT_UI.useState(homeData.input2);
        const [input3, setInput3] = CAT_UI.useState(homeData.input3);
        const [input4, setInput4] = CAT_UI.useState("null");
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
                            homeData.input1 = val;
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
                            homeData.input2 = val;
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
                            homeData.input3 = val;
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
                            if(input4=="null" || input4==""){
                                alert("内容为空，请检查")
                            }else{
                                let content=JSON.parse(input4);
                                let yearPart=input2.slice(0,2);
                                let month=input2.slice(2,4);
                                let day=input2.slice(4);
                                let newDate="20"+yearPart+"-"+month+"-"+day+" 00:00:00";
                                //console.log("20"+yearPart+"-"+month+"-"+day+" 00:00:00");
                                console.log("第一个newDate:",newDate);
                                newDate=Date.parse(newDate)/1000;

                                console.log("第二个newDate:",newDate);
                                let time=24/input3;
                                let frequency=24/time;
                                let r=confirm("点击确定，任务开始执行");
                                if (r==true){
                                    //console.log("content",content);
                                    if(homeData.autoSyncPromotionStarus==1){//如果开启了折扣同步
                                        CAT_UI.Message.info({
                                            content: "即将删除旧折扣",
                                            closable: true,
                                            duration: 5000,
                                        });
                                        //console.log("Ces")
                                        syncDelFlag1=1;
                                        delDiscount({//根据活动名称中的日期和尾缀删除折扣
                                            mode:mode,
                                            syncDelFlag:syncDelFlag1,
                                        })
                                        let a=setInterval(()=>{
                                            //console.log("重复中");
                                            if(syncDelFlag1==0){//如果删除已经完成
                                                clearInterval(a);
                                                setTimeout(()=>{
                                                    let a=getDate()
                                                    let yearPart1=a.slice(0,2);
                                                    let month1=a.slice(2,4);
                                                    let day1=a.slice(4);
                                                    let newDate1="20"+yearPart1+"-"+month1+"-"+day1+" 00:00:00";
                                                    newDate1=Date.parse(newDate1)/1000;
                                                    discountActivity({//折扣报名
                                                        tail:input1+"x",
                                                        date:newDate1,
                                                        content:content,
                                                        mode:mode,
                                                        syncDelFlag:1,
                                                    });
                                                },5000);

                                            }
                                        },100)
                                        let b=setInterval(()=>{
                                            //console.log("重复中1");
                                            if(syncDelFlag2==0){//如果折扣已经完成
                                                clearInterval(b);
                                                setTimeout(()=>{
                                                    console.log("123",content)
                                                    CAT_UI.Message.info({
                                                        content: "即将开始闪购报名",
                                                        closable: true,
                                                        duration: 5000,
                                                    });
                                                    flashDealActivity({//报闪购
                                                        tail:input1,
                                                        date:newDate,
                                                        time:time,
                                                        frequency:frequency,
                                                        content:content,
                                                        mode:mode,
                                                    });
                                                },5000);

                                            }
                                        },100)
                                        }else if(homeData.autoSyncPromotionStarus==0){//如果没开启自动同步折扣
                                            CAT_UI.Message.info({
                                                content: "即将开始闪购报名",
                                                closable: true,
                                                duration: 5000,
                                            });
                                            flashDealActivity({//直接报闪购
                                                tail:input1,
                                                date:newDate,
                                                time:time,
                                                frequency:frequency,
                                                content:content,
                                                mode:mode,
                                            });
                                        }


                                }else{
                                }
                            }


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

    //折扣(页面3) #折扣报名
    function UI_discount(){
        const [input1, setInput1] = CAT_UI.useState(homeData.input6);
        const [input2, setInput2] = CAT_UI.useState(homeData.input7);
        const [input3, setInput3] = CAT_UI.useState("null");
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
                            homeData.input6 = val;
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
                            homeData.input7 = val;
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

                            if(input3=="null" || input3==""){

                            }else{
                                let content=JSON.parse(input3);
                                let yearPart=input2.slice(0,2);
                                let month=input2.slice(2,4);
                                let day=input2.slice(4);
                                let newDate="20"+yearPart+"-"+month+"-"+day+" 00:00:00";
                                //console.log("20"+yearPart+"-"+month+"-"+day+" 00:00:00");
                                newDate=Date.parse(newDate)/1000;//获取时间戳
                                //console.log(newDate);
                                alert("点击确定，任务开始执行");
                                //console.log(content);
                                discountActivity({
                                    tail:input1,
                                    date:newDate,
                                    content:content,
                                    mode:mode,
                                });
                            }


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
        const [input1, setInput1] = CAT_UI.useState(homeData.input4);
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
                            homeData.input1 = val;
                            array5=val.split(",");
                            //console.log(array5);
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
    function createPanel(){
        CAT_UI.createPanel({
            minButton: true,//minButton控制是否显示最小化按钮，默认为true
            min: homeData.panelStatus,// min代表面板初始状态为最小化,默认为true（仅显示header）
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
                    const [input1, setInput1] = CAT_UI.useState(homeData.autoSyncPromotionStarus);
                    const [input2, setInput2] = CAT_UI.useState(homeData.autoPanelStatus);
                    //console.log(input1);
                    //console.log("121123233");

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
                                        CAT_UI.Text("闪购报名同步到折扣报名："),
                                        CAT_UI.Checkbox("",{
                                            //className:"123",
                                            style:{
                                                //fontSize: "50px",
                                                //backgroundColor:"black",
                                            },
                                            checked:input1,
                                            onChange(checked){
                                                //选中时
                                                if(checked){
                                                    setInput1(1);//重新设置input1
                                                    localStorage.setItem("autoSyncPromotionStarus","1");
                                                    homeData.autoSyncPromotionStarus=1;

                                                }else{
                                                    setInput1(0);
                                                    localStorage.setItem("autoSyncPromotionStarus","0");
                                                    homeData.autoSyncPromotionStarus=0;
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
                                                    homeData.autoPanelStatus=1;

                                                }else{
                                                    setInput2(0);
                                                    localStorage.setItem("autoPanelStatus","0");
                                                    homeData.autoPanelStatus=0;
                                                }

                                            },
                                        }),

                                    ),


                                    CAT_UI.Divider("首页设置"),
                                    CAT_UI.createElement(
                                        "div",
                                        {
                                            style: {
                                                display: "flex",
                                                //justifyContent: "space-between",//平均分布
                                                alignItems: "center",

                                            },
                                        },
                                        CAT_UI.Text("折扣表价格减1："),
                                        CAT_UI.Checkbox("",{
                                            //className:"123",
                                            style:{
                                                //fontSize: "50px",
                                                //backgroundColor:"black",
                                            },
                                            checked:input1,
                                            onChange(checked){
                                                //选中时
                                                if(checked){
                                                    setInput1(1);//重新设置input1
                                                    localStorage.setItem("autoSyncPromotionStarus","1");
                                                    homeData.autoSyncPromotionStarus=1;

                                                }else{
                                                    setInput1(0);
                                                    localStorage.setItem("autoSyncPromotionStarus","0");
                                                    homeData.autoSyncPromotionStarus=0;
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
                                        CAT_UI.Text("折扣表库存为1或0："),
                                        CAT_UI.Checkbox("",{
                                            //className:"123",
                                            style:{
                                                //fontSize: "50px",
                                                //backgroundColor:"black",
                                            },
                                            checked:input1,
                                            onChange(checked){
                                                //选中时
                                                if(checked){
                                                    setInput1(1);//重新设置input1
                                                    localStorage.setItem("autoSyncPromotionStarus","1");
                                                    homeData.autoSyncPromotionStarus=1;

                                                }else{
                                                    setInput1(0);
                                                    localStorage.setItem("autoSyncPromotionStarus","0");
                                                    homeData.autoSyncPromotionStarus=0;
                                                }

                                            },
                                        }),
                                    ),

                                ]),
                                {
                                    title: "设置",
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
                                        let checkBoxMask=document.querySelector("cat-ui-plan").shadowRoot.querySelectorAll(".arco-checkbox-mask");//获取元素
                                        checkBoxMask.forEach((e)=>{
                                            e.style.width = '24px';
                                            e.style.height = '24px';
                                        })
                                    },
                                    onOk: () => {
                                        setVisible(false);
                                    },
                                    onCancel: () => {//取消后
                                        homeData.autoSyncPromotionStarus = temp.data1;//复原
                                        homeData.autoPanelStatus=temp.data2;//复原
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
    }


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

    //获取产品信息 #getProductsInfof #getProductsInfo_f #获取商品信息 #商品信息函数 #产品信息函数
    function getProductsInfo(){
        return new Promise((resolve)=>{
            if(mode==1){//本土
                console.log("abb")
                // 使用 $ajax 或其他异步请求方法
                $.ajax({
                    url: "https://seller-th.tiktok.com/api/v1/product/local/products/list?tab_id=1&page_number=1&page_size=1000&sku_number=100",
                    type: 'GET',
                    //async:false,//同步操作
                    success: function(res){
                        console.log(res);
                        resolve(res);
                    }
                });
                //console.log("开始加载")
            }else if(mode==2){//跨境
                GM_xmlhttpRequest({
                    method: "GET",
                    url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/product/local/products/list?oec_seller_id=7495143478410054258&tab_id=1&page_number=1&page_size=1000&sku_number=100',
                    headers: {
                        'authority': 'api16-normal-useast1a.tiktokglobalshop.com',
                        'accept': '*/*',
                        'accept-language': 'zh-CN,zh;q=0.9',
                        'x-tt-oec-region': 'TH'
                    },
                    onload: function(response){
                        let res = JSON.parse(response.responseText);
                        //console.log("1",res);
                        resolve(res);
                    },
                    onerror: function(res){
                        console.log("请求失败");

                    }
                });
            }
        })


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

    //获得折扣内容 #getDiscount_f #getDiscountf
    function getDiscount(options){
        let{
            id=null,
            mode=null
        }=options
        new Promise((resolve)=>{
            if(mode==1){//本土店
                $.ajax({
                    url: 'https://seller-th.tiktok.com/api/v1/promotion/list_products_by_cursor',
                    crossDomain: true,
                    method: 'post',
                    headers: {
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'promotion_id': id,
                        'cursor': 0,
                        'limit': 0
                    }),
                }).success(function(res) {
                    //console.log("获取折扣内容成功",res);
                    resolve(res);

                });
            }else if(mode==2){//跨境店
                GM_xmlhttpRequest({
                    method: "POST",
                    url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/promotion/list_products_by_cursor?oec_seller_id=7495143478410054258',
                    headers: {
                        "Content-Type": 'application/json',
                    },
                    data: JSON.stringify({
                        'promotion_id': id,
                        'cursor': 0,
                        'limit': 0
                    }),
                    onload: function(response){
                        let res=JSON.parse(response.responseText);
                        //console.log("获取折扣内容成功",res);
                        resolve(res);



                    },
                    onerror: function(res){
                        console.log("请求失败");
                    }
                });
            }
        }).then((res)=>{
            let array=[["产品id","skuId","price","stock"]];//数组
            getProductsInfo().then((res1)=>{
                console.log("ttt")
                let array1=[["skuID","可用库存"]];//数组
                CAT_UI.Message.info({
                    content: "正在导出部分商品信息，请稍等",
                    closable: true,
                    duration: 5000,
                });
                console.log("123",res1)
                res1.data.products.forEach((e,index,self)=>{
                    e.skus.forEach((e1,index1,self1)=>{
                        array1.push([e1.id,e1.quantities[0].open_quantity]);//可用库存
                    })
                    if(index==self.length-1){
                        console.log("look",array1)
                    }
                })
                res.data.item_products.forEach((e,index,self)=>{//遍历每个商品
                    e.skus.forEach((e1,index1,self1)=>{//遍历每个sku
                        array1.forEach((e2,index2,self2)=>{
                            //console.log("胡",e2[0])
                            if(e2[0]==e1.sku_id){
                                array.push([e1.product_id,e1.sku_id,e1.fixed_price_value,e2[1]])
                            }
                        })
                        console.log(e1);
                        // console.log("库存为：",e1.inventory_quantity)
                        // console.log("数组长度为：",self1.length);//数组长度
                        // console.log(index1);
                        // console.log("产品id为：",e1.product_id);
                        // console.log("skuId为：",e1.sku_id);
                        // console.log("价格为：",e1.fixed_price_value);
                        // console.log("数组",array);

                        if(index==self.length-1 && index1==self1.length-1){//最后一条
                            ex("产品折扣表",array)//导出折扣表
                        }
                    })
                })
            })

        })
    }

    //报闪购 #报闪购函数 #报闪购的函数 #flashDealActivityf #flashDealActivity_f #闪购函数 #闪购报名函数
    function flashDealActivity(options){
        let{
            tail=null,
            date=null,
            time=null,
            frequency=null,
            content=null,
            mode=null,//模式，1为本土，2为跨境
        }=options
        console.log("报闪购的内容：",content)
        //console.log(date);
        //console.log(date*frequency);

        let startTime=timestampToTime(date*1000).slice(2);
        let endTime=timestampToTime((date+3600*frequency)*1000).slice(7);
        if(time==1){
            endTime="24:00"
        }
        let starDate=date.toString();
        let endDate=(date+3600*frequency).toString();
        //console.log(startTime+"-"+endTime+" "+tail);

        //console.log(endTime);
        new Promise((resolve)=>{
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
                    resolve(res);


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
                        console.log("闪购报名请求成功返回内容：",res);
                        resolve(res);
                    },
                    onerror: function(res){
                        console.log("请求失败");
                    }
                });
            }
        }).then((res)=>{
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
                    alert("闪购报名成功");
                }
            }else if(res.message=="The promotion name already exists"){
                alert("闪购名已经存在");

            }else{
                alert("闪购报名失败！！！！！！");
            }
        })


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
                    //console.log("闪购内容为",res);
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

    //折扣报名 #discountActivityf #discountActivity函数 #折扣报名f #报折扣 #折扣函数
    function discountActivity(options){
        let{
            tail=null,
            date=null,
            content=null,
            mode=null,//模式，1为本土，2为跨境
            syncDelFlag=null,
        }=options
        let content1=deepCopy(content);//深拷贝数组
        if(syncDelFlag){
            syncDelFlag2=1;
        }

        if(content1[0].flash_sale_price!=undefined){//如果是闪购内容
            content1=flashExToDis(content1);//闪购内容转化为折扣内容
        }
        console.log("折扣报名内容：",content1)

        //console.log("日期",date);
        let today=timestampToTime(date*1000).slice(0,-6);
        //console.log("today",today);
        //console.log(today+" "+tail);
        let starDate=date.toString();
        let endDate=(date+31536000).toString();//一年

        if(mode==1){//泰国本土

            $.ajax({
                url: 'https://seller-th.tiktok.com/api/v1/promotion/fixed_price/create',
                crossDomain: true,
                method: 'post',
                headers: {
                },
                contentType: 'application/json',
                data: JSON.stringify({
                    'period': {
                        'start_time': starDate,
                        'end_time': endDate
                    },
                    'promotion_name': today+" "+tail,
                    'promotion_limit_dimension': 1,
                    'products_fixed_price': content1,
                    'check_overlap': true
                }),
            }).success(function(res) {
                console.log("折扣报名成功后返回",res);
                if(syncDelFlag!=1){
                    alert("折扣报名成功");
                }else{
                    CAT_UI.Message.info({
                        content: "新折扣创建完成，即将进行闪购报名",
                        closable: true,
                        duration: 5000,
                    });
                    syncDelFlag2=0;
                }

            });
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
                    'products_fixed_price': content1,
                    'check_overlap': true
                }),
                onload: function(response){
                    let res=JSON.parse(response.responseText);
                    console.log("折扣报名成功后返回",res);
                    if(syncDelFlag!=1){
                        alert("折扣报名成功");
                    }else{
                        CAT_UI.Message.info({
                            content: "新折扣创建完成，即将进行闪购报名",
                            closable: true,
                            duration: 5000,
                        });
                        syncDelFlag2=0;
                    }


                },
                onerror: function(res){
                    console.log("请求失败");
                    alert("折扣报名失败");
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

    //删除折扣 #delDiscountf #delDiscount函数 #删除折扣函数
    function delDiscount(options){
        let{
            date=null,
            tail=null,
            mode=null,
            syncDelFlag=null,
        }=options;

        let res;

        getDiscountList({//获取折扣列表数据
            date:date,
            tail:tail,
            mode:mode,
            syncDelFlag:syncDelFlag,
        }).then((data)=>{
            //console.log("ces1")
            res=data;
            //console.log("ces2")
            let delDiscountIdArray=getDelDiscountIdArray({//获取要删除的折扣id数组
                res:res,
                mode:mode,
                tail:tail,
                date:date,
                syncDelFlag:syncDelFlag,
            })
            delDiscountIdArray.forEach(function(e,index,self){
                if(index!=self.length-1){
                    postDelDiscount({
                        promotion_id:e,
                        mode:mode,
                        syncDelFlag:syncDelFlag,
                    });
                }else if(index==self.length-1){//最后一次遍历
                    postDelDiscount({
                        promotion_id:e,
                        endFlag:1,
                        mode:mode,
                        syncDelFlag:syncDelFlag,
                    });
                }
            });
        })





    }

    //获取折扣列表 #获取折扣f #获取折扣列表f #获得折扣列表 #getDiscountList_f #getDiscountListf
    function getDiscountList(options){
        let{
            mode=null,//模式，1为本土，2为跨境
        }=options
        //console.log("天天")
        return new Promise((resolve)=>{
            //console.log("天天2")
            if(mode==1){//泰国本土
                $.ajax({
                    url: 'https://seller-th.tiktok.com/api/v1/promotion/discount/list',
                    crossDomain: true,
                    method: 'post',
                    headers: {
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'index': 0,
                        'size': 100,
                        'status': 1,
                        'promotion_type': 1
                    }),
                }).success(function(res) {
                    //console.log("折扣列表内容为",res);
                    resolve(res);
                });
            }else if(mode==2){//跨境
                //console.log("天天1")
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
                        'promotion_type': 4
                    }),
                    onload: function(response){
                        let res=JSON.parse(response.responseText);
                        //console.log("折扣列表内容为",res);
                        resolve(res);
                    },
                    onerror: function(res){
                        console.log("请求失败");
                    }
                });
            }
        })
    }

    //获取要删除的折扣id数组
    function getDelDiscountIdArray(options){
        let{
            res=null,
            mode=null,
            tail=null,
            date=null,
            syncDelFlag=null,
        }=options
        let delDiscountIdArray=[];//需要删除的折扣id数组
        let dataHead;//路径头
        if(mode==1){//本土店
            dataHead=res.data.seller_discounts;
        }else if(mode==2){//跨境店
            dataHead=res.data.promotions;
        }
        console.log("ll")
        dataHead.forEach(function(e,index,self){
            let id=e.id;//折扣活动id
            let name=e.name;//折扣活动名字
            let status=e.status;//折扣活动状态
            //console.log(name.slice(0,6));//日期
            //console.log(name.slice(7));//尾缀
            //console.log(tail);
            if(syncDelFlag==1 && (status==2 || status==3)){//如果是在同步折扣，并且活动为进行中或未开始
                delDiscountIdArray.push(id);
            }else if(date==name.slice(0,6) && tail==name.slice(7)){//如果是正常删除
                delDiscountIdArray.push(id);
            }
            if(index==self.length-1){//最后一次遍历
                if(syncDelFlag==1 && delDiscountIdArray.length==0){//如果没有要删除的折扣活动，则任务提前完成
                    syncDelFlag1=0;//复位
                    console.log("提前完成删除");
                }
            }
        })
        return delDiscountIdArray;//返回要删除的折扣活动id列表
    }

    //发起删除折扣的请求
    function postDelDiscount(options){
        let{
            promotion_id=null,
            endFlag=null,
            mode=null,
            syncDelFlag=syncDelFlag,
        }=options
        console.log("要删除的折扣id：",promotion_id)
        new Promise((resolve)=>{
            if(mode==1){//本土店
                $.ajax({
                    url: 'https://seller-th.tiktok.com/api/v1/promotion/destroy',
                    crossDomain: true,
                    method: 'post',
                    headers: {
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'promotion_id':promotion_id
                    }),
                }).success(function(res) {
                    console.log(res);
                    resolve();
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
                        resolve();
                    },
                    onerror: function(res){
                        console.log("请求失败");
                    }
                });
            }
        }).then(()=>{
            console.log("完成");
            if(endFlag==1 && syncDelFlag!=1){
                alert("删除完成");
            }else if(endFlag==1 && syncDelFlag==1){
                console.log("正常删除后复位");
                CAT_UI.Message.info({
                    content: "旧折扣已删除，即将同步创建新折扣",
                    closable: true,
                    duration: 5000,
                });
                syncDelFlag1=0;//复位
            }
        })
    }

    //时间字符串转化为时间戳，输入格式为"240407或240407120000"
    function stringToTimestamp(dateString) {
        var year, month, day, hour, minute, second;
        // 如果时间字符串长度为 6，则精确到日期
        if (dateString.length === 6) {
            year = parseInt(dateString.substring(0, 2)) + 2000; // 假设年份是 2000 年之后
            month = parseInt(dateString.substring(2, 4)) - 1; // 月份是从 0 到 11 的，所以要减去 1
            day = parseInt(dateString.substring(4, 6));
            // 设置时分秒为 0
            hour = 0;
            minute = 0;
            second = 0;
        } else if (dateString.length === 12) { // 如果时间字符串长度为 12，则精确到秒
            year = parseInt(dateString.substring(0, 2)) + 2000; // 假设年份是 2000 年之后
            month = parseInt(dateString.substring(2, 4)) - 1; // 月份是从 0 到 11 的，所以要减去 1
            day = parseInt(dateString.substring(4, 6));
            hour = parseInt(dateString.substring(6, 8));
            minute = parseInt(dateString.substring(8, 10));
            second = parseInt(dateString.substring(10, 12));
        } else {
            // 如果时间字符串长度不是 6 或 12，则抛出错误
            throw "Invalid input string length. It should be either 6 or 12 characters long.";
        }

        // 使用年、月、日、时、分、秒的值创建 Date 对象
        var dateObject = new Date(year, month, day, hour, minute, second);

        // 获取时间戳（毫秒）
        var timestamp = dateObject.getTime();

        // 返回时间戳
        return timestamp;
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

    //获取年月日 #getDate_f
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

    //导出二维数组为表格 #exf #ex_f 'ex("活动辅助表",array2,"全年闪购的商品id",array3,"不活跃的商品id",array4,"被删除商品id")'
    function ex(bookName,...array){
        let forT;//将要循环的次数

        if(array.length%2==0){//偶数
            forT=array.length/2;
        }else if(array.length%2==1){//奇数，缺少最后一个工作表的表名
            forT=array.length==1 ? 1:(array.length+1)/2
            array.push("Sheet"+array.length);//补充缺失的表名
        }
        /* 生成工作簿并 */
        const book = XLSX.utils.book_new()//生成一个空白的工作簿
        let sheetDataArray=[];//存放工作表数据的数组
        /* 把转换JS数据数组的数组为工作表 */

        for(let i=0;i<forT;i++){
            console.log("cc")
            sheetDataArray[i]=XLSX.utils.aoa_to_sheet(array[i*2])
            try{
                XLSX.utils.book_append_sheet(book,sheetDataArray[i],array[i*2+1])
            }catch{
                XLSX.utils.book_append_sheet(book,sheetDataArray[i],"Sheetx"+i+1)
            }

        }

        /* 保存到文件 */
        XLSX.writeFile(book,bookName+".xlsx")
        console.log("cc")
    }

    //监听放大缩小按钮
    document.addEventListener('DOMContentLoaded', function() {
        // 在这里放置在DOM加载完成后执行的代码
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
                    //console.log("天天",data.autoPanelStatus)
                    if(homeData.autoPanelStatus){//如果data.autoPanelStatus为1
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

    });

    //深拷贝数组或对象
    function deepCopy(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        let copy = Array.isArray(obj) ? [] : {};

        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                copy[key] = deepCopy(obj[key]);
            }
        }

        return copy;
    }

    //获取订单结算数据表格
    function getJiesuanData(place_time_lower,place_time_upper){
        getJiesuanDataList(place_time_lower,place_time_upper).then((res)=>{
            // 声明一个数组，用于存储异步操作结果
            let arrays=[["订单id","重量(g)"]]

            res.data.order_records.forEach((e,index,self)=>{
                let array=getJiesuanDataDtail(e.statement_detail_id).then((res1)=>{

                    console.log("ggg",e.statement_detail_id)
                    //console.log("描述",res1.data.order_record.out_come.fee_list[2].sub_fees);
                    console.log("111",res1.data.order_record.trade_order_id);
                    console.log("日记第"+index+"个",res1.data.order_record.out_come.fee_list)

                    let inputString;
                    let weight;
                    if(res1.data.order_record.out_come.fee_list.length!=4){
                        console.log("没有")
                        weight="没有"
                    }else{
                        inputString=res1.data.order_record.out_come.fee_list[2].sub_fees[0].description
                        weight = parseInt(inputString.match(/\d+/)[0]);
                    }
                    let trade_order_id=res1.data.order_record.trade_order_id;
                    console.log("现在是第"+index)
                    console.log("222",weight);
                    return [trade_order_id, weight];
                })
                // 将每次异步操作返回的 Promise 对象存入数组
                arrays.push(array);
            })
            // 使用 Promise.all() 等待所有异步操作完成
            Promise.all(arrays).then((results) => {
                console.log("所有异步操作已完成");
                console.log("结果数组:", results);
                // 在这里执行你想要在所有异步操作完成后执行的代码
                ex("订单结算数据", results, "Sheet1");
            }).catch((error) => {
                console.error("发生错误：", error);
            });
        })

    }

    //获取订单结算数据列表
    function getJiesuanDataList(place_time_lower,place_time_upper){
        return new Promise((resolve)=>{
            GM_xmlhttpRequest({
                method: "GET",
                url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/pay/statement/order/list?oec_seller_id=7495143478410054258&size=500&page_type=10&place_time_lower='+place_time_lower+'&place_time_upper='+place_time_upper,
                headers: {

                },
                onload: function(response){
                    let res = JSON.parse(response.responseText);
                    console.log("1",res);
                    resolve(res);


                },
                onerror: function(res){
                    console.log("请求失败");

                }
            });
        })

    }

    //获取订单结束数据详情
    function getJiesuanDataDtail(statement_detail_id){
        return new Promise((resolve)=>{
            GM_xmlhttpRequest({
                method: "GET",
                url: 'https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/pay/statement/transaction/detail?oec_seller_id=7495143478410054258&page_type=8&statement_detail_id='+statement_detail_id,
                headers: {

                },
                onload: function(response){
                    let res = JSON.parse(response.responseText);
                    resolve(res)

                },
                onerror: function(res){
                    console.log("请求失败");

                }
            });
        })


    }
    /**********************************函数定义区-END**********************************/

    /**********************************函数执行区-START**********************************/
    (()=>{//获取网址
        //console.log("网址为：",href);
        if(href.indexOf("https://seller-th.tiktok.com")!=-1){//泰国本土
            mode=1;
        }else if(href.indexOf("https://seller.tiktokglobalshop.com")!=-1){//跨境
            mode=2;
        }
    })()

    getDiscountList({
        mode:mode
    }).then((data1)=>{
        let partStr;//本土店和跨境店折扣返回内容关键字段不同
        if(mode==1){//本土店
            partStr="seller_discounts";
        }else if(mode==2){//跨境点
            partStr="promotions";
        }
        //console.log(1235);
        for(let i=0;i<10;i++){
            console.log(data1.data[partStr][i])
            if(data1.data[partStr][i].status==2){//如果有进行中的折扣，就获取折扣id并生成面板
                //console.log("进行中的折扣id",data1.data[partStr][i].id);
                homeData.discountId=data1.data[partStr][i].id;
                createPanel();//创造ui
                break;//找到后推出循环，防止溢出
            }
            //console.log(data1.data[partStr].length)
            if(i==9 || i==data1.data[partStr].length-1){//如果找不到进行中的折扣，就直接生成面板
                //console.log("进行中的折扣id",data1.data[partStr][i].id);
                homeData.discountId="请输入折扣id";
                createPanel();//创造ui
                break;//退出循环，防止溢出
            }



        }
    });


    //getFlashDealProtect();//获取tk闪购商品id

    //getInactive();//获取不活跃商品id

    //getDeleted(); //获取被删除商品id

    init();//数据初始化
    /**********************************函数执行区-END**********************************/
})();


