// Telegram Web App Integration
class TelegramWebApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isInTelegram = !!this.tg;
        this.user = null;
        
        if (this.isInTelegram) {
            this.init();
        }
    }
    
    init() {
        // Инициализация Telegram Web App
        this.tg.ready();
        this.tg.expand();
        
        // Получаем данные пользователя
        this.user = this.tg.initDataUnsafe?.user;
        
        console.log('🤖 Telegram Web App initialization:');
        console.log('- initDataUnsafe:', this.tg.initDataUnsafe);
        console.log('- user:', this.user);
        console.log('- platform:', this.tg.platform);
        console.log('- version:', this.tg.version);
        
        // Если пользователь не найден в initDataUnsafe, попробуем другие способы
        if (!this.user && this.tg.initData) {
            console.log('🔍 Trying to parse initData manually...');
            try {
                const urlParams = new URLSearchParams(this.tg.initData);
                const userParam = urlParams.get('user');
                if (userParam) {
                    this.user = JSON.parse(decodeURIComponent(userParam));
                    console.log('✅ User found in initData:', this.user);
                }
            } catch (error) {
                console.log('❌ Failed to parse initData:', error);
            }
        }
        
        // Настраиваем тему
        this.setupTheme();
        
        // Настраиваем главную кнопку
        this.setupMainButton();
        
        // Настраиваем кнопку назад
        this.setupBackButton();
        
        // Обработчики событий
        this.setupEventHandlers();
        
        console.log('✅ Telegram Web App initialized with user:', this.user);
    }
    
    setupTheme() {
        if (!this.tg.themeParams) return;
        
        const theme = this.tg.themeParams;
        const root = document.documentElement;
        
        // Применяем цвета темы Telegram
        if (theme.bg_color) root.style.setProperty('--tg-bg-color', theme.bg_color);
        if (theme.text_color) root.style.setProperty('--tg-text-color', theme.text_color);
        if (theme.hint_color) root.style.setProperty('--tg-hint-color', theme.hint_color);
        if (theme.link_color) root.style.setProperty('--tg-link-color', theme.link_color);
        if (theme.button_color) root.style.setProperty('--tg-button-color', theme.button_color);
        if (theme.button_text_color) root.style.setProperty('--tg-button-text-color', theme.button_text_color);
        
        // Добавляем класс для Telegram темы
        document.body.classList.add('telegram-theme');
    }
    
    setupMainButton() {
        this.tg.MainButton.setText('Добавить ферму');
        this.tg.MainButton.color = this.tg.themeParams.button_color || '#2e7d32';
        this.tg.MainButton.textColor = this.tg.themeParams.button_text_color || '#ffffff';
        
        this.tg.MainButton.onClick(() => {
            if (window.app) {
                window.app.showAddFarmModal();
            }
        });
    }
    
    setupBackButton() {
        this.tg.BackButton.onClick(() => {
            // Закрываем модальные окна или возвращаемся назад
            if (window.app) {
                window.app.hideAllModals();
                window.app.hideFarmInfoPanel();
            }
            this.tg.BackButton.hide();
        });
    }
    
    setupEventHandlers() {
        // Обработчик изменения viewport
        this.tg.onEvent('viewportChanged', () => {
            console.log('Viewport changed:', this.tg.viewportHeight, this.tg.viewportStableHeight);
        });
        
        // Обработчик изменения темы
        this.tg.onEvent('themeChanged', () => {
            this.setupTheme();
        });
    }
    
    showMainButton(text = 'Добавить ферму') {
        this.tg.MainButton.setText(text);
        this.tg.MainButton.show();
    }
    
    hideMainButton() {
        this.tg.MainButton.hide();
    }
    
    showBackButton() {
        this.tg.BackButton.show();
    }
    
    hideBackButton() {
        this.tg.BackButton.hide();
    }
    
    sendData(data) {
        // Отправляем данные обратно в Telegram
        this.tg.sendData(JSON.stringify(data));
    }
    
    close() {
        this.tg.close();
    }
    
    showAlert(message) {
        this.tg.showAlert(message);
    }
    
    showConfirm(message, callback) {
        this.tg.showConfirm(message, callback);
    }
    
    hapticFeedback(type = 'impact', style = 'medium') {
        if (this.tg.HapticFeedback) {
            if (type === 'impact') {
                this.tg.HapticFeedback.impactOccurred(style); // light, medium, heavy
            } else if (type === 'notification') {
                this.tg.HapticFeedback.notificationOccurred(style); // error, success, warning
            } else if (type === 'selection') {
                this.tg.HapticFeedback.selectionChanged();
            }
        }
    }
    
    getUserData() {
        return {
            id: this.user?.id,
            firstName: this.user?.first_name,
            lastName: this.user?.last_name,
            username: this.user?.username,
            languageCode: this.user?.language_code,
            isPremium: this.user?.is_premium
        };
    }
    
    isUserAuthorized() {
        return !!this.user;
    }
}

// UK Farms Map - Main Application
class UKFarmsMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.farms = [];
        this.currentUser = null;
        this.farmInfoPanel = null;
        this.currentTheme = 'light';
        this.currentReviewFarm = null;
        this.filteredFarms = [];
        this.activeFilters = {};
        
        // Инициализация Telegram Web App
        this.telegramApp = new TelegramWebApp();
        
        this.init();
    }

    async init() {
        try {
            this.initTheme();
            this.initTelegramIntegration();
            this.checkSavedUser();
            this.updateHeaderForUser(); // Ensure login button is always set up
            this.initPWA();
            this.initMap();
            this.initEventListeners();
            this.initFarmNameAutocomplete();
            this.initSearchAndFilters();
            this.initGeolocation();
            await this.loadFarms();
            
            const welcomeMessage = this.telegramApp.isInTelegram 
                ? `Добро пожаловать в Telegram Web App карты ферм UK! 🤖`
                : 'Добро пожаловать в карту ферм Великобритании!';
            this.showNotification(welcomeMessage, 'success');
        } catch (error) {
            console.error('Initialization error:', error);
            this.showNotification(CONFIG.ERROR_MESSAGES.SERVER_ERROR, 'error');
        }
    }
    
    initTelegramIntegration() {
        if (!this.telegramApp.isInTelegram) return;
        
        console.log('🤖 Telegram Web App detected');
        console.log('User authorized:', this.telegramApp.isUserAuthorized());
        console.log('User data:', this.telegramApp.getUserData());
        
        // Автоматическая авторизация через Telegram
        if (this.telegramApp.isUserAuthorized()) {
            const userData = this.telegramApp.getUserData();
            this.currentUser = {
                id: userData.id,
                firstName: userData.firstName,
                lastName: userData.lastName,
                username: userData.username,
                email: `${userData.username || userData.id}@telegram.user`, // Виртуальный email
                source: 'telegram',
                reviewCount: 0 // Telegram пользователи начинают с 0 отзывов
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('telegramUser', JSON.stringify(this.currentUser));
            localStorage.setItem('userEmail', this.currentUser.email);
            
            console.log('✅ Telegram user authorized:', this.currentUser);
        } else {
            // Fallback: если мы в Telegram Web App, но данные пользователя недоступны,
            // все равно считаем пользователя авторизованным
            console.log('⚠️ Telegram user data not available, using fallback authorization');
            this.currentUser = {
                id: 'telegram_user_' + Date.now(),
                firstName: 'Telegram',
                lastName: 'User',
                username: 'telegram_user',
                email: `telegram_user_${Date.now()}@telegram.user`,
                source: 'telegram',
                reviewCount: 0
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('telegramUser', JSON.stringify(this.currentUser));
            localStorage.setItem('userEmail', this.currentUser.email);
            
            console.log('✅ Telegram fallback user created:', this.currentUser);
        }
        
        // Настраиваем интерфейс для Telegram
        this.setupTelegramUI();
    }
    
    setupTelegramUI() {
        // Скрываем заголовок в Telegram (он есть в самом Telegram)
        const header = document.querySelector('.app-header');
        if (header) {
            header.style.display = 'none';
        }
        
        // Увеличиваем высоту карты
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.height = '100vh';
            mainContent.style.paddingBottom = '60px'; // Место для рекламы
        }
        
        // Показываем главную кнопку Telegram
        this.telegramApp.showMainButton('Добавить ферму');
        
        // Добавляем класс для стилизации
        document.body.classList.add('telegram-web-app');
    }

    checkSavedUser() {
        // Если пользователь уже авторизован через Telegram, не перезаписываем
        if (this.currentUser && this.currentUser.source === 'telegram') {
            console.log('🤖 Telegram user already authorized, skipping saved user check');
            return;
        }
        
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
            this.currentUser = { email: savedEmail };
            // Можно добавить счетчик отзывов пользователя
            const reviewCount = localStorage.getItem('userReviewCount') || '0';
            this.currentUser.reviewCount = parseInt(reviewCount);
            console.log('✅ Saved user loaded:', this.currentUser);
        }
    }

    updateHeaderForUser() {
        const loginBtn = document.getElementById('loginHeaderBtn');
        
        if (!loginBtn) {
            console.error('Login button not found in DOM');
            return;
        }
        
        // Очищаем предыдущие обработчики
        loginBtn.onclick = null;
        // Клонируем элемент чтобы удалить все event listeners
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        
        // Получаем новую ссылку на кнопку после клонирования
        const updatedLoginBtn = document.getElementById('loginHeaderBtn');
        
        if (this.currentUser) {
            // Показываем информацию о пользователе вместо кнопки входа
            updatedLoginBtn.innerHTML = `
                <span class="material-symbols-outlined">account_circle</span>
                <span class="btn-text-full">${this.currentUser.reviewCount || 0} отзывов</span>
                <span class="btn-text-short">${this.currentUser.reviewCount || 0}</span>
            `;
            updatedLoginBtn.title = `Открыть профиль пользователя`;
            updatedLoginBtn.className = 'btn-primary';
            updatedLoginBtn.style.cursor = 'pointer';
            
            // Устанавливаем обработчик для авторизованного пользователя
            updatedLoginBtn.addEventListener('click', () => {
                this.showUserProfile();
            });
        } else {
            // Показываем кнопку входа для неавторизованных пользователей
            updatedLoginBtn.innerHTML = `
                <span class="material-symbols-outlined">login</span>
                <span class="btn-text-full">Войти</span>
                <span class="btn-text-short">Войти</span>
            `;
            updatedLoginBtn.title = 'Войти в систему';
            updatedLoginBtn.className = 'btn-primary';
            updatedLoginBtn.style.cursor = 'pointer';
            
            // Устанавливаем обработчик для неавторизованного пользователя
            updatedLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Кнопка входа нажата - открываем модальное окно');
                this.showModal('loginModal');
            });
        }
    }

    initGeolocation() {
        if (!CONFIG.APP_SETTINGS.ENABLE_GEOLOCATION || !navigator.geolocation) {
            return;
        }

        // Добавляем кнопку геолокации на карту
        const locationControl = L.control({ position: 'topright' });
        locationControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.innerHTML = `
                <a href="#" title="Найти мое местоположение" role="button" aria-label="Найти мое местоположение">
                    <span class="material-symbols-outlined">my_location</span>
                </a>
            `;
            div.style.backgroundColor = 'white';
            div.style.width = '40px';
            div.style.height = '40px';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.cursor = 'pointer';

            div.onclick = (e) => {
                e.preventDefault();
                this.getCurrentLocation();
            };

            return div;
        };
        locationControl.addTo(this.map);
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showNotification('Геолокация не поддерживается вашим браузером', 'error');
            return;
        }

        const locationBtn = document.querySelector('.leaflet-control-custom a');
        const originalContent = locationBtn.innerHTML;
        locationBtn.innerHTML = '<div class="loading" style="width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #2e7d32; border-radius: 50%; animation: spin 1s linear infinite;"></div>';

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.handleLocationSuccess(latitude, longitude);
                locationBtn.innerHTML = originalContent;
            },
            (error) => {
                this.handleLocationError(error);
                locationBtn.innerHTML = originalContent;
            },
            options
        );
    }

    handleLocationSuccess(lat, lng) {
        // Сохраняем местоположение пользователя
        this.userLocation = { lat, lng };

        // Центрируем карту на местоположении пользователя
        this.map.setView([lat, lng], 12);

        // Добавляем маркер местоположения пользователя
        if (this.userLocationMarker) {
            this.map.removeLayer(this.userLocationMarker);
        }

        this.userLocationMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: '<div class="user-location-marker">📍</div>',
                className: 'user-location-marker-container',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);

        this.userLocationMarker.bindPopup('Ваше местоположение').openPopup();

        // Находим ближайшие фермы
        this.findNearbyFarms(lat, lng);

        this.showNotification('Местоположение определено! Теперь доступна фильтрация по радиусу', 'success');
    }

    handleLocationError(error) {
        let message = 'Не удалось определить местоположение';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                message = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера';
                break;
            case error.POSITION_UNAVAILABLE:
                message = 'Информация о местоположении недоступна';
                break;
            case error.TIMEOUT:
                message = 'Время ожидания определения местоположения истекло';
                break;
        }

        this.showNotification(message, 'error');
    }

    findNearbyFarms(userLat, userLng, radiusKm = 50) {
        const nearbyFarms = this.farms.filter(farm => {
            if (!farm.lat || !farm.lng) return false;
            const distance = this.calculateDistance(userLat, userLng, farm.lat, farm.lng);
            return distance <= radiusKm;
        }).sort((a, b) => {
            const distA = this.calculateDistance(userLat, userLng, a.lat, a.lng);
            const distB = this.calculateDistance(userLat, userLng, b.lat, b.lng);
            return distA - distB;
        });

        if (nearbyFarms.length > 0) {
            // Обновляем отображение ферм
            this.filteredFarms = nearbyFarms;
            this.updateMapDisplay();
            
            // Показываем уведомление с количеством найденных ферм
            this.showNotification(`Найдено ${nearbyFarms.length} ферм в радиусе ${radiusKm} км`, 'info');
        } else {
            this.showNotification(`В радиусе ${radiusKm} км ферм не найдено`, 'info');
        }
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Радиус Земли в км
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    initTheme() {
        // Используем только светлую тему
        this.currentTheme = 'light';
        document.documentElement.setAttribute('data-theme', 'light');
    }

    initMap() {
        this.map = L.map('map').setView(CONFIG.MAP_CONFIG.center, CONFIG.MAP_CONFIG.zoom);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            minZoom: CONFIG.MAP_CONFIG.minZoom,
            maxZoom: CONFIG.MAP_CONFIG.maxZoom
        }).addTo(this.map);

        // Initialize farm info panel
        this.farmInfoPanel = document.getElementById('farmInfoPanel');
    }

    initEventListeners() {
        // Initialize mobile gestures
        this.initMobileGestures();

        // Add farm button
        document.getElementById('addFarmBtn').addEventListener('click', () => {
            this.showAddFarmModal();
        });

        // Login header button - обработчик будет установлен в updateHeaderForUser()
        // document.getElementById('loginHeaderBtn').addEventListener('click', () => {
        //     this.showModal('loginModal');
        // });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.manualRefresh();
        });

        // Statistics button
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.showStatsModal();
        });

        // Close statistics modal
        document.getElementById('closeStatsBtn').addEventListener('click', () => {
            this.hideModal('statsModal');
        });

        // Statistics filters
        document.getElementById('applyStatsFiltersBtn').addEventListener('click', () => {
            this.applyStatsFilters();
        });

        document.getElementById('clearStatsFiltersBtn').addEventListener('click', () => {
            this.clearStatsFilters();
        });

        // PWA install button
        document.getElementById('installBtn').addEventListener('click', () => {
            this.installPWA();
        });

        // Update button
        document.getElementById('updateBtn').addEventListener('click', () => {
            this.updateApp();
        });

        // Dismiss update banner
        document.getElementById('dismissUpdateBtn').addEventListener('click', () => {
            this.dismissUpdate();
        });

        // Close profile modal
        document.getElementById('closeProfileBtn').addEventListener('click', () => {
            this.hideModal('profileModal');
        });

        // Modal close buttons
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.hideModal('addFarmModal');
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.hideModal('addFarmModal');
        });

        document.getElementById('closeLoginBtn').addEventListener('click', () => {
            this.hideModal('loginModal');
        });

        document.getElementById('cancelLoginBtn').addEventListener('click', () => {
            this.hideModal('loginModal');
        });

        // Review modal close buttons
        document.getElementById('closeReviewModalBtn').addEventListener('click', () => {
            this.hideModal('addReviewModal');
        });

        document.getElementById('cancelReviewBtn').addEventListener('click', () => {
            this.hideModal('addReviewModal');
        });

        // Panel close button
        document.getElementById('closePanelBtn').addEventListener('click', () => {
            this.hideFarmInfoPanel();
        });

        // Form submissions
        document.getElementById('addFarmForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddFarm();
        });

        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleLogin();
        });

        document.getElementById('registerByReviewBtn').addEventListener('click', () => {
            this.hideModal('loginModal');
            this.showAddFarmModal();
        });

        // Review form submission
        document.getElementById('addReviewForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddReview();
        });

        // Rating sliders
        document.getElementById('farmRating').addEventListener('input', (e) => {
            this.updateRatingDisplay(e.target.value);
        });

        document.getElementById('reviewRating').addEventListener('input', (e) => {
            this.updateReviewRatingDisplay(e.target.value);
        });

        // Search and filter controls
        document.getElementById('toggleFiltersBtn').addEventListener('click', () => {
            this.toggleFiltersPanel();
        });

        document.getElementById('clearSearchBtn').addEventListener('click', () => {
            this.clearSearch();
        });

        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            this.clearAllFilters();
        });

        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
                this.hideFarmInfoPanel();
            }
        });
    }

    initFarmNameAutocomplete() {
        const farmNameInput = document.getElementById('farmName');
        const suggestionsDiv = document.getElementById('farmNameSuggestions');
        
        let debounceTimer;
        
        farmNameInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.showFarmSuggestions(e.target.value, suggestionsDiv);
            }, CONFIG.APP_SETTINGS.DEBOUNCE_DELAY);
        });

        farmNameInput.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsDiv.style.display = 'none';
            }, 200);
        });
    }

    showFarmSuggestions(query, container) {
        if (query.length < 2) {
            container.style.display = 'none';
            return;
        }

        const matches = CONFIG.FAMOUS_FARMS.filter(farm => 
            farm.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10);

        if (matches.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.innerHTML = matches.map(farm => 
            `<div class="suggestion-item" onclick="app.selectFarmSuggestion('${farm}')">${farm}</div>`
        ).join('');
        
        container.style.display = 'block';
    }

    selectFarmSuggestion(farmName) {
        document.getElementById('farmName').value = farmName;
        document.getElementById('farmNameSuggestions').style.display = 'none';
    }

    updateRatingDisplay(rating) {
        const display = document.getElementById('ratingDisplay');
        display.textContent = '⭐'.repeat(parseInt(rating));
    }

    updateReviewRatingDisplay(rating) {
        const display = document.getElementById('reviewRatingDisplay');
        display.textContent = '⭐'.repeat(parseInt(rating));
    }

    async loadFarms() {
        try {
            const response = await this.apiCall('GET_FARMS');
            if (response.success) {
                this.farms = response.data || [];
                this.displayFarmsOnMap();
            }
        } catch (error) {
            console.error('Error loading farms:', error);
            // Load demo data for development
            this.loadDemoData();
        }
    }

    loadDemoData() {
        this.farms = [
            {
                id: 1,
                type: 'vegetables',
                name: 'G\'s Fresh',
                address: 'Ely, Cambridgeshire',
                postcode: 'CB7 4QW',
                operator: 'AgriHR',
                rating: 4,
                reviews: [
                    {
                        rating: 4,
                        comment: 'Хорошие условия работы, дружелюбный персонал',
                        date: '2024-11-15',
                        earnings: '£8500 за 3 месяца',
                        duration: '3 месяца'
                    }
                ],
                lat: 52.3980,
                lng: 0.2620
            },
            {
                id: 2,
                type: 'berries',
                name: 'Berry Gardens',
                address: 'Maidstone, Kent',
                postcode: 'ME15 9YT',
                operator: 'Concordia',
                rating: 5,
                reviews: [
                    {
                        rating: 5,
                        comment: 'Отличная ферма! Хорошая оплата и условия проживания',
                        date: '2024-10-20',
                        earnings: '£12000 за сезон (4 месяца)',
                        duration: '4 месяца'
                    }
                ],
                lat: 51.2704,
                lng: 0.5227
            }
        ];
        this.displayFarmsOnMap();
    }

    displayFarmsOnMap() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add new markers
        this.farms.forEach(farm => {
            if (farm.lat && farm.lng) {
                const marker = this.createFarmMarker(farm);
                this.markers.push(marker);
            }
        });
    }

    createFarmMarker(farm) {
        const farmType = CONFIG.FARM_TYPES[farm.type];
        const emoji = farmType ? farmType.emoji : '🏭';
        
        const marker = L.marker([farm.lat, farm.lng], {
            icon: L.divIcon({
                html: `<div class="custom-marker">${emoji}</div>`,
                className: 'custom-marker-container',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);

        marker.on('click', () => {
            this.showFarmInfo(farm);
        });

        // Add popup
        const avgRating = this.calculateAverageRating(farm.reviews || []);
        const isAuthorized = this.currentUser !== null;
        
        const popupContent = isAuthorized ? `
            <div class="farm-popup">
                <h3>${emoji} ${farm.name}</h3>
                <p><strong>Тип:</strong> ${farmType ? farmType.name : 'Неизвестно'}</p>
                <p><strong>Адрес:</strong> ${farm.address}</p>
                <p><strong>Оператор:</strong> ${this.formatOperators(farm)}</p>
                <p><strong>Рейтинг:</strong> ${'⭐'.repeat(avgRating)} (${farm.reviews?.length || 0} отзывов)</p>
                <button onclick="app.showFarmInfo(${JSON.stringify(farm).replace(/"/g, '&quot;')})" class="btn-primary" style="margin-top: 8px;">
                    Подробнее
                </button>
            </div>
        ` : `
            <div class="farm-popup" style="text-align: center; padding: 20px;">
                <span class="material-symbols-outlined" style="font-size: 32px; color: var(--md-sys-color-primary); margin-bottom: 12px; display: block;">lock</span>
                <h4 style="margin: 0 0 12px 0; color: var(--md-sys-color-on-surface);">Требуется авторизация</h4>
                <p style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 16px;">
                    Поделитесь опытом, чтобы получить доступ к информации
                </p>
                <button onclick="app.showFarmInfo(${JSON.stringify(farm).replace(/"/g, '&quot;')})" class="btn-primary" style="margin-top: 8px; width: 100%; font-size: 12px; padding: 8px 12px;">
                    Авторизоваться
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        
        return marker;
    }

    showFarmInfo(farm) {
        console.log('🏭 showFarmInfo called for:', farm.name);
        console.log('👤 Current user:', this.currentUser);
        console.log('🤖 Is in Telegram:', this.telegramApp.isInTelegram);
        
        // Проверяем авторизацию пользователя
        if (!this.currentUser) {
            console.log('❌ No current user, showing auth required message');
            this.showAuthRequiredMessage(farm);
            return;
        }
        
        console.log('✅ User authorized, showing farm info');

        const farmType = CONFIG.FARM_TYPES[farm.type];
        const avgRating = this.calculateAverageRating(farm.reviews || []);
        
        const content = `
            <div class="farm-card">
                <div class="farm-header">
                    <div class="farm-emoji">${farmType ? farmType.emoji : '🏭'}</div>
                    <div class="farm-title">
                        <h3 class="farm-name">${farm.name}</h3>
                        <p class="farm-type">${farmType ? farmType.name : 'Неизвестный тип'}</p>
                    </div>
                    <div class="farm-rating">
                        ${'⭐'.repeat(avgRating)}
                        <span>(${farm.reviews?.length || 0})</span>
                    </div>
                </div>
                
                <div class="farm-details">
                    <div class="farm-detail">
                        <span class="material-symbols-outlined">location_on</span>
                        ${farm.address}, ${farm.postcode}
                    </div>
                    <div class="farm-detail">
                        <span class="material-symbols-outlined">business</span>
                        ${this.formatOperators(farm)}
                    </div>
                </div>
                
                <div class="farm-reviews">
                    <h4>Отзывы работников</h4>
                    ${this.renderReviews(farm.reviews || [])}
                    
                    <button class="btn-primary mt-16" onclick="app.showAddReviewForm(${farm.id})">
                        <span class="material-symbols-outlined">add_comment</span>
                        Добавить отзыв
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('farmInfoContent').innerHTML = content;
        this.farmInfoPanel.classList.remove('hidden');
        
        // Показываем кнопку "Назад" в Telegram
        if (this.telegramApp.isInTelegram) {
            this.telegramApp.showBackButton();
        }
    }

    showAuthRequiredMessage(farm) {
        const content = `
            <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, var(--md-sys-color-primary-container), var(--md-sys-color-surface)); border-radius: 12px; margin: 20px 0;">
                <span class="material-symbols-outlined" style="font-size: 48px; color: var(--md-sys-color-primary); margin-bottom: 16px; display: block;">lock</span>
                <h3 style="color: var(--md-sys-color-on-primary-container); margin-bottom: 12px;">Требуется авторизация</h3>
                <p style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 16px; line-height: 1.5;">
                    Чтобы увидеть подробную информацию о фермах, отзывы работников, зарплаты и условия работы, поделитесь своим опытом.
                </p>
                <p style="color: var(--md-sys-color-primary); margin-bottom: 16px; font-size: 14px; font-weight: 500;">
                    💡 Принцип справедливого обмена: поделись опытом — получи доступ к опыту других!
                </p>
                <p style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 24px; font-size: 13px;">
                    Добавьте информацию о любой ферме, где вы работали, и получите полный доступ ко всей информации на сайте.
                </p>
                
                <button class="btn-primary" onclick="app.showAddFarmModal()" style="margin-bottom: 12px; width: 100%;">
                    <span class="material-symbols-outlined">add</span>
                    Добавить ферму и получить доступ
                </button>
                
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--md-sys-color-outline-variant);">
                    <p style="font-size: 12px; color: var(--md-sys-color-on-surface-variant); margin-bottom: 12px;">
                        Уже есть аккаунт?
                    </p>
                    <button class="btn-secondary" onclick="app.showModal('loginModal')" style="width: 100%;">
                        <span class="material-symbols-outlined">login</span>
                        Войти
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('farmInfoContent').innerHTML = content;
        this.farmInfoPanel.classList.remove('hidden');
        
        // Показываем кнопку "Назад" в Telegram
        if (this.telegramApp.isInTelegram) {
            this.telegramApp.showBackButton();
        }
    }

    renderAdBanner() {
        return `
            <div class="farm-detail" style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 16px; border-radius: 8px; margin: 16px 0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 250px;">
                    <span class="material-symbols-outlined">account_balance</span>
                    <div style="font-size: 13px; line-height: 1.4;">
                        ${CONFIG.AD_CONFIG.REVIEW_TEXT}
                    </div>
                </div>
                <a href="${CONFIG.AD_CONFIG.WEBSITE_URL}" target="_blank" style="background: rgba(255,255,255,0.2); color: white; text-decoration: none; padding: 8px 16px; border-radius: 20px; font-weight: 500; font-size: 12px; border: 1px solid rgba(255,255,255,0.3); white-space: nowrap; margin-top: 8px;">
                    ${CONFIG.AD_CONFIG.BUTTON_TEXT}
                </a>
            </div>
        `;
    }

    renderReviews(reviews) {
        // Всегда показываем рекламу как первый "отзыв"
        const adReview = this.renderAdAsReview();
        
        if (!reviews || reviews.length === 0) {
            return adReview + '<p style="color: var(--md-sys-color-on-surface-variant); font-style: italic; margin-top: 16px;">Пока нет отзывов от работников</p>';
        }

        const userReviews = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="review-rating">${'⭐'.repeat(review.rating || 3)}</div>
                    <div class="review-date">${this.formatDate(review.date)}</div>
                </div>
                <div class="review-text">${review.comment || 'Без комментария'}</div>
                ${review.operator ? `<div class="farm-detail"><span class="material-symbols-outlined">business</span>Оператор: <strong>${review.operator}</strong></div>` : ''}
                ${review.earnings ? `<div class="farm-detail"><span class="material-symbols-outlined">payments</span>Общий заработок: ${review.earnings}</div>` : ''}
                ${review.duration ? `<div class="farm-detail"><span class="material-symbols-outlined">schedule</span>Продолжительность: ${review.duration}</div>` : ''}
                <div class="review-actions">
                    <button class="btn-small" onclick="app.flagReview(${review.id || 0})">
                        <span class="material-symbols-outlined">flag</span>
                        Пожаловаться
                    </button>
                </div>
            </div>
        `).join('');

        return adReview + userReviews;
    }

    renderAdAsReview() {
        return `
            <div class="review-item ad-review">
                <div class="review-header">
                    <div class="review-rating">
                        <span class="material-symbols-outlined" style="color: #1976d2;">account_balance</span>
                        <strong style="color: #1976d2; margin-left: 8px;">Реклама</strong>
                    </div>
                    <div class="review-date">Спонсор</div>
                </div>
                <div class="review-text" style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 16px; border-radius: 8px; margin: 8px 0;">
                    <strong>${CONFIG.AD_CONFIG.COMPANY_NAME}</strong><br>
                    ${CONFIG.AD_CONFIG.REVIEW_TEXT}
                </div>
                <div class="review-actions">
                    <a href="${CONFIG.AD_CONFIG.WEBSITE_URL}" target="_blank" class="btn-small" style="background: #1976d2; color: white; text-decoration: none; border: none;">
                        <span class="material-symbols-outlined">open_in_new</span>
                        ${CONFIG.AD_CONFIG.BUTTON_TEXT}
                    </a>
                </div>
            </div>
        `;
    }

    calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review) => acc + (review.rating || 3), 0);
        return Math.round(sum / reviews.length);
    }

    formatDate(dateString) {
        if (!dateString) return 'Неизвестно';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    formatOperators(farm) {
        if (farm.operators && Array.isArray(farm.operators) && farm.operators.length > 1) {
            return `${farm.operators.join(', ')} <span style="color: var(--md-sys-color-primary); font-size: 12px;">(${farm.operators.length} операторов)</span>`;
        }
        return farm.operator || 'Неизвестно';
    }

    hideFarmInfoPanel() {
        this.farmInfoPanel.classList.add('hidden');
        
        // Скрываем кнопку "Назад" и показываем главную кнопку в Telegram
        if (this.telegramApp.isInTelegram) {
            this.telegramApp.hideBackButton();
            this.telegramApp.showMainButton('Добавить ферму');
        }
    }

    showAddFarmModal() {
        this.showModal('addFarmModal');
        this.resetAddFarmForm();
        
        // Pre-fill email if user is logged in
        if (this.currentUser && this.currentUser.email) {
            document.getElementById('userEmail').value = this.currentUser.email;
        }
    }

    resetAddFarmForm() {
        document.getElementById('addFarmForm').reset();
        this.updateRatingDisplay(3);
    }

    async handleAddFarm() {
        const formData = this.getFormData('addFarmForm');
        
        if (!this.validateFarmForm(formData)) {
            return;
        }

        try {
            // Geocode the postcode
            const coordinates = await this.geocodePostcode(formData.postcode);
            if (!coordinates) {
                this.showNotification(CONFIG.ERROR_MESSAGES.GEOCODING_FAILED, 'error');
                return;
            }

            const farmData = {
                ...formData,
                lat: coordinates.lat,
                lng: coordinates.lng,
                timestamp: new Date().toISOString()
            };

            const response = await this.apiCall('ADD_FARM', farmData);
            
            if (response.success) {
                // Автоматически авторизуем пользователя
                if (!this.currentUser) {
                    this.currentUser = { email: formData.userEmail, reviewCount: 1 };
                    localStorage.setItem('userEmail', formData.userEmail);
                    localStorage.setItem('userReviewCount', '1');
                    this.updateHeaderForUser();
                    this.showNotification('🎉 Поздравляем! Вы получили доступ к информации о всех фермах!', 'success');
                } else {
                    this.currentUser.reviewCount = (this.currentUser.reviewCount || 0) + 1;
                    localStorage.setItem('userReviewCount', this.currentUser.reviewCount.toString());
                    this.updateHeaderForUser();
                }
                
                this.showNotification(CONFIG.SUCCESS_MESSAGES.FARM_ADDED, 'success');
                this.hideModal('addFarmModal');
                await this.loadFarms(); // Reload farms
            } else {
                this.showNotification(response.error || CONFIG.ERROR_MESSAGES.SERVER_ERROR, 'error');
            }
        } catch (error) {
            console.error('Error adding farm:', error);
            this.showNotification(CONFIG.ERROR_MESSAGES.NETWORK_ERROR, 'error');
        }
    }

    getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Get values from form elements directly for better compatibility
        data.farmType = document.getElementById('farmType').value;
        data.farmName = document.getElementById('farmName').value;
        data.farmAddress = document.getElementById('farmAddress').value;
        data.farmPostcode = document.getElementById('farmPostcode').value.toUpperCase();
        data.farmOperator = document.getElementById('farmOperator').value;
        data.farmRating = parseInt(document.getElementById('farmRating').value);
        data.farmComment = document.getElementById('farmComment').value;
        
        // Format earnings with currency symbol
        const earningsValue = document.getElementById('farmEarnings').value;
        data.farmEarnings = earningsValue ? `£${parseInt(earningsValue).toLocaleString()}` : '';
        
        data.farmDuration = document.getElementById('farmDuration').value;
        data.userEmail = document.getElementById('userEmail').value;
        
        return data;
    }

    validateFarmForm(data) {
        const required = ['farmType', 'farmName', 'farmAddress', 'farmPostcode', 'farmOperator', 'userEmail'];
        
        for (let field of required) {
            if (!data[field] || data[field].trim() === '') {
                this.showNotification(`Поле "${this.getFieldLabel(field)}" обязательно для заполнения`, 'error');
                return false;
            }
        }

        // Validate UK postcode format
        const postcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
        if (!postcodeRegex.test(data.farmPostcode)) {
            this.showNotification(CONFIG.ERROR_MESSAGES.INVALID_POSTCODE, 'error');
            return false;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@gmail\.com$/i;
        if (!emailRegex.test(data.userEmail)) {
            this.showNotification('Пожалуйста, используйте действительный Gmail адрес', 'error');
            return false;
        }

        // Validate earnings if provided
        const earningsInput = document.getElementById('farmEarnings').value;
        if (earningsInput && (isNaN(earningsInput) || parseInt(earningsInput) < 0)) {
            this.showNotification('Заработок должен быть положительным числом', 'error');
            return false;
        }

        return true;
    }

    getFieldLabel(fieldName) {
        const labels = {
            farmType: 'Тип фермы',
            farmName: 'Название фермы',
            farmAddress: 'Адрес',
            farmPostcode: 'Почтовый индекс',
            farmOperator: 'Оператор',
            userEmail: 'Email'
        };
        return labels[fieldName] || fieldName;
    }

    async geocodePostcode(postcode) {
        try {
            const response = await fetch(`${CONFIG.POSTCODES_API_URL}/${encodeURIComponent(postcode)}`);
            const data = await response.json();
            
            if (data.status === 200 && data.result) {
                return {
                    lat: data.result.latitude,
                    lng: data.result.longitude
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    }

    async apiCall(endpoint, data = null) {
        const url = CONFIG.GOOGLE_SCRIPT_URL;
        const method = data ? 'POST' : 'GET';
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify({
                action: endpoint,
                ...data
            });
        } else {
            // For GET requests, add action as URL parameter
            const urlWithParams = `${url}?action=${endpoint}`;
            return fetch(urlWithParams, options).then(response => response.json());
        }

        const response = await fetch(url, options);
        return response.json();
    }

    showModal(modalId) {
        console.log('showModal called with modalId:', modalId);
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error('Modal not found:', modalId);
            return;
        }
        console.log('Modal found, showing:', modal);
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Показываем кнопку "Назад" в Telegram
        if (this.telegramApp.isInTelegram) {
            this.telegramApp.showBackButton();
            this.telegramApp.hideMainButton();
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Скрываем кнопку "Назад" и показываем главную кнопку в Telegram
        if (this.telegramApp.isInTelegram) {
            this.telegramApp.hideBackButton();
            this.telegramApp.showMainButton('Добавить ферму');
        }
    }
    
    hideAllModals() {
        document.querySelectorAll('.modal.show').forEach(modal => {
            this.hideModal(modal.id);
        });
    }

    hideAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            this.hideModal(modal.id);
        });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info';
        
        notification.innerHTML = `
            <span class="material-symbols-outlined">${icon}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Remove on click
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        
        if (!email || !email.includes('@gmail.com')) {
            this.showNotification('Пожалуйста, введите действительный Gmail адрес', 'error');
            return;
        }

        try {
            const response = await this.apiCall('LOGIN', { email });
            
            if (response.success) {
                this.currentUser = { email };
                localStorage.setItem('userEmail', email);
                this.updateHeaderForUser();
                this.showNotification(CONFIG.SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
                this.hideModal('loginModal');
            } else {
                this.showNotification(response.error || CONFIG.ERROR_MESSAGES.LOGIN_FAILED, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(CONFIG.ERROR_MESSAGES.NETWORK_ERROR, 'error');
        }
    }

    async flagReview(reviewId) {
        if (!this.currentUser) {
            this.showModal('loginModal');
            return;
        }

        try {
            const response = await this.apiCall('FLAG_REVIEW', {
                reviewId,
                userEmail: this.currentUser.email
            });
            
            if (response.success) {
                this.showNotification(CONFIG.SUCCESS_MESSAGES.REVIEW_FLAGGED, 'success');
            } else {
                this.showNotification(response.error || CONFIG.ERROR_MESSAGES.SERVER_ERROR, 'error');
            }
        } catch (error) {
            console.error('Flag review error:', error);
            this.showNotification(CONFIG.ERROR_MESSAGES.NETWORK_ERROR, 'error');
        }
    }

    showAddReviewForm(farmId) {
        // Find the farm by ID
        const farm = this.farms.find(f => f.id === farmId);
        if (!farm) {
            this.showNotification('Ферма не найдена', 'error');
            return;
        }

        // Store current farm for review submission
        this.currentReviewFarm = farm;
        
        // Reset form
        this.resetAddReviewForm();
        
        // Show modal
        this.showModal('addReviewModal');
        
        // Update modal title with farm name
        document.querySelector('#addReviewModal .modal-header h2').textContent = `Добавить отзыв о ферме "${farm.name}"`;
    }

    resetAddReviewForm() {
        document.getElementById('addReviewForm').reset();
        this.updateReviewRatingDisplay(3);
        
        // Pre-fill email if user is logged in
        if (this.currentUser && this.currentUser.email) {
            document.getElementById('reviewEmail').value = this.currentUser.email;
        }
    }

    async handleAddReview() {
        if (!this.currentReviewFarm) {
            this.showNotification('Ошибка: ферма не выбрана', 'error');
            return;
        }

        const reviewData = this.getReviewFormData();
        
        if (!this.validateReviewForm(reviewData)) {
            return;
        }

        try {
            // Prepare review data for API
            const apiData = {
                farmId: this.currentReviewFarm.id,
                farmName: this.currentReviewFarm.name,
                farmType: this.currentReviewFarm.type,
                farmAddress: this.currentReviewFarm.address,
                farmPostcode: this.currentReviewFarm.postcode,
                farmOperator: this.currentReviewFarm.operator,
                rating: reviewData.rating,
                comment: reviewData.comment,
                earnings: reviewData.earnings,
                duration: reviewData.duration,
                userEmail: reviewData.email,
                lat: this.currentReviewFarm.lat,
                lng: this.currentReviewFarm.lng
            };

            const response = await this.apiCall('ADD_REVIEW', apiData);
            
            if (response.success) {
                this.showNotification(CONFIG.SUCCESS_MESSAGES.REVIEW_ADDED, 'success');
                this.hideModal('addReviewModal');
                
                // Update current user
                if (!this.currentUser) {
                    this.currentUser = { email: reviewData.email, reviewCount: 1 };
                    localStorage.setItem('userEmail', reviewData.email);
                    localStorage.setItem('userReviewCount', '1');
                    this.updateHeaderForUser();
                    this.showNotification('🎉 Поздравляем! Вы получили доступ к информации о всех фермах!', 'success');
                } else {
                    this.currentUser.reviewCount = (this.currentUser.reviewCount || 0) + 1;
                    localStorage.setItem('userReviewCount', this.currentUser.reviewCount.toString());
                    this.updateHeaderForUser();
                }
                
                // Reload farms to show new review
                await this.loadFarms();
                
                // Refresh farm info panel if it's open
                if (!this.farmInfoPanel.classList.contains('hidden')) {
                    this.showFarmInfo(this.currentReviewFarm);
                }
            } else {
                this.showNotification(response.error || CONFIG.ERROR_MESSAGES.SERVER_ERROR, 'error');
            }
        } catch (error) {
            console.error('Error adding review:', error);
            this.showNotification(CONFIG.ERROR_MESSAGES.NETWORK_ERROR, 'error');
        }
    }

    getReviewFormData() {
        // Format earnings with currency symbol
        const earningsValue = document.getElementById('reviewEarnings').value.trim();
        const formattedEarnings = earningsValue ? `£${parseInt(earningsValue).toLocaleString()}` : '';
        
        return {
            rating: parseInt(document.getElementById('reviewRating').value),
            comment: document.getElementById('reviewComment').value.trim(),
            earnings: formattedEarnings,
            duration: document.getElementById('reviewDuration').value.trim(),
            email: document.getElementById('reviewEmail').value.trim()
        };
    }

    // User Profile Methods
    showUserProfile() {
        if (!this.currentUser) {
            this.showModal('loginModal');
            return;
        }

        const content = this.renderUserProfile();
        document.getElementById('profileContent').innerHTML = content;
        this.showModal('profileModal');
        this.loadUserActivity();
    }

    renderUserProfile() {
        const user = this.currentUser;
        const joinDate = localStorage.getItem('userJoinDate') || new Date().toLocaleDateString('ru-RU');
        
        return `
            <div class="user-profile">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <span class="material-symbols-outlined">account_circle</span>
                    </div>
                    <div class="profile-info">
                        <h3>${user.email}</h3>
                        <p>Участник с ${joinDate}</p>
                    </div>
                </div>

                <div class="profile-stats">
                    <div class="stat-card">
                        <div class="stat-number">${user.reviewCount || 0}</div>
                        <div class="stat-label">Отзывов написано</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${user.farmsAdded || 0}</div>
                        <div class="stat-label">Ферм добавлено</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${user.helpfulVotes || 0}</div>
                        <div class="stat-label">Полезных голосов</div>
                    </div>
                </div>

                <div class="profile-sections">
                    <div class="profile-section">
                        <h4>📝 Мои отзывы</h4>
                        <div id="userReviews" class="user-reviews">
                            <div class="loading-placeholder">Загрузка отзывов...</div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h4>🏭 Добавленные фермы</h4>
                        <div id="userFarms" class="user-farms">
                            <div class="loading-placeholder">Загрузка ферм...</div>
                        </div>
                    </div>

                    <div class="profile-section">
                        <h4>⚙️ Настройки</h4>
                        <div class="profile-settings">
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="emailNotifications" ${user.emailNotifications ? 'checked' : ''}>
                                    Уведомления на email
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="publicProfile" ${user.publicProfile ? 'checked' : ''}>
                                    Публичный профиль
                                </label>
                            </div>
                            <div class="setting-item">
                                <button class="btn-secondary" onclick="app.exportUserData()">
                                    <span class="material-symbols-outlined">download</span>
                                    Экспорт данных
                                </button>
                            </div>
                            <div class="setting-item">
                                <button class="btn-secondary" onclick="app.deleteAccount()" style="color: #d32f2f;">
                                    <span class="material-symbols-outlined">delete</span>
                                    Удалить аккаунт
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadUserActivity() {
        if (!this.currentUser) return;

        try {
            // Load user's reviews
            const userReviews = this.farms.filter(farm => 
                farm.reviews && farm.reviews.some(review => 
                    review.userEmail === this.currentUser.email
                )
            ).map(farm => ({
                farmName: farm.name,
                farmAddress: farm.address,
                reviews: farm.reviews.filter(review => review.userEmail === this.currentUser.email)
            }));

            this.renderUserReviews(userReviews);

            // Load user's farms
            const userFarms = this.farms.filter(farm => 
                farm.addedBy === this.currentUser.email
            );

            this.renderUserFarms(userFarms);

        } catch (error) {
            console.error('Failed to load user activity:', error);
        }
    }

    renderUserReviews(userReviews) {
        const container = document.getElementById('userReviews');
        
        if (userReviews.length === 0) {
            container.innerHTML = '<p class="empty-state">Вы еще не написали ни одного отзыва</p>';
            return;
        }

        const reviewsHTML = userReviews.map(farm => 
            farm.reviews.map(review => `
                <div class="user-review-item">
                    <div class="review-farm">
                        <h5>${farm.farmName}</h5>
                        <p>${farm.farmAddress}</p>
                    </div>
                    <div class="review-content">
                        <div class="review-rating">${'⭐'.repeat(review.rating || 3)}</div>
                        <p>${review.comment}</p>
                        <div class="review-meta">
                            <span>${this.formatDate(review.date)}</span>
                            ${review.earnings ? `• ${review.earnings}` : ''}
                            ${review.duration ? `• ${review.duration}` : ''}
                        </div>
                    </div>
                    <div class="review-actions">
                        <button class="btn-small" onclick="app.editReview('${review.id}')">
                            <span class="material-symbols-outlined">edit</span>
                            Редактировать
                        </button>
                        <button class="btn-small" onclick="app.deleteReview('${review.id}')">
                            <span class="material-symbols-outlined">delete</span>
                            Удалить
                        </button>
                    </div>
                </div>
            `).join('')
        ).join('');

        container.innerHTML = reviewsHTML;
    }

    renderUserFarms(userFarms) {
        const container = document.getElementById('userFarms');
        
        if (userFarms.length === 0) {
            container.innerHTML = '<p class="empty-state">Вы еще не добавили ни одной фермы</p>';
            return;
        }

        const farmsHTML = userFarms.map(farm => `
            <div class="user-farm-item">
                <div class="farm-emoji">${CONFIG.FARM_TYPES[farm.type]?.emoji || '🏭'}</div>
                <div class="farm-info">
                    <h5>${farm.name}</h5>
                    <p>${farm.address}</p>
                    <div class="farm-meta">
                        <span>${farm.operator}</span>
                        <span>•</span>
                        <span>${'⭐'.repeat(this.calculateAverageRating(farm.reviews || []))}</span>
                        <span>(${farm.reviews?.length || 0} отзывов)</span>
                    </div>
                </div>
                <div class="farm-actions">
                    <button class="btn-small" onclick="app.showFarmInfo(${JSON.stringify(farm).replace(/"/g, '&quot;')})">
                        <span class="material-symbols-outlined">visibility</span>
                        Посмотреть
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = farmsHTML;
    }

    editReview(reviewId) {
        // TODO: Implement review editing
        this.showNotification('Редактирование отзывов будет доступно в следующей версии', 'info');
    }

    deleteReview(reviewId) {
        if (confirm('Вы уверены, что хотите удалить этот отзыв?')) {
            // TODO: Implement review deletion
            this.showNotification('Удаление отзывов будет доступно в следующей версии', 'info');
        }
    }

    exportUserData() {
        if (!this.currentUser) return;

        const userData = {
            email: this.currentUser.email,
            joinDate: localStorage.getItem('userJoinDate'),
            reviewCount: this.currentUser.reviewCount,
            farmsAdded: this.currentUser.farmsAdded,
            settings: {
                emailNotifications: document.getElementById('emailNotifications')?.checked,
                publicProfile: document.getElementById('publicProfile')?.checked
            },
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `uk-farms-user-data-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Данные экспортированы', 'success');
    }

    deleteAccount() {
        const confirmation = prompt('Для подтверждения удаления аккаунта введите "УДАЛИТЬ":');
        
        if (confirmation === 'УДАЛИТЬ') {
            if (confirm('Это действие нельзя отменить. Все ваши данные будут удалены. Продолжить?')) {
                // Clear local data
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userReviewCount');
                localStorage.removeItem('userJoinDate');
                
                this.currentUser = null;
                this.updateHeaderForUser();
                this.hideModal('profileModal');
                
                this.showNotification('Аккаунт удален. Данные из Google Sheets нужно удалить вручную.', 'info');
            }
        } else if (confirmation !== null) {
            this.showNotification('Неверное подтверждение. Аккаунт не удален.', 'error');
        }
    }

    // Mobile Gestures and Touch Support
    initMobileGestures() {
        // Pull-to-refresh (можно включить в config.js)
        if (CONFIG.APP_SETTINGS.ENABLE_PULL_TO_REFRESH) {
            this.initPullToRefresh();
        }
        
        // Modal swipe gestures
        this.initModalSwipes();
        
        // Haptic feedback
        this.initHapticFeedback();
        
        // Enhanced map gestures
        this.initMapGestures();
    }

    initPullToRefresh() {
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        let isPulling = false;
        let refreshThreshold = 80;
        
        const mainContent = document.querySelector('.main-content');
        const pullIndicator = this.createPullIndicator();
        
        mainContent.addEventListener('touchstart', (e) => {
            if (mainContent.scrollTop === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });
        
        mainContent.addEventListener('touchmove', (e) => {
            if (!isPulling) return;
            
            currentY = e.touches[0].clientY;
            pullDistance = currentY - startY;
            
            if (pullDistance > 0 && mainContent.scrollTop === 0) {
                e.preventDefault();
                
                const progress = Math.min(pullDistance / refreshThreshold, 1);
                this.updatePullIndicator(pullIndicator, progress);
                
                if (pullDistance > refreshThreshold) {
                    this.triggerHapticFeedback('light');
                }
            }
        }, { passive: false });
        
        mainContent.addEventListener('touchend', () => {
            if (isPulling && pullDistance > refreshThreshold) {
                this.performRefresh();
            }
            
            this.hidePullIndicator(pullIndicator);
            isPulling = false;
            pullDistance = 0;
        });
    }

    createPullIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh-indicator';
        indicator.innerHTML = `
            <div class="pull-spinner">
                <span class="material-symbols-outlined">refresh</span>
            </div>
            <div class="pull-text">Потяните для обновления</div>
        `;
        document.body.appendChild(indicator);
        return indicator;
    }

    updatePullIndicator(indicator, progress) {
        const spinner = indicator.querySelector('.pull-spinner');
        const text = indicator.querySelector('.pull-text');
        
        indicator.style.transform = `translateY(${Math.min(progress * 60, 60)}px)`;
        indicator.style.opacity = progress;
        spinner.style.transform = `rotate(${progress * 360}deg)`;
        
        if (progress >= 1) {
            text.textContent = 'Отпустите для обновления';
            indicator.classList.add('ready');
        } else {
            text.textContent = 'Потяните для обновления';
            indicator.classList.remove('ready');
        }
    }

    hidePullIndicator(indicator) {
        indicator.style.transform = 'translateY(-100px)';
        indicator.style.opacity = '0';
        indicator.classList.remove('ready');
    }

    async performRefresh() {
        this.showNotification('Обновление данных...', 'info');
        this.triggerHapticFeedback('medium');
        
        try {
            await this.loadFarms();
            this.showNotification('Данные обновлены', 'success');
        } catch (error) {
            this.showNotification('Ошибка при обновлении', 'error');
        }
    }

    async manualRefresh() {
        const refreshBtn = document.getElementById('refreshBtn');
        const icon = refreshBtn.querySelector('.material-symbols-outlined');
        
        // Анимация вращения кнопки
        icon.style.animation = 'spin 1s linear infinite';
        refreshBtn.disabled = true;
        
        this.showNotification('Обновление данных...', 'info');
        this.triggerHapticFeedback('light');
        
        try {
            await this.loadFarms();
            this.showNotification('Данные успешно обновлены!', 'success');
            this.triggerHapticFeedback('success');
        } catch (error) {
            this.showNotification('Ошибка при обновлении данных', 'error');
            this.triggerHapticFeedback('error');
        } finally {
            // Убираем анимацию и включаем кнопку
            icon.style.animation = '';
            refreshBtn.disabled = false;
        }
    }

    initModalSwipes() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            let startY = 0;
            let currentY = 0;
            let isDragging = false;
            
            const modalContent = modal.querySelector('.modal-content');
            
            modalContent.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                isDragging = true;
                modalContent.style.transition = 'none';
            }, { passive: true });
            
            modalContent.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;
                
                if (deltaY > 0) {
                    modalContent.style.transform = `translateY(${deltaY}px)`;
                    modal.style.backgroundColor = `rgba(0, 0, 0, ${0.5 - (deltaY / 1000)})`;
                }
            }, { passive: true });
            
            modalContent.addEventListener('touchend', () => {
                if (!isDragging) return;
                
                const deltaY = currentY - startY;
                modalContent.style.transition = 'transform 0.3s ease';
                
                if (deltaY > 150) {
                    // Close modal
                    this.hideModal(modal.id);
                    this.triggerHapticFeedback('light');
                } else {
                    // Snap back
                    modalContent.style.transform = 'translateY(0)';
                    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }
                
                isDragging = false;
            });
        });
    }

    initHapticFeedback() {
        // Check if haptic feedback is supported
        this.hapticSupported = 'vibrate' in navigator;
    }

    triggerHapticFeedback(type = 'light') {
        if (!this.hapticSupported) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [50],
            success: [10, 50, 10],
            error: [100, 50, 100],
            notification: [20, 20, 20]
        };
        
        navigator.vibrate(patterns[type] || patterns.light);
    }

    initMapGestures() {
        if (!this.map) return;
        
        // Enhanced zoom controls for mobile
        this.map.on('zoomstart', () => {
            this.triggerHapticFeedback('light');
        });
        
        // Double tap to zoom to user location
        let lastTap = 0;
        this.map.on('click', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected
                if (this.userLocation) {
                    this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
                    this.triggerHapticFeedback('medium');
                }
            }
            
            lastTap = currentTime;
        });
    }

    // Enhanced notification with haptic feedback
    showNotification(message, type = 'info') {
        // В Telegram Web App используем нативные уведомления
        if (this.telegramApp.isInTelegram) {
            if (type === 'error') {
                this.telegramApp.showAlert(`❌ ${message}`);
            } else {
                // Для успеха и инфо показываем обычные уведомления, но с haptic feedback
                this.telegramApp.hapticFeedback('notification', type === 'success' ? 'success' : 'warning');
            }
        }
        
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'error' ? 'error' : type === 'success' ? 'check_circle' : 'info';
        
        notification.innerHTML = `
            <span class="material-symbols-outlined">${icon}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Trigger haptic feedback
        this.triggerHapticFeedback(type === 'error' ? 'error' : type === 'success' ? 'success' : 'notification');
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Remove on click
        notification.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
    }

    validateReviewForm(data) {
        // Check required fields
        if (!data.comment) {
            this.showNotification('Пожалуйста, напишите отзыв', 'error');
            return false;
        }

        if (!data.duration) {
            this.showNotification('Пожалуйста, укажите продолжительность работы', 'error');
            return false;
        }

        if (!data.email) {
            this.showNotification('Пожалуйста, укажите ваш Gmail', 'error');
            return false;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@gmail\.com$/i;
        if (!emailRegex.test(data.email)) {
            this.showNotification('Пожалуйста, используйте действительный Gmail адрес', 'error');
            return false;
        }

        // Check rating range
        if (data.rating < 1 || data.rating > 5) {
            this.showNotification('Рейтинг должен быть от 1 до 5 звезд', 'error');
            return false;
        }

        // Validate earnings if provided
        const earningsInput = document.getElementById('reviewEarnings').value;
        if (earningsInput && (isNaN(earningsInput) || parseInt(earningsInput) < 0)) {
            this.showNotification('Заработок должен быть положительным числом', 'error');
            return false;
        }

        return true;
    }

    // Search and Filter Methods
    initSearchAndFilters() {
        const searchInput = document.getElementById('searchInput');
        let searchTimeout;

        // Real-time search with debounce
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, CONFIG.APP_SETTINGS.DEBOUNCE_DELAY);
        });

        // Initialize filtered farms
        this.filteredFarms = [...this.farms];
    }

    toggleFiltersPanel() {
        const panel = document.getElementById('filtersPanel');
        const btn = document.getElementById('toggleFiltersBtn');
        
        panel.classList.toggle('hidden');
        btn.classList.toggle('active');
    }

    performSearch(query) {
        if (!query || query.trim().length === 0) {
            this.filteredFarms = [...this.farms];
        } else {
            const searchTerm = query.toLowerCase().trim();
            this.filteredFarms = this.farms.filter(farm => {
                return (
                    farm.name.toLowerCase().includes(searchTerm) ||
                    farm.address.toLowerCase().includes(searchTerm) ||
                    farm.postcode.toLowerCase().includes(searchTerm) ||
                    (CONFIG.FARM_TYPES[farm.type]?.name || '').toLowerCase().includes(searchTerm) ||
                    farm.operator.toLowerCase().includes(searchTerm)
                );
            });
        }

        this.applyCurrentFilters();
        this.updateMapDisplay();
        this.updateSearchResults();
    }

    applyFilters() {
        const filters = {
            type: document.getElementById('typeFilter').value,
            operator: document.getElementById('operatorFilter').value
        };

        this.activeFilters = Object.fromEntries(
            Object.entries(filters).filter(([key, value]) => value !== '')
        );

        this.applyCurrentFilters();
        this.updateMapDisplay();
        this.updateActiveFiltersDisplay();
        this.updateSearchResults();
        
        // Hide filters panel after applying
        document.getElementById('filtersPanel').classList.add('hidden');
        document.getElementById('toggleFiltersBtn').classList.remove('active');
    }

    applyCurrentFilters() {
        let filtered = [...this.filteredFarms];

        // Apply type filter
        if (this.activeFilters.type) {
            filtered = filtered.filter(farm => farm.type === this.activeFilters.type);
        }

        // Apply operator filter
        if (this.activeFilters.operator) {
            filtered = filtered.filter(farm => {
                if (farm.operators && Array.isArray(farm.operators)) {
                    return farm.operators.includes(this.activeFilters.operator);
                }
                return farm.operator === this.activeFilters.operator;
            });
        }

        this.filteredFarms = filtered;
    }



    updateMapDisplay() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add filtered markers
        this.filteredFarms.forEach(farm => {
            if (farm.lat && farm.lng) {
                const marker = this.createFarmMarker(farm);
                this.markers.push(marker);
            }
        });

        // Adjust map view if there are results
        if (this.filteredFarms.length > 0 && this.filteredFarms.length < this.farms.length) {
            this.fitMapToResults();
        }
    }

    fitMapToResults() {
        if (this.filteredFarms.length === 0) return;

        const bounds = L.latLngBounds();
        this.filteredFarms.forEach(farm => {
            if (farm.lat && farm.lng) {
                bounds.extend([farm.lat, farm.lng]);
            }
        });

        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [20, 20] });
        }
    }

    updateActiveFiltersDisplay() {
        const container = document.getElementById('activeFilters');
        container.innerHTML = '';

        Object.entries(this.activeFilters).forEach(([key, value]) => {
            const chip = document.createElement('div');
            chip.className = 'filter-chip';
            
            const label = this.getFilterLabel(key, value);
            chip.innerHTML = `
                <span>${label}</span>
                <span class="material-symbols-outlined filter-chip-remove" onclick="app.removeFilter('${key}')">close</span>
            `;
            
            container.appendChild(chip);
        });
    }

    getFilterLabel(key, value) {
        const labels = {
            type: CONFIG.FARM_TYPES[value]?.name || value,
            operator: value
        };
        
        return labels[key] || value;
    }



    removeFilter(filterKey) {
        delete this.activeFilters[filterKey];
        
        // Reset corresponding select
        const selectId = filterKey + 'Filter';
        const select = document.getElementById(selectId);
        if (select) {
            select.value = '';
        }

        this.applyCurrentFilters();
        this.updateMapDisplay();
        this.updateActiveFiltersDisplay();
        this.updateSearchResults();
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.filteredFarms = [...this.farms];
        this.applyCurrentFilters();
        this.updateMapDisplay();
        this.updateSearchResults();
    }

    clearAllFilters() {
        this.activeFilters = {};
        
        // Reset all filter selects
        document.getElementById('typeFilter').value = '';
        document.getElementById('operatorFilter').value = '';
        
        this.applyCurrentFilters();
        this.updateMapDisplay();
        this.updateActiveFiltersDisplay();
        this.updateSearchResults();
    }

    updateSearchResults() {
        // Update results count (можно добавить индикатор количества результатов)
        const totalFarms = this.farms.length;
        const filteredCount = this.filteredFarms.length;
        
        if (filteredCount < totalFarms) {
            this.showNotification(`Найдено ${filteredCount} из ${totalFarms} ферм`, 'info');
        }
    }

    // Override loadFarms to initialize filters
    async loadFarms() {
        try {
            const response = await this.apiCall('GET_FARMS');
            if (response.success) {
                this.farms = response.data || [];
                this.filteredFarms = [...this.farms];
                this.displayFarmsOnMap();
            }
        } catch (error) {
            console.error('Error loading farms:', error);
            this.loadDemoData();
        }
    }

    // Override loadDemoData to initialize filters
    loadDemoData() {
        this.farms = [
            {
                id: 1,
                type: 'vegetables',
                name: 'G\'s Fresh',
                address: 'Ely, Cambridgeshire',
                postcode: 'CB7 4QW',
                operator: 'AgriHR',
                rating: 4,
                reviews: [
                    {
                        rating: 4,
                        comment: 'Хорошие условия работы, дружелюбный персонал',
                        date: '2024-11-15',
                        earnings: '£8500 за 3 месяца',
                        duration: '3 месяца'
                    }
                ],
                lat: 52.3980,
                lng: 0.2620
            },
            {
                id: 2,
                type: 'berries',
                name: 'Berry Gardens',
                address: 'Maidstone, Kent',
                postcode: 'ME15 9YT',
                operator: 'Concordia',
                rating: 5,
                reviews: [
                    {
                        rating: 5,
                        comment: 'Отличная ферма! Хорошая оплата и условия проживания',
                        date: '2024-10-20',
                        earnings: '£12000 за сезон (4 месяца)',
                        duration: '4 месяца'
                    }
                ],
                lat: 51.2704,
                lng: 0.5227
            }
        ];
        this.filteredFarms = [...this.farms];
        this.displayFarmsOnMap();
    }

    // Override displayFarmsOnMap to use filtered farms
    displayFarmsOnMap() {
        this.updateMapDisplay();
    }

    // PWA Initialization
    initPWA() {
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        
        // Listen for install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Listen for app installed
        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
            this.showNotification('Приложение успешно установлено!', 'success');
        });

        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Check for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                this.showUpdateBanner();
            });
        }

        // Handle URL shortcuts
        this.handleURLShortcuts();

        // Initialize offline indicator
        this.updateOfflineIndicator();
    }

    showInstallButton() {
        const installBtn = document.getElementById('installBtn');
        installBtn.classList.remove('hidden');
        installBtn.title = 'Установить приложение на устройство';
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        installBtn.classList.add('hidden');
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            this.showNotification('Установка недоступна в данном браузере', 'info');
            return;
        }

        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                this.showNotification('Приложение устанавливается...', 'info');
            } else {
                this.showNotification('Установка отменена', 'info');
            }
            
            this.deferredPrompt = null;
            this.hideInstallButton();
        } catch (error) {
            console.error('PWA install error:', error);
            this.showNotification('Ошибка при установке приложения', 'error');
        }
    }

    handleOnline() {
        this.isOnline = true;
        this.updateOfflineIndicator();
        this.showNotification('Подключение восстановлено', 'success');
        
        // Sync pending data
        this.syncPendingData();
    }

    handleOffline() {
        this.isOnline = false;
        this.updateOfflineIndicator();
        this.showNotification('Нет подключения к интернету. Работаем в офлайн режиме', 'info');
    }

    updateOfflineIndicator() {
        const indicator = document.getElementById('offlineIndicator');
        if (this.isOnline) {
            indicator.classList.add('hidden');
        } else {
            indicator.classList.remove('hidden');
        }
    }

    showUpdateBanner() {
        const banner = document.getElementById('updateBanner');
        banner.classList.remove('hidden');
    }

    updateApp() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then(registration => {
                if (registration && registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                }
            });
        }
    }

    dismissUpdate() {
        const banner = document.getElementById('updateBanner');
        banner.classList.add('hidden');
    }

    handleURLShortcuts() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        switch (action) {
            case 'add-farm':
                setTimeout(() => this.showAddFarmModal(), 1000);
                break;
            case 'stats':
                setTimeout(() => this.showStatsModal(), 1000);
                break;
        }
    }

    async syncPendingData() {
        if (!this.isOnline) return;

        try {
            // Trigger background sync if available
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('background-sync-farm');
                await registration.sync.register('background-sync-review');
            }
        } catch (error) {
            console.error('Background sync registration failed:', error);
        }
    }

    // Enhanced API call with offline support
    async apiCall(endpoint, data = null) {
        const url = CONFIG.GOOGLE_SCRIPT_URL;
        const method = data ? 'POST' : 'GET';
        
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.body = JSON.stringify({
                action: endpoint,
                ...data
            });
        } else {
            const urlWithParams = `${url}?action=${endpoint}`;
            try {
                const response = await fetch(urlWithParams, options);
                const result = await response.json();
                
                // Show offline indicator if data is from cache
                if (result.offline) {
                    this.showNotification(result.message || 'Данные загружены из кэша', 'info');
                }
                
                return result;
            } catch (error) {
                if (!this.isOnline) {
                    this.showNotification('Данные недоступны в офлайн режиме', 'error');
                }
                throw error;
            }
        }

        try {
            const response = await fetch(url, options);
            return response.json();
        } catch (error) {
            if (!this.isOnline && data) {
                // Store request for later sync
                await this.storeOfflineRequest(endpoint, data);
                this.showNotification('Запрос сохранен и будет отправлен при подключении к интернету', 'info');
                return { success: true, offline: true };
            }
            throw error;
        }
    }

    async storeOfflineRequest(endpoint, data) {
        try {
            if ('indexedDB' in window) {
                const request = indexedDB.open('uk-farms-db', 2);
                
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction(['pending-farms'], 'readwrite');
                    const store = tx.objectStore('pending-farms');
                    
                    store.add({
                        endpoint,
                        data,
                        timestamp: Date.now()
                    });
                };
            }
        } catch (error) {
            console.error('Failed to store offline request:', error);
        }
    }

    showStatsModal() {
        this.updateStatsContent();
        this.showModal('statsModal');
    }

    updateStatsContent() {
        const filteredFarms = this.getFilteredFarmsForStats();
        const stats = this.calculateStatistics(filteredFarms);
        const content = this.renderStatistics(stats, filteredFarms.length);
        document.getElementById('statsContent').innerHTML = content;
    }

    getFilteredFarmsForStats() {
        const typeFilter = document.getElementById('statsTypeFilter')?.value || '';
        const operatorFilter = document.getElementById('statsOperatorFilter')?.value || '';
        const sortFilter = document.getElementById('statsSortFilter')?.value || '';
        
        let filtered = [...this.farms];
        
        // Apply type filter
        if (typeFilter) {
            filtered = filtered.filter(farm => farm.type === typeFilter);
        }
        
        // Apply operator filter
        if (operatorFilter) {
            filtered = filtered.filter(farm => {
                if (farm.operators && Array.isArray(farm.operators)) {
                    return farm.operators.includes(operatorFilter);
                }
                return farm.operator === operatorFilter;
            });
        }
        
        // Apply sorting
        if (sortFilter) {
            filtered = this.sortFarms(filtered, sortFilter);
        }
        
        return filtered;
    }

    sortFarms(farms, sortType) {
        return farms.sort((a, b) => {
            switch (sortType) {
                case 'earnings_high_to_low':
                    return this.getMaxEarnings(b) - this.getMaxEarnings(a);
                case 'earnings_low_to_high':
                    return this.getMaxEarnings(a) - this.getMaxEarnings(b);
                case 'rating_high_to_low':
                    return this.calculateAverageRating(b.reviews || []) - this.calculateAverageRating(a.reviews || []);
                case 'rating_low_to_high':
                    return this.calculateAverageRating(a.reviews || []) - this.calculateAverageRating(b.reviews || []);
                default:
                    return 0;
            }
        });
    }

    getMaxEarnings(farm) {
        if (!farm.reviews || farm.reviews.length === 0) return 0;
        
        let maxEarnings = 0;
        farm.reviews.forEach(review => {
            if (review.earnings) {
                // Извлекаем числовое значение из строки типа "£12000 за сезон (4 месяца)"
                const earningsMatch = review.earnings.match(/£?(\d+(?:,\d+)*)/);
                if (earningsMatch) {
                    const earnings = parseInt(earningsMatch[1].replace(/,/g, ''));
                    maxEarnings = Math.max(maxEarnings, earnings);
                }
            }
        });
        
        return maxEarnings;
    }

    getSortInfo(sortType) {
        const sortLabels = {
            'earnings_high_to_low': '💰 По заработку (от высокого к низкому)',
            'earnings_low_to_high': '💸 По заработку (от низкого к высокому)',
            'rating_high_to_low': '⭐ По рейтингу (от высокого к низкому)',
            'rating_low_to_high': '⭐ По рейтингу (от низкого к высокому)'
        };
        
        return sortLabels[sortType] || '';
    }

    applyStatsFilters() {
        this.updateStatsContent();
    }

    clearStatsFilters() {
        document.getElementById('statsTypeFilter').value = '';
        document.getElementById('statsOperatorFilter').value = '';
        document.getElementById('statsSortFilter').value = '';
        this.updateStatsContent();
    }

    calculateStatistics(farmsToAnalyze = null) {
        const farms = farmsToAnalyze || this.farms;
        const stats = {
            total: farms.length,
            byType: {},
            byOperator: {},
            byRegion: {},
            averageRating: 0,
            totalReviews: 0,
            topRatedFarms: [],
            recentFarms: [],
            earningsData: []
        };

        let totalRating = 0;
        let totalReviews = 0;
        const farmsWithRatings = [];

        farms.forEach(farm => {
            // Статистика по типам
            const farmType = CONFIG.FARM_TYPES[farm.type];
            const typeName = farmType ? farmType.name : farm.type;
            stats.byType[typeName] = (stats.byType[typeName] || 0) + 1;
            
            // Статистика по операторам
            if (farm.operators && Array.isArray(farm.operators)) {
                farm.operators.forEach(operator => {
                    stats.byOperator[operator] = (stats.byOperator[operator] || 0) + 1;
                });
            } else if (farm.operator) {
                stats.byOperator[farm.operator] = (stats.byOperator[farm.operator] || 0) + 1;
            }
            
            // Статистика по регионам
            const region = this.getRegionFromPostcode(farm.postcode);
            stats.byRegion[region] = (stats.byRegion[region] || 0) + 1;
            
            // Статистика по отзывам
            if (farm.reviews && farm.reviews.length > 0) {
                totalReviews += farm.reviews.length;
                let farmRatingSum = 0;
                farm.reviews.forEach(review => {
                    const rating = review.rating || 3;
                    totalRating += rating;
                    farmRatingSum += rating;
                });
                
                const avgFarmRating = farmRatingSum / farm.reviews.length;
                farmsWithRatings.push({
                    ...farm,
                    averageRating: avgFarmRating,
                    reviewCount: farm.reviews.length
                });
            }
        });

        stats.averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
        stats.totalReviews = totalReviews;

        // Топ ферм по рейтингу
        stats.topRatedFarms = farmsWithRatings
            .sort((a, b) => b.averageRating - a.averageRating)
            .slice(0, 5);

        // Топ ферм по заработку
        const farmsWithEarnings = farms.filter(farm => this.getMaxEarnings(farm) > 0)
            .map(farm => ({
                ...farm,
                maxEarnings: this.getMaxEarnings(farm),
                averageRating: this.calculateAverageRating(farm.reviews || [])
            }));
        
        stats.topEarningsFarms = farmsWithEarnings
            .sort((a, b) => b.maxEarnings - a.maxEarnings)
            .slice(0, 5);

        // Недавние фермы (последние 10)
        stats.recentFarms = farms
            .slice(-10)
            .reverse();

        return stats;
    }

    getRegionFromPostcode(postcode) {
        if (!postcode) return 'Неизвестно';
        const prefix = postcode.substring(0, 2).toUpperCase();
        
        const regionMappings = {
            'SW': 'Лондон (SW)', 'SE': 'Лондон (SE)', 'N1': 'Лондон (N)', 
            'E1': 'Лондон (E)', 'W1': 'Лондон (W)', 'NW': 'Лондон (NW)',
            'EC': 'Лондон (EC)', 'WC': 'Лондон (WC)',
            'ME': 'Кент', 'TN': 'Кент', 'CT': 'Кент',
            'BN': 'Сассекс', 'RH': 'Суррей', 'GU': 'Суррей',
            'CB': 'Кембриджшир', 'PE': 'Кембриджшир',
            'M1': 'Манчестер', 'L1': 'Ливерпуль', 'S1': 'Шеффилд',
            'B1': 'Бирмингем', 'CV': 'Ковентри', 'LE': 'Лестер',
            'EH': 'Эдинбург', 'G1': 'Глазго', 'AB': 'Абердин',
            'CF': 'Кардифф', 'SA': 'Суонси', 'LL': 'Уэльс',
            'BT': 'Северная Ирландия'
        };

        return regionMappings[prefix] || `${prefix} регион`;
    }

    renderStatistics(stats, filteredCount = null) {
        const isFiltered = filteredCount !== null && filteredCount < this.farms.length;
        const filterInfo = isFiltered ? ` (из ${this.farms.length})` : '';
        const sortFilter = document.getElementById('statsSortFilter')?.value || '';
        const sortInfo = this.getSortInfo(sortFilter);
        
        return `
            <div class="stats-dashboard">
                ${isFiltered || sortFilter ? `
                    <div style="background: linear-gradient(135deg, var(--md-sys-color-primary-container), var(--md-sys-color-surface)); padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                        <span class="material-symbols-outlined" style="color: var(--md-sys-color-primary); font-size: 24px; vertical-align: middle; margin-right: 8px;">${sortFilter ? 'sort' : 'filter_alt'}</span>
                        <strong style="color: var(--md-sys-color-on-primary-container);">
                            ${isFiltered ? `Показана статистика для ${filteredCount} ферм из ${this.farms.length}` : `Статистика для всех ${this.farms.length} ферм`}
                            ${sortFilter ? `<br><span style="font-size: 14px; opacity: 0.9;">Сортировка: ${sortInfo}</span>` : ''}
                        </strong>
                    </div>
                ` : ''}
                
                <!-- Общая статистика -->
                <div class="stats-overview">
                    <div class="stats-card">
                        <div class="stats-number">${stats.total}</div>
                        <div class="stats-label">Ферм${filterInfo}</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-number">${stats.totalReviews}</div>
                        <div class="stats-label">Всего отзывов</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-number">${stats.averageRating.toFixed(1)}</div>
                        <div class="stats-label">Средний рейтинг</div>
                    </div>
                    <div class="stats-card">
                        <div class="stats-number">${Object.keys(stats.byOperator).length}</div>
                        <div class="stats-label">Операторов</div>
                    </div>
                </div>

                <!-- Статистика по типам ферм -->
                <div class="stats-section">
                    <h3>🏭 Типы ферм</h3>
                    <div class="stats-chart">
                        ${Object.entries(stats.byType).map(([type, count]) => `
                            <div class="chart-bar">
                                <div class="bar-label">${type}</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${(count / stats.total) * 100}%"></div>
                                    <div class="bar-value">${count}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Статистика по операторам -->
                <div class="stats-section">
                    <h3>🏢 Операторы</h3>
                    <div class="stats-chart">
                        ${Object.entries(stats.byOperator).map(([operator, count]) => `
                            <div class="chart-bar">
                                <div class="bar-label">${operator}</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${(count / stats.total) * 100}%"></div>
                                    <div class="bar-value">${count}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Топ ферм по заработку -->
                <div class="stats-section">
                    <h3>💰 Топ ферм по заработку</h3>
                    <div class="top-farms-list">
                        ${stats.topEarningsFarms.map((farm, index) => `
                            <div class="top-farm-item">
                                <div class="farm-rank">${index + 1}</div>
                                <div class="farm-info">
                                    <div class="farm-name">${farm.name}</div>
                                    <div class="farm-details">${farm.address}</div>
                                </div>
                                <div class="farm-rating">
                                    <div class="rating-stars">💰 £${farm.maxEarnings.toLocaleString()}</div>
                                    <div class="rating-value">${'⭐'.repeat(Math.round(farm.averageRating))} ${farm.averageRating.toFixed(1)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Топ ферм по рейтингу -->
                <div class="stats-section">
                    <h3>⭐ Топ ферм по рейтингу</h3>
                    <div class="top-farms-list">
                        ${stats.topRatedFarms.map((farm, index) => `
                            <div class="top-farm-item">
                                <div class="farm-rank">${index + 1}</div>
                                <div class="farm-info">
                                    <div class="farm-name">${farm.name}</div>
                                    <div class="farm-details">${farm.address}</div>
                                </div>
                                <div class="farm-rating">
                                    <div class="rating-stars">${'⭐'.repeat(Math.round(farm.averageRating))}</div>
                                    <div class="rating-value">${farm.averageRating.toFixed(1)} (${farm.reviewCount})</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Статистика по регионам -->
                <div class="stats-section">
                    <h3>🗺️ Распределение по регионам</h3>
                    <div class="stats-chart">
                        ${Object.entries(stats.byRegion).slice(0, 10).map(([region, count]) => `
                            <div class="chart-bar">
                                <div class="bar-label">${region}</div>
                                <div class="bar-container">
                                    <div class="bar-fill" style="width: ${(count / stats.total) * 100}%"></div>
                                    <div class="bar-value">${count}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new UKFarmsMap();
    
    // Глобальная переменная для Telegram Web App
    if (window.Telegram?.WebApp) {
        window.telegramApp = app.telegramApp;
    }
});

// Make app globally available for onclick handlers
window.app = app;
