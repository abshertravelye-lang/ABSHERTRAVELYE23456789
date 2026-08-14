# نشر ABSHER TRAVEL على Android — دليل شامل

## المتطلبات الأساسية قبل البدء

| المتطلب | المصدر |
|---------|--------|
| حساب Expo | [expo.dev](https://expo.dev) |
| حساب Firebase | [console.firebase.google.com](https://console.firebase.google.com) |
| مستودع GitHub | لتشغيل GitHub Actions |
| (اختياري) حساب Google Play | للنشر على المتجر |

---

## الخطوة 1 — إعداد Firebase وFCM

### 1.1 إنشاء مشروع Firebase
1. افتح [Firebase Console](https://console.firebase.google.com)
2. اضغط **Add project** → أدخل اسماً مثل `absher-travel`
3. فعّل Google Analytics إذا أردت (اختياري)
4. اضغط **Create project**

### 1.2 إضافة تطبيق Android
1. من الصفحة الرئيسية → اضغط أيقونة **Android**
2. **Android package name:** `com.abshertravel.app`
3. **App nickname:** ABSHER TRAVEL (اختياري)
4. اضغط **Register app**
5. اضغط **Download google-services.json**
6. احفظ الملف في: `artifacts/absher-mobile/google-services.json`

> ⚠️ هذا الملف يحتوي على مفاتيح سرية — لا ترفعه لـ GitHub مباشرةً.
> `.gitignore` يتجاهله تلقائياً.

---

## الخطوة 2 — إعداد Expo EAS

### 2.1 إنشاء مشروع EAS
```bash
# ثبّت EAS CLI
npm install -g eas-cli

# سجّل دخولاً
eas login

# اذهب لمجلد التطبيق
cd artifacts/absher-mobile

# ربط المشروع بـ Expo
eas init
```

سيُنشئ هذا مشروعاً على [expo.dev](https://expo.dev) ويُضيف `projectId` إلى `app.json` تلقائياً.

### 2.2 ضبط Project ID في Replit
1. افتح **Secrets** في Replit
2. أضف:
   ```
   Key:   EXPO_PUBLIC_EAS_PROJECT_ID
   Value: <المعرّف الذي ظهر بعد eas init>
   ```

### 2.3 تحديث eas.json
افتح `artifacts/absher-mobile/eas.json` وأبدل كل `REPLACE_WITH_YOUR_EAS_PROJECT_ID` بالمعرّف الحقيقي.

---

## الخطوة 3 — البناء عبر GitHub Actions (الموصى به)

### 3.1 إعداد GitHub Secrets
اذهب إلى: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**

أضف هذه الأسرار الثلاثة:

| Secret Name | القيمة |
|------------|--------|
| `EXPO_TOKEN` | من expo.dev → Account → Access Tokens → Create |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | Project ID من expo.dev |
| `GOOGLE_SERVICES_JSON` | **المحتوى الكامل** لملف `google-services.json` (انسخ النص كله) |

### 3.2 تشغيل البناء
1. افتح GitHub repo → **Actions**
2. اختر workflow: **EAS Build — Android**
3. اضغط **Run workflow**
4. اختر profile:
   - `preview` → ينتج APK قابل للتثبيت مباشرةً
   - `production` → ينتج AAB للنشر على Google Play
5. اضغط **Run workflow**

### 3.3 تحميل APK
بعد اكتمال البناء (~10-15 دقيقة):
1. **Actions → اختر الـ run → Artifacts**
2. حمّل ملف `absher-travel-android-preview-*`
3. ثبّته على جهاز Android (تأكد من تفعيل "Install from unknown sources")

---

## الخطوة 4 — البناء المحلي عبر EAS CLI (بديل)

إذا كنت تريد البناء من جهازك مباشرةً:

```bash
cd artifacts/absher-mobile

# تأكد من وجود google-services.json
ls google-services.json

# بناء APK للتجربة (يرفع للسحابة ويعود بـ APK)
eas build --platform android --profile preview

# بناء AAB للنشر (يستغرق أطول)
eas build --platform android --profile production
```

---

## الخطوة 5 — اختبار الإشعارات

### على الجهاز
1. ثبّت APK على جهاز Android حقيقي
2. افتح التطبيق وسجّل دخولاً
3. اقبل طلب إذن الإشعارات عند ظهوره
4. التطبيق سيرسل Push Token للسيرفر تلقائياً

### من لوحة التحكم
1. افتح [لوحة التحكم](/admin) → قسم الإشعارات (Wrench)
2. اكتب عنواناً ورسالة
3. اختر المستخدم أو "جميع المستخدمين"
4. اضغط **إرسال**
5. يجب أن يصل الإشعار على شاشة القفل خلال ثوانٍ

---

## الخطوة 6 — النشر على Google Play (اختياري)

```bash
# إنشاء AAB أولاً
eas build --platform android --profile production

# رفع للمتجر (يتطلب service account من Google Play Console)
eas submit --platform android
```

---

## مشاكل شائعة

| المشكلة | الحل |
|---------|------|
| `google-services.json not found` | تأكد من وضع الملف في `artifacts/absher-mobile/` |
| إشعارات لا تصل | تأكد من قبول إذن الإشعارات على الجهاز |
| APK لا يفتح | فعّل "تثبيت من مصادر غير معروفة" في إعدادات الجهاز |
| `EXPO_TOKEN invalid` | أنشئ توكناً جديداً من expo.dev → Account Settings → Access Tokens |
| بناء فاشل في CI | تحقق من أن `GOOGLE_SERVICES_JSON` secret يحتوي على JSON صحيح |
