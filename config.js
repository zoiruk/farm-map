// Configuration file for UK Farms Map
const CONFIG = {
    // Google Apps Script Web App URL
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwVnffKa598iycfvc0PykSelo5PSnsG-jP8sEmszud4itCbxKw1aM4RqpNNtH-wO_Zv/exec',
    
    // Postcodes.io API
    POSTCODES_API_URL: 'https://api.postcodes.io/postcodes',
    
    // Map Configuration
    MAP_CONFIG: {
        center: [54.5, -3.5], // UK center coordinates
        zoom: 6,
        minZoom: 5,
        maxZoom: 18
    },
    
    // Farm Types with emojis
    FARM_TYPES: {
        vegetables: { emoji: '🥬', name: 'Овощная ферма', color: '#4caf50' },
        tomatoes: { emoji: '🍅', name: 'Томатная ферма', color: '#f44336' },
        berries: { emoji: '🍓', name: 'Ягодная ферма', color: '#e91e63' },
        mushrooms: { emoji: '🍄', name: 'Грибная ферма', color: '#795548' },
        flowers: { emoji: '🌷', name: 'Цветочная ферма', color: '#9c27b0' },
        apples: { emoji: '🍎', name: 'Яблочная ферма', color: '#ff5722' }
    },
    
    // Seasonal Worker Programme Operators
    OPERATORS: [
        'AgriHR',
        'Concordia',
        'Fruitful Jobs',
        'Pro-Force',
        'HOPS'
    ],
    
    // Famous UK Farms Database (200+ farms)
    FAMOUS_FARMS: [
        // Vegetable Farms
        'G\'s Fresh', 'Barfoots of Botley', 'Greenyard Fresh UK', 'Produce World',
        'Staples Vegetables', 'Huntapac Produce', 'Reynolds Catering Supplies',
        'Cornerways Nursery', 'Thanet Earth', 'APS Salads', 'Vitacress Salads',
        'Bakkavor', 'Florette UK', 'Organic Farm Foods', 'Riverford Organic Farmers',
        
        // Berry Farms
        'Berry Gardens', 'Haygrove', 'S&A Produce', 'Driscoll\'s', 'Hall Hunter Partnership',
        'Clock House Farm', 'Tanner\'s Farm Park', 'Parkside Farm', 'Grange Farm Fruits',
        'Blackmoor Estate', 'Wexcombe Farm', 'Crockford Bridge Farm', 'Kenyon Hall Farm',
        'Essington Fruit Farm', 'Foxendown Farm', 'Parkside Soft Fruits',
        
        // Apple Farms
        'Worldwide Fruit', 'AC Hulme', 'Stocks Farm', 'Loddington Farm', 'Avalon Produce',
        'Kent Blaxill', 'Adrian Scripps', 'Frank P Matthews', 'Bardsley England',
        'Mansfields Fruit Farm', 'Chegworth Valley', 'Brogdale Farm', 'Roughway Farm',
        'Court Lodge Farm', 'Blackmoor Estate', 'Stocks Farm Shop',
        
        // Flower Farms
        'Flamingo Horticulture', 'Dümmen Orange', 'Selecta One', 'Kernock Park Plants',
        'Wyevale Garden Centres', 'Thompson & Morgan', 'Johnsons Seeds',
        'Unwins Seeds', 'Mr Fothergill\'s Seeds', 'Suttons Seeds', 'Kings Seeds',
        'Chiltern Seeds', 'Dobies Garden World', 'Crocus', 'Sarah Raven',
        
        // Mushroom Farms
        'Monaghan Mushrooms', 'Lutece Holdings', 'Smithy Mushrooms', 'Highline Mushrooms',
        'Oaklands Mushrooms', 'Sylvan UK', 'Amycel UK', 'Italspawn UK',
        'Middlebrook Mushrooms', 'Chesswood Mushrooms', 'Meadow Mushrooms',
        
        // Tomato Farms
        'Thanet Earth', 'APS Group', 'Cornerways Nursery', 'Flavourfresh',
        'Wight Salads Group', 'Langmead Group', 'Greenyard Fresh UK',
        'Elsoms Seeds', 'Syngenta Seeds', 'Rijk Zwaan UK', 'Enza Zaden UK',
        
        // Mixed/Large Farms
        'Velcourt', 'Eurofresh Distribution', 'Total Produce', 'Fyffes',
        'Fresh Direct', 'Reynolds', 'Nationwide Produce', 'Freshtime UK',
        'Wealmoor', 'Poupart Imports', 'Mack Multiples', 'Fresca Group',
        'Primafruit', 'Pearson Partnership', 'Redbridge Holdings',
        
        // Regional Farms - England
        'Spalding Produce', 'Lincolnshire Field Products', 'Norfolk Herbs',
        'Suffolk Sweet', 'Essex Growers', 'Kent Garden Produce', 'Surrey Farms',
        'Hampshire Growers', 'Dorset Cereals', 'Devon Farm Fresh', 'Cornwall Growers',
        'Somerset Organics', 'Gloucestershire Produce', 'Worcestershire Farms',
        'Herefordshire Orchards', 'Shropshire Organics', 'Staffordshire Growers',
        'Warwickshire Produce', 'Northamptonshire Farms', 'Bedfordshire Growers',
        'Hertfordshire Fresh', 'Buckinghamshire Organics', 'Oxfordshire Farms',
        'Berkshire Produce', 'Wiltshire Growers', 'Cambridgeshire Organics',
        'Nottinghamshire Farms', 'Leicestershire Produce', 'Rutland Organics',
        'Derbyshire Growers', 'Cheshire Farms', 'Lancashire Produce',
        'Greater Manchester Growers', 'Merseyside Organics', 'Cumbria Farms',
        'Northumberland Produce', 'Durham Growers', 'Tyne and Wear Organics',
        'Yorkshire Dales Farms', 'North Yorkshire Produce', 'West Yorkshire Growers',
        'South Yorkshire Organics', 'East Yorkshire Farms',
        
        // Regional Farms - Scotland
        'Highland Fresh', 'Grampian Growers', 'Tayside Produce', 'Central Scotland Farms',
        'Fife Organics', 'Lothian Growers', 'Borders Produce', 'Dumfries Farms',
        'Galloway Organics', 'Ayrshire Growers', 'Lanarkshire Produce',
        'Stirlingshire Farms', 'Clackmannanshire Organics', 'Falkirk Growers',
        'West Lothian Produce', 'Midlothian Farms', 'East Lothian Organics',
        'Scottish Borders Growers', 'Argyll Fresh', 'Bute Produce',
        'Inverclyde Farms', 'Renfrewshire Organics', 'East Dunbartonshire Growers',
        'West Dunbartonshire Produce', 'North Lanarkshire Farms',
        'South Lanarkshire Organics', 'Glasgow City Growers', 'Edinburgh Produce',
        'Dundee City Farms', 'Aberdeen City Organics', 'Orkney Islands Growers',
        'Shetland Islands Produce', 'Western Isles Farms', 'Highland Organics',
        'Moray Growers', 'Aberdeenshire Produce', 'Angus Farms', 'Perth Organics',
        'Kinross Growers', 'Clackmannanshire Produce',
        
        // Regional Farms - Wales
        'Gwynedd Fresh', 'Anglesey Produce', 'Conwy Growers', 'Denbighshire Organics',
        'Flintshire Farms', 'Wrexham Produce', 'Powys Growers', 'Ceredigion Organics',
        'Pembrokeshire Farms', 'Carmarthenshire Produce', 'Swansea Growers',
        'Neath Port Talbot Organics', 'Bridgend Farms', 'Vale of Glamorgan Produce',
        'Cardiff Growers', 'Rhondda Cynon Taf Organics', 'Merthyr Tydfil Farms',
        'Caerphilly Produce', 'Blaenau Gwent Growers', 'Torfaen Organics',
        'Monmouthshire Farms', 'Newport Produce',
        
        // Regional Farms - Northern Ireland
        'Antrim Fresh', 'Armagh Orchards', 'Down Produce', 'Fermanagh Growers',
        'Londonderry Organics', 'Tyrone Farms', 'Belfast Produce',
        
        // Organic Specialists
        'Soil Association Farms', 'Organic Farmers & Growers', 'Demeter Certified',
        'Biodynamic Association', 'Organic Trust', 'Quality Welsh Food',
        'Red Tractor Assured', 'LEAF Marque', 'RSPCA Assured',
        
        // Specialty Crops
        'British Asparagus Growers', 'English Wine Producers', 'Hop Growers',
        'Lavender Farms UK', 'Christmas Tree Growers', 'Herb Specialists',
        'Watercress Growers', 'Rhubarb Producers', 'Leek Growers',
        'Brussels Sprouts Specialists', 'Cauliflower Producers', 'Cabbage Growers',
        'Broccoli Specialists', 'Spinach Producers', 'Lettuce Growers',
        'Rocket Specialists', 'Kale Producers', 'Chard Growers'
    ],
    
    // Telegram Bot Configuration (optional)
    TELEGRAM_CONFIG: {
        BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN',
        CHAT_ID: 'YOUR_TELEGRAM_CHAT_ID',
        ENABLED: false
    },
    
    // Application Settings
    APP_SETTINGS: {
        MAX_REVIEWS_PER_FARM: 50,
        REVIEW_FLAG_THRESHOLD: 3,
        AUTO_HIDE_FLAGGED_REVIEWS: true,
        ENABLE_GEOLOCATION: true,
        DEFAULT_THEME: 'light', // Только светлая тема
        CACHE_DURATION: 300000, // 5 minutes in milliseconds
        DEBOUNCE_DELAY: 300 // milliseconds for search input
    },
    
    // Advertisement Configuration
    AD_CONFIG: {
        COMPANY_NAME: 'White Tax Returns',
        WEBSITE_URL: 'https://whitetax.site/sng',
        BANNER_TEXT: 'White Tax Returns — официально зарегистрированное налоговое агентство и бухгалтерский отдел Fruitful Jobs и Agri HR. Верните свои налоги быстро и честно — подайте заявку сейчас.',
        BUTTON_TEXT: 'Подайте заявку сейчас',
        REVIEW_TEXT: 'White Tax Returns — официально зарегистрированное налоговое агентство и официальный бухгалтерский отдел операторов Fruitful Jobs и Agri HR. Верните свои налоги быстро и честно — подайте заявку сейчас.'
    },
    
    // API Endpoints
    API_ENDPOINTS: {
        ADD_FARM: '/addFarm',
        GET_FARMS: '/getFarms',
        ADD_REVIEW: '/addReview',
        FLAG_REVIEW: '/flagReview',
        LOGIN: '/login',
        GEOCODE: '/geocode'
    },
    
    // Error Messages
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
        INVALID_POSTCODE: 'Неверный формат почтового индекса UK.',
        GEOCODING_FAILED: 'Не удалось определить координаты по почтовому индексу.',
        FORM_VALIDATION: 'Пожалуйста, заполните все обязательные поля.',
        LOGIN_FAILED: 'Ошибка входа. Проверьте email.',
        UNAUTHORIZED: 'Необходима авторизация для выполнения этого действия.',
        SERVER_ERROR: 'Ошибка сервера. Попробуйте позже.',
        DUPLICATE_REVIEW: 'Вы уже оставляли отзыв для этой фермы.'
    },
    
    // Success Messages
    SUCCESS_MESSAGES: {
        FARM_ADDED: 'Ферма успешно добавлена!',
        REVIEW_ADDED: 'Отзыв успешно добавлен!',
        LOGIN_SUCCESS: 'Вход выполнен успешно!',
        REVIEW_FLAGGED: 'Жалоба отправлена. Спасибо за помощь в модерации!',
        DATA_LOADED: 'Данные загружены успешно!'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}