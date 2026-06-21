const path = require('path');
const fs = require('fs');

// 统一配置静态资源上传目录（避免在每个函数里写重复的绝对路径）
const uploadDir = path.join(__dirname, '../public', 'uploads');

// 自动检测并创建上传目录（防止首次运行因为文件夹不存在而报错）
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 辅助函数：生成不重复的随机文件名
const generateUniqueName = (originalName) => {
  const ext = originalName ? path.extname(originalName) : '.bin';
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  return uniqueSuffix + ext;
};

// 1. 多文件/表单上传
const uploadMultipart = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有检测到上传的文件' });
    }

    const fileDetails = req.files.map(file => {
      return { 
        fieldName: file.fieldname,
        originalName: file.originalname, // Multer 已经自动处理好原文件名
        url: `/uploads/${file.filename}`,
        size: file.size
      };
    });

    res.json({
      message: `成功接收 ${req.files.length} 个文件！`,
      files: fileDetails,
      textFields: req.body
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. 二进制流上传
const uploadBinary = (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: '没有检测到二进制流数据' });
    }

    // 获取前端传过来的 Header 并解码（防止中文乱码）
    const encodedName = req.headers['x-file-name'];
    const originalName = encodedName ? decodeURIComponent(encodedName) : 'binary-file';
    
    const filename = generateUniqueName(originalName);
    const filePath = path.join(uploadDir, filename);

    fs.writeFile(filePath, req.body, (err) => {
      if (err) {
        return res.status(500).json({ error: '文件写入失败: ' + err.message });
      }
      res.json({
        message: '二进制流文件上传成功！',
        filename: filename,
        url: `/uploads/${filename}`
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Base64 上传
const uploadBase64 = (req, res) => {
  try {
    const { base64Data, originalName } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: '没有检测到 Base64 数据' });
    }

    // 清洗 Base64 字符串，剔除可能存在的 Data URL 前缀
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const fileBuffer = Buffer.from(base64Image, 'base64');

    const filename = generateUniqueName(originalName || 'base64-file.jpg');
    const filePath = path.join(uploadDir, filename);

    fs.writeFile(filePath, fileBuffer, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Base64文件保存失败: ' + err.message });
      }
      res.json({
        message: 'Base64 文件上传成功！',
        filename: filename,
        url: `/uploads/${filename}`
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. 覆盖更新文件
const updateFile = (req, res) => {
  try {
    const { filename } = req.params;
    // 使用 path.basename 过滤掉可能包含的路径分隔符，防止路径穿越风险
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '要更新的原文件不存在' });
    }
    if (!req.body || req.body.length === 0) {
      return res.status(400).json({ error: '没有检测到新的文件数据' });
    }

    fs.writeFile(filePath, req.body, (err) => {
      if (err) {
        return res.status(500).json({ error: '文件更新失败: ' + err.message });
      }
      res.json({
        message: `文件 ${safeFilename} 已成功更新覆盖！`,
        filename: safeFilename,
        url: `/uploads/${safeFilename}`
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. 删除文件
const deleteFile = (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在或已被删除' });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: '文件删除失败: ' + err.message });
      }
      res.json({
        message: `文件 ${safeFilename} 删除成功！`,
        id: safeFilename
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// 6. 获取文件列表 (新增)
const getFileList = (req, res) => {
  try {
    // 读取上传目录下的所有文件名
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: '读取文件列表失败: ' + err.message });
      }

      // 过滤掉隐藏文件，并构造完整的数据结构
      const fileList = files
        .filter(filename => !filename.startsWith('.'))
        .map(filename => {
          const ext = path.extname(filename).toLowerCase();
          
          // 根据后缀简单判断是图片还是视频
          let type = 'other';
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) type = 'image';
          if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) type = 'video';

          return {
            filename: filename,
            url: `/uploads/${filename}`,
            type: type
          };
        });

      res.json({ files: fileList });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = {
  uploadMultipart,
  uploadBinary,
  uploadBase64,
  updateFile,
  deleteFile,
  getFileList // <-- 加到这里
};