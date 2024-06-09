// ==UserScript==
// @name         shopee电脑上传护照
// @namespace    http://tampermonkey.net/
// @version      2024-06-09
// @description  try to take over the world!
// @author       You
// @match        https://seller.shopee.co.th/portal/th-onboarding/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=shopee.co.th
// @require      https://unpkg.com/jsqr/dist/jsQR.js
// @grant        none
// ==/UserScript==

(function() {
    let photos;
    let access_token;
    let token;
    // 创建按钮元素
    var button = document.createElement('button');
    button.textContent = '上传手持';

    // 设置按钮的CSS样式
    button.style.cssText = `
    padding: 10px 20px;
    color: white;
    background-color: #007BFF;
    border: none;
    border-radius: 5px;
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    cursor: pointer;
`;

    // 按钮点击时执行的函数
    button.addEventListener('click', function() {
        console.log('按钮被点击了！');
        let dom = document.querySelector("#form_0_component_301218_cId > div > div > div.qr-code > div > img")
        decodeQRCode(dom)
        selectImg()

    });

    // 将按钮添加到页面中
    document.body.appendChild(button);

    function selectImg(){
        console.log("123")
        // 创建一个input元素用于选择文件
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*'; // 只允许选择图片文件
        // 设置按钮的CSS样式
        input.style.cssText = `
 display: none;
`;

        // 选择文件后执行的函数
        // 直接触发input的点击事件，以便打开文件选择对话框
        input.click();
        input.addEventListener('change', function() {
            // 检查是否选择了文件
            if (this.files && this.files[0]) {
                var selectedFile = this.files[0];
                console.log('选择的文件:', selectedFile);
                var file = this.files[0];
                if (file) {
                    // 创建FormData对象
                    var formData = new FormData();
                    // 将文件添加到FormData对象中
                    formData.append('file', file);
                    uploadImg(formData)
                }
                // 这里可以添加代码来使用选中的图片文件
                // 例如，您可以创建一个 FileReader 来读取文件内容

                //                 // 读取文件内容并输出到控制台
                //                 var reader = new FileReader();
                //                 reader.onload = function(e) {
                //                     // 输出文件内容的Base64编码
                //                     console.log('文件内容(Base64编码):', e.target.result);

                //                 };
                //                 reader.readAsDataURL(selectedFile);
            }
        });
        console.log("12345")
        // 将input元素添加到页面中，以便触发选择文件的功能
        document.body.appendChild(input);
    }

    function saveImg(access_token,photos,token){
        let data={
            access_token:access_token,
            photo_type:11,
            photos:[photos],
            token:token
        }
        // 发送POST请求
        fetch('https://seller.shopee.co.th/api/onboarding/local_onboard/v1/th_onboard/photo/save/', {
            method: 'POST',
            headers:{
                'content-type': 'application/json;charset=UTF-8',
            },
            body: JSON.stringify(data)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // 解析JSON格式的响应数据
        }).then(data => {
            console.log('保存成功:', data);

        }).catch((error) => {
            console.error('保存失败:', error);
        });
    }

    //上传图片
    function uploadImg(formData){
        // 发送POST请求
        fetch('https://seller.shopee.co.th/api/onboarding/local_onboard/v1/th_onboard/upload_file/', {
            method: 'POST',
            body: formData // 使用FormData对象作为请求体
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // 解析JSON格式的响应数据
        }).then(data => {
            console.log('图片上传成功:', data);
            photos=data
            saveImg(access_token,photos,token)
        }).catch((error) => {
            console.error('图片上传失败:', error);
        });
    }

    //读取二维码图片
    function decodeQRCode(image) {
        // 创建Canvas来读取图片内容
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = image.naturalWidth; // 使用图片的原始尺寸
        canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // 使用jsQR库识别二维码
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        // 如果识别出二维码，发送通知显示结果
        if (code) {
            console.log(`二维码内容：${code.data}`+ '     二维码识别结果');  //别用GM_notification了吧
            // 使用split方法分割URL以获取查询字符串部分
            let url=code.data
            var queryString = url.split('?')[1];

            // 初始化参数值变量
            var qrTokenValue = null;
            var tokenValue = null;

            // 使用正则表达式匹配qr_token和token参数的值
            var paramsRegex = /qr_token=([a-z0-9\-]+)&token=([a-zA-Z0-9\._~%-]+)/;

            // 执行匹配
            var match = paramsRegex.exec(queryString);

            if (match) {
                // 如果匹配成功，从结果数组中获取参数值
                qrTokenValue = match[1];
                tokenValue = match[2];
            } else {
                console.error('URL参数格式不正确或参数不存在');
            }

            // 打印获取的值
            console.log('qr_token:', qrTokenValue);
            console.log('token:', tokenValue);
            token=tokenValue
            getAccess_token(qrTokenValue)
        } else {
            console.log('未识别到二维码，请确保图片中包含一个可识别的二维码。' + '   二维码识别错误');  //别用GM_notification了吧
        }
    }

    function getAccess_token(qr_token){
        // 定义请求的URL
        var url = 'https://seller.shopee.co.th/api/onboarding/local_onboard/v1/th_onboard/confirm_qr_code/';

        // 定义请求的参数
        var data = {
            qr_token: qr_token
        };

        // 使用fetch发送POST请求
        fetch(url, {
            method: 'POST', // 指定请求方法为POST
            headers: {
                'Content-Type': 'application/json' // 设置请求头，指定发送的数据格式为JSON
            },
            body: JSON.stringify(data) // 将JavaScript对象转换为JSON字符串
        })
            .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json(); // 解析JSON格式的响应数据
        })
            .then(data => {
            console.log('Success_access_token:', data.access_token); // 打印请求成功返回的数据
            access_token=data.access_token
        })
            .catch((error) => {
            console.error('Error:', error); // 打印错误信息
        });
    }

})();
