import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appName: "ArogyaSeva",
      welcomeTitle: "Welcome to ArogyaSeva",
      selectLanguage: "Please select your language.",
      continue: "Continue",
      loginTitle: "Patient Identification",
      loginWithMobile: "Login with Mobile",
      mobilePlaceholder: "Enter mobile number",
      registerNew: "New User Registration",
      name: "Name",
      age: "Age",
      gender: "Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      dashboardTitle: "Main Dashboard",
      consultDoctor: "Consult a Doctor",
      checkVitals: "Check My Vitals",
      oldPrescription: "View Old Prescriptions",
      vitalsTitle: "Vitals Recording",
      sendVitals: "Send Vitals to Doctor",
      waitingTitle: "Waiting Room",
      queueNumber: "Queue Number",
      waitTime: "Estimated Wait Time",
      consultationTitle: "Video Consultation",
      mute: "Mute",
      unmute: "Unmute",
      endCall: "End Call",
      showVitals: "Show Vitals",
      prescriptionTitle: "Prescription Summary",
      printPrescription: "Print Prescription",
      sendSMS: "Send SMS",
      finishSession: "Finish Session",
      audioHelp: "Audio Help",
      noInternet: "No internet. Data is cached and will sync automatically.",
      syncing: "Syncing cached data...",
      ready: "Ready",
      hr: "Heart Rate",
      bp: "Blood Pressure",
      temp: "Temperature",
      spo2: "Oxygen Level",
      weight: "Weight",
      next: "Next",
      back: "Back"
    }
  },
  hi: {
    translation: {
      appName: "आरोग्यसेवा",
      welcomeTitle: "आरोग्यसेवा में आपका स्वागत है",
      selectLanguage: "कृपया अपनी भाषा चुनें।",
      continue: "आगे बढ़ें",
      loginTitle: "रोगी पहचान",
      loginWithMobile: "मोबाइल से लॉगिन",
      mobilePlaceholder: "मोबाइल नंबर दर्ज करें",
      registerNew: "नया पंजीकरण",
      name: "नाम",
      age: "आयु",
      gender: "लिंग",
      male: "पुरुष",
      female: "महिला",
      other: "अन्य",
      dashboardTitle: "मुख्य डैशबोर्ड",
      consultDoctor: "डॉक्टर से परामर्श",
      checkVitals: "वाइटल्स जांचें",
      oldPrescription: "पुराने पर्चे देखें",
      vitalsTitle: "वाइटल्स रिकॉर्डिंग",
      sendVitals: "वाइटल्स डॉक्टर को भेजें",
      waitingTitle: "प्रतीक्षा कक्ष",
      queueNumber: "कतार संख्या",
      waitTime: "अनुमानित प्रतीक्षा समय",
      consultationTitle: "वीडियो परामर्श",
      mute: "म्यूट",
      unmute: "अनम्यूट",
      endCall: "कॉल समाप्त करें",
      showVitals: "वाइटल्स दिखाएं",
      prescriptionTitle: "डिजिटल पर्चा",
      printPrescription: "पर्चा प्रिंट करें",
      sendSMS: "एसएमएस भेजें",
      finishSession: "सत्र समाप्त करें",
      audioHelp: "आवाज़ सहायता",
      noInternet: "इंटरनेट नहीं है। डेटा सुरक्षित है और बाद में सिंक होगा।",
      syncing: "कैश डेटा सिंक हो रहा है...",
      ready: "तैयार",
      hr: "हृदय गति",
      bp: "रक्तचाप",
      temp: "तापमान",
      spo2: "ऑक्सीजन स्तर",
      weight: "वज़न",
      next: "आगे",
      back: "पीछे"
    }
  },
  mr: {
    translation: {
      appName: "आरोग्यसेवा",
      welcomeTitle: "आरोग्यसेवेत आपले स्वागत आहे",
      selectLanguage: "कृपया आपली भाषा निवडा.",
      continue: "पुढे",
      loginTitle: "रुग्ण ओळख",
      dashboardTitle: "मुख्य पटल",
      consultDoctor: "डॉक्टरांचा सल्ला घ्या",
      checkVitals: "व्हायटल्स तपासा",
      oldPrescription: "जुनी प्रिस्क्रिप्शन पाहा",
      vitalsTitle: "व्हायटल्स नोंद",
      waitingTitle: "प्रतीक्षा कक्ष",
      consultationTitle: "व्हिडिओ सल्लामसलत",
      prescriptionTitle: "प्रिस्क्रिप्शन सारांश",
      audioHelp: "आवाज मदत",
      next: "पुढे",
      back: "मागे"
    }
  },
  bn: {
    translation: {
      appName: "আরোগ্যসেবা",
      welcomeTitle: "আরোগ্যসেবায় স্বাগতম",
      selectLanguage: "অনুগ্রহ করে আপনার ভাষা নির্বাচন করুন।",
      continue: "পরবর্তী",
      loginTitle: "রোগী সনাক্তকরণ",
      dashboardTitle: "প্রধান ড্যাশবোর্ড",
      consultDoctor: "ডাক্তারের সাথে কথা বলুন",
      checkVitals: "ভাইটালস দেখুন",
      oldPrescription: "পুরনো প্রেসক্রিপশন",
      vitalsTitle: "ভাইটালস রেকর্ডিং",
      waitingTitle: "অপেক্ষা কক্ষ",
      consultationTitle: "ভিডিও পরামর্শ",
      prescriptionTitle: "প্রেসক্রিপশন সারাংশ",
      audioHelp: "ভয়েস সহায়তা",
      next: "পরবর্তী",
      back: "পিছনে"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("kiosk-language") || "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
