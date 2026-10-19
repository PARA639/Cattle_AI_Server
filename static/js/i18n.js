// ============================================================
// CATTLE AI — MULTILINGUAL SYSTEM
// English | Hindi | Marathi | Tamil | Telugu
// ============================================================

const CATTLE_LANGUAGE_KEY = "cattle_language";

const cattleTranslations = {

    // ========================================================
    // ENGLISH
    // ========================================================

    en: {

        // Common Layout
        "brand.subtitle": "Health Monitoring System",
        "nav.overview": "Overview",
        "nav.analytics": "Analytics",
        "nav.aiHealth": "AI Health",
        "nav.alerts": "Alerts",
        "nav.profile": "Cattle Profile",
        "nav.settings": "Settings",
        "header.subtitle": "Smart Cattle Health Monitoring Platform",
        "footer.realData": "Real Sensor Data Only",
        "footer.platform": "Cattle AI Health Monitoring System",

        // Overview Page
        "overview.pageTitle": "Dashboard Overview",
        "overview.live": "Live Sensor Monitoring",
        "overview.temperature": "Surface Temperature",
        "overview.celsius": "Degrees Celsius (°C)",
        "overview.acceleration": "Acceleration",
        "overview.sound": "Sound Peak",
        "overview.adc": "ADC Peak-to-Peak",
        "overview.ai": "AI Monitoring",
        "overview.health": "Health Status",
        "overview.risk": "Risk Score",
        "overview.anomaly": "Anomaly Detection",
        "overview.offline": "OFFLINE",
        "overview.stale": "OLD DATA",
        "overview.pending": "AI PENDING",
        "overview.notReady": "NOT READY",
        "overview.normal": "NORMAL",
        "overview.warning": "WARNING",
        "overview.critical": "HIGH RISK",
        "overview.detected": "DETECTED",
        "overview.unknown": "UNKNOWN",
        "overview.unavailable": "Unavailable",

        // Settings Page
        "settings.title": "Settings & Preferences",
        "settings.description": "Customize your monitoring dashboard experience",
        "settings.appearance": "Appearance",
        "settings.appearanceDesc": "Choose how the dashboard looks",
        "settings.theme": "Dashboard Theme",
        "settings.light": "Light",
        "settings.dark": "Dark",
        "settings.system": "System Default",
        "settings.language": "Language & Region",
        "settings.languageDesc": "Select your preferred interface language",
        "settings.languageLabel": "Display Language",
        "settings.languageHint": "Language selection is saved automatically.",
        "settings.monitoring": "Monitoring Preferences",
        "settings.monitoringDesc": "Control dashboard update preferences",
        "settings.refresh": "Auto-refresh Interval",
        "settings.refreshHint": "Controls supported dashboard polling intervals.",
        "settings.notifications": "Browser Notifications",
        "settings.notificationsHint": "Save your preference for future browser alert notifications.",
        "settings.save": "Save Preferences",
        "settings.saved": "Preferences saved successfully",
        "settings.reset": "Restore Defaults",
        "settings.note": "Settings are saved in this browser. Sensor measurements and AI records are not modified.",
        "settings.status": "Current Preferences",
        "settings.currentTheme": "Theme",
        "settings.currentLanguage": "Language",
        "settings.currentRefresh": "Refresh Interval",
        "settings.currentNotifications": "Notifications",
        "settings.enabled": "Enabled",
        "settings.disabled": "Disabled"
    },

    // ========================================================
    // HINDI
    // ========================================================

    hi: {

        // Common Layout
        "brand.subtitle": "स्वास्थ्य निगरानी प्रणाली",
        "nav.overview": "अवलोकन",
        "nav.analytics": "विश्लेषण",
        "nav.aiHealth": "एआई स्वास्थ्य",
        "nav.alerts": "अलर्ट",
        "nav.profile": "पशु प्रोफ़ाइल",
        "nav.settings": "सेटिंग्स",
        "header.subtitle": "स्मार्ट पशु स्वास्थ्य निगरानी प्लेटफ़ॉर्म",
        "footer.realData": "केवल वास्तविक सेंसर डेटा",
        "footer.platform": "कैटल एआई स्वास्थ्य निगरानी प्रणाली",

        // Overview Page
        "overview.pageTitle": "डैशबोर्ड अवलोकन",
        "overview.live": "लाइव सेंसर निगरानी",
        "overview.temperature": "सतह का तापमान",
        "overview.celsius": "डिग्री सेल्सियस (°C)",
        "overview.acceleration": "त्वरण",
        "overview.sound": "ध्वनि का अधिकतम स्तर",
        "overview.adc": "एडीसी पीक-टू-पीक",
        "overview.ai": "एआई निगरानी",
        "overview.health": "स्वास्थ्य स्थिति",
        "overview.risk": "जोखिम स्कोर",
        "overview.anomaly": "असामान्यता पहचान",
        "overview.offline": "ऑफ़लाइन",
        "overview.stale": "पुराना डेटा",
        "overview.pending": "एआई परिणाम लंबित",
        "overview.notReady": "तैयार नहीं",
        "overview.normal": "सामान्य",
        "overview.warning": "चेतावनी",
        "overview.critical": "उच्च जोखिम",
        "overview.detected": "असामान्यता मिली",
        "overview.unknown": "अज्ञात",
        "overview.unavailable": "उपलब्ध नहीं",

        // Settings Page
        "settings.title": "सेटिंग्स और प्राथमिकताएँ",
        "settings.description": "अपने निगरानी डैशबोर्ड को अनुकूलित करें",
        "settings.appearance": "दिखावट",
        "settings.appearanceDesc": "डैशबोर्ड का स्वरूप चुनें",
        "settings.theme": "डैशबोर्ड थीम",
        "settings.light": "लाइट",
        "settings.dark": "डार्क",
        "settings.system": "सिस्टम डिफ़ॉल्ट",
        "settings.language": "भाषा और क्षेत्र",
        "settings.languageDesc": "अपनी पसंद की भाषा चुनें",
        "settings.languageLabel": "प्रदर्शन भाषा",
        "settings.languageHint": "भाषा अपने आप सेव हो जाती है।",
        "settings.monitoring": "निगरानी प्राथमिकताएँ",
        "settings.monitoringDesc": "डैशबोर्ड अपडेट प्राथमिकताएँ चुनें",
        "settings.refresh": "ऑटो-रिफ्रेश अंतराल",
        "settings.refreshHint": "समर्थित पेजों का डेटा अपडेट अंतराल तय करता है।",
        "settings.notifications": "ब्राउज़र नोटिफिकेशन",
        "settings.notificationsHint": "भविष्य के अलर्ट नोटिफिकेशन के लिए प्राथमिकता सेव करें।",
        "settings.save": "प्राथमिकताएँ सेव करें",
        "settings.saved": "प्राथमिकताएँ सफलतापूर्वक सेव हुईं",
        "settings.reset": "डिफ़ॉल्ट सेटिंग्स",
        "settings.note": "सेटिंग्स इस ब्राउज़र में सेव होती हैं। सेंसर और एआई डेटा नहीं बदलता।",
        "settings.status": "वर्तमान प्राथमिकताएँ",
        "settings.currentTheme": "थीम",
        "settings.currentLanguage": "भाषा",
        "settings.currentRefresh": "रिफ्रेश अंतराल",
        "settings.currentNotifications": "नोटिफिकेशन",
        "settings.enabled": "चालू",
        "settings.disabled": "बंद"
    },

    // ========================================================
    // MARATHI
    // ========================================================

    mr: {

        // Common Layout
        "brand.subtitle": "आरोग्य निरीक्षण प्रणाली",
        "nav.overview": "आढावा",
        "nav.analytics": "विश्लेषण",
        "nav.aiHealth": "एआय आरोग्य",
        "nav.alerts": "सूचना",
        "nav.profile": "जनावराची माहिती",
        "nav.settings": "सेटिंग्ज",
        "header.subtitle": "स्मार्ट जनावर आरोग्य निरीक्षण प्रणाली",
        "footer.realData": "फक्त वास्तविक सेन्सर डेटा",
        "footer.platform": "कॅटल एआय आरोग्य निरीक्षण प्रणाली",

        // Overview Page
        "overview.pageTitle": "डॅशबोर्ड आढावा",
        "overview.live": "थेट सेन्सर निरीक्षण",
        "overview.temperature": "पृष्ठभागाचे तापमान",
        "overview.celsius": "अंश सेल्सिअस (°C)",
        "overview.acceleration": "त्वरण",
        "overview.sound": "ध्वनीची कमाल पातळी",
        "overview.adc": "एडीसी पीक-टू-पीक",
        "overview.ai": "एआय निरीक्षण",
        "overview.health": "आरोग्य स्थिती",
        "overview.risk": "जोखीम गुण",
        "overview.anomaly": "असामान्यता शोध",
        "overview.offline": "ऑफलाइन",
        "overview.stale": "जुना डेटा",
        "overview.pending": "एआय निकाल प्रलंबित",
        "overview.notReady": "तयार नाही",
        "overview.normal": "सामान्य",
        "overview.warning": "इशारा",
        "overview.critical": "उच्च जोखीम",
        "overview.detected": "असामान्यता आढळली",
        "overview.unknown": "अज्ञात",
        "overview.unavailable": "उपलब्ध नाही",

        // Settings Page
        "settings.title": "सेटिंग्ज आणि प्राधान्ये",
        "settings.description": "तुमचा डॅशबोर्ड सानुकूलित करा",
        "settings.appearance": "देखावा",
        "settings.appearanceDesc": "डॅशबोर्डचे स्वरूप निवडा",
        "settings.theme": "डॅशबोर्ड थीम",
        "settings.light": "लाइट",
        "settings.dark": "डार्क",
        "settings.system": "सिस्टम डीफॉल्ट",
        "settings.language": "भाषा आणि प्रदेश",
        "settings.languageDesc": "तुमची पसंतीची भाषा निवडा",
        "settings.languageLabel": "प्रदर्शन भाषा",
        "settings.languageHint": "भाषेची निवड आपोआप जतन होते.",
        "settings.monitoring": "निरीक्षण प्राधान्ये",
        "settings.monitoringDesc": "डॅशबोर्ड अद्यतन प्राधान्ये निवडा",
        "settings.refresh": "स्वयंचलित रिफ्रेश कालावधी",
        "settings.refreshHint": "समर्थित पृष्ठांसाठी अद्यतन कालावधी ठरवतो.",
        "settings.notifications": "ब्राउझर सूचना",
        "settings.notificationsHint": "भविष्यातील सूचनांसाठी तुमची पसंती जतन करा.",
        "settings.save": "प्राधान्ये जतन करा",
        "settings.saved": "प्राधान्ये यशस्वीरित्या जतन झाली",
        "settings.reset": "डीफॉल्ट सेटिंग्ज",
        "settings.note": "सेटिंग्ज या ब्राउझरमध्ये जतन होतात. सेन्सर आणि एआय डेटा बदलत नाही.",
        "settings.status": "सध्याची प्राधान्ये",
        "settings.currentTheme": "थीम",
        "settings.currentLanguage": "भाषा",
        "settings.currentRefresh": "रिफ्रेश कालावधी",
        "settings.currentNotifications": "सूचना",
        "settings.enabled": "सुरू",
        "settings.disabled": "बंद"
    },

    // ========================================================
    // TAMIL
    // ========================================================

    ta: {

        // Common Layout
        "brand.subtitle": "சுகாதார கண்காணிப்பு அமைப்பு",
        "nav.overview": "மேலோட்டம்",
        "nav.analytics": "பகுப்பாய்வு",
        "nav.aiHealth": "AI ஆரோக்கியம்",
        "nav.alerts": "எச்சரிக்கைகள்",
        "nav.profile": "கால்நடை விவரம்",
        "nav.settings": "அமைப்புகள்",
        "header.subtitle": "ஸ்மார்ட் கால்நடை சுகாதார கண்காணிப்பு",
        "footer.realData": "உண்மையான சென்சார் தரவு மட்டும்",
        "footer.platform": "கேட்டில் AI சுகாதார கண்காணிப்பு அமைப்பு",

        // Overview Page
        "overview.pageTitle": "டாஷ்போர்டு மேலோட்டம்",
        "overview.live": "நேரடி சென்சார் கண்காணிப்பு",
        "overview.temperature": "மேற்பரப்பு வெப்பநிலை",
        "overview.celsius": "டிகிரி செல்சியஸ் (°C)",
        "overview.acceleration": "முடுக்கம்",
        "overview.sound": "ஒலியின் உச்ச அளவு",
        "overview.adc": "ADC உச்சத்திலிருந்து உச்சம்",
        "overview.ai": "AI கண்காணிப்பு",
        "overview.health": "ஆரோக்கிய நிலை",
        "overview.risk": "ஆபத்து மதிப்பெண்",
        "overview.anomaly": "அசாதாரணம் கண்டறிதல்",
        "overview.offline": "இணைப்பில்லை",
        "overview.stale": "பழைய தரவு",
        "overview.pending": "AI முடிவு நிலுவையில்",
        "overview.notReady": "தயாராக இல்லை",
        "overview.normal": "இயல்பானது",
        "overview.warning": "எச்சரிக்கை",
        "overview.critical": "அதிக ஆபத்து",
        "overview.detected": "கண்டறியப்பட்டது",
        "overview.unknown": "தெரியவில்லை",
        "overview.unavailable": "கிடைக்கவில்லை",

        // Settings Page
        "settings.title": "அமைப்புகள் மற்றும் விருப்பங்கள்",
        "settings.description": "உங்கள் டாஷ்போர்டைத் தனிப்பயனாக்குங்கள்",
        "settings.appearance": "தோற்றம்",
        "settings.appearanceDesc": "டாஷ்போர்டின் தோற்றத்தைத் தேர்ந்தெடுக்கவும்",
        "settings.theme": "டாஷ்போர்டு தீம்",
        "settings.light": "லைட்",
        "settings.dark": "டார்க்",
        "settings.system": "கணினி இயல்புநிலை",
        "settings.language": "மொழி மற்றும் பகுதி",
        "settings.languageDesc": "விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
        "settings.languageLabel": "காட்சி மொழி",
        "settings.languageHint": "மொழித் தேர்வு தானாகவே சேமிக்கப்படும்.",
        "settings.monitoring": "கண்காணிப்பு விருப்பங்கள்",
        "settings.monitoringDesc": "டாஷ்போர்டு புதுப்பிப்பு விருப்பங்கள்",
        "settings.refresh": "தானியங்கி புதுப்பிப்பு இடைவெளி",
        "settings.refreshHint": "ஆதரிக்கப்படும் பக்கங்களின் புதுப்பிப்பு இடைவெளி.",
        "settings.notifications": "உலாவி அறிவிப்புகள்",
        "settings.notificationsHint": "எதிர்கால எச்சரிக்கைகளுக்கான விருப்பத்தைச் சேமிக்கவும்.",
        "settings.save": "விருப்பங்களைச் சேமி",
        "settings.saved": "விருப்பங்கள் வெற்றிகரமாக சேமிக்கப்பட்டன",
        "settings.reset": "இயல்புநிலைக்கு மீட்டமை",
        "settings.note": "அமைப்புகள் இந்த உலாவியில் சேமிக்கப்படும். சென்சார் மற்றும் AI தரவு மாற்றப்படாது.",
        "settings.status": "தற்போதைய விருப்பங்கள்",
        "settings.currentTheme": "தீம்",
        "settings.currentLanguage": "மொழி",
        "settings.currentRefresh": "புதுப்பிப்பு இடைவெளி",
        "settings.currentNotifications": "அறிவிப்புகள்",
        "settings.enabled": "இயக்கப்பட்டது",
        "settings.disabled": "முடக்கப்பட்டது"
    },

    // ========================================================
    // TELUGU
    // ========================================================

    te: {

        // Common Layout
        "brand.subtitle": "ఆరోగ్య పర్యవేక్షణ వ్యవస్థ",
        "nav.overview": "అవలోకనం",
        "nav.analytics": "విశ్లేషణ",
        "nav.aiHealth": "AI ఆరోగ్యం",
        "nav.alerts": "హెచ్చరికలు",
        "nav.profile": "పశువుల వివరాలు",
        "nav.settings": "సెట్టింగులు",
        "header.subtitle": "స్మార్ట్ పశువుల ఆరోగ్య పర్యవేక్షణ",
        "footer.realData": "నిజమైన సెన్సార్ డేటా మాత్రమే",
        "footer.platform": "క్యాటిల్ AI ఆరోగ్య పర్యవేక్షణ వ్యవస్థ",

        // Overview Page
        "overview.pageTitle": "డాష్‌బోర్డ్ అవలోకనం",
        "overview.live": "ప్రత్యక్ష సెన్సార్ పర్యవేక్షణ",
        "overview.temperature": "ఉపరితల ఉష్ణోగ్రత",
        "overview.celsius": "డిగ్రీల సెల్సియస్ (°C)",
        "overview.acceleration": "త్వరణం",
        "overview.sound": "గరిష్ఠ శబ్ద స్థాయి",
        "overview.adc": "ADC పీక్-టు-పీక్",
        "overview.ai": "AI పర్యవేక్షణ",
        "overview.health": "ఆరోగ్య స్థితి",
        "overview.risk": "ప్రమాద స్కోరు",
        "overview.anomaly": "అసాధారణత గుర్తింపు",
        "overview.offline": "ఆఫ్‌లైన్",
        "overview.stale": "పాత డేటా",
        "overview.pending": "AI ఫలితం పెండింగ్‌లో ఉంది",
        "overview.notReady": "సిద్ధంగా లేదు",
        "overview.normal": "సాధారణం",
        "overview.warning": "హెచ్చరిక",
        "overview.critical": "అధిక ప్రమాదం",
        "overview.detected": "గుర్తించబడింది",
        "overview.unknown": "తెలియదు",
        "overview.unavailable": "అందుబాటులో లేదు",

        // Settings Page
        "settings.title": "సెట్టింగులు మరియు ప్రాధాన్యతలు",
        "settings.description": "మీ డాష్‌బోర్డ్‌ను అనుకూలీకరించండి",
        "settings.appearance": "రూపం",
        "settings.appearanceDesc": "డాష్‌బోర్డ్ రూపాన్ని ఎంచుకోండి",
        "settings.theme": "డాష్‌బోర్డ్ థీమ్",
        "settings.light": "లైట్",
        "settings.dark": "డార్క్",
        "settings.system": "సిస్టమ్ డిఫాల్ట్",
        "settings.language": "భాష మరియు ప్రాంతం",
        "settings.languageDesc": "మీకు నచ్చిన భాషను ఎంచుకోండి",
        "settings.languageLabel": "ప్రదర్శన భాష",
        "settings.languageHint": "భాష ఎంపిక స్వయంచాలకంగా సేవ్ అవుతుంది.",
        "settings.monitoring": "పర్యవేక్షణ ప్రాధాన్యతలు",
        "settings.monitoringDesc": "డాష్‌బోర్డ్ నవీకరణ ప్రాధాన్యతలు",
        "settings.refresh": "ఆటో-రిఫ్రెష్ వ్యవధి",
        "settings.refreshHint": "మద్దతు ఉన్న పేజీల నవీకరణ వ్యవధి.",
        "settings.notifications": "బ్రౌజర్ నోటిఫికేషన్లు",
        "settings.notificationsHint": "భవిష్యత్ హెచ్చరికల కోసం ఎంపికను సేవ్ చేయండి.",
        "settings.save": "ప్రాధాన్యతలను సేవ్ చేయండి",
        "settings.saved": "ప్రాధాన్యతలు విజయవంతంగా సేవ్ అయ్యాయి",
        "settings.reset": "డిఫాల్ట్ సెట్టింగులు",
        "settings.note": "సెట్టింగులు ఈ బ్రౌజర్‌లో సేవ్ అవుతాయి. సెన్సార్ మరియు AI డేటా మారదు.",
        "settings.status": "ప్రస్తుత ప్రాధాన్యతలు",
        "settings.currentTheme": "థీమ్",
        "settings.currentLanguage": "భాష",
        "settings.currentRefresh": "రిఫ్రెష్ వ్యవధి",
        "settings.currentNotifications": "నోటిఫికేషన్లు",
        "settings.enabled": "ఆన్",
        "settings.disabled": "ఆఫ్"
    }
};


// ============================================================
// LANGUAGE FUNCTIONS
// ============================================================

function getCattleLanguage() {

    const language = localStorage.getItem(
        CATTLE_LANGUAGE_KEY
    ) || "en";

    return cattleTranslations[language]
        ? language
        : "en";
}


function cattleTranslate(key) {

    const language = getCattleLanguage();

    return (
        cattleTranslations[language]?.[key]
        ?? cattleTranslations.en[key]
        ?? key
    );
}


// ============================================================
// APPLY TRANSLATIONS TO PAGE
// ============================================================

function applyCattleTranslations() {

    const language = getCattleLanguage();

    document.documentElement.lang = language;

    document.querySelectorAll(
        "[data-i18n]"
    ).forEach(element => {

        const key = element.dataset.i18n;

        element.textContent = cattleTranslate(key);
    });

    window.dispatchEvent(
        new CustomEvent("cattle:language-applied", {
            detail: { language }
        })
    );
}


// ============================================================
// CHANGE LANGUAGE
// ============================================================

function setCattleLanguage(language) {

    if (!cattleTranslations[language]) {
        return;
    }

    localStorage.setItem(
        CATTLE_LANGUAGE_KEY,
        language
    );

    applyCattleTranslations();
}


// ============================================================
// INITIALIZE
// ============================================================

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        applyCattleTranslations
    );

} else {

    applyCattleTranslations();
}
