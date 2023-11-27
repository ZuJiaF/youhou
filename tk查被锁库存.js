// ==UserScript==
// @name         tk查被锁库存1.2
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  try to take over the world!
// @author       You
// @match        https://seller-th.tiktok.com/*
// @updateURL    https://raw.githubusercontent.com/ZuJiaF/youhou/main/tk%E6%9F%A5%E8%A2%AB%E9%94%81%E5%BA%93%E5%AD%98.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shopee.co.th
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://cdn.staticfile.org/xlsx/0.15.1/xlsx.core.min.js
// @grant        none
// ==/UserScript==

(function() {
    let end_flag1=0;//tk被锁库存结束标志位
    let FlashDealProtect_EndFlag=0;//tk闪购商品id结束标志位
    let array1=[];//tk被锁库存
    let array2=[];//tk闪购商品id
    let count=0;//加载计数

    /**********************************函数执行区**********************************/
    addButton();//添加按钮
    move('div1');//元素拖动
    get_0();//主函数
    getFlashDealProtect();//获取tk闪购商品id
    /**********************************函数执行区**********************************/
    //     $("body").append("\
    // <div id='div1' style='right: 10px;bottom:70px;width:200px;height: 100px;    justify-content:center;align-items:center;background-color:#000000;display:flex;flex-direction:column;overflow: hidden;position: fixed;z-index:999;'>\
    // <button id='btn1' type='button' style='font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
    // 导出宝函库存\
    // </button>\
    // <button id='btn2' type='button' style='font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
    // 导出新仓库存\
    // </button>\
    // <button id='btn3' type='button' style='font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
    // 导出两仓库存\
    // </button>\
    // </div>\
    // ");
    function addButton(){
        $("body").append("\
<div id='div1' style='right: 10px;bottom:70px;width:200px;height: 100px;justify-content:center;align-items:center;background-color:#000000;display:flex;flex-direction:column;overflow: hidden;position: fixed;z-index:999;'>\
<button id='btn1' type='button' style='margin-bottom:2px;font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
导出tk被查库存\
</button>\
<button id='btn2' type='button' style='font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 150px;height: 35px;border-radius:4px; '>\
    导出tk闪购的商品id\
</button>\
</div>\
");
        let btn1 = document.getElementById('btn1');
        let btn2 = document.getElementById('btn2');
        btn1.onclick = function(){
            if(end_flag1==1){
                ex(array1,"tk被锁库存");//导出表格
            }
            else if(end_flag1==0){
                alert('加载中，请稍等');
            }
        };
        btn2.onclick = function(){
            if(FlashDealProtect_EndFlag==1){
                ex(array2,"参与全年闪购的商品id");//导出表格
            }
            else if(FlashDealProtect_EndFlag==0){
                alert('加载中，请稍等');
            }
        };
    }

    /**************************************拖动元素**************************************/
    function move(id){
        // 获取到 DOM 元素
        const box = document.querySelector('#'+id);
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

    /**************************************拖动元素**************************************/


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
                        array11.push([res.data.products[i].skus[j].id+","+res.data.products[i].skus[j].quantities[0].reserved_quantity]);
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
                console.log("1111",res);
                let length=res.data.campaign_product_approve_infos.length;
                console.log("长度为："+length);
                for(let i=0;i<length;i++){
                    let statu=res.data.campaign_product_approve_infos[i].product_approve_status;
                    if(statu==2){
                        console.log(res.data.campaign_product_approve_infos[i].product_info_base.product_id);
                        array2.push([res.data.campaign_product_approve_infos[i].product_info_base.product_id]);
                    }
                    if(i==length-1){
                        console.log("最后一个");
                        console.log("all:"+array2);
                        FlashDealProtect_EndFlag=1;//结束标志位
                    }
                    //console.log(res.data.campaign_product_approve_infos[i].product_info_base.product_id);
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
        XLSX.writeFile(book,name+".xlsx")
    }



    // Your code here...
})();
