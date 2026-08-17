import type { Domain } from "./types";

/**
 * Central translation dictionaries, organized by domain.
 *
 * Each domain is a flat map of dotted keys → `{ ar, en }`. Keys are namespaced
 * by domain prefix (e.g. `common.*`, `auth.*`) and MUST be globally unique
 * because {@link ../index.ts} merges every domain into a single flat map.
 *
 * Sources merged here:
 *  - artifacts/absher-travel/src/hooks/use-translation.tsx
 *  - artifacts/absher-mobile/constants/i18n.ts
 *  - hardcoded strings surveyed across the pages/screens of both apps.
 *
 * App-migration agents will add stragglers; the bulk of translations live here.
 */

/** Generic UI: buttons, actions, statuses, generic labels. */
export const common: Domain = {
  "common.brand": { ar: "ABSHER TRAVEL", en: "ABSHER TRAVEL" },
  "common.loadingError": { ar: "تعذّر التحميل", en: "Failed to load" },
  "common.result": { ar: "نتيجة", en: "result(s)" },
  "common.tagline": {
    ar: "خدمات موثوقة للتأشيرات والسفر",
    en: "Trusted visa & travel services",
  },
  "common.loading": { ar: "جاري التحميل...", en: "Loading..." },
  "common.saving": { ar: "جاري الحفظ...", en: "Saving..." },
  "common.sending": { ar: "جاري الإرسال...", en: "Sending..." },
  "common.noData": { ar: "لا توجد بيانات", en: "No data available" },
  "common.readMore": { ar: "المزيد", en: "Read More" },
  "common.showMore": { ar: "عرض المزيد", en: "Show more" },
  "common.showLess": { ar: "عرض أقل", en: "Show less" },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.confirm": { ar: "تأكيد", en: "Confirm" },
  "common.delete": { ar: "حذف", en: "Delete" },
  "common.edit": { ar: "تعديل", en: "Edit" },
  "common.add": { ar: "إضافة", en: "Add" },
  "common.close": { ar: "إغلاق", en: "Close" },
  "common.back": { ar: "رجوع", en: "Back" },
  "common.next": { ar: "التالي", en: "Next" },
  "common.previous": { ar: "السابق", en: "Previous" },
  "common.continue": { ar: "متابعة", en: "Continue" },
  "common.submit": { ar: "إرسال", en: "Submit" },
  "common.retry": { ar: "حاول مرة أخرى", en: "Try again" },
  "common.search": { ar: "بحث", en: "Search" },
  "common.filter": { ar: "تصفية", en: "Filter" },
  "common.all": { ar: "الكل", en: "All" },
  "common.yes": { ar: "نعم", en: "Yes" },
  "common.no": { ar: "لا", en: "No" },
  "common.ok": { ar: "حسناً", en: "OK" },
  "common.done": { ar: "تم", en: "Done" },
  "common.optional": { ar: "اختياري", en: "Optional" },
  "common.required": { ar: "مطلوب", en: "Required" },
  "common.comingSoon": { ar: "قريباً", en: "Coming soon" },
  "common.viewAll": { ar: "عرض الكل", en: "View all" },
  "common.price": { ar: "السعر", en: "Price" },
  "common.from": { ar: "من", en: "From" },
  "common.perPerson": { ar: "للشخص", en: "per person" },
  "common.duration": { ar: "المدة", en: "Duration" },
  "common.days": { ar: "يوم", en: "days" },
  "common.nights": { ar: "ليلة", en: "nights" },
  "common.currency": { ar: "ريال", en: "SAR" },
  "common.langToggle": { ar: "English", en: "العربية" },
  "common.arabic": { ar: "عربي", en: "Arabic" },
  "common.english": { ar: "الإنجليزية", en: "English" },
};

/** Navigation, tabs, header actions. */
export const nav: Domain = {
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.destinations": { ar: "الوجهات", en: "Destinations" },
  "nav.offers": { ar: "العروض", en: "Offers" },
  "nav.programs": { ar: "البرامج السياحية", en: "Tourism Programs" },
  "nav.programsShort": { ar: "البرامج", en: "Programs" },
  "nav.visas": { ar: "التأشيرات", en: "Visas" },
  "nav.flights": { ar: "الرحلات", en: "Flights" },
  "nav.bookings": { ar: "طلباتي", en: "Bookings" },
  "nav.account": { ar: "الملف الشخصي", en: "Profile" },
  "nav.about": { ar: "من نحن", en: "About Us" },
  "nav.contact": { ar: "تواصل معنا", en: "Contact Us" },
  "nav.admin": { ar: "لوحة التحكم", en: "Admin" },
};

/** Onboarding & welcome (mobile). */
export const onboarding: Domain = {
  "onboarding.skip": { ar: "تخطي", en: "Skip" },
  "onboarding.start": { ar: "ابدأ رحلتك", en: "Start your journey" },
  "onboarding.slide1.title": { ar: "ABSHER TRAVEL", en: "ABSHER TRAVEL" },
  "onboarding.slide1.subtitle": {
    ar: "رحلاتك تبدأ هنا - خدمات سفر متكاملة بلمسة واحدة",
    en: "Your journey starts here — complete travel services in one tap",
  },
  "onboarding.slide2.title": { ar: "تأشيرات ووثائق", en: "Visas & Documents" },
  "onboarding.slide2.subtitle": {
    ar: "نسهل عليك استخراج التأشيرات لأكثر من 150 وجهة حول العالم",
    en: "We make it easy to get visas for 150+ destinations worldwide",
  },
  "onboarding.slide3.title": { ar: "رحلات فاخرة", en: "Premium Trips" },
  "onboarding.slide3.subtitle": {
    ar: "برامج سياحية حصرية وعروض استثنائية تناسب تطلعاتك",
    en: "Exclusive tour programs and exceptional offers tailored to you",
  },
  "welcome.tagline": {
    ar: "خدمات موثوقة للتأشيرات والسفر",
    en: "Trusted visa & travel services",
  },
  "welcome.login": { ar: "تسجيل الدخول", en: "Sign In" },
  "welcome.register": { ar: "إنشاء حساب", en: "Create Account" },
  "welcome.explore": { ar: "استكشف الخدمات", en: "Explore Services" },
  "welcome.contact": { ar: "تواصل معنا", en: "Contact Us" },
  "welcome.contactMessage": {
    ar: "مرحباً، أرغب في الاستفسار عن خدمات ABSHER TRAVEL",
    en: "Hello, I would like to inquire about ABSHER TRAVEL services",
  },
};

/** Authentication: login / register / verify / forgot. */
export const auth: Domain = {
  // login
  "login.title": { ar: "تسجيل الدخول", en: "Sign In" },
  "login.email": { ar: "البريد الإلكتروني", en: "Email" },
  "login.emailPlaceholder": { ar: "example@email.com", en: "example@email.com" },
  "login.password": { ar: "كلمة المرور", en: "Password" },
  "login.forgot": { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },
  "login.submit": { ar: "تسجيل الدخول", en: "Sign In" },
  "login.submitting": { ar: "جاري الدخول...", en: "Signing in..." },
  "login.noAccount": { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  "login.createAccount": { ar: "إنشاء حساب جديد", en: "Create a new account" },
  "login.missingTitle": { ar: "بيانات ناقصة", en: "Missing information" },
  "login.missingBody": {
    ar: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
    en: "Please enter your email and password",
  },
  "login.errorTitle": { ar: "خطأ في الدخول", en: "Sign-in error" },
  "login.errorBody": {
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    en: "Email or password is incorrect",
  },
  // register
  "register.title": { ar: "إنشاء حساب جديد", en: "Create Account" },
  "register.firstName": { ar: "الاسم الأول", en: "First name" },
  "register.firstNamePlaceholder": { ar: "محمد", en: "Mohammed" },
  "register.lastName": { ar: "الاسم الأخير", en: "Last name" },
  "register.lastNamePlaceholder": { ar: "السعيد", en: "Alsaeed" },
  "register.email": { ar: "البريد الإلكتروني", en: "Email" },
  "register.emailPlaceholder": { ar: "example@email.com", en: "example@email.com" },
  "register.phone": { ar: "رقم الهاتف", en: "Phone number" },
  "register.phonePlaceholder": { ar: "5X XXX XXXX", en: "5X XXX XXXX" },
  "register.password": { ar: "كلمة المرور", en: "Password" },
  "register.passwordPlaceholder": {
    ar: "8 أحرف على الأقل",
    en: "At least 8 characters",
  },
  "register.confirmPassword": { ar: "تأكيد كلمة المرور", en: "Confirm password" },
  "register.confirmPasswordPlaceholder": {
    ar: "أعد إدخال كلمة المرور",
    en: "Re-enter your password",
  },
  "register.submit": { ar: "إنشاء الحساب", en: "Create Account" },
  "register.submitting": { ar: "جاري الإنشاء...", en: "Creating..." },
  "register.haveAccount": { ar: "لديك حساب بالفعل؟", en: "Already have an account?" },
  "register.login": { ar: "تسجيل الدخول", en: "Sign In" },
  "register.missingContact": {
    ar: "يرجى إدخال البريد الإلكتروني أو رقم الهاتف",
    en: "Please enter your email or phone number",
  },
  "register.missingPassword": {
    ar: "يرجى إدخال كلمة المرور",
    en: "Please enter a password",
  },
  "register.passwordMismatch": {
    ar: "كلمة المرور غير متطابقة",
    en: "Passwords do not match",
  },
  "register.passwordShort": {
    ar: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    en: "Password must be at least 8 characters",
  },
  "register.errorBody": {
    ar: "فشل إنشاء الحساب، ربما البريد الإلكتروني مسجل مسبقاً",
    en: "Failed to create account, the email may already be registered",
  },
  "register.missingTitle": { ar: "بيانات ناقصة", en: "Missing information" },
  "register.errorTitle": { ar: "خطأ", en: "Error" },
  // Auth screen redesign
  "auth.tagline": { ar: "شريكك المتميز في السفر", en: "Your Premium Travel Partner" },
  "auth.heroTitle": { ar: "رحلتك تبدأ هنا", en: "Your Journey Starts Here" },
  "auth.heroSubtitle": { ar: "خدمات سفر متكاملة بلمسة واحدة", en: "Complete travel services in one tap" },
  "auth.tabLogin": { ar: "تسجيل الدخول", en: "Sign In" },
  "auth.tabRegister": { ar: "إنشاء حساب جديد", en: "Create Account" },
  "auth.rememberMe": { ar: "تذكرني", en: "Remember me" },
  "auth.orSignIn": { ar: "أو سجل الدخول باستخدام", en: "Or sign in with" },
  "auth.phoneNumber": { ar: "رقم الجوال", en: "Phone" },
  "auth.trust.help.title": { ar: "تحتاج مساعدة؟", en: "Need help?" },
  "auth.trust.help.caption": { ar: "تواصل مع الدعم", en: "Contact support" },
  "auth.identifier": { ar: "البريد الإلكتروني أو رقم الجوال", en: "Email or phone number" },
  "auth.identifierPlaceholder": {
    ar: "أدخل بريدك الإلكتروني أو رقم جوالك",
    en: "Enter your email or phone number",
  },
  "auth.orContinue": { ar: "أو تابع عبر", en: "Or continue with" },
  "auth.googleSignIn": { ar: "تسجيل الدخول بحساب Google", en: "Sign in with Google" },
  "auth.googleSoonTitle": { ar: "قريباً", en: "Coming soon" },
  "auth.googleSoonBody": {
    ar: "سيتوفر تسجيل الدخول عبر Google قريباً",
    en: "Sign-in with Google will be available soon",
  },
  "auth.trust.secure.title": { ar: "آمن وموثوق", en: "Safe & Secure" },
  "auth.trust.secure.caption": { ar: "حماية بياناتك ومعاملاتك", en: "Protecting your data & transactions" },
  "auth.trust.support.title": { ar: "دعم على مدار الساعة", en: "24/7 Support" },
  "auth.trust.support.caption": { ar: "فريق دعم متخصص لمساعدتك", en: "A dedicated team to help you" },
  "auth.trust.experience.title": { ar: "خبرة موثوقة", en: "Trusted Expertise" },
  "auth.trust.experience.caption": { ar: "سنوات من الخبرة في خدمتك", en: "Years of experience at your service" },
  // forgot password
  "forgot.title1": { ar: "نسيت كلمة المرور؟", en: "Forgot password?" },
  "forgot.title2": { ar: "تم إرسال الرابط", en: "Link sent" },
  "forgot.subtitle1": {
    ar: "أدخل بريدك الإلكتروني أو رقم جوالك المرتبط بحسابك وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.",
    en: "Enter the email or phone number linked to your account and we will send you a password reset link.",
  },
  "forgot.subtitle2": {
    ar: "لقد أرسلنا تعليمات استعادة كلمة المرور. يرجى التحقق من صندوق الوارد.",
    en: "We have sent password recovery instructions. Please check your inbox.",
  },
  "forgot.field": {
    ar: "البريد الإلكتروني أو رقم الجوال",
    en: "Email or phone number",
  },
  "forgot.submit": { ar: "إرسال رابط الاستعادة", en: "Send recovery link" },
  "forgot.submitting": { ar: "جاري الإرسال...", en: "Sending..." },
  "forgot.backToLogin": { ar: "العودة لتسجيل الدخول", en: "Back to sign in" },
  "forgot.noLink": { ar: "لم يصلك الرابط؟", en: "Didn't receive the link?" },
  "forgot.retry": { ar: "حاول مرة أخرى", en: "Try again" },
  // otp / verify
  "otp.title": { ar: "رمز التحقق", en: "Verification code" },
  "otp.subtitle": {
    ar: "أدخل رمز التحقق المكون من 6 أرقام المرسل إلى",
    en: "Enter the 6-digit verification code sent to",
  },
  "otp.verify": { ar: "تأكيد", en: "Confirm" },
  "otp.verifying": { ar: "جاري التحقق...", en: "Verifying..." },
  "otp.noCode": { ar: "لم يصلك الرمز؟", en: "Didn't receive the code?" },
  "otp.resendIn": { ar: "إعادة الإرسال", en: "Resend" },
  "otp.resendNow": { ar: "إعادة الإرسال الآن", en: "Resend now" },
};

/** Country picker. */
export const country: Domain = {
  "country.searchPlaceholder": {
    ar: "ابحث عن دولة أو رمز...",
    en: "Search country or code...",
  },
  "country.title": { ar: "اختر الدولة", en: "Select country" },
};

/** Profile / account screen and profile editing. */
export const profile: Domain = {
  "profile.title": { ar: "الملف الشخصي", en: "My Profile" },
  "profile.edit": { ar: "تعديل الملف الشخصي", en: "Edit profile" },
  "profile.complete": { ar: "ملفك الشخصي مكتمل", en: "Your profile is complete" },
  "profile.guestWelcome": { ar: "مرحباً بك!", en: "Welcome!" },
  "profile.guestSubtitle": { ar: "سجّل دخولك للوصول إلى جميع خدماتنا وتتبع طلباتك", en: "Sign in to access all our services and track your requests" },
  "profile.logoutConfirmTitle": { ar: "هل تريد تسجيل الخروج؟", en: "Sign out?" },
  "profile.logoutConfirmBody": { ar: "هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟", en: "Are you sure you want to sign out of your account?" },
  "profile.completionDone": { ar: "تم إكمال الملف الشخصي", en: "Profile completed" },
  "profile.completionDoneSub": { ar: "ملفك الشخصي مكتمل وجاهز للاستفادة من جميع خدماتنا.", en: "Your profile is complete and ready to use all our services." },
  "profile.completionPending": { ar: "أكمل ملفك الشخصي", en: "Complete your profile" },
  "profile.completionPendingSub": { ar: "ملفك الشخصي غير مكتمل، يرجى إكماله للاستفادة من جميع خدماتنا.", en: "Your profile is incomplete, please complete it to use all our services." },
  "profile.firstName": { ar: "الاسم الأول", en: "First name" },
  "profile.lastName": { ar: "الاسم الأخير", en: "Last name" },
  "profile.email": { ar: "البريد الإلكتروني", en: "Email" },
  "profile.phone": { ar: "رقم الهاتف", en: "Phone number" },
  "profile.whatsapp": { ar: "رقم الواتساب", en: "WhatsApp number" },
  "profile.dateOfBirth": { ar: "تاريخ الميلاد", en: "Date of birth" },
  "profile.nationality": { ar: "الجنسية", en: "Nationality" },
  "profile.passportNumber": { ar: "رقم الجواز", en: "Passport number" },
  "profile.passportExpiry": { ar: "تاريخ انتهاء الجواز", en: "Passport expiry date" },
  "profile.passportImage": { ar: "صورة جواز السفر", en: "Passport photo" },
  "profile.profilePhoto": { ar: "الصورة الشخصية", en: "Profile photo" },
  "profile.uploadPhoto": { ar: "رفع صورة", en: "Upload photo" },
  "profile.changePhoto": { ar: "تغيير الصورة", en: "Change photo" },
  "profile.logout": { ar: "تسجيل الخروج", en: "Sign out" },
  "profile.deleteAccount": { ar: "حذف الحساب", en: "Delete account" },
  "profile.deleteConfirm": {
    ar: "هل أنت متأكد أنك تريد حذف حسابك نهائياً؟ سيتم مسح جميع بياناتك ولن تتمكن من التراجع عن هذا الإجراء.",
    en: "Are you sure you want to permanently delete your account? All your data will be erased and this action cannot be undone.",
  },
  "profile.saved": { ar: "تم حفظ التغييرات", en: "Changes saved" },
};

/** Visas: listing, categories, detail, apply wizard. */
export const visas: Domain = {
  "visas.title": { ar: "التأشيرات", en: "Visas" },
  "visas.services": { ar: "خدمات التأشيرات", en: "Visa Services" },
  "visas.extract": { ar: "استخراج التأشيرات", en: "Visa Services" },
  "visas.apply": { ar: "تقديم على التأشيرة", en: "Apply for visa" },
  "visas.applyNow": { ar: "قدّم الآن", en: "Apply now" },
  "visas.processingTime": { ar: "مدة الإنجاز", en: "Processing time" },
  "visas.fee": { ar: "الرسوم", en: "Fee" },
  "visas.requirements": { ar: "المتطلبات", en: "Requirements" },
  "visas.documents": { ar: "الوثائق المطلوبة", en: "Required Documents" },
  "visas.validity": { ar: "مدة الصلاحية", en: "Validity" },
  "visas.entryType": { ar: "نوع الدخول", en: "Entry type" },
  "visas.selectCountry": { ar: "اختر الوجهة", en: "Select destination" },
  "visas.selectType": { ar: "اختر نوع التأشيرة", en: "Select visa type" },
  // hub / search screen
  "visas.hub.title": { ar: "بوابة التأشيرات", en: "Visa Hub" },
  "visas.hub.availableVisas": { ar: "تأشيرة متاحة", en: "visas available" },
  "visas.hub.allDestinations": { ar: "جميع الوجهات", en: "All destinations" },
  "visas.hub.searchPlaceholder": { ar: "ابحث عن وجهة...", en: "Search destination..." },
  "visas.hub.visaCount": { ar: "تأشيرة", en: "Visas" },
  "visas.hub.fastApproval": { ar: "موافقة سريعة", en: "Fast Approval" },
  "visas.hub.multipleEntry": { ar: "دخول متعدد", en: "Multiple Entry" },
  // filters
  "visas.filter.entryType": { ar: "نوع الدخول", en: "Entry type" },
  "visas.filter.processingTime": { ar: "مدة المعالجة", en: "Processing time" },
  "visas.filter.anyEntry": { ar: "أي نوع", en: "Any type" },
  "visas.filter.singleEntry": { ar: "دخول واحد", en: "Single entry" },
  "visas.filter.multipleEntry": { ar: "دخول متعدد", en: "Multiple entry" },
  "visas.filter.anyDuration": { ar: "أي مدة", en: "Any duration" },
  // sections
  "visas.section.fastApprovalSub": { ar: "تأشيرة بموافقة خلال 3 أيام أو أقل", en: "visa(s) approved in 3 days or less" },
  "visas.section.lowestPrice": { ar: "الأقل تكلفة", en: "Most Affordable" },
  "visas.section.lowestPriceSub": { ar: "أفضل قيمة مقابل المال", en: "Best value for money" },
  "visas.section.multipleEntrySub": { ar: "سافر أكثر من مرة بتأشيرة واحدة", en: "Travel multiple times on one visa" },
  "visas.section.newest": { ar: "أحدث التأشيرات", en: "Newest Visas" },
  "visas.section.newestSub": { ar: "وجهات أضيفت حديثاً", en: "Recently added destinations" },
  "visas.section.destinationsAvailable": { ar: "وجهة متاحة", en: "destinations available" },
  // empty states
  "visas.error.loading": { ar: "تعذّر تحميل قائمة التأشيرات", en: "Could not load the visa list" },
  "visas.empty.title": { ar: "لا توجد نتائج", en: "No results found" },
  "visas.empty.noMatch": { ar: "لا توجد تأشيرات تطابق معايير البحث", en: "No visas match your search criteria" },
  "visas.empty.noVisas": { ar: "لا توجد تأشيرات متاحة حالياً", en: "No visas available at the moment" },
  // categories
  "visas.category.all": { ar: "جميع الوجهات", en: "All Destinations" },
  "visas.category.tourist": { ar: "سياحية", en: "Tourist" },
  "visas.category.business": { ar: "عمل", en: "Business" },
  "visas.category.medical": { ar: "علاجية", en: "Medical" },
  "visas.category.umrah": { ar: "عمرة", en: "Umrah" },
  "visas.category.express": { ar: "مستعجلة", en: "Express" },
  // processing speeds
  "visas.speed.fast": { ar: "1-3 أيام", en: "1-3 days" },
  "visas.speed.standard": { ar: "4-7 أيام", en: "4-7 days" },
  "visas.speed.slow": { ar: "+7 أيام", en: "7+ days" },
};

/** Umrah wizard & umrah visa flow. */
export const umrah: Domain = {
  "umrah.title": { ar: "تأشيرة العمرة", en: "Umrah Visa" },
  "umrah.instantApply": { ar: "قدّم طلب تأشيرة العمرة الآن", en: "Apply for an Umrah visa now" },
  "umrah.packages": { ar: "باقات العمرة", en: "Umrah Packages" },
  "umrah.applyTitle": { ar: "التقديم على تأشيرة العمرة", en: "Apply for Umrah Visa" },
  "umrah.step.personal": { ar: "البيانات الشخصية", en: "Personal details" },
  "umrah.step.passport": { ar: "بيانات الجواز", en: "Passport details" },
  "umrah.step.documents": { ar: "المستندات", en: "Documents" },
  "umrah.step.review": { ar: "المراجعة", en: "Review" },
  "umrah.step.payment": { ar: "الدفع", en: "Payment" },
  "umrah.reviewConfirm": {
    ar: "يرجى مراجعة بياناتك قبل الإرسال",
    en: "Please review your details before submitting",
  },
  "umrah.submit": { ar: "إرسال الطلب", en: "Submit application" },
  "umrah.submitting": { ar: "جاري إرسال الطلب...", en: "Submitting..." },
  "umrah.success": { ar: "تم إرسال طلبك بنجاح", en: "Your application was submitted" },
};

/** Applications & visa tracking, status labels. */
export const tracking: Domain = {
  "tracking.title": { ar: "تتبع الطلب", en: "Track application" },
  "tracking.error.title": { ar: "حدث خطأ", en: "An error occurred" },
  "tracking.error.desc": { ar: "تعذّر تحميل الطلبات، يرجى المحاولة مجدداً", en: "Could not load requests, please try again" },
  "tracking.empty.noRequestsTitle": { ar: "لا توجد طلبات", en: "No requests yet" },
  "tracking.empty.noRequestsDesc": { ar: "لم تقم بتقديم أي طلبات بعد.", en: "You haven't submitted any requests yet." },
  "tracking.applications": { ar: "طلبات التأشيرة", en: "Visa applications" },
  "tracking.bookings": { ar: "الحجوزات", en: "Bookings" },
  "tracking.myRequests": { ar: "طلباتي", en: "My requests" },
  "tracking.request": { ar: "طلب", en: "Request" },
  "tracking.requests": { ar: "طلبات", en: "Requests" },
  "tracking.reference": { ar: "رقم الطلب", en: "Reference number" },
  "tracking.submittedOn": { ar: "تاريخ التقديم", en: "Submitted on" },
  "tracking.uploadDocuments": { ar: "رفع المستندات", en: "Upload documents" },
  "tracking.timeline": { ar: "سجل الحالة", en: "Status timeline" },
  // status labels (visa applications)
  "status.received": { ar: "تم الاستلام", en: "Received" },
  "status.pending": { ar: "قيد الانتظار", en: "Pending" },
  "status.underReview": { ar: "قيد المراجعة", en: "Under review" },
  "status.processing": { ar: "قيد المعالجة", en: "Processing" },
  "status.awaitingDocuments": { ar: "بانتظار مستندات", en: "Awaiting documents" },
  "status.documentsUploaded": { ar: "تم رفع المستندات", en: "Documents uploaded" },
  "status.sentToEmbassy": { ar: "أُرسل للسفارة", en: "Sent to embassy" },
  "status.issued": { ar: "صدرت التأشيرة", en: "Visa issued" },
  "status.approved": { ar: "مقبول", en: "Approved" },
  "status.confirmed": { ar: "مؤكد", en: "Confirmed" },
  "status.completed": { ar: "مكتمل", en: "Completed" },
  "status.rejected": { ar: "مرفوض", en: "Rejected" },
  "status.cancelled": { ar: "ملغي", en: "Cancelled" },
};

/** Booking requests (web book form). */
export const booking: Domain = {
  "booking.request": { ar: "طلب حجز", en: "Booking Request" },
  "booking.searchFlights": { ar: "احجز الآن", en: "Book now" },
  "bookings.subtitle": { ar: "تابع جميع طلباتك وحالة كل طلب بسهولة", en: "Track all your requests and their status easily" },
  "bookings.requestsList": { ar: "قائمة الطلبات", en: "Requests List" },
  "bookings.orderNo": { ar: "رقم الطلب:", en: "Order No:" },
  "bookings.date": { ar: "تاريخ الطلب:", en: "Date:" },
  "bookings.viewDetails": { ar: "عرض التفاصيل", en: "Details" },
  "bookings.filter.flights": { ar: "حجوزات الطيران", en: "Flights" },
  "bookings.filter.hotels": { ar: "حجوزات الفنادق", en: "Hotels" },
  "booking.submit": { ar: "إرسال الطلب", en: "Submit Request" },
  "booking.name": { ar: "الاسم", en: "Name" },
  "booking.phone": { ar: "رقم الهاتف", en: "Phone" },
  "booking.email": { ar: "البريد الإلكتروني", en: "Email" },
  "booking.destination": { ar: "الوجهة", en: "Destination" },
  "booking.travelDate": { ar: "تاريخ السفر", en: "Travel Date" },
  "booking.returnDate": { ar: "تاريخ العودة", en: "Return Date" },
  "booking.adults": { ar: "البالغين", en: "Adults" },
  "booking.children": { ar: "الأطفال", en: "Children" },
  "booking.notes": { ar: "ملاحظات", en: "Notes" },
  "booking.type.flight": { ar: "طيران", en: "Flight" },
  "booking.type.hotel": { ar: "فندق", en: "Hotel" },
  "booking.type.program": { ar: "برنامج سياحي", en: "Tourism Program" },
  "booking.type.visa": { ar: "تأشيرة", en: "Visa" },
  "booking.bookViaWhatsApp": { ar: "احجز عبر واتساب", en: "Book via WhatsApp" },
};

/** Payment & wallet. */
export const payment: Domain = {
  "payment.title": { ar: "الدفع", en: "Payment" },
  "payment.wallet": { ar: "المحفظة", en: "Wallet" },
  "payment.balance": { ar: "الرصيد", en: "Balance" },
  "payment.total": { ar: "الإجمالي", en: "Total" },
  "payment.amount": { ar: "المبلغ", en: "Amount" },
  "payment.pay": { ar: "ادفع الآن", en: "Pay now" },
  "payment.deposit": { ar: "إيداع رصيد", en: "Deposit funds" },
  "payment.withdraw": { ar: "السحب", en: "Withdraw" },
  "payment.transfer": { ar: "التحويل", en: "Transfer" },
  "payment.bankTransfer": { ar: "حوالة بنكية", en: "Bank transfer" },
  "payment.transactions": { ar: "المعاملات", en: "Transactions" },
  "payment.type.credit": { ar: "الإيداع", en: "Credit" },
  "payment.type.debit": { ar: "السحب", en: "Debit" },
  "payment.method": { ar: "طريقة الدفع", en: "Payment method" },
  "payment.success": { ar: "تم الدفع بنجاح", en: "Payment successful" },
  "payment.failed": { ar: "فشلت عملية الدفع", en: "Payment failed" },
  "wallet.active": { ar: "نشطة", en: "Active" },
  "wallet.availableBalance": { ar: "الرصيد المتاح", en: "Available balance" },
  "wallet.currency": { ar: "ريال", en: "SAR" },
  "wallet.deposit": { ar: "إيداع", en: "Deposit" },
  "wallet.withdraw": { ar: "سحب", en: "Withdraw" },
  "wallet.transfer": { ar: "تحويل", en: "Transfer" },
  "wallet.history": { ar: "سجل المعاملات", en: "Transaction history" },
  "wallet.empty.title": { ar: "لا توجد معاملات بعد", en: "No transactions yet" },
  "wallet.empty.desc": { ar: "ستظهر جميع حركات محفظتك هنا.", en: "All your wallet activity will appear here." },
  "wallet.actionSoon": { ar: "خدمة {action} ستتوفر قريباً", en: "{action} will be available soon" },
  "wallet.txSuccess": { ar: "ناجحة", en: "Successful" },
};

/** Notifications. */
export const notifications: Domain = {
  "notifications.title": { ar: "الإشعارات", en: "Notifications" },
  "notifications.subtitle": { ar: "جميع التنبيهات والتحديثات الخاصة بك", en: "All your alerts and updates" },
  "notifications.markAllRead": { ar: "الكل مقروء", en: "Mark all read" },
  "notifications.empty": { ar: "لا توجد إشعارات", en: "No notifications" },
  "notifications.now": { ar: "الآن", en: "Now" },
  "notifications.filter.unread": { ar: "غير مقروءة", en: "Unread" },
  "notifications.filter.alerts": { ar: "تنبيهات", en: "Alerts" },
  "notifications.filter.offers": { ar: "عروض وخصومات", en: "Offers" },
  "notifications.type.booking": { ar: "الحجوزات", en: "Booking" },
  "notifications.type.application": { ar: "الطلبات", en: "Application" },
  "notifications.type.flight": { ar: "الرحلات", en: "Flight" },
  "notifications.type.offer": { ar: "العروض", en: "Offer" },
  "notifications.type.promo": { ar: "الترويج", en: "Promotion" },
};

/** Settings. */
export const settings: Domain = {
  "settings.title": { ar: "الإعدادات", en: "Settings" },
  "settings.language": { ar: "اللغة", en: "Language" },
  "settings.theme": { ar: "المظهر", en: "Appearance" },
  "settings.theme.light": { ar: "نهاري", en: "Light" },
  "settings.theme.dark": { ar: "ليلي", en: "Dark" },
  "settings.theme.system": { ar: "تلقائي", en: "System" },
  "settings.notifications": { ar: "الإشعارات", en: "Notifications" },
  "settings.pushNotifs": { ar: "الإشعارات الفورية", en: "Push notifications" },
  "settings.pushNotifsDesc": { ar: "استقبال الإشعارات على جهازك", en: "Receive notifications on your device" },
  "settings.emailNotifs": { ar: "إشعارات البريد", en: "Email notifications" },
  "settings.smsNotifs": { ar: "الرسائل النصية", en: "SMS notifications" },
  "settings.notif.booking": { ar: "الحجوزات والرحلات", en: "Bookings & flights" },
  "settings.notif.bookingDesc": { ar: "تحديثات حجوزاتك ورحلاتك الجوية", en: "Updates on your bookings and flights" },
  "settings.notif.visa": { ar: "التأشيرات والعمرة", en: "Visas & Umrah" },
  "settings.notif.visaDesc": { ar: "تحديثات طلبات التأشيرة والعمرة", en: "Updates on your visa and Umrah applications" },
  "settings.notif.promo": { ar: "العروض والبرامج", en: "Offers & programs" },
  "settings.notif.promoDesc": { ar: "عروض سياحية وبرامج خاصة", en: "Tourism offers and special programs" },
  "settings.notif.system": { ar: "إشعارات النظام", en: "System notifications" },
  "settings.notif.systemDesc": { ar: "تنبيهات حسابك والإشعارات الإدارية", en: "Account alerts and admin messages" },
  "settings.notifSaved": { ar: "تم حفظ الإعدادات", en: "Settings saved" },
  "settings.notifSavedDesc": { ar: "سيتم تطبيق إعداداتك فوراً", en: "Your preferences will be applied immediately" },
  "settings.biometrics": { ar: "الدخول بالبصمة", en: "Biometric login" },
  "settings.security": { ar: "الأمان والخصوصية", en: "Security & privacy" },
  "settings.help": { ar: "المساعدة والدعم", en: "Help & support" },
  "settings.comingSoonTitle": { ar: "قريباً", en: "Coming soon" },
  "settings.comingSoonBody": {
    ar: "هذه الميزة ستكون متاحة في التحديث القادم.",
    en: "This feature will be available in the next update.",
  },
};

/** Legal: terms & privacy (headings and short blurbs). */
export const legal: Domain = {
  "legal.terms.title": { ar: "الشروط والأحكام", en: "Terms & Conditions" },
  "legal.privacy.title": { ar: "سياسة الخصوصية", en: "Privacy Policy" },
  "legal.accept": { ar: "أوافق على الشروط والأحكام", en: "I agree to the Terms & Conditions" },
  "legal.terms.intro": {
    ar: 'مرحباً بك في تطبيق ABSHER TRAVEL. باستخدامك لهذا التطبيق فإنك توافق على الالتزام بهذه الشروط والأحكام كاملةً. إذا كنت لا توافق على أي بند من هذه البنود، يُرجى التوقف عن استخدام التطبيق.',
    en: "Welcome to the ABSHER TRAVEL app. By using this app you agree to be fully bound by these Terms & Conditions. If you do not agree to any of these terms, please stop using the app.",
  },
  "legal.privacy.section.collect": {
    ar: "البيانات التي نجمعها",
    en: "Data we collect",
  },
  "legal.privacy.section.use": {
    ar: "كيفية استخدام بياناتك",
    en: "How we use your data",
  },
  "legal.privacy.section.share": { ar: "مشاركة البيانات", en: "Data sharing" },
  "legal.privacy.section.protect": { ar: "حماية البيانات", en: "Data protection" },
  "legal.privacy.section.retain": { ar: "الاحتفاظ بالبيانات", en: "Data retention" },
  "legal.privacy.section.rights": { ar: "حقوقك", en: "Your rights" },
  "legal.privacy.section.permissions": {
    ar: "الأذونات على الجهاز",
    en: "Device permissions",
  },
  "legal.privacy.section.contact": { ar: "التواصل معنا", en: "Contact us" },
};

/** Support & help. */
export const support: Domain = {
  "support.title": { ar: "الدعم والمساعدة", en: "Support & Help" },
  "support.contactUs": { ar: "تواصل معنا", en: "Contact us" },
  "support.available": {
    ar: "فريق الدعم متاح لمساعدتك عبر قنوات التواصل داخل التطبيق.",
    en: "Our support team is available to help you through the app's contact channels.",
  },
  "support.whatsapp": { ar: "الدردشة عبر واتساب", en: "Chat on WhatsApp" },
  "support.call": { ar: "اتصل بنا", en: "Call us" },
  "support.email": { ar: "راسلنا", en: "Email us" },
  "support.faq": { ar: "الأسئلة الشائعة", en: "FAQ" },
};

/** Home / marketing landing (web + mobile home). */
export const home: Domain = {
  "home.heroTitle": { ar: "ABSHER TRAVEL", en: "ABSHER TRAVEL" },
  "home.heroSub": {
    ar: "بوابتك إلى العالم بخدمات سفر احترافية وأسعار منافسة",
    en: "Your Gateway to the World with Professional Travel Services",
  },
  "home.exploreOffers": { ar: "استكشف العروض", en: "Explore Offers" },
  "home.bookNow": { ar: "احجز الآن", en: "Book Now" },
  "home.ourServices": { ar: "خدماتنا", en: "Our Services" },
  "home.featuredOffers": { ar: "العروض المميزة", en: "Featured Offers" },
  "home.popularDestinations": { ar: "الوجهات السياحية", en: "Popular Destinations" },
  "home.ourDestinations": { ar: "وجهاتنا", en: "Our Destinations" },
  "home.tourismPrograms": { ar: "البرامج السياحية", en: "Tourism Programs" },
  "home.discoverPrograms": {
    ar: "اكتشف باقاتنا السياحية",
    en: "Discover our tour packages",
  },
  "home.included": { ar: "يشمل", en: "Included" },
  // services grid
  "home.service.flights": { ar: "حجز تذاكر الطيران", en: "Flight Ticket Booking" },
  "home.service.hotels": { ar: "حجز الفنادق", en: "Hotel Booking" },
  "home.service.visas": { ar: "استخراج التأشيرات", en: "Visa Services" },
  "home.service.programs": { ar: "برامج سياحية", en: "Tourism Programs" },
  "home.service.umrah": { ar: "العمرة", en: "Umrah Packages" },
  "home.service.carRental": { ar: "تأجير السيارات", en: "Car Rental" },
  "home.service.insurance": { ar: "التأمين السياحي", en: "Travel Insurance" },
  "home.service.airportTransfer": {
    ar: "استقبال وتوديع المطارات",
    en: "Airport Transfer",
  },
  "home.service.corporate": { ar: "حجوزات الشركات", en: "Corporate Bookings" },
  "home.service.business": { ar: "خدمات رجال الأعمال", en: "Business Services" },
  // Home redesign — promotional carousel
  "home.carousel.a11y": { ar: "العروض الترويجية", en: "Promotional offers" },
  // Home redesign — services 2x2 grid
  "home.services.flights.title": { ar: "حجوزات الطيران", en: "Flight Bookings" },
  "home.services.flights.desc": { ar: "احجز رحلتك بسهولة وأمان", en: "Book your flight easily and securely" },
  "home.services.hotels.title": { ar: "حجوزات الفنادق", en: "Hotel Bookings" },
  "home.services.hotels.desc": { ar: "أفضل الفنادق في أرقى الوجهات", en: "The finest hotels in premier destinations" },
  "home.services.evisas.title": { ar: "التأشيرات الإلكترونية", en: "E-Visas" },
  "home.services.evisas.desc": { ar: "تأشيرات إلكترونية لسفر أسهل", en: "Electronic visas for easier travel" },
  "home.services.umrah.title": { ar: "تأشيرة العمرة", en: "Umrah Visa" },
  "home.services.umrah.desc": { ar: "تأشيرة عمرة بخطوات بسيطة", en: "Umrah visa in simple steps" },
  "home.exit.title": { ar: "الخروج من التطبيق", en: "Exit application" },
  "home.exit.message": { ar: "هل أنت متأكد أنك تريد الخروج من التطبيق؟", en: "Are you sure you want to exit?" },
  // In-app support chat
  "supportChat.title": { ar: "الدعم", en: "Support" },
  "supportChat.headerSubtitle": { ar: "فريق ABSHER TRAVEL", en: "ABSHER TRAVEL Team" },
  "supportChat.greeting": {
    ar: "مرحباً {name} 👋 أهلاً بك في ABSHER TRAVEL. كيف يمكن لفريق الدعم مساعدتك اليوم؟",
    en: "Hello {name} 👋 Welcome to ABSHER TRAVEL. How can our support team help you today?",
  },
  "supportChat.greetingGuest": {
    ar: "مرحباً بك في ABSHER TRAVEL 👋 كيف يمكن لفريق الدعم مساعدتك اليوم؟",
    en: "Welcome to ABSHER TRAVEL 👋 How can our support team help you today?",
  },
  "supportChat.guestPrompt": {
    ar: "مرحباً بك في ABSHER TRAVEL 👋 يرجى إدخال اسمك لبدء المحادثة",
    en: "Welcome to ABSHER TRAVEL 👋 Please provide your name to start the conversation",
  },
  "supportChat.nameLabel": { ar: "اسمك", en: "Your name" },
  "supportChat.namePlaceholder": { ar: "أدخل اسمك", en: "Enter your name" },
  "supportChat.continue": { ar: "متابعة", en: "Continue" },
  "supportChat.inputPlaceholder": { ar: "اكتب رسالتك...", en: "Type your message..." },
  "supportChat.send": { ar: "إرسال", en: "Send" },
  "supportChat.loadError": {
    ar: "تعذّر تحميل المحادثة. حاول مرة أخرى.",
    en: "Could not load the conversation. Please try again.",
  },
  "supportChat.retry": { ar: "إعادة المحاولة", en: "Retry" },
  "supportChat.staffName": { ar: "فريق الدعم", en: "Support Team" },
  "supportChat.you": { ar: "أنت", en: "You" },
  "supportChat.emptyName": { ar: "يرجى إدخال اسمك", en: "Please enter your name" },
};

/** Flights & hotels (coming-soon placeholders). */
export const flightsHotels: Domain = {
  "flights.title": { ar: "الرحلات", en: "Flights" },
  "flights.search": { ar: "بحث عن رحلة", en: "Search flights" },
  "flights.from": { ar: "من", en: "From" },
  "flights.to": { ar: "إلى", en: "To" },
  "flights.departDate": { ar: "تاريخ المغادرة", en: "Departure date" },
  "flights.returnDate": { ar: "تاريخ العودة", en: "Return date" },
  "flights.passengers": { ar: "المسافرون", en: "Passengers" },
  "flights.comingSoon": {
    ar: "خدمة حجز الطيران قريباً",
    en: "Flight booking coming soon",
  },
  "hotels.title": { ar: "الفنادق", en: "Hotels" },
  "hotels.comingSoon": {
    ar: "خدمة حجز الفنادق قريباً",
    en: "Hotel booking coming soon",
  },
};

/** About / company (web). */
export const about: Domain = {
  "about.title": { ar: "من نحن", en: "About Us" },
  "about.vision": { ar: "رؤيتنا", en: "Our Vision" },
  "about.mission": { ar: "رسالتنا", en: "Our Mission" },
  "about.goals": { ar: "أهدافنا", en: "Our Goals" },
  "about.whyUs": { ar: "لماذا نحن", en: "Why Us" },
  "about.address": { ar: "العنوان", en: "Address" },
  "about.phones": { ar: "أرقام التواصل", en: "Phone Numbers" },
  "about.sendMessage": { ar: "إرسال رسالة", en: "Send Message" },
  "about.subject": { ar: "الموضوع", en: "Subject" },
  "about.message": { ar: "الرسالة", en: "Message" },
};

/** Errors & toasts. */
export const errors: Domain = {
  "errors.generic": {
    ar: "حدث خطأ ما، يرجى المحاولة مرة أخرى",
    en: "Something went wrong, please try again",
  },
  "errors.network": {
    ar: "تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت",
    en: "Could not reach the server, check your connection",
  },
  "errors.unauthorized": {
    ar: "انتهت الجلسة، يرجى تسجيل الدخول مجدداً",
    en: "Your session expired, please sign in again",
  },
  "errors.notFound": { ar: "الصفحة غير موجودة", en: "Page not found" },
  "errors.required": { ar: "هذا الحقل مطلوب", en: "This field is required" },
  "errors.invalidEmail": {
    ar: "البريد الإلكتروني غير صحيح",
    en: "Invalid email address",
  },
  "errors.uploadFailed": { ar: "فشل رفع الملف", en: "Upload failed" },
  "toasts.saved": { ar: "تم الحفظ بنجاح", en: "Saved successfully" },
  "toasts.deleted": { ar: "تم الحذف", en: "Deleted" },
  "toasts.copied": { ar: "تم النسخ", en: "Copied" },
  "toasts.sent": { ar: "تم الإرسال بنجاح", en: "Sent successfully" },
};

/** Account screen menu items and stats. */
export const account: Domain = {
  "account.stats.active": { ar: "طلبات نشطة", en: "Active requests" },
  "account.stats.completed": { ar: "طلبات مكتملة", en: "Completed" },
  "account.menu.info": { ar: "المعلومات الشخصية", en: "Personal info" },
  "account.menu.infoSub": { ar: "إدارة بياناتك ومعلومات التواصل", en: "Manage your data and contact info" },
  "account.menu.docs": { ar: "الوثائق والمستندات", en: "Documents" },
  "account.menu.docsSub": { ar: "إدارة مستنداتك وملفاتك الشخصية", en: "Manage your files and documents" },
  "account.menu.pay": { ar: "وسائل الدفع", en: "Payment methods" },
  "account.menu.paySub": { ar: "إدارة بطاقاتك وطرق الدفع الخاصة بك", en: "Manage your cards and payment methods" },
  "account.menu.sec": { ar: "الأمان والخصوصية", en: "Security & Privacy" },
  "account.menu.secSub": { ar: "إعدادات الأمان والخصوصية", en: "Security settings and privacy" },
  "account.menu.notif": { ar: "الإشعارات", en: "Notifications" },
  "account.menu.notifSub": { ar: "تخصيص الإشعارات والتنبيهات", en: "Customize notifications and alerts" },
  "account.menu.help": { ar: "الدعم والمساعدة", en: "Help & Support" },
  "account.menu.helpSub": { ar: "تواصل معنا للحصول على المساعدة", en: "Contact us for assistance" },
  "account.menu.logoutSub": { ar: "تسجيل الخروج من حسابك", en: "Sign out of your account" },
};

/** More / extra services screen. */
export const more: Domain = {
  "more.title": { ar: "المزيد من الخدمات", en: "More Services" },
  "more.subtitle": { ar: "كل ما تحتاجه لرحلة أسهل وأكثر راحة", en: "Everything you need for an easier and more comfortable journey" },
  "more.programs.subtitle": { ar: "اكتشف برامجنا السياحية واختر الوجهة المناسبة لك", en: "Discover our programs and choose your destination" },
  "more.bookings.title": { ar: "إدارة طلباتي", en: "Manage Bookings" },
  "more.bookings.subtitle": { ar: "متابعة جميع طلبات التأشيرات والعمرة وحالة كل طلب", en: "Track all your visa and umrah requests" },
  "more.documents.title": { ar: "المستندات", en: "Documents" },
  "more.documents.subtitle": { ar: "الوصول إلى المستندات والملفات المرتبطة بطلباتك", en: "Access documents and files related to your requests" },
  "more.notifications.subtitle": { ar: "جميع التنبيهات والتحديثات الخاصة بطلباتك", en: "All alerts and updates for your requests" },
  "more.support.title": { ar: "الدعم والتواصل", en: "Support & Contact" },
  "more.support.subtitle": { ar: "التواصل مع فريق الدعم والاستفسار عن الخدمات", en: "Contact our support team for inquiries" },
  "more.help.title": { ar: "مركز المساعدة", en: "Help Center" },
  "more.help.subtitle": { ar: "الأسئلة الشائعة والتعليمات المهمة", en: "Frequently asked questions and important instructions" },
  "more.settings.subtitle": { ar: "إدارة اللغة، الإشعارات، الحساب والخصوصية", en: "Manage language, notifications, account and privacy" },
};

/** Ordered list of all domains merged into the flat dictionary. */
export const DOMAINS: Domain[] = [
  common,
  nav,
  onboarding,
  auth,
  country,
  profile,
  account,
  visas,
  umrah,
  tracking,
  booking,
  payment,
  notifications,
  settings,
  legal,
  support,
  home,
  flightsHotels,
  about,
  more,
  errors,
];
