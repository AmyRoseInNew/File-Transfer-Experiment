// 页面元素 DOM 引用
const cover1 = document.getElementById("cover1");
const cover2 = document.getElementById("cover2");
const cover3 = document.getElementById("cover3");
const btnSubmit = document.getElementById("filesubmit");
const fileGrid = document.getElementById("fileGrid");
const btnRefresh = document.getElementById("btnRefresh");

/**
 * 从后端获取文件资产列表并渲染到页面
 */
async function loadFileList() {
    try {
        const response = await fetch('/files/list');
        const result = await response.json();
        
        if (!result.files || result.files.length === 0) {
            fileGrid.innerHTML = `<p class="empty-tip">服务器上传目录空空如也~</p>`;
            return;
        }

        fileGrid.innerHTML = ''; // 清空内容

        result.files.forEach(file => {
            const card = document.createElement('div');
            card.className = 'file-card';

           // 在 loadFileList 循环内部修改：
              const timestamp = Date.now(); // 生成当前时间戳
              
              let mediaHtml = `<span style="font-size:24px;">📁</span>`; 
              if (file.type === 'image') {
                  // 加上 ?t= 时间戳，强制浏览器绕过缓存重新加载新图片
                 mediaHtml = `<img src="${file.url}?t=${timestamp}" alt="预览">`;
              } else if (file.type === 'video') {
                  // 视频同理
                  mediaHtml = `<video src="${file.url}?t=${timestamp}" muted preload="metadata"></video>`;
              }

            // 2. 组装卡片内部 HTML 结构
            card.innerHTML = `
                <div class="preview-box">${mediaHtml}</div>
                <div class="file-name" title="${file.filename}">${file.filename}</div>
                <div>
                    <button class="btn-success" onclick="quickUpdate('${file.filename}')">更新</button>
                    <button class="btn-danger" onclick="quickDelete('${file.filename}')">删除</button>
                </div>
            `;
            fileGrid.appendChild(card);
        });
    } catch (error) {
        console.error('获取列表失败:', error);
    }
}

/**
 * 监听事件绑定
 */
window.addEventListener('DOMContentLoaded', loadFileList);
btnRefresh.addEventListener('click', loadFileList);

/**
 * 核心：三种上传方式并行处理
 */
btnSubmit.addEventListener('click', async (event) => {
    event.preventDefault();
    btnSubmit.disabled = true;
    btnSubmit.innerText = "正在上传...";

    const uploadTasks = [];

    // --- 方式一：Multipart ---
    if (cover1.files[0]) {
        const file1 = cover1.files[0];
        const formData = new FormData();
        formData.append('cover1', file1);
        uploadTasks.push(fetch('/files/multipart', { method: 'POST', body: formData }).then(res => res.json()));
    }

    // --- 方式二：二进制流 ---
    if (cover2.files[0]) {
        const file2 = cover2.files[0];
        uploadTasks.push(fetch('/files/binary', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/octet-stream', 
                'x-file-name': encodeURIComponent(file2.name) 
            },
            body: file2
        }).then(res => res.json()));
    }

    // --- 方式三：Base64 JSON ---
    if (cover3.files[0]) {
        const file3 = cover3.files[0];
        const fileToBase64 = (file) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });

        try {
            const base64String = await fileToBase64(file3);
            uploadTasks.push(fetch('/files/base64', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalName: file3.name, base64Data: base64String })
            }).then(res => res.json()));
        } catch (e) { 
            console.error('Base64 转换失败:', e); 
        }
    }

    // 检查是否有任何任务
    if (uploadTasks.length === 0) {
        alert('请至少选择一个文件进行上传！');
        btnSubmit.disabled = false;
        btnSubmit.innerText = "提交文件";
        return;
    }

    // 并行发送请求
    await Promise.all(uploadTasks);
    
    // 恢复状态并清空输入
    btnSubmit.disabled = false;
    btnSubmit.innerText = "提交文件";
    cover1.value = ''; 
    cover2.value = ''; 
    cover3.value = '';
    
    // 自动刷新视图
    loadFileList();
});

/**
 * 快捷更新文件（挂载到 window 作用域以支持 HTML onclick 触发）
 */
window.quickUpdate = function(filename) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = "image/*,video/*"; 

    fileInput.onchange = async () => {
        // 1. 确保用户选中了文件，并且使用 [0] 获取具体的 File 二进制对象
        if (!fileInput.files || !fileInput.files[0]) return;
        
        try {
            const fileObject = fileInput.files[0];
            
            const response = await fetch(`/files/${encodeURIComponent(filename)}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/octet-stream' 
                },
                body: fileObject // 必须是具体的 File 对象，后端 express.raw 才能正确接收并写入
            });

            if (response.ok) {
                alert('文件覆盖更新成功！');
                
                // 2. 核心修复：更新成功后立即重新拉取列表
                await loadFileList(); 
            } else {
                const err = await response.json();
                alert(`更新失败: ${err.error}`);
            }
        } catch (error) {
            console.error('网络更新错误:', error);
            alert('网络更新错误');
        }
    };
    fileInput.click(); 
};
/**
 * 快捷删除文件
 */
window.quickDelete = async function(filename) {
    if (!confirm(`确认要删除文件：\n${filename} 吗？`)) return;

    try {
        const response = await fetch(`/files/${encodeURIComponent(filename)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('文件删除成功！');
            loadFileList(); 
        } else {
            const err = await response.json();
            alert(`删除失败: ${err.error}`);
        }
    } catch (error) {
        alert('网络删除错误');
    }
};