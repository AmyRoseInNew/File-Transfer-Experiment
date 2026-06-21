    在浏览器里输入：http://127.0.0.1:8081,即可访问文件管理系统。进行图片和视频的管理。
此系统采用的是一次传输post三个文件的，按照三种不同文件传输格式，第一个文件按照multipart数据格式传输，第二个文件按照stream（即二进制流）格式传输，第三个文件按照base64格式（放在json字段）传输。
    对于文件的更新put则统一按照二进制流先传输文件到后端，后端做保存和删除旧文件，但文件名保持不变。
  对于文件的删除delete,则直接按照文件名作为id,因为保存的文件都是按照时间戳+随机字符生成的文件名，具有唯一性。
详细的API如下：
接口功能	    请求方法与路径	         数据传输格式 (Content-Type)
多文件表单上传	 POST /files/multipart	 multipart/form-data
二进制流上传	 POST /files/binary	     application/octet-stream
Base64文本上传	 POST /files/base64	     application/json
覆盖更新资产	 PUT /files/:filename	  application/octet-stream
物理删除资产	 DELETE /files/:filename  URL 参数路径传递