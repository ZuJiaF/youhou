let a;//文件夹名
let temp;//中转

function Workbook_Activate()
{
	try{
  [...Sheets].forEach((e,index,self)=>{
		if(e.Name=="js宏配置表"){
			throw new Error('End Loop')
		}
		if(index==self.length-1){
			console.log(e.Name)
			Sheets.Add(undefined,e, 1, undefined);
			ActiveSheet.Name="js宏配置表";
		}
	})
} catch (e) {
}
let settingSheet=ThisWorkbook.Sheets.Item("js宏配置表");
	let default1=settingSheet.Range("A1");
	if(default1.Value2==null){
		default1.Value2="150跨境";
	}
	a=default1.Value2;
	ThisWorkbook.Sheets.Item(1).Activate();
}


/**
 * CommandButton1_Click Macro
 * 点击菜单
 */
function CommandButton1_Click()
{
	UserForm1.TextEdit2.Value=a;
	UserForm1.Show();	
}

/**
 * CommandButton2_Click Macro
 * 开始合并
 */
function CommandButton2_Click()
{
	//本表所在文件夹下的待合并文件夹，可以根据实际情况自己更换
		
	p = ThisWorkbook.Path + "\\" + a + "\\"
		
	f = Dir(p+'*') //遍历excel文件
		
	let nb = ThisWorkbook; //新建一个工作簿定义为nb
	
	let flag=1;
	
	while(f){ //循环直到文件名不为空
	let length;
	if(flag==1){
		length=0;
	}else if(flag==0){
		length=nb.Sheets.Item(1).UsedRange.Rows.Count;
	}
	
	nb.Sheets.Item(1).Range("A"+(length+1)).Select();
	fn=f.replace('.xlsx','').replace('.xls','').replace('.xlsm','') //得到原工作簿名称（不带后缀）
	
	//console.log(p+f);
	let wb = Workbooks.Open(p + f) //打开要合并的工作簿
	
	for(sh of wb.Sheets){
	let length1=sh.UsedRange.Rows.Count;
	
	if(flag==1){
		sh.UsedRange.Copy() //复制工作表到新工作簿中
		
	}else if(flag==0){
		sh.Rows.Item(2+":"+length1).Copy() //复制工作表到新工作簿中
		
	}

	nb.Sheets.Item(1).Paste();
	//nb.Sheets.Item(1).Range("A2").Select().Paste();
	}
	wb.Sheets.Item(1).Range("A1").Copy()
	wb.Close(false) //关闭要合并的工作簿
	
	f = Dir() //循环下一个文件
	flag=0;
	}
}

//输入框值有改变
function UserForm1_TextEdit2_Change()
{
	console.log(11);
	temp=UserForm1.TextEdit2.Value;
	
}

/**
 * UserForm1_CommandButton2_Click Macro
 * 菜单中的关闭事件
 */
function UserForm1_CommandButton2_Click()
{
	if(temp!=null){//如果有赋值事件发生
		a=temp;
		Sheets.Item("js宏配置表").Range("A1").Value2=temp;
		temp=null;	
	}
	
	console.log(a);
	UserForm1.Close();
}



// function run()
//{	

//let a=Dir("C:\\Users\\fjh\\Desktop\\聚树\\tiktok\\上传记录\\跨境店上传记录\\150-跨境\\")
//console.log(a);
//for(let i=0;i<=5;i++){
//	let b=Dir()
//	console.log(b)
//}

//	while(true){
		
//		try{
//			file=Dir(); //这个Dir函数，每被调用一次，就会返回一个文件名，下一次调用，就会返回下一个文件名
//		        console.log(file); //在 wps宏编辑器，下端的，立即窗口中，输出，变量 file 的值
//                    }catch(err){
//			alert("文件名称，已经遍历完毕");
//			break; //这里用的是死循环，当遍历结束时，程序会报错，这里用异常处理程序，try...catch，中断循环
//		}
		
//	}
//}


// 文件夹遍历加判断



//function openWorkbookByPath(filePath) {
//    // 尝试打开指定路径的工作簿
//    try {
    	
//        var workbook = Workbooks.openWorkbook(filePath);
//        console.log(1)
//        return workbook;
//    } catch (e) {
//        // 打开失败时的处理逻辑
//        console.log(123)
//        console.error("无法打开工作簿：" + filePath);
//        return null;
//    }
//}

//// 指定要打开的工作簿的路径
//var filePath = "C:\\Users\\fjh\\Desktop\\聚树\\tiktok\\上传记录\\跨境店上传记录\\150-跨境\\240112\\同店多个.xlsx";
//var workbook = Workbooks.Open(filePath);
// 打开工作簿
//var targetWorkbook = openWorkbookByPath(filePath);

//// 判断工作簿是否成功打开
//if (targetWorkbook) {
//	console.log(123)
//    // 在这里可以进行进一步的操作，例如合并工作表、处理数据等
//    // 你可以使用 targetWorkbook 对象来调用 WPS 表格提供的其他 API
//} else {
//    // 打开失败时的处理逻辑
//    console.error("无法继续操作，因为工作簿未成功打开。");
//    console.log(321)
//}


