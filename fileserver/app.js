const express = require('express');
const path = require('path');
const fileRoutes = require('./routes/fileRoutes'); // 引入路由模块

const app = express();

// 静态资源中间件
app.use(express.static(path.join(__dirname, 'public')));

// 将所有以 /files 开头的请求，分发给 fileRoutes 处理
app.use('/files', fileRoutes);

const server = app.listen(8081, function () {
   console.log("应用实例，访问地址为 http://127.0.0.1:8081");
});