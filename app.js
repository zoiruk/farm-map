// Инициализация карты
let map;
let markers = [];
let userEmail = null;
let googleUser = null;

// Система уведомлений Material Design 3
function showNotification(message, type = 'info', duration = 4000) {
    // Создаем контейнер для уведомлений если его нет
    let container = document.getElementById('notifications-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifications-container';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }

    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Иконка в зависимости от типа
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    
    notification.innerHTML = `
        <span class="material-symbols-outlined notification-icon">${icons[type] || 'info'}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;
    
    // Добавляем в контейнер
    container.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Автоматическое удаление
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// Проверка Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

// Получение эмодзи по типу фермы
function getFarmEmoji(type) {
    const emojis = {
        'vegetables': '🥬',
        'tomatoes': '🍅',
        'berries': '🍓',
        'mushrooms': '🍄',
        'flowers': '🌷',
        'apples': '🍎'
    };
    return emojis[type] || '🌾';
}

// Получение названия типа фермы
function getFarmTypeName(type) {
    const names = {
        'vegetables': 'Овощная ферма',
        'tomatoes': 'Томатная ферма',
        'berries': 'Ягодная ферма',
        'mushrooms': 'Грибная ферма',
        'flowers': 'Цветочная ферма',
        'apples': 'Яблочная ферма'
    };
    return names[type] || 'Ферма';
}

// Список известных ферм для автодополнения
const KNOWN_FARMS = [
    "Farplants", "Charltons Farm", "RUMWOOD GREEN FARM LTD", "Agri Fruit Ltd", "GPH Mushrooms",
    "Gilfresh Produce", "Drimbown / Monagham Mushrooms", "D.Geddes Farms Ltd", "Treberva Fruit Farm Ltd",
    "Edward Vinson", "G H Dean & Co. Ltd.", "TH Clement and Son Limited", "Staples Vegetables",
    "W Glen Limited", "D & J Hayward Growers", "Vicarage Nurseries Ltd", "Nyetimber Ltd",
    "Castleton Farm", "Essex Growers", "MWW Farms Ltd", "JR Clarke and Partners (Manor Farm Fruits)",
    "Berry Farming Ltd", "Raymond Rankin Farmer", "Bridge Mushrooms LTD", "C & L Mushrooms LTD",
    "Mac Ivors Cider / MacNeice Fruit Ltd", "Foxberry Fruit Farm", "Hughes Mushrooms",
    "GS The Lettuce Company", "GS Barway Services Ltd", "Barcham Trees PLC", "Valley Grown Salads",
    "G A Stevenson", "North Maldon Growers Ltd", "P.G Rix Farms Ltd", "Agrial Fresh Farms LTD",
    "Boxford / Peake Fruit", "Intercrop LTD", "A.C. Hulme & Sons", "Kelsey Farm", "FW Mansfield & Son",
    "Thanet Earth", "New Farm Produce Limited", "Seahills Farm", "LM Porter", "PJ Stirling",
    "Busby Partners Ltd", "Tasker Partnership", "Abbey View Produce", "Frank Clarke and Sons Limited",
    "Mushrooms Scotland", "Craigmarloch Nurseries Ltd", "Blackmoor Estate", "HA Trim",
    "S & A Produce (UK) Ltd", "A.J. & C.I. Snell", "Moorcourt Fruit", "Withers Fruit Farm",
    "Haygrove Ltd", "Cobrey Farms", "EC Drummond fruit / Homme Soft Fruit Ltd", "Chicory Crops Ltd.",
    "Anchor Nurseries Ltd", "James Foskett Farms Ltd", "Ward Farming Ltd", "New Shoots Ltd",
    "Wests Farm Produce", "Bressingham Mushrooms", "Camstar Herbs LTD", "Suffolk Mushrooms Ltd",
    "Easter Grangemuir Farm", "Barnsmuir Farm", "KETTLE PRODUCE LTD", "East Lathrisk Farm",
    "Allanhill Farming Company LTD", "Blacketyside Farm", "Quaintil", "Dyson Farming Ltd",
    "Gaskains Limited", "Oakdene Farm / WB Chambers", "WB Chambers", "Clock House Farm Limited",
    "Winterwood Farms", "Hugh Lowe Farms Limited", "Laurence J Betts Limited.", "A C Goatham & Son",
    "FGA Farming Limited", "Hammond Produce Limited", "Place UK Ltd", "Portwood Asparagus J W Allen & Sons",
    "Sharrington Strawberries", "Moulton Bulbs", "Rokewood Ltd", "OAKLEY FARMS", "KJ Curson Ltd",
    "Bedlam Farms", "Alpress Farm", "Flountain Plants", "Leggates", "PRODUCE WORLD LTD",
    "CC McIntyre Farming", "James Mclntyre & Sons", "WP Bruce Farm", "A P Barrie & Co",
    "Steward of Tayside (Tofthill Farm)", "Langmead Farms", "Vitacress Salads Limited",
    "The Summer Berry Company", "Tangmere Airfield Nurseries Ltd", "Natures Way Foods",
    "Barfoot Farms LTD", "The Greenhouse Growers Ely", "Bryan Salads", "Lovana Nurseries",
    "Alan Baybutt & Sons LTD", "Olive Grove Salads Ltd", "T and E Forshaw", "Flavourfresh Salads Ltd",
    "Gore Hall Produce", "EU Plants limited", "B A Beare & Sons (Tulleys Farm)", "Barnsfold Nurseries",
    "Puffin Produce Ltd", "New Forest Fruit", "R & J Emery", "Salads Harvesting Ltd",
    "Dearnsdale Fruit", "A J Busby Limited", "Lower Reule Farm Ltd", "Bradley Farming",
    "G.R. & C.M. Cartwright & Son / Home Farm Produce Limited", "Bradon Soft Fruit Farm LTD",
    "RK Drysdale", "Fans Farming", "PDM Produce (UK) Ltd", "The Hadlow Estate", "Roughway Farm",
    "Adrian Scripps LTD", "Charrington Fruit Farms", "Cottage Farms", "Rockett Garden", "Rowe Farming",
    "Fentongollan Farms", "Varfell Farms Ltd", "RL Whear & Son Ltd", "Riviera Produce",
    "Southern England Farm", "CP Richards", "La Serra Ltd", "RedStar Growers", "Walsh Mushrooms",
    "Zenith Nurseries", "A S Green LTD", "Harpers Farming", "RRW Bartlet", "J Neil & Sons",
    "Drinkwater Mushrooms", "APearson and Sons (1949) LLP (Alderley Edge)", "APS Produce Middlewich",
    "LM Porter Rosemount Farm", "John P Gray & Son", "McIntyre Fruit Ltd", "James Mason Farms / Denbrae Farm",
    "Billington Farm", "Craigowl Farms Ltd", "Forest Produce UK Ltd", "Fruit farm", "GS Sandfields Farm",
    "Herb fresh LLP.", "JG PORTER", "Monkton farm", "Peacehill", "Peter Marshall & Co", "Redhouse Farm",
    "D A Baillie", "JC & MW Suckley", "Langdon Monor Farm", "Eaton Farm", "GS Littleport Mushrooms LLP",
    "Haylock Mushrooms", "Orchard Potatoes", "Shean Mushrooms", "Hopeman Christmas Trees",
    "Top Barn Produce", "G & B B Houlbrooke & Son Ltd", "Harrold Fruit Farming Ltd", "Valefresco Limited",
    "Bardsley Fruit Farming Limited", "Bardsley Horticulture LTD", "Easter Denhead Farm", "Abbotsham Farm",
    "AE Brown (Farms) LTD", "Bayne Farming Limited", "Bowley Farm", "Chilton Farm",
    "Cornish Labour Services Ltd", "Drummonds", "East End Nurseries Limited", "Esker Mushrooms Ltd",
    "Flixton Mooshrooms", "Forestview Organic", "Frank Rudd and Sons", "Freshfield", "Gasparro Produce",
    "Genovese Ltd", "Grange Lodge Farm", "Greenseed", "Gregorio's Produce Ltd", "J & A Growers Ltd",
    "J & C McDiarmid", "JDG Richards", "JH RICHARDS", "JH Richards (Cornwall)", "Jon Smith",
    "Josh and Tom Berry", "Keenaghan Mushrooms", "Kirkenel Orchards", "LF WMK LLP", "Logon",
    "Ltd (Langford)", "M&G Mushrooms", "Makins", "Maurice crouch", "McArdle", "Mee Farms",
    "Meikleour Trust", "Millets Fruit", "Myatt & Co", "NI Cockburn", "Nocton Farm", "Oakchurch",
    "OasthouseFarm", "Orchard Mushrooms Limited", "PD Samles", "PD Smales & Son", "Penerley Farm",
    "R & G Christie", "R & J Kessell", "RD Renwick", "Ricjard Rowan", "S Murdoch Farm",
    "Springhill Farm Onions", "Springhill Farm Tomatoes", "Starkeys Fruit", "Sterling Suffolk Limited",
    "Stubbins Marketing Ltd", "Tas Valley Mushrooms Ltd", "The Tomato Stall", "Twyman H W",
    "Valley Produce Ltd", "Vinyard Farming", "Wealmoor", "West Friarton", "Wey Street Farm",
    "Wykham Park Farm"
].sort();

// Инициализация карты
function initMap() {
    map = L.map('map').setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    loadFarms();
}



// Загрузка ферм с сервера
async function loadFarms() {
    try {
        console.log('Загружаем фермы с:', `${CONFIG.GOOGLE_SCRIPT_URL}?action=getFarms`);
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=getFarms`);
        console.log('Ответ загрузки ферм:', response.status, response.statusText);
        
        const farms = await response.json();
        console.log('Получено ферм:', farms.length, farms);
        
        displayFarms(farms);
    } catch (error) {
        console.error('Ошибка загрузки ферм:', error);
        showNotification('Не удалось загрузить данные. Проверьте настройки в config.js', 'error');
    }
}

// Отображение ферм на карте
function displayFarms(farms) {
    console.log('Отображаем фермы на карте:', farms.length);
    
    // Очистка старых маркеров
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Добавление маркеров на карту
    farms.forEach((farm, index) => {
        console.log(`Ферма ${index + 1}:`, {
            name: farm.name,
            postcode: farm.postcode,
            lat: farm.lat,
            lng: farm.lng,
            hasCoordinates: !!(farm.lat && farm.lng)
        });
        
        if (farm.lat && farm.lng) {
            // Создаем кастомную иконку с эмодзи
            const emoji = getFarmEmoji(farm.type);
            const customIcon = L.divIcon({
                html: `<div style="font-size: 32px; text-align: center; line-height: 1;">${emoji}</div>`,
                className: 'emoji-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [0, -40]
            });

            const marker = L.marker([farm.lat, farm.lng], { icon: customIcon })
                .addTo(map)
                .on('click', () => {
                    // Проверяем авторизацию
                    if (!userEmail) {
                        authModal.style.display = 'block';
                        return;
                    }
                    showFarmInfo(farm);
                });

            // Добавляем tooltip с названием и типом
            const typeName = getFarmTypeName(farm.type);
            marker.bindTooltip(`${emoji} ${farm.name}<br><small>${typeName}</small>`, {
                permanent: false,
                direction: 'top',
                className: 'farm-tooltip'
            });

            markers.push(marker);
            console.log(`Маркер добавлен для ${farm.name} в координатах [${farm.lat}, ${farm.lng}]`);
        } else {
            console.warn(`Ферма ${farm.name} не имеет координат:`, farm);
        }
    });
    
    console.log(`Всего маркеров на карте: ${markers.length}`);
}

// Модальные окна
const authModal = document.getElementById('authModal');
const farmModal = document.getElementById('farmModal');
const infoModal = document.getElementById('infoModal');

// Проверка авторизации при загрузке
function checkAuth() {
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        userEmail = savedEmail;
        updateUIForLoggedInUser();
    }
}

// Обновление UI для авторизованного пользователя
function updateUIForLoggedInUser() {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('userEmail').textContent = userEmail;
}

// Обновление UI для неавторизованного пользователя
function updateUIForLoggedOutUser() {
    document.getElementById('loginBtn').style.display = 'flex';
    document.getElementById('userInfo').style.display = 'none';
    userEmail = null;
    localStorage.removeItem('userEmail');
}

// Кнопка "Войти"
document.getElementById('loginBtn').onclick = () => {
    authModal.style.display = 'block';
};

// Кнопка "Выйти"
document.getElementById('logoutBtn').onclick = () => {
    if (confirm('Вы уверены, что хотите выйти?')) {
        updateUIForLoggedOutUser();
        if (googleUser) {
            google.accounts.id.disableAutoSelect();
        }
    }
};

// Кнопка "Войти" в модальном окне авторизации
document.getElementById('loginSubmitBtn').onclick = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    
    if (!email) {
        showNotification('Введите Gmail', 'warning');
        return;
    }
    
    // Проверяем, что это Gmail
    if (!email.endsWith('@gmail.com')) {
        showNotification('Пожалуйста, используйте Gmail аккаунт (example@gmail.com)', 'warning');
        return;
    }
    
    // Проверяем регистрацию
    await checkUserRegistration(email);
};

// Кнопка "Добавить отзыв" в модальном окне авторизации
document.getElementById('addReviewBtn').onclick = () => {
    authModal.style.display = 'none';
    farmModal.style.display = 'block';
};

// Кнопка "Добавить ферму"
document.getElementById('addFarmBtn').onclick = () => {
    farmModal.style.display = 'block';
};

// Закрытие модальных окон
document.querySelectorAll('.close-btn').forEach(closeBtn => {
    closeBtn.onclick = function () {
        this.closest('.modal').style.display = 'none';
    };
});

window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
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
        type: document.getElementById('farmType').value,
        name: document.getElementById('farmName').value,
        address: document.getElementById('farmAddress').value,
        postcode: document.getElementById('farmPostcode').value.toUpperCase(),
        email: document.getElementById('farmEmail').value,
        operator: document.getElementById('farmOperator').value,
        rating: parseInt(document.getElementById('farmRating').value),
        comment: document.getElementById('farmComment').value,
        earnings: document.getElementById('farmEarnings').value,
        duration: document.getElementById('farmDuration').value,
        userGmail: document.getElementById('userGmail').value
    };

    if (!formData.rating) {
        showNotification('Пожалуйста, поставьте оценку', 'warning');
        return;
    }

    console.log('Отправляем данные:', formData);
    showNotification('Отправляем данные...', 'info', 2000);

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        console.log('Ответ сервера:', response.status, response.statusText);
        
        const result = await response.json();
        console.log('Результат:', result);

        if (result.success) {
            // Сохраняем Gmail пользователя для автоматического входа
            userEmail = formData.userGmail;
            localStorage.setItem('userEmail', userEmail);
            updateUIForLoggedInUser();

            showNotification('Информация успешно добавлена! Теперь вы можете входить используя ваш Gmail: ' + userEmail, 'success', 6000);
            farmModal.style.display = 'none';

            // Обновить карту
            console.log('Обновляем карту...');
            loadFarms();

            // Очистить форму
            document.getElementById('farmForm').reset();
            starBtns.forEach(s => s.classList.remove('active'));
        } else {
            console.error('Ошибка от сервера:', result);
            showNotification('Ошибка: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка отправки данных:', error);
        showNotification('Ошибка отправки данных: ' + error.message, 'error');
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
    farm.reviews.forEach((review, index) => {
        let reviewStarsHTML = '';
        for (let i = 1; i <= 5; i++) {
            reviewStarsHTML += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${i <= review.rating ? 1 : 0};">star</span>`;
        }

        // Проверяем количество флагов
        const flags = review.flags || 0;
        const isHidden = flags >= 3;
        const isSuspicious = flags >= 1 && flags < 3;

        // Скрываем отзывы с 3+ флагами
        if (isHidden) {
            return;
        }

        commentsHTML += `
            <div class="comment ${isSuspicious ? 'suspicious-review' : ''}" data-review-index="${index}">
                ${isSuspicious ? '<div class="warning-badge">⚠️ Спорный отзыв</div>' : ''}
                <div class="comment-rating">${reviewStarsHTML}</div>
                <p>${review.comment || 'Без комментария'}</p>
                ${review.earnings ? `<p><strong>Заработок:</strong> £${review.earnings}</p>` : ''}
                ${review.duration ? `<p><strong>Длительность:</strong> ${review.duration} мес.</p>` : ''}
                <div class="review-actions">
                    <button class="report-btn" onclick="reportReview('${farm.postcode}', ${index})">
                        <span class="material-symbols-outlined">flag</span>
                        Пожаловаться
                    </button>
                    ${flags > 0 ? `<span class="flag-count">🚩 ${flags} жалоб${flags === 1 ? 'а' : flags < 5 ? 'ы' : ''}</span>` : ''}
                </div>
            </div>
        `;
    });
    commentsHTML += '</div>';

    const farmEmoji = getFarmEmoji(farm.type);
    const farmTypeName = getFarmTypeName(farm.type);

    const infoHTML = `
        <div style="text-align: center; font-size: 48px; margin-bottom: 16px;">${farmEmoji}</div>
        <h2>${farm.name}</h2>
        <p style="color: var(--md-sys-color-primary); font-weight: 500; margin-bottom: 12px;">${farmTypeName}</p>
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

// Функция жалобы на отзыв
window.reportReview = async function (postcode, reviewIndex) {
    // Запрашиваем причину
    const reason = prompt('Почему этот отзыв недостоверный?\n\n(Например: "Я работал на этой ферме, информация не соответствует действительности")\n\nПричина (опционально):');

    // Если пользователь отменил
    if (reason === null) {
        return;
    }

    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'reportReview',
                postcode: postcode,
                reviewIndex: reviewIndex,
                reason: reason || 'Причина не указана'
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Спасибо! Жалоба отправлена. Мы проверим этот отзыв. Если будет 3+ жалобы, отзыв будет скрыт автоматически.', 'success', 6000);
            // Обновить данные
            loadFarms();
        } else {
            showNotification('Ошибка: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Ошибка отправки жалобы:', error);
        showNotification('Не удалось отправить жалобу. Попробуйте позже.', 'error');
    }
};

// Инициализация автодополнения для названий ферм
function initFarmNameAutocomplete() {
    const input = document.getElementById('farmName');
    const suggestionsDiv = document.getElementById('farmSuggestions');
    
    if (!input || !suggestionsDiv) {
        console.error('Элементы автодополнения не найдены!');
        return;
    }
    
    console.log('Автодополнение инициализировано');
    
    // Убедимся, что поле доступно для ввода
    input.removeAttribute('readonly');
    input.removeAttribute('disabled');
    
    // При вводе текста
    input.addEventListener('input', function(e) {
        const value = this.value.toLowerCase().trim();
        
        console.log('Ввод:', value);
        
        // Очищаем список
        suggestionsDiv.innerHTML = '';
        
        // Если пусто - скрываем
        if (value.length < 1) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        // Фильтруем фермы
        const matches = KNOWN_FARMS.filter(farm => 
            farm.toLowerCase().includes(value)
        ).slice(0, 10); // Максимум 10 подсказок
        
        console.log('Найдено совпадений:', matches.length);
        
        // Если нет совпадений - показываем сообщение
        if (matches.length === 0) {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.style.color = '#666';
            div.style.fontStyle = 'italic';
            div.textContent = 'Нет совпадений. Вы можете ввести новое название.';
            suggestionsDiv.appendChild(div);
            suggestionsDiv.style.display = 'block';
            return;
        }
        
        // Показываем подсказки
        matches.forEach(farmName => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = farmName;
            
            // При клике на подсказку
            div.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                input.value = farmName;
                suggestionsDiv.style.display = 'none';
                input.focus();
            };
            
            suggestionsDiv.appendChild(div);
        });
        
        suggestionsDiv.style.display = 'block';
    });
    
    // При фокусе показываем все варианты
    input.addEventListener('focus', function() {
        if (this.value.length > 0) {
            // Триггерим событие input для показа подсказок
            this.dispatchEvent(new Event('input'));
        }
    });
    
    // Скрыть при клике вне поля
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
    
    // Навигация клавиатурой
    let selectedIndex = -1;
    input.addEventListener('keydown', (e) => {
        const items = suggestionsDiv.querySelectorAll('.suggestion-item');
        
        if (e.key === 'Escape') {
            suggestionsDiv.style.display = 'none';
            selectedIndex = -1;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items, selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
            updateSelection(items, selectedIndex);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            items[selectedIndex].click();
            selectedIndex = -1;
        }
    });
    
    function updateSelection(items, index) {
        items.forEach((item, i) => {
            if (i === index) {
                item.style.background = '#e3f2fd';
            } else {
                item.style.background = '';
            }
        });
    }
}

// Проверка регистрации пользователя
async function checkUserRegistration(email) {
    try {
        const response = await fetch(`${CONFIG.GOOGLE_SCRIPT_URL}?action=checkUser&email=${encodeURIComponent(email)}`);
        const result = await response.json();

        if (result.registered) {
            // Пользователь зарегистрирован
            userEmail = email;
            localStorage.setItem('userEmail', userEmail);
            updateUIForLoggedInUser();
            authModal.style.display = 'none';
            showNotification('Добро пожаловать, ' + email + '!', 'success');
        } else {
            // Пользователь не зарегистрирован
            showNotification('Этот Gmail не зарегистрирован. Добавьте отзыв о ферме, чтобы зарегистрироваться.', 'warning', 5000);
        }
    } catch (error) {
        console.error('Ошибка проверки пользователя:', error);
        showNotification('Ошибка проверки. Попробуйте позже.', 'error');
    }
}

// Инициализация при загрузке
window.onload = () => {
    initMap();
    initFarmNameAutocomplete();
    checkAuth();
};
