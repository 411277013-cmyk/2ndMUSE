let wishlist = JSON.parse(localStorage.getItem("2andmuse_wishlist")) || [];
let cart = JSON.parse(localStorage.getItem("2andmuse_cart")) || [];
let products = [];
let inspirations = [];
let orders = []; // 新增：保存來自後端的訂單大陣列
let currentCategory = "all";

const productGrid = document.getElementById("productGrid");
const favoriteGrid = document.getElementById("favoriteGrid");
const favCount = document.getElementById("favCount");
const productCount = document.getElementById("productCount");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const cartList = document.getElementById("cartList");
const inspoGrid = document.getElementById("inspoGrid");
const inspImageInput = document.getElementById("inspImage");
const uploadInspoButton = document.getElementById("uploadInspo");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const categoryButtons = document.querySelectorAll(".category-btn");
const openSellButton = document.getElementById("openSell");
const openCartButton = document.getElementById("openCart");
const homeNav = document.getElementById("homeNav");
const editNav = document.getElementById("editNav");
const deleteNav = document.getElementById("deleteNav");
const accountNav = document.getElementById("accountNav");
const sellModal = document.getElementById("sellModal");
const cartModal = document.getElementById("cartModal");
const accountModal = document.getElementById("accountModal");
const accountSummary = document.getElementById("accountSummary");
const accountFavorites = document.getElementById("accountFavorites");
const accountCartList = document.getElementById("accountCartList");
const modeBanner = document.getElementById("modeBanner");
const checkoutButton = document.getElementById("checkoutButton");

let deleteMode = false;
let editMode = false;
let editingProductId = null;

// 從真後端同步資料庫所有數據（包含訂單）
async function fetchAllData() {
  try {
    const resProd = await fetch('/api/products');
    products = await resProd.json();
    const resInsp = await fetch('/api/inspirations');
    inspirations = await resInsp.json();
    
    // 從後端撈取同步最新的訂單狀況
    const resOrders = await fetch('/api/orders');
    orders = await resOrders.json();
    
    updateDisplay();
  } catch (err) {
    console.error("資料庫讀取失敗:", err);
  }
}

function saveLocalState() {
  localStorage.setItem("2andmuse_wishlist", JSON.stringify(wishlist));
  localStorage.setItem("2andmuse_cart", JSON.stringify(cart));
}

function formatPrice(value) {
  return `NT$${Number(value).toLocaleString()}`;
}

function buildProductCard(item) {
  const idNum = Number(item.id) || item.id;
  const isFav = wishlist.includes(idNum);
  const activeClass = isFav ? "active" : "";
  let actionOverlay = "";
  if (deleteMode) {
    actionOverlay = `<button class="delete-prod" data-deleteprod="${item.id}" title="刪除商品">×</button>`;
  } else if (editMode) {
    actionOverlay = `<button class="edit-prod" data-editprod="${item.id}" title="編輯商品">✎</button>`;
  }
  return `
    <article class="product-card ${deleteMode ? "delete-mode" : editMode ? "edit-mode" : ""}" data-productid="${item.id}" style="position: relative;">
      ${actionOverlay}
      <img src="${item.imageUrl || 'https://via.placeholder.com/300x400?text=2ndMUSE'}" alt="${item.title}" />
      <div class="card-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <h3 style="color: var(--text); margin:0; font-size:1.1rem;">${item.title}</h3>
          <button class="icon-btn ${activeClass}" data-fav="${item.id}" title="收藏" style="cursor:pointer; background:none; border:none; font-size:1.3rem; color: ${isFav ? '#ff4d4d' : 'rgba(255,255,255,0.3)'}">
            ♥
          </button>
        </div>
        <p style="color: var(--muted); margin: 0.2rem 0; font-size:0.9rem;">${item.category}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.8rem;">
          <span class="price" style="color: var(--accent); font-weight:bold;">${formatPrice(item.price)}</span>
          <button class="add-cart" data-add="${item.id}">加入購物袋</button>
        </div>
      </div>
    </article>
  `;
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase();
  return products.filter((item) => {
    const matchesCategory = currentCategory === "all" || item.category === currentCategory;
    const matchesSearch = query === "" ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

function renderProducts(items) {
  if (!productGrid) return;
  if (items.length > 0) {
    productGrid.innerHTML = items.map(buildProductCard).join("");
  } else {
    productGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--muted);">目前沒有此分類商品</div>`;
  }
  if (productCount) productCount.textContent = products.length;
}

function renderFavorites() {
  const favorites = products.filter((p) => wishlist.includes(Number(p.id) || p.id));
  if (favoriteGrid) {
    favoriteGrid.innerHTML = favorites.length > 0
      ? favorites.map(item => `
          <div class="favorite-item">
            <h4 style="margin:0 0 0.3rem 0; color:#111;">${item.title}</h4>
            <p style="margin:0; color:#666; font-size:0.85rem;">${item.category} · ${formatPrice(item.price)}</p>
          </div>
        `).join("")
      : `<div style="grid-column: 1/-1; color: var(--muted); padding: 1rem 0;">收藏夾空空如也</div>`;
  }
  if (favCount) favCount.textContent = wishlist.length;
}

function renderInspirations() {
  if (!inspoGrid) return;
  inspoGrid.innerHTML = inspirations.length > 0
    ? inspirations.map(item => `
        <article class="inspo-card">
          <img src="${item.imageUrl}" alt="穿搭靈感" />
          <button class="delete-inspo" data-delete="${item.id}" title="刪除">×</button>
        </article>
      `).join("")
    : `<div style="color: var(--muted); padding: 1rem 0;">尚無穿搭靈感，快來上傳第一張！</div>`;
}

function renderCart() {
  if (cartCount) cartCount.textContent = Math.max(0, cart.length);
  if (!cartList) return;
  
  if (cart.length === 0) {
    cartList.innerHTML = `<div style="color:#555; text-align:center; padding:1rem 0;">購物袋裡什麼都沒有</div>`;
    if (cartTotal) cartTotal.textContent = "NT$0";
    return;
  }

  let total = 0;
  cartList.innerHTML = cart.map((item, index) => {
    total += Number(item.price);
    return `
      <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid #eee;">
        <div>
          <span style="font-weight:bold;">${item.title}</span><br>
          <small style="color:#666;">${item.category} · ${formatPrice(item.price)}</small>
        </div>
        <button class="remove-cart" data-cartidx="${index}" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">移除</button>
      </div>
    `;
  }).join("");
  if (cartTotal) cartTotal.textContent = formatPrice(total);
}

function renderAccount() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || { username: '訪客', role: 'buyer' };
  const favorites = products.filter((p) => wishlist.includes(Number(p.id) || p.id));
  
  if (accountFavorites) {
    accountFavorites.innerHTML = favorites.length > 0
      ? favorites.map(item => `<div style="padding:0.4rem 0; border-bottom:1px solid #eee; color:#111;">⭐ ${item.title} (${item.category})</div>`).join("")
      : `<div style="color:#888;">暫無收藏</div>`;
  }
  
  if (accountSummary) {
    accountSummary.innerHTML = `
      <p style="margin:0.2rem 0;">👤 當前登入：<strong>${currentUser.username}</strong> (${currentUser.role === 'seller' ? '💎 賣家管理者' : '🛒 一般買家'})</p>
      <p style="margin:0.2rem 0;">📊 平台總在架商品：<strong>${products.length}</strong> 件</p>
      <p style="margin:0.2rem 0;">❤️ 我的收藏清單：<strong>${favorites.length}</strong> 件</p>
    `;
  }

  // 渲染買賣家分流物流區塊資料
  renderLogisticsDOM(currentUser);
}

// 根據目前身分動態渲染物流追蹤與出貨控制台
function renderLogisticsDOM(user) {
  // 1. 買家端：篩選出屬於這個買家的訂單
  const buyerTrackingContainer = document.getElementById('myOrdersTracking');
  if (buyerTrackingContainer) {
    const myOrders = orders.filter(o => o.buyer === user.username);
    buyerTrackingContainer.innerHTML = myOrders.length ? myOrders.map(order => {
      let badgeColor = order.status.includes('處理中') ? '#e67e22' : order.status.includes('運送中') ? '#2980b9' : '#27ae60';
      return `
        <div style="padding:10px; border-bottom:1px solid #eee; background:white; margin-bottom:6px; border-radius:4px; font-size:13px; color:#111;">
          <b>訂單單號:</b> <span style="font-family:monospace; color:#333;">${order.id}</span><br>
          <b>品名金額:</b> ${order.title} (<span style="color:#c0392b; font-weight:bold;">$${order.price}</span>)<br>
          <div style="margin-top:6px;">
            <b>🚚 物流進度：</b>
            <span style="color:white; background:${badgeColor}; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">${order.status}</span>
          </div>
        </div>
      `;
    }).join('') : '目前無任何下單採購物流紀錄。';
  }

  // 2. 賣家端：顯示全部訂單，並提供修改狀態按鈕
  const sellerManagementContainer = document.getElementById('sellerOrdersManagement');
  if (sellerManagementContainer) {
    sellerManagementContainer.innerHTML = orders.length ? orders.map(order => `
      <div style="padding:10px; border-bottom:1px solid #ddd; background:white; margin-bottom:8px; border-radius:6px; font-size:13px; color:#111;">
        <div style="display:flex; justify-content:space-between;">
          <b>買家帳號:</b> <span>${order.buyer}</span>
          <small style="color:#888;">${order.time}</small>
        </div>
        <b>下單單品:</b> ${order.title} ($${order.price})<br>
        <b>當前狀態:</b> <span style="color:#d35400; font-weight:bold;">${order.status}</span>
        <div style="margin-top:8px; display:flex; gap:6px;">
          <button onclick="changeOrderStatus('${order.id}', '運送中 (Shipping)')" style="padding:4px 8px; background:#3498db; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;">🚚 點擊出貨</button>
          <button onclick="changeOrderStatus('${order.id}', '已送達 (Delivered)')" style="padding:4px 8px; background:#2ecc71; color:white; border:none; border-radius:4px; cursor:pointer; font-size:11px;">✅ 商品送達</button>
        </div>
      </div>
    `) : '目前整個系統尚無收到買家訂單。';
  }
}

// 賣家點擊出貨、送達時調用後端 API 更改狀態
async function changeOrderStatus(orderId, nextStatus) {
  try {
    const res = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newStatus: nextStatus })
    });
    const result = await res.json();
    if(result.success) {
      alert(`物流更新成功！該單目前狀態：${nextStatus}`);
      fetchAllData(); // 重新向後端刷新大資料，即時同步！
    }
  } catch (err) {
    alert("後端物流狀態更新失敗！");
  }
}

function setActiveNav(button) {
  document.querySelectorAll(".bottom-nav .nav-btn").forEach((btn) => btn.classList.remove("active"));
  if (button) button.classList.add("active");
}

function renderModeBanner() {
  if (!modeBanner) return;
  if (editMode) {
    modeBanner.textContent = "【編輯模式】點擊商品右上角的 ✎ 圖標可快速更改資訊。";
    modeBanner.style.background = "rgba(52, 152, 219, 0.2)";
  } else if (deleteMode) {
    modeBanner.textContent = "【刪除模式】點擊商品右上角的 × 即可將之下架。";
    modeBanner.style.background = "rgba(231, 76, 60, 0.2)";
  } else {
    modeBanner.textContent = "【瀏覽模式】點擊 ♥ 收藏商品，或將其加入購物袋。";
    modeBanner.style.background = "rgba(255, 255, 255, 0.12)";
  }
}

function updateDisplay() {
  renderProducts(getFilteredProducts());
  renderFavorites();
  renderInspirations();
  renderCart();
  renderModeBanner();
  saveLocalState();
}

if (productGrid) {
  productGrid.addEventListener("click", async (event) => {
    const deleteProdId = event.target.dataset.deleteprod;
    const editProdId = event.target.dataset.editprod;
    const favId = event.target.closest("[data-fav]")?.dataset.fav;
    const addId = event.target.closest("[data-add]")?.dataset.add;

    if (deleteProdId) {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (!user || user.role !== 'seller') { return alert('【權限不足】只有賣家管理端可以進行商品下架刪除喔！'); }
      if(confirm("確定要將這件精品下架嗎？此動作將同步從資料庫中移除。")) {
        await fetch(`/api/products/${deleteProdId}`, { method: 'DELETE' });
        wishlist = wishlist.filter((id) => id !== Number(deleteProdId) && id !== deleteProdId);
        cart = cart.filter((item) => item.id !== deleteProdId);
        fetchAllData();
      }
      return;
    }

    if (editProdId) {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (!user || user.role !== 'seller') { return alert('【權限不足】只有賣家管理端可以編輯修改商品資訊！'); }
      const product = products.find((item) => item.id == editProdId);
      if (product) {
        editingProductId = editProdId;
        document.getElementById("sellTitle").value = product.title;
        document.getElementById("sellPrice").value = product.price;
        document.getElementById("sellCategory").value = product.category;
        document.querySelector("#sellModal h2").textContent = "修改商品資訊";
        document.getElementById("confirmSell").textContent = "更新商品";
        sellModal.classList.add("show");
      }
      return;
    }

    if (favId) {
      const idNum = Number(favId) || favId;
      const index = wishlist.indexOf(idNum);
      if (index >= 0) {
        wishlist.splice(index, 1);
      } else {
        wishlist.push(idNum);
      }
      updateDisplay();
      return;
    }

    if (addId) {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (!user || user.role !== 'buyer') { return alert('提示：請使用買家身分將二手精品加入購物袋結帳喔！'); }
      const idNum = Number(addId) || addId;
      const product = products.find((item) => item.id == idNum);
      if (product) {
        cart.push(product);
        updateDisplay();
        alert(`已將「${product.title}」放入購物袋！`);
      }
      return;
    }
  });
}

if (cartList) {
  cartList.addEventListener("click", (e) => {
    if (e.target.classList.contains("remove-cart")) {
      const idx = Number(e.target.dataset.cartidx);
      cart.splice(idx, 1);
      updateDisplay();
    }
  });
}

if (inspoGrid) {
  inspoGrid.addEventListener("click", async (event) => {
    const deleteId = event.target.dataset.delete;
    if (!deleteId) return;
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'seller') { return alert('只有賣家端可以清理靈感牆圖片喔！'); }
    await fetch(`/api/inspirations/${deleteId}`, { method: 'DELETE' });
    fetchAllData();
  });
}

if (uploadInspoButton) {
  uploadInspoButton.addEventListener("click", async () => {
    if (!inspImageInput.files.length) {
      alert("請選擇一張穿搭圖片再進行上傳。");
      return;
    }
    const formData = new FormData();
    formData.append("image", inspImageInput.files[0]);

    await fetch('/api/inspirations', {
      method: 'POST',
      body: formData
    });
    inspImageInput.value = "";
    fetchAllData();
  });
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    currentCategory = button.dataset.category;
    renderProducts(getFilteredProducts());
  });
});

if (searchButton) {
  searchButton.addEventListener("click", () => renderProducts(getFilteredProducts()));
}
if (searchInput) {
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") renderProducts(getFilteredProducts());
  });
}

if (homeNav) {
  homeNav.addEventListener("click", () => {
    setActiveNav(homeNav);
    editMode = false;
    deleteMode = false;
    updateDisplay();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
if (editNav) {
  editNav.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'seller') { return alert('【權限不符】只有賣家端可以切換成批次編輯修改模式！'); }
    editMode = true;
    deleteMode = false;
    setActiveNav(editNav);
    updateDisplay();
  });
}
if (deleteNav) {
  deleteNav.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'seller') { return alert('【權限不符】只有賣家端可以切換成下架刪除模式！'); }
    deleteMode = true;
    editMode = false;
    setActiveNav(deleteNav);
    updateDisplay();
  });
}
if (accountNav) {
  accountNav.addEventListener("click", () => {
    setActiveNav(accountNav);
    renderAccount();
    accountModal.classList.add("show");
  });
}

if (openSellButton) {
  openSellButton.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'seller') { return alert('【權限不足】只有賣家身分能使用「＋ SELL」刊登新品到伺服器庫存喔！'); }
    resetSellModal();
    sellModal.classList.add("show");
  });
}
if (openCartButton) {
  openCartButton.addEventListener("click", () => {
    cartModal.classList.add("show");
    renderCart();
  });
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-close]")) {
    sellModal.classList.remove("show");
    cartModal.classList.remove("show");
    accountModal.classList.remove("show");
    editMode = false;
    deleteMode = false;
    setActiveNav(homeNav);
    resetSellModal();
    updateDisplay();
  }
});

function resetSellModal() {
  editingProductId = null;
  document.querySelector("#sellModal h2").textContent = "刊登新品";
  document.getElementById("confirmSell").textContent = "確定刊登";
  document.getElementById("sellTitle").value = "";
  document.getElementById("sellPrice").value = "";
  document.getElementById("sellImage").value = "";
}

document.getElementById("confirmSell").addEventListener("click", async () => {
  const title = document.getElementById("sellTitle").value.trim();
  const price = document.getElementById("sellPrice").value.trim();
  const category = document.getElementById("sellCategory").value;
  const fileInput = document.getElementById("sellImage");

  if (!title || !price) {
    alert("請填寫商品名稱與價格。");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("price", price);
  formData.append("category", category);
  
  if (fileInput.files.length) {
    formData.append("image", fileInput.files[0]);
  } else if (!editingProductId) {
    alert("請為上架的二手單品選擇一張展示圖片。");
    return;
  }

  if (editingProductId) {
    formData.append("id", editingProductId);
  }

  await fetch('/api/products', {
    method: 'POST',
    body: formData
  });

  alert(editingProductId ? "商品內容已成功同步至資料庫！" : "新品已成功刊登至真後端資料庫！");
  resetSellModal();
  sellModal.classList.remove("show");
  editMode = false;
  setActiveNav(homeNav);
  fetchAllData();
});

// 買家點擊「結帳按鈕」：真正發送給後端儲存，不因刷新而不見
if (checkoutButton) {
  checkoutButton.addEventListener("click", async () => {
    if (cart.length === 0) {
      alert("購物袋空空如也，無法啟動結帳程序。");
      return;
    }
    const user = JSON.parse(localStorage.getItem('currentUser')) || { username: '匿名買家' };

    try {
      // 將購物袋中的所有商品，一筆一筆建立正式後端訂單
      for (let item of cart) {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            price: item.price,
            buyer: user.username
          })
        });
      }
      alert("✨ 結帳成功！訂單已成立，已正式向後端物流控制台發送出貨通知。");
      cart = [];
      cartModal.classList.remove("show");
      fetchAllData(); // 重新同步
    } catch(err) {
      alert("結帳失敗，請確認後端伺服器正常運行中。");
    }
  });
}

// ==================== 買賣家核心登入與權限管理 ====================
window.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        document.getElementById('loginModal').style.display = 'none';
        applyRoleTheme(user.role);
    } else {
        document.getElementById('loginModal').style.display = 'flex';
    }
});

function handleLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const role = document.getElementById('loginRole').value;
    
    if(!username) { alert('請輸入帳號！'); return; }
    
    const user = { username, role };
    localStorage.setItem('currentUser', JSON.stringify(user));
    document.getElementById('loginModal').style.display = 'none';
    
    applyRoleTheme(role);
    fetchAllData();
    alert(`登入成功！歡迎回到 2ndMUSE，${role === 'seller' ? '👑 賣家管理者' : '🛒 買家專員'}: ${username}`);
}

function applyRoleTheme(role) {
    if (role === 'seller') {
        document.getElementById('modalTitle').innerText = '💎 2ndMUSE 賣家管理後台';
        document.getElementById('buyerSection').style.display = 'none';
        document.getElementById('sellerSection').style.display = 'block';
    } else {
        document.getElementById('modalTitle').innerText = '🛒 2ndMUSE 買家會員中心';
        document.getElementById('buyerSection').style.display = 'block';
        document.getElementById('sellerSection').style.display = 'none';
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    alert('您已安全登出 2ndMUSE！');
    location.reload();
}

window.addEventListener("load", () => {
  fetchAllData();
});