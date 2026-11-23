const BASE_URL = "/api";

let allProducts = [];

const skinTypeMap = {
    dry: "сухой",
    oily: "жирной",
    sensitive: "чувствительной"
};

async function fetchCatalog() {
    try {
        const response = await fetch(`${BASE_URL}/products`);
        if (!response.ok) throw new Error("Ошибка при загрузке каталога");

        allProducts = await response.json();
        updateCatalogView();
    } catch (error) {
        console.error("Ошибка при получении товаров:", error);
        const container = document.getElementById("product-container");
        if (container) {
            container.innerHTML = `<p class="basket-error">Не удалось загрузить товары. Проверьте, запущен ли сервер FastAPI.</p>`;
        }
    }
}

// 2. Отрисовка карточек в #product-container
function renderCatalog(productsList) {
    const container = document.getElementById("product-container");
    if (!container) return;

    container.innerHTML = "";

    if (productsList.length === 0) {
        container.innerHTML = "<p>По выбранным фильтрам товаров не найдено.</p>";
        return;
    }

        productsList.forEach(item => {
        container.innerHTML += `
            <div class="product-card">
                <a href="product.html?id=${item.id}" class="product-link">
                    <img src="${item.image_url}" alt="${item.title}" class="product-img">
                    <h3 class="product-title">${item.title}</h3>
                </a>
                <p class="product-desc">${item.description}</p>
                <div class="product-price">${item.price} руб.</div>
                <button class="btn-buy" onclick="addProductToCart('${item.id}')">Купить</button>
            </div>
        `;
    });
}

function updateCatalogView() {
    let result = [...allProducts];

    const checkedBoxes = Array.from(document.querySelectorAll(".skin-checkbox:checked"));
    if (checkedBoxes.length > 0) {
        const selectedKeywords = checkedBoxes.map(cb => skinTypeMap[cb.value]);
        result = result.filter(item => {
            const desc = item.description.toLowerCase();
            return selectedKeywords.some(keyword => desc.includes(keyword));
        });
    }

    const sortSelect = document.getElementById("price-sort");
    if (sortSelect) {
        if (sortSelect.value === "cheap") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortSelect.value === "expensive") {
            result.sort((a, b) => b.price - a.price);
        }
    }

    renderCatalog(result);
}

async function addProductToCart(productId) {
    const currentUserId = localStorage.getItem("kitty_user_id");

    if (!currentUserId) {
        alert("Чтобы добавить товар в корзину, сначала войдите в профиль на странице корзины!");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "user-id": currentUserId
            },
            body: JSON.stringify({ product_id: productId, quantity: 1 })
        });

        if (response.ok) {
            alert("Товар успешно добавлен в корзину Китти Шопа! 😻");
        } else {
            const err = await response.json();
            alert("Не удалось добавить товар: " + (err.detail || "Ошибка сервера"));
        }
    } catch (error) {
        console.error("Ошибка сети:", error);
        alert("Не удалось связаться с сервером.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetchCatalog();

    const sortSelect = document.getElementById("price-sort");
    if (sortSelect) {
        sortSelect.addEventListener("change", updateCatalogView);
    }

    const checkboxes = document.querySelectorAll(".skin-checkbox");
    checkboxes.forEach(cb => {
        cb.addEventListener("change", updateCatalogView);
    });
});
