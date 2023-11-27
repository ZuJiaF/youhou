// ==UserScript==
// @name         甩手导出各仓库库存
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://dz.shuaishou.com/stock/storeManage/storeList
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://cdn.staticfile.org/xlsx/0.15.1/xlsx.core.min.js
// ==/UserScript==

(function() {
    /*********全局变量*********/
    let ArrayHead=["商品sku","商品名称","货架位编号","可用库存","锁定库存","总库存","在途库存","头程天数","安全天数","仓库名称","币种","成本价"];
    let oldWarehouseArray=[];//宝函仓数据
    let newWarehouseArray=[];//新仓数据
    let flag=0;//函数执行时标志位
    let flag1=0;//老仓运行flag
    let flag2=0;//新仓运行flag
    let oldListLength=0;
    let newListLength=0;
    /*********全局变量*********/

    /*********函数调用*********/
    addElement();//元素添加
    moveElement();//拖动元素
    /*********函数调用*********/
    //元素添加
    function addElement(){
        $("body").append("\
<div id='div1' style='right: 10px;bottom:70px;width:200px;height: 100px;    justify-content:center;align-items:center;background-color:#000000;display:flex;flex-direction:column;overflow: hidden;position: fixed;z-index:999;'>\
<button id='btn1' type='button' style='font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
导出宝函库存\
</button>\
<button id='btn2' type='button' style='font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
导出新仓库存\
</button>\
<button id='btn3' type='button' style='font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
导出两仓库存\
</button>\
</div>\
");
    }
    //拖动元素
    function moveElement(){
        // 获取到 DOM 元素
        const box = document.querySelector('#div1')

        const mousedown = (event) => {
            //console.log('鼠标点击位置 ———— 距离浏览器最左边的位置：'+event.clientX)
            //console.log('元素距离浏览器最左边的位置：' + box.offsetLeft)
            let innerX = event.clientX - box.offsetLeft
            let innerY = event.clientY - box.offsetTop

            box.style.borderWidth = "1px";
            box.style.borderStyle = "solid";
            box.style.borderColor = "black";
            // 移动时
            document.onmousemove = function (event) {
                box.style.left = event.clientX - innerX + "px"
                box.style.top = event.clientY - innerY + "px"
            }

            // 抬起时
            document.onmouseup = function () {
                document.onmousemove = null
                document.mousedown = null
                control()
                box.style.borderWidth = "";
                box.style.borderStyle = "";
                box.style.borderColor = "";
            }
        }

        // 超出边界处理
        const control = function () {
            if (box.offsetLeft < 0) {
                box.style.left = 0 + "px"
            }

            if (box.offsetTop < 0) {
                box.style.top = 0 + "px"
            }

            if ((box.offsetLeft + parseInt(box.style.width)) > window.innerWidth) {
                box.style.left = (window.innerWidth - parseInt(box.style.width)) + "px"
            }

            if ((box.offsetTop + parseInt(box.style.height)) > window.innerHeight) {
                box.style.top = (window.innerHeight - parseInt(box.style.height)) + "px"
            }

        }

        // 按下时
        box.addEventListener('mousedown', mousedown, false);
    }


    let btn1 = document.getElementById('btn1');
    let btn2 = document.getElementById('btn2');
    let btn3 = document.getElementById('btn3');
    //导出老仓库存
    btn1.onclick = function(){

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

    };
    //导出新仓库存
    btn2.onclick = function(){
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

    };
    //导出双仓库存
    btn3.onclick = function(){
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

    };







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
