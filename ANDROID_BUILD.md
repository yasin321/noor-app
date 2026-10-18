# ساخت نسخه اندروید نور

## پیش‌نیازها
- Node.js سازگار با پروژه (ترجیحاً Node 22 LTS)
- Android Studio و Android SDK نصب‌شده
- JDK سازگار با Gradle/Android Gradle Plugin پروژه

## همگام‌سازی و ساخت APK آزمایشی
از ریشه پروژه، در ترمینال اجرا کنید:

```bash
npm ci
npm run typecheck
npm test
npm run build
npx cap sync android
```

ویندوز:

```bat
cd android
gradlew.bat assembleDebug
```

macOS/Linux:

```bash
cd android
./gradlew assembleDebug
```

خروجی APK آزمایشی معمولاً در `android/app/build/outputs/apk/debug/app-debug.apk` خواهد بود.

## نسخه انتشار
نسخه انتشار باید با کلید امضای متعلق به صاحب برنامه امضا شود. کلید و رمزهای امضا را در مخزن یا ZIP عمومی قرار ندهید. پیش از انتشار، نصب و اعلان‌ها را روی دستگاه واقعی آزمایش کنید و سیاست‌های فعلی کافه‌بازار را بررسی کنید.

## محدودیت تأیید در این بسته
در محیطی که این بسته ویرایش شده، Android SDK نصب نیست و دسترسی شبکه برای نصب npm وابستگی‌ها در دسترس/پایدار نبود؛ بنابراین APK در این محیط ساخته نشده و ساخت Gradle هنوز تأیید نشده است.
