const BASE_URL = "/api";

async function loadProductDetail() {
    const container = document.getElementById("product-detail-box");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id") || "1";

    try {
        const response = await fetch(`${BASE_URL}/products/${productId}`);

        if (response.status === 404) {
            container.innerHTML = `
                <h1 class="content-title">Товар не найден</h1>
                <p>К сожалению, такого средства нет в каталоге Китти Шоп.</p>
            `;
            return;
        }

        if (!response.ok) {
            throw new Error("Ошибка сервера");
        }

        const item = await response.json();
        document.title = `Китти Шоп — ${item.title}`;

        container.innerHTML = `
            <div class="product-detail-layout">
                <img src="${item.image_url}" alt="${item.title}" class="product-detail-img">
                <div class="product-detail-info">
                    <h1 class="content-title">${item.title}</h1>
                    <p class="product-detail-badge">Назначение: <strong>${item.description}</strong></p>
                    <p class="product-detail-text">
                        Оригинальное средство ухода из коллекции Китти Шоп. Подходит для ежедневного применения согласно рекомендациям по типу кожи.
                    </p>
                    <div class="product-detail-price">${item.price} руб.</div>
                    <button class="btn-buy" onclick="addSingleProductToCart('${item.id}')">Добавить в корзину</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Ошибка загрузки товара:", error);
        container.innerHTML = `<p class="basket-error">Не удалось загрузить данные товара. Проверьте, запущен ли сервер FastAPI.</p>`;
    }
}

async function addSingleProductToCart(productId) {
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
            body: JSON.stringify({ product_id: Number(productId), quantity: 1 })
        });

        if (response.ok) {
            alert("Товар успешно добавлен в корзину Китти Шопа! 😻");
        } else {
            const err = await response.json();
            alert("Не удалось добавить товар: " + (err.detail || "Ошибка сервера"));
        }
    } catch (error) {
        alert("Ошибка соединения с сервером.");
    }
}

document.addEventListener("DOMContentLoaded", loadProductDetail);
