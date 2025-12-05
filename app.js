// Инициализация карты
let map;
let markers = [];
let userCode = null;

// Проверка Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Инициализация карты
function initMap() {
    map = L.map('map').setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    loadFarms();
}

// Тестовые данные для демо-режима
const DEMO_FARMS = [
    {
        name: "Charltons Farm",
        address: "Maidstone, Kent",
        postcode: "ME17 3ND",
        email: "info@charltonsfarms.co.uk",
        operators: ["Fruitful Jobs", "Agri HR", "Concordia", "HOPS"],
        avgRating: 4.5,
        reviews: [
            { rating: 5, comment: "Отличная ферма, хорошие условия проживания", earnings: 3500, duration: 4 },
            { rating: 4, comment: "Много работы, дружный коллектив", earnings: 4200, duration: 5 }
        ],
        lat: 51.2787,
        lng: 0.5217
    },
    {
        name: "Berry Farming Ltd",
        address: "Littlehampton, West Sussex",
        postcode: "BN18 0DF",
        email: "monika.boduszek@ai-ltd.com",
        operators: ["Fruitful Jobs", "Pro-Force", "HOPS"],
        avgRating: 4.2,
        reviews: [
            { rating: 4, comment: "Хорошая оплата, много клубники", earnings: 3800, duration: 3 },
            { rating: 4, comment: "Рекомендую для новичков", earnings: 3200, duration: 4 }
        ],
        lat: 50.8097,
        lng: -0.5406
    },
    {
        name: "GS The Lettuce Company",
        address: "Ely, Cambridgeshire",
        postcode: "CB7 5TZ",
        email: "careers@gs-fresh.com",
        operators: ["Fruitful Jobs", "Concordia", "Pro-Force", "HOPS"],
        avgRating: 4.0,
        reviews: [
            { rating: 4, comment: "Большая компания, стабильная работа", earnings: 3600, duration: 6 }
        ],
        lat: 52.3990,
        lng: 0.2623
    },
    {
        name: "Thanet Earth",
        address: "Birchington, Kent",
        postcode: "CT7 0AX",
        email: "HR@thanetearth.com",
        operators: ["Pro-Force"],
        avgRating: 4.3,
        reviews: [
            { rating: 5, comment: "Современные теплицы, работа круглый год", earnings: 4500, duration: 6 },
            { rating: 4, comment: "Хорошие условия труда", earnings: 4000, duration: 5 }
        ],
        lat: 51.3761,
        lng: 1.3042
    },
    {
        name: "Haygrove Ltd",
        address: "Ledbury, Herefordshire",
        postcode: "HR8 2JL",
        email: "neli.manukova@haygrove.co.uk",
        operators: ["Fruitful Jobs", "Pro-Force"],
        avgRating: 4.7,
        reviews: [
            { rating: 5, comment: "Лучшая ферма! Отличный менеджмент", earnings: 4800, duration: 5 },
            { rating: 5, comment: "Очень рекомендую", earnings: 5000, duration: 6 },
            { rating: 4, comment: "Хорошая оплата и условия", earnings: 4200, duration: 4 }
        ],
        lat: 52.0364,
        lng: -2.4258
    },
    {
        name: "Allanhill Farming Company",
        address: "St Andrews, Fife",
        postcode: "KY16 8LJ",
        email: "Info@allanhill.co.uk",
        operators: ["Fruitful Jobs", "AGRI HR", "Concordia", "Pro-Force", "HOPS"],
        avgRating: 4.4,
        reviews: [
            { rating: 4, comment: "Хорошая ферма в Шотландии", earnings: 3900, duration: 4 },
            { rating: 5, comment: "Красивые места, дружелюбные люди", earnings: 4100, duration: 5 }
        ],
        lat: 56.3398,
        lng: -2.7967
    },
    {
        name: "Barfoot Farms",
        address: "Chichester, West Sussex",
        postcode: "PO21 3PX",
        email: "info@barfoots.co.uk",
        operators: ["Pro-Force"],
        avgRating: 4.1,
        reviews: [
            { rating: 4, comment: "Много разной работы, интересно", earnings: 3700, duration: 5 }
        ],
        lat: 50.8429,
        lng: -0.7751
    },
    {
        name: "Place UK Ltd",
        address: "Great Yarmouth, Norfolk",
        postcode: "NR12 8RQ",
        email: "info@placeuk.com",
        operators: ["Fruitful Jobs", "Pro-Force", "HOPS"],
        avgRating: 3.9,
        reviews: [
            { rating: 4, comment: "Нормальная ферма, стабильная работа", earnings: 3400, duration: 4 }
        ],
        lat: 52.6309,
        lng: 1.7297
    }
];

// Загрузка ферм с сервера
async function loadFarms() {
    try {
        // Если включен демо-режим, используем тестовые данные
        if (CONFIG.DEMO_MODE) {
            displayFarms(DEMO_FARMS);
            return;
        }
        
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getFarms`);
        const farms = await response.json();
        displayFarms(farms);
    } catch (error) {
        console.error('Ошибка загрузки ферм:', error);
        
        // В случае ошибки показываем демо-данные
        if (CONFIG.DEMO_MODE || CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
            console.log('Используются демо-данные');
            displayFarms(DEMO_FARMS);
        } else {
            alert('Не удалось загрузить данные. Проверьте настройки в config.js');
        }
    }
}

// Отображение ферм на карте
function displayFarms(farms) {
    // Очистка старых маркеров
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    // Добавление маркеров на карту
    farms.forEach(farm => {
        if (farm.lat && farm.lng) {
            const marker = L.marker([farm.lat, farm.lng])
                .addTo(map)
                .on('click', () => showFarmInfo(farm));
            markers.push(marker);
        }
    });
}

// Модальные окна
const codeModal = document.getElementById('codeModal');
const farmModal = document.getElementById('farmModal');
const infoModal = document.getElementById('infoModal');

document.getElementById('enterCodeBtn').onclick = () => {
    codeModal.style.display = 'block';
};

document.getElementById('addFarmBtn').onclick = () => {
    farmModal.style.display = 'block';
};

// Закрытие модальных окон
document.querySelectorAll('.close-btn').forEach(closeBtn => {
    closeBtn.onclick = function() {
        this.closest('.modal').style.display = 'none';
    };
});

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// Ввод кода
document.getElementById('submitCodeBtn').onclick = async () => {
    const code = document.getElementById('codeInput').value.trim();
    if (!code) {
        alert('Введите код');
        return;
    }
    
    // Демо-режим
    if (CONFIG.DEMO_MODE || CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        // В демо-режиме принимаем любой код формата FM********
        if (code.startsWith('FM') && code.length >= 4) {
            userCode = code;
            alert('ДЕМО-РЕЖИМ: Код принят! Теперь вы можете добавлять информацию.');
            codeModal.style.display = 'none';
            farmModal.style.display = 'block';
        } else {
            alert('Неверный формат кода. Используйте формат: FM12345678');
        }
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=verifyCode&code=${code}`);
        const result = await response.json();
        
        if (result.valid) {
            userCode = code;
            alert('Код принят! Теперь вы можете добавлять информацию.');
            codeModal.style.display = 'none';
            farmModal.style.display = 'block';
        } else {
            alert('Неверный код');
        }
    } catch (error) {
        console.error('Ошибка проверки кода:', error);
        alert('Ошибка проверки кода');
    }
};

// Рейтинг звёзд (Material Design 3)
const starBtns = document.querySelectorAll('.star-btn');
const ratingInput = document.getElementById('farmRating');

starBtns.forEach(btn => {
    btn.onclick = () => {
        const rating = btn.dataset.rating;
        ratingInput.value = rating;
        
        starBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.rating <= rating);
        });
    };
});

// Отправка формы
document.getElementById('farmForm').onsubmit = async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('farmName').value,
        address: document.getElementById('farmAddress').value,
        postcode: document.getElementById('farmPostcode').value.toUpperCase(),
        email: document.getElementById('farmEmail').value,
        operator: document.getElementById('farmOperator').value,
        rating: parseInt(document.getElementById('farmRating').value),
        comment: document.getElementById('farmComment').value,
        earnings: document.getElementById('farmEarnings').value,
        duration: document.getElementById('farmDuration').value,
        userCode: userCode
    };
    
    if (!formData.rating) {
        alert('Пожалуйста, поставьте оценку');
        return;
    }
    
    // Демо-режим
    if (CONFIG.DEMO_MODE || CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        alert('ДЕМО-РЕЖИМ: Данные не сохранены. Настройте Google Apps Script для сохранения данных.');
        
        // Генерируем демо-код
        if (!userCode) {
            const demoCode = 'FM' + Math.random().toString(36).substr(2, 8).toUpperCase();
            userCode = demoCode;
            document.querySelector('.code-display').textContent = demoCode;
            document.getElementById('generatedCode').style.display = 'block';
            document.getElementById('farmForm').style.display = 'none';
        } else {
            farmModal.style.display = 'none';
        }
        
        // Очистить форму
        document.getElementById('farmForm').reset();
        starBtns.forEach(s => s.classList.remove('active'));
        return;
    }
    
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Показать сгенерированный код
            if (result.code && !userCode) {
                userCode = result.code;
                document.querySelector('.code-display').textContent = result.code;
                document.getElementById('generatedCode').style.display = 'block';
                document.getElementById('farmForm').style.display = 'none';
            } else {
                alert('Информация успешно добавлена!');
                farmModal.style.display = 'none';
            }
            
            // Обновить карту
            loadFarms();
            
            // Очистить форму
            document.getElementById('farmForm').reset();
            starBtns.forEach(s => s.classList.remove('active'));
        } else {
            alert('Ошибка: ' + result.message);
        }
    } catch (error) {
        console.error('Ошибка отправки данных:', error);
        alert('Ошибка отправки данных');
    }
};

// Показать информацию о ферме (Material Design 3)
function showFarmInfo(farm) {
    const avgRating = farm.avgRating || 0;
    const filledStars = Math.round(avgRating);
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        starsHTML += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${i <= filledStars ? 1 : 0};">star</span>`;
    }
    
    let operatorsHTML = '<div class="operators">';
    farm.operators.forEach(op => {
        operatorsHTML += `<span class="operator-tag">${op}</span>`;
    });
    operatorsHTML += '</div>';
    
    let commentsHTML = '<div class="comments"><h3>Отзывы:</h3>';
    
    // Рекламный комментарий White Tax Returns (всегда первый)
    commentsHTML += `
        <div class="comment promo-comment">
            <div class="promo-header">
                <span class="material-symbols-outlined promo-icon">account_balance</span>
                <strong>White Tax Returns</strong>
            </div>
            <p><strong>White Tax Returns</strong> — официально зарегистрированное налоговое агентство, официальная бухгалтерия операторов Fruitful Jobs и Agri HR.</p>
            <p>🙋‍♂️ Вы тоже можете вернуть свои налоги!</p>
            <p>🙅‍♂️ Предоплаты нет</p>
            <p>👉 <a href="https://whitetax.site/sng" target="_blank" rel="noopener">whitetax.site/sng</a> — для подачи заявки</p>
        </div>
    `;
    
    // Отзывы пользователей
    farm.reviews.forEach(review => {
        let reviewStarsHTML = '';
        for (let i = 1; i <= 5; i++) {
            reviewStarsHTML += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${i <= review.rating ? 1 : 0};">star</span>`;
        }
        commentsHTML += `
            <div class="comment">
                <div class="comment-rating">${reviewStarsHTML}</div>
                <p>${review.comment || 'Без комментария'}</p>
                ${review.earnings ? `<p><strong>Заработок:</strong> £${review.earnings}</p>` : ''}
                ${review.duration ? `<p><strong>Длительность:</strong> ${review.duration} мес.</p>` : ''}
            </div>
        `;
    });
    commentsHTML += '</div>';
    
    const infoHTML = `
        <h2>${farm.name}</h2>
        <p><strong>Адрес:</strong> ${farm.address}</p>
        <p><strong>Postcode:</strong> ${farm.postcode}</p>
        ${farm.email ? `<p><strong>Email:</strong> ${farm.email}</p>` : ''}
        <div class="rating-display">${starsHTML} <span style="color: var(--md-sys-color-on-surface-variant);">(${avgRating.toFixed(1)})</span></div>
        <h3 style="font-size: 22px; font-weight: 500; margin-top: 16px;">Операторы:</h3>
        ${operatorsHTML}
        ${commentsHTML}
    `;
    
    document.getElementById('farmInfo').innerHTML = infoHTML;
    infoModal.style.display = 'block';
}

// Инициализация при загрузке
window.onload = () => {
    initMap();
    
    // Показать уведомление о демо-режиме
    if (CONFIG.DEMO_MODE || CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_SCRIPT_URL_HERE') {
        document.getElementById('demoNotice').style.display = 'flex';
    }
};
