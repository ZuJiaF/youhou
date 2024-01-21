// ==UserScript==
// @name         tk助手
// @namespace    http://tampermonkey.net/
// @version      1.0.1
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

    //
    /**********************************函数执行区**********************************/
    get_0();//tk被锁库存
    getFlashDealProtect();//获取tk闪购商品id
    getInactive();//获取不活跃商品id
    getDeleted(); //获取被删除商品id
    /**********************************函数执行区**********************************/

    //综合面板

    const data = {
        input1: "a",
        input2: getDate(),
        input3: "1",
        input4:"700789,600017",
        input5:"null"
    };
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
                            flashDealActivity(input1,newDate,time,frequency,content);//报闪购
                        },
                    }),
                    CAT_UI.Button("删除", {
                        type: "primary",
                        onClick() {
                            let r=confirm("确定删除吗?");
                            if (r==true){
                                getFlashDealList(input2.slice(2),input1)
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

    //获取属性(页面3)
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
    CAT_UI.createPanel({
        minButton: true,//minButton控制是否显示最小化按钮，默认为true

        min: true,// min代表面板初始状态为最小化（仅显示header）
        /*相当于GM_addStyle */
        appendStyle: `section {
    max-width:500px;
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
                        CAT_UI.Router.Link("闪购", { to: "/flashDeal" }),
                        CAT_UI.Router.Link("属性", { to: "/getAttribute" }),
                        "v "+GM_info.script.version,//版本
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

    //报闪购
    function flashDealActivity(tail,date,time,frequency,content){

        console.log(date);
        console.log(date+3600*frequency);

        let startTime=timestampToTime((date-3600)*1000);
        let endTime=timestampToTime(((date-3600)+3600*frequency)*1000).slice(5);
        if(time==1){
            endTime="24:00"
        }
        let starDate=date.toString();
        let endDate=(date+3600*frequency).toString();
        console.log(startTime+"-"+endTime+" "+tail);

        //console.log(endTime);
        if(href.indexOf("https://seller-th.tiktok.com")!=-1){//泰国本土
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

                });//请求成功后要执行的

            });
        }else if(href.indexOf("https://seller.tiktokglobalshop.com")!=-1){//跨境
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
                flashDealActivity(tail,date+3600*frequency,time-1,frequency,content)
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
    function deactivateFlashDeal(promotion_id,endFlag){
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
    }

    //获取闪购列表
    function getFlashDealList(date,tail){
        let deactivateFlashDealArray=[];//需要删除闪购id数组
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


            res.data.flash_sales.forEach(function(e,index){
                //console.log(e.promotion_id);//活动id
                let id=e.promotion_id;

                //console.log(e.promotion_name);//活动名字
                let name=e.promotion_name;
                //console.log(name.slice(0,4));//日期
                //console.log(name.slice(17));//代号
                console.log(tail);
                if(date==name.slice(0,4) && tail==name.slice(17)){
                    //console.log("11111111111");
                    deactivateFlashDealArray.push(id);

                }


            })
        }).done(function(){

            //console.log(deactivateFlashDealArray);
            deactivateFlashDealArray.forEach(function(e,index){

                if(index!=deactivateFlashDealArray.length-1){
                    deactivateFlashDeal(e);
                }else if(index==deactivateFlashDealArray.length-1){
                    deactivateFlashDeal(e,1);
                }
            });
        });
    }

    /* 时间戳转换为时间 */
    function timestampToTime(timestamp) {
        timestamp = timestamp ? timestamp : null;
        let date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000

        let M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
        let D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        let h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        let m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        return M + D + h + m;
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



    // Your code here...
})();
