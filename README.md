  &emsp;&emsp;  在浏览器里输入：http://127.0.0.1:8081,即可访问文件管理系统。进行图片和视频的管理。  
此系统采用的是一次传输post三个文件的，按照三种不同文件传输格式，第一个文件按照multipart数据格式传输，第二个文件按照stream（即二进制流）格式传输，第三个文件按照base64格式（放在json字段）传输。  
   &emsp;&emsp; 对于文件的更新put则统一按照二进制流先传输文件到后端，后端做保存和删除旧文件，但文件名保持不变。  
   &emsp;&emsp; 对于文件的删除delete,则直接按照文件名作为id,因为保存的文件都是按照时间戳+随机字符生成的文件名，具有唯一性。  
详细的API如下：  

接口功能	   &emsp;&emsp;      请求方法与路径	       &emsp;&emsp;   数据传输格式 (Content-Type)  
多文件表单上传	&emsp;&emsp; POST /files/multipart	&emsp;&emsp;  multipart/form-data  
二进制流上传	  &emsp;&emsp;   POST /files/binary	  &emsp;&emsp;    application/octet-stream  
Base64文本上传	&emsp;&emsp; POST /files/base64	    &emsp;&emsp;  application/json  
覆盖更新资产	   &emsp;&emsp;  PUT /files/:filename	&emsp;&emsp;  application/octet-stream  
物理删除资产	    &emsp;&emsp; DELETE /files/:filename &emsp;&emsp; URL 参数路径传递  
