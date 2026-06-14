const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 建立上傳與資料儲存的實體路徑
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 🛠️ 升級：實體硬碟資料庫保存檔案
const DATA_FILE = path.join(__dirname, 'database_backup.json');

// 初始化載入歷史資料，防止重新打開就不見
let db = { products: [], inspirations: [], orders: [] };
if (fs.existsSync(DATA_FILE)) {
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        console.log("💾 成功從實體硬碟載入商品及訂單歷史備份！");
    } catch(e) {
        console.log("備份檔初始化中...");
    }
}

// 輔助函數：每次有新商品或新訂單，自動寫入檔案保存
function saveToDisk() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Multer 圖片上傳設定
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ==================== API 路由 ====================

// 1. 取得所有商品庫存
app.get('/api/products', (req, res) => res.json(db.products));

// 2. 取得所有穿搭靈感
app.get('/api/inspirations', (req, res) => res.json(db.inspirations));

// 3. 取得所有訂單物流
app.get('/api/orders', (req, res) => res.json(db.orders));

// 4. 刊登新品或編輯修改舊品 (支援 FormData)
app.post('/api/products', upload.single('image'), (req, res) => {
    const { id, title, price, category } = req.body;
    
    if (id) {
        // 編輯模式
        const prod = db.products.find(p => p.id == id);
        if (prod) {
            prod.title = title;
            prod.price = parseFloat(price);
            prod.category = category;
            if (req.file) prod.imageUrl = `/uploads/${req.file.filename}`;
        }
    } else {
        // 全新刊登模式
        const newProduct = {
            id: Date.now(),
            title,
            price: parseFloat(price) || 0,
            category,
            imageUrl: req.file ? `/uploads/${req.file.filename}` : 'https://via.placeholder.com/300x400?text=2ndMUSE'
        };
        db.products.push(newProduct);
    }
    saveToDisk(); // 永久保存
    res.json({ success: true });
});

// 5. 下架刪除商品
app.delete('/api/products/:id', (req, res) => {
    db.products = db.products.filter(p => p.id != req.params.id);
    saveToDisk();
    res.json({ success: true });
});

// 6. 上傳穿搭靈感
app.post('/api/inspirations', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false });
    const newInspo = {
        id: Date.now(),
        imageUrl: `/uploads/${req.file.filename}`
    };
    db.inspirations.push(newInspo);
    saveToDisk();
    res.json({ success: true });
});

// 7. 刪除穿搭靈感
app.delete('/api/inspirations/:id', (req, res) => {
    db.inspirations = db.inspirations.filter(i => i.id != req.params.id);
    saveToDisk();
    res.json({ success: true });
});

// 8. 買家結帳、建立正式訂單
app.post('/api/orders', (req, res) => {
    const { title, price, buyer } = req.body;
    const newOrder = {
        id: "MUSE-" + Date.now() + Math.floor(Math.random() * 100),
        title,
        price,
        buyer,
        status: "處理中 (Pending)", // 初始狀態
        time: new Date().toLocaleTimeString()
    };
    db.orders.push(newOrder);
    saveToDisk(); // 寫入檔案保存
    res.json({ success: true, order: newOrder });
});

// 9. 賣家變更出貨狀態 API
app.post('/api/orders/update-status', (req, res) => {
    const { orderId, newStatus } = req.body;
    const order = db.orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        saveToDisk(); // 狀態改變，永久存入硬碟
        return res.json({ success: true });
    }
    res.status(404).json({ success: false, message: '訂單不見了' });
});

app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 2ndMUSE 全端硬碟級電商系統已啟動！`);
    console.log(`🌐 專案本機調試網址：http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});