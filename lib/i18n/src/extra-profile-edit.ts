import type { Domain } from "./types";

/**
 * Keys for the mobile profile-edit screen (app/profile-edit.tsx) plus a few
 * previously-missing keys discovered during the i18n audit (flights hub header,
 * legal last-updated date, and dynamic umrah status labels).
 */
export const extraProfileEdit: Domain = {
  // ── Header / gate ─────────────────────────────────────────────────────────
  "profileEdit.header": { ar: "الملف الشخصي", en: "My Profile" },
  "profileEdit.loginFirst": { ar: "يرجى تسجيل الدخول أولاً", en: "Please sign in first" },

  // ── Section 1: personal photo ─────────────────────────────────────────────
  "profileEdit.photoTitle": { ar: "الصورة الشخصية", en: "Personal Photo" },
  "profileEdit.photoSubtitle": {
    ar: "قم برفع أو تحديث صورتك الشخصية",
    en: "Upload or update your personal photo",
  },
  "profileEdit.uploadPhoto": { ar: "رفع الصورة الشخصية", en: "Upload personal photo" },
  "profileEdit.replacePhoto": { ar: "تغيير الصورة", en: "Change photo" },
  "profileEdit.uploading": { ar: "جاري الرفع...", en: "Uploading..." },
  "profileEdit.validatingPhoto": { ar: "جاري التحقق من الصورة...", en: "Validating photo..." },
  "profileEdit.pickImage": { ar: "اضغط لرفع المستند", en: "Tap to upload" },
  "profileEdit.photoRejected": {
    ar: "الصورة غير مطابقة للمتطلبات. يرجى رفع صورة شخصية واضحة وحديثة بخلفية فاتحة.",
    en: "The photo does not meet the requirements. Please upload a clear, recent personal photo with a light background.",
  },
  "profileEdit.photoCheckUnavailable": {
    ar: "تعذر التحقق الآلي من الصورة حالياً. تم حفظ الصورة وستتم مراجعتها لاحقاً.",
    en: "Automatic photo verification is currently unavailable. Your photo was saved and will be reviewed later.",
  },
  "profileEdit.photoUploadFailBody": {
    ar: "تعذر رفع الصورة. تحقق من اتصالك وحاول مرة أخرى.",
    en: "Could not upload the photo. Check your connection and try again.",
  },

  // ── Section 2: passport ───────────────────────────────────────────────────
  "profileEdit.passportTitle": { ar: "بيانات جواز السفر", en: "Passport Details" },
  "profileEdit.passportSubtitle": {
    ar: "يتم استخراج البيانات تلقائياً من الجواز",
    en: "Details are extracted automatically from your passport",
  },
  "profileEdit.uploadPassportImage": {
    ar: "اضغط لرفع صورة جواز السفر",
    en: "Tap to upload your passport image",
  },
  "profileEdit.infoPageOnly": {
    ar: "صفحة البيانات الشخصية فقط",
    en: "The personal information page only",
  },
  "profileEdit.replace": { ar: "تغيير", en: "Change" },
  "profileEdit.readingPassport": { ar: "جاري قراءة الجواز...", en: "Reading passport..." },
  "profileEdit.aiExtracting": {
    ar: "يتم استخراج البيانات تلقائياً، لحظات من فضلك",
    en: "Extracting your details automatically, one moment please",
  },
  "profileEdit.ocrFailed": {
    ar: "تعذرت قراءة الجواز تلقائياً. يمكنك إدخال البيانات يدوياً.",
    en: "Could not read the passport automatically. You can enter the details manually.",
  },
  "profileEdit.passportUploadFailBody": {
    ar: "تعذر رفع صورة الجواز. تحقق من اتصالك وحاول مرة أخرى.",
    en: "Could not upload the passport image. Check your connection and try again.",
  },

  // ── Passport / personal fields ────────────────────────────────────────────
  "profileEdit.firstName": { ar: "الاسم الأول", en: "First name" },
  "profileEdit.lastName": { ar: "اسم العائلة", en: "Last name" },
  "profileEdit.passportNumber": { ar: "رقم الجواز", en: "Passport number" },
  "profileEdit.nationality": { ar: "الجنسية", en: "Nationality" },
  "profileEdit.nationalityPlaceholder": { ar: "مثال: سعودي", en: "e.g. Saudi" },
  "profileEdit.dateOfBirth": { ar: "تاريخ الميلاد", en: "Date of birth" },
  "profileEdit.gender": { ar: "الجنس", en: "Gender" },
  "profileEdit.male": { ar: "ذكر", en: "Male" },
  "profileEdit.female": { ar: "أنثى", en: "Female" },
  "profileEdit.passportIssueDate": { ar: "تاريخ إصدار الجواز", en: "Passport issue date" },
  "profileEdit.passportExpiry": { ar: "تاريخ انتهاء الجواز", en: "Passport expiry date" },
  "profileEdit.passportIssueCountry": { ar: "دولة إصدار الجواز", en: "Passport issuing country" },
  "profileEdit.passportIssuePlace": { ar: "مكان إصدار الجواز", en: "Place of issue" },

  // ── Section 3: contact ────────────────────────────────────────────────────
  "profileEdit.contactTitle": { ar: "بيانات التواصل", en: "Contact Details" },
  "profileEdit.phone": { ar: "رقم الهاتف", en: "Phone number" },
  "profileEdit.whatsapp": { ar: "رقم الواتساب", en: "WhatsApp number" },
  "profileEdit.address": { ar: "العنوان", en: "Address" },
  "profileEdit.email": { ar: "البريد الإلكتروني", en: "Email" },

  // ── Section 4: GCC residency ──────────────────────────────────────────────
  "profileEdit.gccTitle": { ar: "إقامة دول مجلس التعاون", en: "GCC Residency" },
  "profileEdit.gccSubtitle": {
    ar: "هل أنت مقيم في إحدى دول مجلس التعاون الخليجي؟",
    en: "Are you a resident of a GCC country?",
  },
  "profileEdit.gccCountry": { ar: "دولة الإقامة", en: "Country of residence" },
  "profileEdit.gccNumber": { ar: "رقم الإقامة", en: "Residence permit number" },
  "profileEdit.gccExpiry": { ar: "تاريخ الانتهاء", en: "Expiry date" },
  "profileEdit.gccFront": { ar: "صورة الإقامة (الوجه الأمامي)", en: "Residence permit (front)" },
  "profileEdit.gccBack": { ar: "صورة الإقامة (الوجه الخلفي)", en: "Residence permit (back)" },
  "profileEdit.country.sa": { ar: "السعودية", en: "Saudi Arabia" },
  "profileEdit.country.ae": { ar: "الإمارات", en: "United Arab Emirates" },
  "profileEdit.country.kw": { ar: "الكويت", en: "Kuwait" },
  "profileEdit.country.qa": { ar: "قطر", en: "Qatar" },
  "profileEdit.country.bh": { ar: "البحرين", en: "Bahrain" },
  "profileEdit.country.om": { ar: "عُمان", en: "Oman" },

  // ── Section 5: European residency ─────────────────────────────────────────
  "profileEdit.euroTitle": {
    ar: "الإقامة الأوروبية / تأشيرة شنغن",
    en: "European Residency / Schengen Visa",
  },
  "profileEdit.euroSubtitle": {
    ar: "هل لديك إقامة أوروبية أو تأشيرة شنغن سارية؟",
    en: "Do you hold a valid European residency or Schengen visa?",
  },
  "profileEdit.euroDocType": { ar: "نوع الوثيقة", en: "Document type" },
  "profileEdit.euroExpiry": { ar: "تاريخ الانتهاء", en: "Expiry date" },
  "profileEdit.euroDocImage": { ar: "صورة الوثيقة", en: "Document image" },
  "profileEdit.euroDoc.schengen": { ar: "تأشيرة شنغن", en: "Schengen visa" },
  "profileEdit.euroDoc.euResidency": { ar: "إقامة أوروبية", en: "EU residency" },
  "profileEdit.euroDoc.ukVisa": { ar: "تأشيرة بريطانيا", en: "UK visa" },
  "profileEdit.euroDoc.ukResidency": { ar: "إقامة بريطانية", en: "UK residency" },

  // ── Save / result ─────────────────────────────────────────────────────────
  "profileEdit.saveButton": { ar: "حفظ الملف الشخصي", en: "Save Profile" },
  "profileEdit.saveFailBody": {
    ar: "تعذر حفظ البيانات. حاول مرة أخرى.",
    en: "Could not save your details. Please try again.",
  },
  "profileEdit.savedTitle": { ar: "تم حفظ الملف الشخصي", en: "Profile Saved" },
  "profileEdit.savedBody": {
    ar: "تم حفظ بيانات ملفك الشخصي بنجاح.",
    en: "Your profile details were saved successfully.",
  },
  "profileEdit.savedOk": { ar: "حسناً", en: "OK" },
  "profileEdit.savedBack": { ar: "العودة للحساب", en: "Back to Account" },

  // ── Flights & hotels hub header (coming soon screen) ──────────────────────
  "flights.hubTitle": { ar: "الرحلات والفنادق", en: "Flights & Hotels" },
  "flights.hubSub": {
    ar: "خدمات الحجز ستتوفر قريباً",
    en: "Booking services are coming soon",
  },

  // ── Legal last-updated date (terms & privacy screens) ─────────────────────
  "legal.lastUpdatedDate": { ar: "17 أغسطس 2026", en: "August 17, 2026" },

  // ── Umrah application statuses resolved dynamically (status.<camelCase>) ──
  "status.awaitingPayment": { ar: "بانتظار الدفع", en: "Awaiting payment" },
  "status.submitted": { ar: "تم التقديم", en: "Submitted" },
};
