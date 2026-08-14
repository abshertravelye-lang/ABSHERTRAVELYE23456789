# إعداد الإشعارات الفورية (Push Notifications) على الأجهزة الحقيقية

## المشكلة

Expo Go على Android (SDK 53+) **لا يدعم** إشعارات Push الحقيقية — التوكنات تفشل صامتةً، ولا يصل أي إشعار للجهاز. يلزم تثبيت نسخة إنتاج/تطوير فعلية من التطبيق.

---

## الخطوة 1 — الحصول على Expo Project ID

1. سجّل دخولك (أو أنشئ حساباً) على [expo.dev](https://expo.dev)
2. افتح **Projects → New Project**
3. اختر **slug**: `abshertravel` (يجب أن يطابق slug في `app.json`)
4. بعد إنشاء المشروع، انسخ **Project ID** (UUID بصيغة `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## الخطوة 2 — ضبط Project ID في Replit

افتح **Secrets** في Replit وأضف:

```
Key:   EXPO_PUBLIC_EAS_PROJECT_ID
Value: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx   ← القيمة التي نسختها من expo.dev
```

التطبيق يقرأ هذا المتغير تلقائياً عبر `lib/pushNotifications.ts` ← لا حاجة لتعديل أي ملف.

---

## iOS — البناء والنشر عبر Expo Launch (Replit)

Expo Launch يعالج بناء iOS واعتمادات APNs **تلقائياً**:

1. أكمل الخطوتين 1 و2 أعلاه
2. اضغط زر **Publish** في Replit
3. اتبع خطوات Expo Launch (قد يطلب ربط حساب Expo)
4. بعد اكتمال البناء، وزّع التطبيق عبر TestFlight أو App Store
5. على الجهاز الحقيقي: سجّل دخولاً، اقبل إذن الإشعارات
6. أرسل إشعاراً تجريبياً من **لوحة التحكم الإدارية → الإشعارات** → يصل على شاشة القفل

---

## Android — FCM (Firebase Cloud Messaging)

> ⚠️ Replit لا يدعم نشر Android على Google Play مباشرةً. البناء لأندرويد يتطلب EAS أو CI/CD خارجي.

### إعداد Firebase

1. افتح [Firebase Console](https://console.firebase.google.com) وأنشئ مشروعاً
2. أضف تطبيق Android بـ package name: `com.abshertravel.app`
3. حمّل ملف `google-services.json` وضعه في: `artifacts/absher-mobile/google-services.json`
   _(الملف مُدرج في `.gitignore` — لا يُرفع للمستودع)_
4. في `artifacts/absher-mobile/app.json` أضف داخل كتلة `"android"`:
   ```json
   "googleServicesFile": "./google-services.json"
   ```
5. ابنِ التطبيق عبر EAS Build خارج Replit وثبّته على جهاز Android حقيقي

---

## اختبار الإشعارات من لوحة التحكم

1. سجّل دخول في التطبيق المبني على جهاز حقيقي
2. افتح **لوحة التحكم الإدارية → الإشعارات**
3. اكتب عنواناً ورسالة واختر "جميع المستخدمين"
4. اضغط **إرسال** — يصل الإشعار حتى لو كان التطبيق مغلقاً

---

## ملاحظات فنية

| المكوّن | الحالة |
|---|---|
| تسجيل التوكنات (`/push-tokens`) | ✅ مكتمل |
| حفظ التوكنات في DB (`push_tokens`) | ✅ مكتمل |
| إرسال Expo Push (`notify.ts`) | ✅ مكتمل |
| حذف التوكنات المنتهية صلاحيتها | ✅ تلقائي |
| لوحة إدارة الإشعارات | ✅ مكتملة |
| إشعار بلغة المستخدم (عربي/إنجليزي) | ✅ مكتمل |
| `EXPO_PUBLIC_EAS_PROJECT_ID` env var | ⏳ يتطلب تدخل المستخدم |
| iOS APNs (Expo Launch) | ⏳ يتطلب النشر عبر Replit Publish |
| Android FCM (google-services.json) | ⏳ يتطلب Firebase + EAS خارج Replit |
