function initMap() {
    const statusElement = document.getElementById('map-status');

    try {
        if (typeof ymaps === 'undefined') {
            throw new Error("Библиотека карт недоступна");
        }

        const myMap = new ymaps.Map("map", {
            center: [59.9323, 30.3601],
            zoom: 16,
            controls: ['zoomControl']
        });

        const myPlacemark = new ymaps.Placemark([59.9323, 30.3601], {
            balloonContentHeader: "Китти Шоп 🐱",
            balloonContentBody: "Красота и забота в каждом флаконе!",
            balloonContentFooter: "Невский проспект, д. 102"
        });


        myMap.geoObjects.add(myPlacemark);

        if (statusElement) statusElement.style.display = 'none';

    } catch (error) {
        showMapError();
    }
}

function showMapError() {
    const statusElement = document.getElementById('map-status');
    const mapElement = document.getElementById('map');
    
    if (statusElement) {
        statusElement.textContent = "Не удалось загрузить интерактивную карту.";
        statusElement.style.color = "#e63946"; 
    }
    if (mapElement) {
        mapElement.innerHTML = `
            <div class="error-fallback">
                <strong class="error-fallback-title">📍 Карта временно недоступна</strong>
                <p class="error-fallback-text">
                    Проверьте подключение к интернету.<br>Ждем вас по адресу: Невский проспект, д. 102
                </p>
            </div>`;
    }
}

// Запуск карты
if (typeof ymaps !== 'undefined') {
    ymaps.ready(initMap);
} else {
    window.addEventListener('DOMContentLoaded', showMapError);
}

document.getElementById('feedback-form').addEventListener('submit', function(event) {
    event.preventDefault(); 
    
    let isValid = true;
    
    const username = document.getElementById('username');
    const email = document.getElementById('email');
    const message = document.getElementById('message');
    
    const usernameError = document.getElementById('username-error');
    const emailError = document.getElementById('email-error');
    const messageError = document.getElementById('message-error');
    
    usernameError.textContent = '';
    emailError.textContent = '';
    messageError.textContent = '';
    
    if (username.value.trim() === '') {
        usernameError.textContent = 'Пожалуйста, введите ваше имя';
        isValid = false;
    }
    
    if (email.value.trim() === '') {
        emailError.textContent = 'Пожалуйста, введите Email';
        isValid = false;
    } else if (!email.value.includes('@') || !email.value.includes('.')) {
        emailError.textContent = 'Email должен содержать знаки @ и точку';
        isValid = false;
    }
    
    if (message.value.trim() === '') {
        messageError.textContent = 'Напишите текст сообщения';
        isValid = false;
    }
    
    if (isValid) {
        alert('Форма заполнена корректно! Ошибок нет.');
        document.getElementById('feedback-form').reset();
    }
});
