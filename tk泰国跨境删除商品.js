// ==UserScript==
// @name         tk泰国跨境删除商品
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  try to take over the world!
// @author       You
// @match        https://seller.tiktokglobalshop.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tiktokglobalshop.com
// @require      https://cdn.staticfile.org/jquery/1.10.2/jquery.min.js
// @grant GM_xmlhttpRequest
// ==/UserScript==

(function() {
    delItem();
    function delItem(){
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://api16-normal-useast1a.tiktokglobalshop.com/api/v1/product/global/products/delete?oec_seller_id=7495143478410054258",
            headers: {
                'x-secsdk-csrf-token': '00010000000150696f131abcc1601715fe3efe4fdc157a0afbbd36993ab853c3f2818179ade317aa9012fbe9ba61',//会变动
                "Content-Type": 'application/json',
            },
            data: JSON.stringify({
                'product_ids': [
                    '1729955755389586034'
                ]
            }),
            
            onload: function(response){
                console.log("请求成功");
                console.log(response.responseText);
            },
            onerror: function(response){
                console.log("请求失败");
            }
        });
    }
})();
