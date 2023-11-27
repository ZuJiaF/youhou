// ==UserScript==
// @name         sp查被锁库存
// @namespace    http://tampermonkey.net/
// @version      0.2.0
// @description  try to take over the world!
// @author       You
// @match        https://seller.shopee.co.th/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shopee.co.th
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @require      https://cdn.staticfile.org/xlsx/0.15.1/xlsx.core.min.js
// @grant        none
// ==/UserScript==

(function() {

     let count_flag;

    var page=1;
    var mix_page=2;//页数
    var all_product_id=[];
    var array=[];
    var flag=0;
    let end_flag=0;//结束标志位
    let startFlag=0;//开始标志位
    $("body").append("\
<div id='div1' style='right: 10px;bottom:70px;width:200px;height: 200px;justify-content:center;align-items:center;background-color:#000000;display:flex;flex-direction:column;overflow: hidden;position: fixed;z-index:999;'>\
<button id='btn1' type='button' style='margin-bottom:2px;font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
开始执行\
</button>\
<button id='btn2' type='button' style='margin-bottom:2px;font—size:40px;background: #1a59b7;color:#ffffff;padding:5px;text-align:center;width: 120px;height: 35px;border-radius:4px; '>\
导出sp被查库存\
</button>\
</div>\
");

    let btn1 = document.getElementById('btn1');
    let btn2 = document.getElementById('btn2');
    btn1.onclick = function(){
        if(startFlag==0){
            alert('马上导出');
        get_0();
            startFlag=1;
        }else if(startFlag==1){
        alert('已经开始导出');
        }


    };
    btn2.onclick = function(){
        if(end_flag==1){
            alert('点击确定后，将导出');
            /* 把转换JS数据数组的数组为工作表 */
            const sheet= XLSX.utils.aoa_to_sheet(array)
            /* 生成工作簿并添加工作表 */
            const book = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(book,sheet,'sheet1' )
            /* 保存到文件 */
            XLSX.writeFile(book,'sp被锁库存.xlsx')
        }
        else if(end_flag==0){
            alert('加载中，总'+all_product_id.length+"个，正在加载第"+(count_flag+1)+"个");
        }
    };

   
    function get_0(){
        //console.log("开始加载第"+page+"页")
        $.ajax({
            url: "https://seller.shopee.co.th/api/v3/mpsku/list/get_product_list?SPC_CDS=9ea2b92e-78ef-4deb-b8d2-65de65d1f970&SPC_CDS_VER=2&page_number="+page+"&page_size=48",
            type: 'GET',
            //async:false,//同步操作
            success: function(res){
                //console.log("请求成功"+res);
                let length=res.data.products.length;
                for(let i=0;i<length;i++){
                    all_product_id.push(res.data.products[i].id);
                }
                if(page==mix_page){
                    //console.log("产品数量："+all_product_id.length);
                    var count=0;
                    var Interval=setInterval(function(){
                        get_1(all_product_id[count],count,Interval);
                        count++;
                    },500);
                }
                page++;
                if(page<=mix_page){
                    get_0()
                }
            }
        });
    }
    function get_1(product_id,count,Interval){
        count_flag=count;//传递count到外面
        //console.log("总共"+all_product_id.length+"个，开始执行第"+(count+1)+"个");
        //console.log("开始"+product_id)
        $.ajax({
            url: "https://seller.shopee.co.th/api/v3/product/get_product_detail/?SPC_CDS=64b0b980-5c05-4493-a2fe-470274707407&SPC_CDS_VER=2&product_id="+product_id+"&version=3.2.0",
            type: 'GET',
            //async:false,//同步操作
            success: function(res){
                let length=res.data.model_list.length;
                for(var i=0;i<length;i++){
                    array.push([res.data.model_list[i].id+","+res.data.model_list[i].stock_detail.total_reserved_stock]);
                }


            },
            complete:function(){
                if(count+1==all_product_id.length){
                    //console.log("已获取到第"+(count+1)+"个，总"+all_product_id.length+"个，结束");
                    end_flag=1;//结束标志位
                    clearInterval(Interval);
                    //console.log(array);
                }
            }
        });
    }
    
})();
