const STORAGE_PRODUCTS = "2andmuse_products";
const STORAGE_WISHLIST = "2andmuse_wishlist";
const STORAGE_CART = "2andmuse_cart";
const STORAGE_INSPIRATIONS = "2andmuse_inspirations";

const defaultProducts = [];

let products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS)) || defaultProducts;
let wishlist = JSON.parse(localStorage.getItem(STORAGE_WISHLIST)) || [];
let cart = JSON.parse(localStorage.getItem(STORAGE_CART)) || [];
let inspirations = JSON.parse(localStorage.getItem(STORAGE_INSPIRATIONS)) || [];
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
let deleteMode = false;
let editMode = false;
let editingProductId = null;

function saveState() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
  localStorage.setItem(STORAGE_WISHLIST, JSON.stringify(wishlist));
  localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  localStorage.setItem(STORAGE_INSPIRATIONS, JSON.stringify(inspirations));
}

function formatPrice(value) {
  return `NT$${Number(value).toLocaleString()}`;
}

function buildProductCard(item) {
  const activeClass = wishlist.includes(item.id) ? "active" : "";
  let actionOverlay = "";
  if (deleteMode) {
    actionOverlay = `<button class="delete-prod" data-deleteprod="${item.id}" title="刪除商品">×</button>`;
  } else if (editMode) {
    actionOverlay = `<button class="edit-prod" data-editprod="${item.id}" title="編輯商品">✎</button>`;
  }
  return `
    <article class="product-card ${deleteMode ? "delete-mode" : editMode ? "edit-mode" : ""}" data-productid="${item.id}">
      ${actionOverlay}
      <img src="${item.image}" alt="${item.title}" />
      <div class="card-body">
        <div class="card-row">
          <h3>${item.title}</h3>
          <button class="icon-btn ${activeClass}" data-fav="${item.id}" title="收藏">
            ♥
          </button>
        </div>
        <p>${item.category}</p>
        <div class="card-row">
          <span class="price">${formatPrice(item.price)}</span>
          <button class="add-cart" data-add="${item.id}">加入購物袋</button>
        </div>
      </div>
    </article>
  `;
}

function renderProducts(items) {
  productGrid.innerHTML =
    items.length > 0
      ? items.map(buildProductCard).join("")
      : `<div class="empty-state">
           <h3>找不到商品</h3>
           <p>請嘗試其他關鍵字或分類</p>
         </div>`;
  productCount.textContent = items.length;
}

function renderFavorites() {
  const favorites = products.filter((p) => wishlist.includes(p.id));
  favoriteGrid.innerHTML =
    favorites.length > 0
      ? favorites
          .map(
            (item) => `
        <div class="favorite-item">
          <h4>${item.title}</h4>
          <p>${item.category} · ${formatPrice(item.price)}</p>
        </div>`
          )
          .join("")
      : `<div class="empty-state">
           <h3>收藏清單目前為空</h3>
           <p>點擊商品上的心形按鈕，加入收藏</p>
         </div>`;
  favCount.textContent = favorites.length;
}

function renderInspirations() {
  inspoGrid.innerHTML =
    inspirations.length > 0
      ? inspirations
          .map(
            (item) => `
        <article class="inspo-card">
          <img src="${item.image}" alt="穿搭靈感" />
          <button class="delete-inspo" data-delete="${item.id}" title="刪除">×</button>
        </article>`
          )
          .join("")
      : `<div class="empty-state">
           <h3>穿搭牆目前尚無圖片</h3>
           <p>上傳你的穿搭靈感，讓牆面更有感。</p>
         </div>`;
}

function renderCart() {
  if (cart.length === 0) {
    cartList.innerHTML = `<div class="empty-state">
      <h3>購物袋是空的</h3>
      <p>立即選購喜愛商品。</p>
    </div>`;
    cartTotal.textContent = "NT$0";
    cartCount.textContent = "0";
    return;
  }

  let total = 0;
  cartList.innerHTML = cart
    .map((item) => {
      total += Number(item.price);
      return `<div class="cart-item">
        <span>${item.title}</span>
        <strong>${formatPrice(item.price)}</strong>
      </div>`;
    })
    .join("");
  cartTotal.textContent = formatPrice(total);
  cartCount.textContent = cart.length;
}

function renderAccount() {
  const favorites = products.filter((p) => wishlist.includes(p.id));
  accountFavorites.innerHTML =
    favorites.length > 0
      ? favorites
          .map(
            (item) => `
        <div class="account-item">
          <h4>${item.title}</h4>
          <p>${item.category}</p>
        </div>`
          )
          .join("")
      : `<div class="empty-state">
           <h3>收藏清單目前為空</h3>
         </div>`;

  accountCartList.innerHTML =
    cart.length > 0
      ? cart
          .map(
            (item) => `
        <div class="account-item">
          <h4>${item.title}</h4>
          <p>${formatPrice(item.price)}</p>
        </div>`
          )
          .join("")
      : `<div class="empty-state">
           <h3>購物清單目前是空的</h3>
         </div>`;

  accountSummary.innerHTML = `
    <p>收藏 ${favorites.length} 件</p>
    <p>購物袋 ${cart.length} 件</p>
  `;
}

function setActiveNav(button) {
  document.querySelectorAll(".bottom-nav .nav-btn").forEach((btn) => btn.classList.remove("active"));
  if (button) button.classList.add("active");
}

function enterEditMode() {
  editMode = true;
  deleteMode = false;
  setActiveNav(editNav);
  updateDisplay();
  alert("編輯模式已開啟，點擊商品卡即可編輯資料。");
}

function enterDeleteMode() {
  deleteMode = !deleteMode;
  editMode = false;
  setActiveNav(deleteMode ? deleteNav : homeNav);
  updateDisplay();
  if (deleteMode) {
    alert("刪除模式開啟，點擊商品卡即可刪除商品。靈感牆可直接點選刪除按鈕。");
  }
}

function openEditProduct(item) {
  editingProductId = item.id;
  document.getElementById("sellTitle").value = item.title;
  document.getElementById("sellPrice").value = item.price;
  document.getElementById("sellCategory").value = item.category;
  document.getElementById("sellImage").value = "";
  document.querySelector("#sellModal h2").textContent = "編輯商品";
  document.getElementById("confirmSell").textContent = "更新商品";
  sellModal.classList.add("show");
}

function resetSellModal() {
  editingProductId = null;
  document.querySelector("#sellModal h2").textContent = "刊登新品";
  document.getElementById("confirmSell").textContent = "確定刊登";
  document.getElementById("sellTitle").value = "";
  document.getElementById("sellPrice").value = "";
  document.getElementById("sellImage").value = "";
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase();
  return products.filter((item) => {
    const matchesCategory =
      currentCategory === "all" || item.category === currentCategory;
    const matchesSearch =
      query === "" ||
      item.title.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

function renderModeBanner() {
  if (!modeBanner) return;
  if (editMode) {
    modeBanner.textContent = "編輯模式：點擊鉛筆按鈕編輯商品，或點擊 HOME 返回一般模式。";
  } else if (deleteMode) {
    modeBanner.textContent = "刪除模式：點擊垃圾桶按鈕刪除商品，或點擊 HOME 返回一般模式。";
  } else {
    modeBanner.textContent = "目前模式：瀏覽商品。";
  }
}

function updateDisplay() {
  renderProducts(getFilteredProducts());
  renderFavorites();
  renderInspirations();
  renderCart();
  renderModeBanner();
  saveState();
}

function setActiveCategory(button) {
  categoryButtons.forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
}

productGrid.addEventListener("click", (event) => {
  const deleteProdId = event.target.dataset.deleteprod;
  const editProdId = event.target.dataset.editprod;

  if (deleteProdId) {
    const id = Number(deleteProdId);
    products = products.filter((item) => item.id !== id);
    wishlist = wishlist.filter((itemId) => itemId !== id);
    cart = cart.filter((item) => item.id !== id);
    updateDisplay();
    return;
  }

  if (editProdId) {
    const id = Number(editProdId);
    const product = products.find((item) => item.id === id);
    if (product) {
      openEditProduct(product);
    }
    return;
  }

  const favId = event.target.dataset.fav;
  const addId = event.target.dataset.add;
  if (favId) {
    const id = Number(favId);
    const index = wishlist.indexOf(id);
    if (index >= 0) {
      wishlist.splice(index, 1);
    } else {
      wishlist.push(id);
    }
    updateDisplay();
    return;
  }
  if (addId) {
    const id = Number(addId);
    const product = products.find((item) => item.id === id);
    if (product) {
      cart.push(product);
      updateDisplay();
      alert("已加入購物袋！");
    }
    return;
  }
});

inspoGrid.addEventListener("click", (event) => {
  const deleteId = event.target.dataset.delete;
  if (!deleteId) return;
  inspirations = inspirations.filter((item) => item.id !== Number(deleteId));
  updateDisplay();
});

uploadInspoButton.addEventListener("click", () => {
  if (!inspImageInput.files.length) {
    alert("請選擇一張圖片後再上傳。" );
    return;
  }

  const file = inspImageInput.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    inspirations.unshift({
      id: Date.now(),
      image: reader.result
    });
    inspImageInput.value = "";
    updateDisplay();
  };
  reader.readAsDataURL(file);
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentCategory = button.dataset.cat;
    setActiveCategory(button);
    renderProducts(getFilteredProducts());
  });
});

searchButton.addEventListener("click", () => {
  renderProducts(getFilteredProducts());
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    renderProducts(getFilteredProducts());
  }
});

homeNav.addEventListener("click", () => {
  setActiveNav(homeNav);
  editMode = false;
  deleteMode = false;
  updateDisplay();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

editNav.addEventListener("click", () => {
  enterEditMode();
});

deleteNav.addEventListener("click", () => {
  enterDeleteMode();
});

accountNav.addEventListener("click", () => {
  setActiveNav(accountNav);
  renderAccount();
  accountModal.classList.add("show");
});

document.addEventListener("click", (event) => {
  const closeBtn = event.target.closest("[data-close]");
  if (closeBtn) {
    sellModal.classList.remove("show");
    cartModal.classList.remove("show");
    accountModal.classList.remove("show");
    editMode = false;
    deleteMode = false;
    setActiveNav(homeNav);
    resetSellModal();
  }
});

openSellButton.addEventListener("click", () => {
  sellModal.classList.add("show");
});

openCartButton.addEventListener("click", () => {
  cartModal.classList.add("show");
  renderCart();
});

document.getElementById("confirmSell").addEventListener("click", () => {
  const title = document.getElementById("sellTitle").value.trim();
  const price = Number(document.getElementById("sellPrice").value.trim());
  const category = document.getElementById("sellCategory").value;
  const fileInput = document.getElementById("sellImage");

  if (!title || !price) {
    alert("請填寫完整商品資訊。");
    return;
  }

  const saveProduct = (image) => {
    if (editingProductId) {
      products = products.map((item) =>
        item.id === editingProductId
          ? { ...item, title, category, price, image: image || item.image }
          : item
      );
      alert("商品已更新！");
    } else {
      products.unshift({
        id: Date.now(),
        title,
        category,
        price,
        image: image || ""
      });
      alert("商品已成功刊登！");
    }
    resetSellModal();
    sellModal.classList.remove("show");
    updateDisplay();
  };

  if (fileInput.files.length) {
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      saveProduct(reader.result);
      fileInput.value = "";
    };
    reader.readAsDataURL(file);
  } else {
    if (editingProductId) {
      saveProduct();
    } else {
      alert("請上傳商品圖片。若要更新商品，圖片可保留原來的。\n若要刊登新商品，必須上傳圖片。");
    }
  }
});

document.getElementById("checkoutButton").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("購物袋內沒有商品。");
    return;
  }
  alert("結帳完成，感謝您的訂購！");
  cart = [];
  updateDisplay();
  cartModal.classList.remove("show");
});

window.addEventListener("load", () => {
  updateDisplay();
});