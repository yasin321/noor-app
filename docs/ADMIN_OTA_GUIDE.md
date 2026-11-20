# راهنمای جامع مدیریت محتوای زنده (OTA) و همگام‌سازی سراسری نور

این راهنما هم داخل مخزن گیت و هم در جدول `admin_playbook` پنل Supabase ذخیره شده است تا هر زمان خواستی بدون آپدیت APK محتوای جدید منتشر کنی، دقیق و سریع جلو بروی.

---

## ۱. استاندارد طلایی حجم و کیفیت قبل از آپلود

قبل از آپلود هر فایل در **Supabase ← Storage ← باکت `noor-media`**، اسکریپت آماده را روی ویندوز اجرا کن:

- **اذان، تلاوت قرآن، دعا (صدای تک‌خوان شفاف و کم‌حجم — ۴۸k Mono با تنظیم خودکار بلندی صدا):**
  ```powershell
  .\scripts\optimize-media.ps1 -InputFile "C:\path\to\adhan.mp3" -Mode speech
  ```
- **تواشیح و نوای گروهی (کیفیت استریو ۶۴k — زیر ۱ مگابایت):**
  ```powershell
  .\scripts\optimize-media.ps1 -InputFile "C:\path\to\tawashih.mp3" -Mode music
  ```
- **والپیپر حرم و منظره بالای صفحه خانه (ابعاد استاندارد `960x540` نسبت ۱۶:۹ — زیر ۱۲۰ کیلوبایت):**
  ```powershell
  .\scripts\optimize-media.ps1 -InputFile "C:\path\to\haram.jpg" -Mode wallpaper
  ```

---

## ۲. افزودن اذان، تواشیح یا دعای جدید (بدون آپدیت APK)

1. در Supabase برو به **Storage ← `noor-media` ← پوشه `audio/`** و فایل MP3 بهینه‌شده را آپلود کن و **Public URL** را کپی کن.
2. برو به **Table Editor ← `media_catalog` ← Insert row**:
   - `id`: شناسه یکتا انگلیسی (مثلاً `adhan_shakernezhad_hd`)
   - `category`: یکی از مقادیر `adhan` | `pre_adhan` | `post_adhan` | `dua` | `surah`
   - `title_fa`, `subtitle_fa`, `reciter_fa`, `duration_fa`, `audio_url`
   - `is_active`: `true`
3. برو به **Table Editor ← `global_sync_meta`** و عدد `catalog_version` را **۱ واحد زیاد کن** (مثلاً `1` ← `2`).
4. **نتیجه روی گوشی کاربران:** هم در «مرکز سینک گلوبال» و هم مستقیم در لیست مؤذنان یا کشوی «تعقیبات» ظاهر می‌شود و با یک کلیک روی گوشی دانلود آفلاین می‌شود.

---

## ۳. افزودن والپیپر جدید بالای صفحه خانه

1. عکس `960x540` را در **Storage ← `noor-media` ← پوشه `wallpapers/`** آپلود و **Public URL** را کپی کن.
2. در **Table Editor ← `remote_wallpapers` ← Insert row**:
   - `id`: مثلاً `shrine_samarra_2026`
   - `category`: `shrine` | `mosque` | `occasion` | `nature`
   - `title_fa`, `subtitle_fa`, `occasion_tag`, `image_url`, `is_active = true`
3. در `global_sync_meta` عدد `catalog_version` را **+۱** کن.
4. **نتیجه:** هم در «مرکز سینک گلوبال ← تب والپیپرها» و هم در گالری تصاویر صفحه خانه با برچسب **«✨ جدید»** ظاهر می‌شود.

---

## ۴. افزودن تم مناسبتی جدید (رمضان، محرم، غدیر، نوروز...)

1. در **Table Editor ← `remote_themes` ← Insert row**:
   - `id`, `name_en`, `name_fa`, `occasion_fa`
   - رنگ‌های Hex استاندارد (`bg_color`, `surface_color`, `surface_alt_color`, `card_color`, `primary_color`, `accent_color`)
   - اگر می‌خواهی همراه تم، عکس بالای صفحه خانه هم خودکار ست شود، لینک عکس را در `wallpaper_url` بگذار.
2. در `global_sync_meta` عدد `catalog_version` را **+۱** کن.

---

## ۵. ارسال پیام مناسبتی یا فرمان آپدیت نسخه جدید APK

- **پیام مناسبتی بالای صفحه:** در `global_sync_meta` متن `announcement_fa` را بنویس و `announcement_active = true` کن.
- **آپدیت نسخه APK:** در `app_releases` یک ردیف جدید با `platform = 'android'`، `version_code` بزرگ‌تر از نسخه قبلی، `version_name` (مثلاً `v3.1.0`)، لینک مستقیم APK از GitHub Releases و `changelog_fa` ثبت کن (`force_update = false` برای اختیاری، `true` برای اجباری).
