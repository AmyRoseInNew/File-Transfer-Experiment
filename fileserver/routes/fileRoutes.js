const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');

// 引入刚刚写好的控制器
const fileController = require('../controllers/fileController');

// 配置 Multer 存储规则
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 这里的相对路径基于执行环境，指向根目录下的 public/uploads
    cb(null, path.join(__dirname, '../public', 'uploads')); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// 1. 多文件上传 (使用 multer 中间件)
router.post('/multipart', upload.any(), fileController.uploadMultipart);

// 2. 二进制流上传 (使用内置 express.raw 中间件)
router.post('/binary', express.raw({ type: '*/*', limit: '10mb' }), fileController.uploadBinary);

// 3. Base64 上传 (使用内置 express.json 中间件)
router.post('/base64', express.json({ limit: '10mb' }), fileController.uploadBase64);

// 4. 一键更新文件
router.put('/:filename', express.raw({ type: '*/*', limit: '10mb' }), fileController.updateFile);

// 5. 删除文件
router.delete('/:filename', fileController.deleteFile);

router.get('/list', fileController.getFileList);
module.exports = router;