const BASE_URL = "/api";

async function loadMainProducts() {
    const container = document.getElementById("main-products-grid") || document.querySelector(".product-grid");
    if (!container) return;

    try {
        const response = await fetch(`${BASE_URL}/products`);
        if (!response.ok) throw new Error("Ошибка загрузки товаров");

        const products = await response.json();
        
        const featuredProducts = products.slice(0, 4);

        container.innerHTML = "";

        featuredProducts.forEach(item => {
            container.innerHTML += `
                <div class="product-card">
                    <img src="${item.image_url}" alt="${item.title}" class="product-img">
                    <h3 class="product-title">${item.title}</h3>
                    <p class="product-desc">${item.description}</p>
                    <div class="product-price">${item.price} руб</div>
                    <a href="product.html?id=${item.id}" class="btn-details">ПОДРОБНЕЕ</a>
                </div>
            `;
        });
    } catch (error) {
        console.error("Ошибка при получении товаров для главной:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadMainProducts);
