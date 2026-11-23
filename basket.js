const BASE_URL = "/api";

window.openAuthModal = function() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('is-open');
    }
};

window.closeAuthModal = function() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('is-open');
    }
};

window.logoutUser = function() {
    localStorage.removeItem('kitty_user_id');
    localStorage.removeItem('kitty_username');
    loadBasket();
};

async function loadBasket() {
    const userId = localStorage.getItem('kitty_user_id');
    const username = localStorage.getItem('kitty_username');
    const container = document.getElementById('my-basket-box');

    if (!container) return;

    if (!userId) {
        container.innerHTML = `
            <div class="basket-item">
                <p>Войдите в профиль, чтобы увидеть вашу корзину и оформить заказ.</p>
            </div>
            <div class="basket-action">
                <a href="#" id="checkout-btn">ВОЙТИ ИЛИ ЗАРЕГИСТРИРОВАТЬСЯ</a>
            </div>
        `;
        document.getElementById('checkout-btn').onclick = (e) => {
            e.preventDefault();
            window.openAuthModal();
        };
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/cart`, {
            method: 'GET',
            headers: { 'user-id': userId }
        });

        if (response.status === 401) {
            window.logoutUser();
            return;
        }

        if (!response.ok) {
            throw new Error('Ошибка сервера при загрузке корзины');
        }

        const cartItems = await response.json();

        const userHeader = `
            <div class="basket-item basket-user-bar">
                <p>Покупатель: <strong>${username}</strong></p>
                <a href="#" id="logout-link" class="basket-logout-link">Выйти</a>
            </div>
        `;

        if (!cartItems || cartItems.length === 0) {
            container.innerHTML = `
                ${userHeader}
                <div class="basket-item">
                    <p>Ваша корзина пока пуста.</p>
                </div>
            `;
            document.getElementById('logout-link').onclick = (e) => {
                e.preventDefault();
                window.logoutUser();
            };
            return;
        }

        let totalSum = 0;
        let itemsHtml = '';

        cartItems.forEach(item => {
            const itemPrice = item.price * item.quantity;
            totalSum += itemPrice;
            itemsHtml += `
                <div class="basket-item">
                    <p>${item.title} (${item.quantity} шт)</p>
                    <strong>${itemPrice} руб</strong>
                </div>
            `;
        });

        container.innerHTML = `
            ${userHeader}
            ${itemsHtml}
            <div class="basket-total">
                <strong>Итоговая сумма:</strong>
                <span class="basket-total-price">${totalSum} руб</span>
            </div>
            <div class="basket-action">
                <a href="#" id="checkout-btn">ОФОРМИТЬ ЗАКАЗ</a>
            </div>
        `;

        document.getElementById('logout-link').onclick = (e) => {
            e.preventDefault();
            window.logoutUser();
        };

        document.getElementById('checkout-btn').onclick = (e) => {
            e.preventDefault();
            alert(`Спасибо, ${username}! Ваш заказ на сумму ${totalSum} руб оформлен.`);
        };

    } catch (error) {
        console.error('Ошибка при загрузке корзины:', error);
        container.innerHTML = `
            <div class="basket-item">
                <p class="basket-error">Не удалось загрузить корзину. Проверьте, запущен ли сервер FastAPI.</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadBasket();

    const modal = document.getElementById('login-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const authForm = document.getElementById('auth-form');
    const regBtn = document.getElementById('submit-register');

    if (closeBtn) closeBtn.onclick = window.closeAuthModal;
    window.onclick = (e) => { if (e.target === modal) window.closeAuthModal(); };

    if (authForm) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            const username = document.getElementById('auth-username').value.trim();
            const password = document.getElementById('auth-password').value;

            try {
                const response = await fetch(`${BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('kitty_user_id', data.user_id);
                    localStorage.setItem('kitty_username', data.username);
                    window.closeAuthModal();
                    authForm.reset();
                    loadBasket();
                } else {
                    const err = await response.json();
                    alert('Ошибка авторизации: ' + (err.detail || 'Неверные данные'));
                }
            } catch (error) {
                alert('Не удалось связаться с сервером FastAPI при авторизации.');
            }
        };
    }

    if (regBtn) {
        regBtn.onclick = async (e) => {
            e.preventDefault();
            const username = document.getElementById('auth-username').value.trim();
            const password = document.getElementById('auth-password').value;

            if (!username || !password) {
                alert('Заполните поля логина и пароля для регистрации!');
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    alert('Профиль успешно создан! Теперь нажмите кнопку "Войти и оформить"');
                } else {
                    const err = await response.json();
                    alert('Ошибка регистрации: ' + (err.detail || 'Логин занят'));
                }
            } catch (error) {
                alert('Не удалось связаться с сервером при регистрации.');
            }
        };
    }
});
