// ==UserScript==
// @name         填充店铺链接
// @namespace    http://tampermonkey.net/
// @version      2024-10-28
// @description  try to take over the world!
// @author       You
// @match        https://help.shopee.co.th/portal/webform/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shopee.co.th
// @grant        none
// ==/UserScript==

(function() {

    let Interval = setInterval(()=>{
        let dom =document.querySelector("div.shopee-react-input.bb-widget-input > div > input")
        if(dom){
            setTimeout(()=>{
                console.log("更改",dom)
                dom =document.querySelector("div.shopee-react-input.bb-widget-input > div > input")
                dom.focus();
                document.execCommand("insertText", false, "https://shopee.co.th/nrn6rhwjay")
                console.log("更改1",dom.value)

            },1000)
            clearInterval(Interval)
        }
    },100)
    })();
