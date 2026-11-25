package com.noor.app;

import android.animation.ValueAnimator;
import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.LinearInterpolator;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.appcompat.app.AppCompatActivity;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AdhanAlarmActivity extends AppCompatActivity {
    public static final String ACTION_CLOSE_UI = "com.noor.app.ACTION_CLOSE_ALARM_UI";

    private ValueAnimator eqAnimator;
    private AnimatedEqualizerView equalizerView;
    private TextView clockView;
    private final Handler clockHandler = new Handler(Looper.getMainLooper());
    private final Runnable clockTicker = new Runnable() {
        @Override
        public void run() {
            if (clockView != null) {
                clockView.setText(formatNowPersianClock());
            }
            clockHandler.postDelayed(this, 15000L);
        }
    };

    private final BroadcastReceiver closeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            try {
                getWindow().clearFlags(
                        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                );
            } catch (Exception ignored) {}
            finishAndRemoveTask();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        turnScreenOnAndUnlock();
        renderAlarmScreen(getIntent());

        IntentFilter filter = new IntentFilter(ACTION_CLOSE_UI);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(closeReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(closeReceiver, filter);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        turnScreenOnAndUnlock();
        renderAlarmScreen(intent);
    }

    private void renderAlarmScreen(Intent intent) {
        if (eqAnimator != null) {
            eqAnimator.cancel();
            eqAnimator = null;
        }
        clockHandler.removeCallbacks(clockTicker);

        String rawTitle = intent != null && intent.getStringExtra("title") != null
                ? intent.getStringExtra("title").trim()
                : "وقت اذان و نیایش";
        String rawBody = intent != null && intent.getStringExtra("body") != null
                ? intent.getStringExtra("body").trim()
                : "حَیَّ عَلَی الصَّلَاة — وقت فضیلت نماز فرا رسیده است";
        String soundType = intent != null && intent.getStringExtra("soundType") != null
                ? intent.getStringExtra("soundType").trim()
                : "adhan";
        String adhanId = intent != null && intent.getStringExtra("adhanId") != null
                ? intent.getStringExtra("adhanId").trim().toLowerCase(Locale.US)
                : "";
        float playbackRate = intent != null ? intent.getFloatExtra("playbackRate", 1.0f) : 1.0f;

        String cleanTitle = stripBrokenChars(rawTitle);
        String cleanBody = stripBrokenChars(rawBody);

        AlarmVisualProfile profile = resolveVisualProfile(cleanTitle, cleanBody, soundType, adhanId, playbackRate);

        FrameLayout root = new FrameLayout(this);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        // لایه ۱: پس‌زمینه کلاسیک لاجوردی/زمردی همراه با قوس محراب و شمسه نورانی
        MihrabBackdropView backdrop = new MihrabBackdropView(
                this,
                profile.bgTop,
                profile.bgMid,
                profile.bgBottom,
                profile.accentGold,
                profile.accentGlow
        );
        root.addView(backdrop, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        // لایه ۲: محتوای وسط‌چین با قابلیت اسکرول در صفحه‌های کوچک
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setVerticalScrollBarEnabled(false);

        LinearLayout container = new LinearLayout(this);
        container.setOrientation(LinearLayout.VERTICAL);
        container.setGravity(Gravity.CENTER_HORIZONTAL);
        container.setPadding(dp(22), dp(42), dp(22), dp(34));

        // ردیف بالا: کپسول دسته‌بندی رویداد
        TextView topPill = new TextView(this);
        topPill.setText(profile.topBadge);
        topPill.setTextColor(profile.accentGold);
        topPill.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12.5f);
        topPill.setTypeface(Typeface.DEFAULT_BOLD);
        topPill.setGravity(Gravity.CENTER);
        topPill.setPadding(dp(18), dp(7), dp(18), dp(7));
        GradientDrawable pillBg = new GradientDrawable();
        pillBg.setColor(Color.argb(46, Color.red(profile.accentGold), Color.green(profile.accentGold), Color.blue(profile.accentGold)));
        pillBg.setStroke(dp(1), Color.argb(135, Color.red(profile.accentGold), Color.green(profile.accentGold), Color.blue(profile.accentGold)));
        pillBg.setCornerRadius(dp(99));
        topPill.setBackground(pillBg);
        LinearLayout.LayoutParams pillLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        pillLp.bottomMargin = dp(18);
        container.addView(topPill, pillLp);

        // نشان طلایی محراب نور (Vector Canvas — بدون ایموجی خراب)
        GoldenEmblemView emblem = new GoldenEmblemView(this, profile.accentGold, profile.accentSecondary);
        LinearLayout.LayoutParams embLp = new LinearLayout.LayoutParams(dp(86), dp(86));
        embLp.bottomMargin = dp(10);
        container.addView(emblem, embLp);

        // ساعت زنده با ارقام فارسی
        clockView = new TextView(this);
        clockView.setText(formatNowPersianClock());
        clockView.setTextColor(Color.parseColor("#F8FAFC"));
        clockView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 40f);
        clockView.setTypeface(Typeface.create("sans-serif-light", Typeface.BOLD));
        clockView.setGravity(Gravity.CENTER);
        clockView.setLetterSpacing(0.06f);
        LinearLayout.LayoutParams clockLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        clockLp.bottomMargin = dp(6);
        container.addView(clockView, clockLp);

        // اکولایزر زنده ۷ ستونه + وضعیت پویا
        LinearLayout eqRow = new LinearLayout(this);
        eqRow.setOrientation(LinearLayout.HORIZONTAL);
        eqRow.setGravity(Gravity.CENTER);
        eqRow.setPadding(dp(14), dp(6), dp(14), dp(6));
        GradientDrawable eqPillBg = new GradientDrawable();
        eqPillBg.setColor(Color.parseColor("#22000000"));
        eqPillBg.setStroke(dp(1), Color.argb(75, Color.red(profile.accentSecondary), Color.green(profile.accentSecondary), Color.blue(profile.accentSecondary)));
        eqPillBg.setCornerRadius(dp(99));
        eqRow.setBackground(eqPillBg);

        equalizerView = new AnimatedEqualizerView(this, profile.accentGold, profile.accentSecondary);
        LinearLayout.LayoutParams eqViewLp = new LinearLayout.LayoutParams(dp(44), dp(18));
        eqViewLp.leftMargin = dp(8);
        eqViewLp.rightMargin = dp(8);
        eqRow.addView(equalizerView, eqViewLp);

        TextView eqLabel = new TextView(this);
        eqLabel.setText(profile.equalizerStatus);
        eqLabel.setTextColor(Color.parseColor("#E2E8F0"));
        eqLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        eqLabel.setTypeface(Typeface.DEFAULT_BOLD);
        eqRow.addView(eqLabel);

        LinearLayout.LayoutParams eqRowLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        eqRowLp.bottomMargin = dp(22);
        container.addView(eqRow, eqRowLp);

        // کارت شیشه‌ای کلاسیک با قاب طلایی
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_HORIZONTAL);
        card.setPadding(dp(22), dp(24), dp(22), dp(24));
        GradientDrawable cardBg = new GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{ profile.cardTop, profile.cardBottom }
        );
        cardBg.setStroke(dp(1), Color.argb(145, Color.red(profile.accentGold), Color.green(profile.accentGold), Color.blue(profile.accentGold)));
        cardBg.setCornerRadius(dp(28));
        card.setBackground(cardBg);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            card.setElevation(dp(10));
        }

        // عنوان اصلی رویداد (مثلاً: اذان مغرب به افق مشهد / تلاوت سوره مبارکه واقعه)
        TextView titleView = new TextView(this);
        titleView.setText(cleanTitle);
        titleView.setTextColor(profile.titleColor);
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 23f);
        titleView.setTypeface(Typeface.DEFAULT_BOLD);
        titleView.setGravity(Gravity.CENTER);
        titleView.setLineSpacing(dp(4), 1.08f);
        card.addView(titleView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));

        // خط جداکننده تزئینی کلاسیک
        TextView divider = new TextView(this);
        divider.setText("────────  ✦  ────────");
        divider.setTextColor(Color.argb(175, Color.red(profile.accentGold), Color.green(profile.accentGold), Color.blue(profile.accentGold)));
        divider.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f);
        divider.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams divLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        divLp.topMargin = dp(12);
        divLp.bottomMargin = dp(12);
        card.addView(divider, divLp);

        // آیه یا فراز عربی اختصاصی همان سوره / اذان / تواشیح
        if (!profile.classicalVerse.isEmpty()) {
            TextView verseView = new TextView(this);
            verseView.setText(profile.classicalVerse);
            verseView.setTextColor(Color.parseColor("#FEF9C3"));
            verseView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18.5f);
            verseView.setTypeface(Typeface.SERIF, Typeface.BOLD);
            verseView.setGravity(Gravity.CENTER);
            verseView.setLineSpacing(dp(5), 1.15f);
            verseView.setPadding(dp(12), dp(10), dp(12), dp(10));
            GradientDrawable verseBg = new GradientDrawable();
            verseBg.setColor(Color.argb(30, Color.red(profile.accentGold), Color.green(profile.accentGold), Color.blue(profile.accentGold)));
            verseBg.setCornerRadius(dp(16));
            verseView.setBackground(verseBg);
            LinearLayout.LayoutParams verseLp = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            verseLp.bottomMargin = dp(12);
            card.addView(verseView, verseLp);
        }

        // توضیح فارسی متناسب با رویداد
        TextView bodyView = new TextView(this);
        bodyView.setText(cleanBody);
        bodyView.setTextColor(Color.parseColor("#E2E8F0"));
        bodyView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14.5f);
        bodyView.setGravity(Gravity.CENTER);
        bodyView.setLineSpacing(dp(4), 1.15f);
        card.addView(bodyView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));

        LinearLayout.LayoutParams cardLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        cardLp.bottomMargin = dp(26);
        container.addView(card, cardLp);

        // دکمه اصلی توقف (گرادیان طلایی کلاسیک)
        Button stopBtn = new Button(this);
        stopBtn.setText(profile.stopButtonLabel);
        stopBtn.setAllCaps(false);
        stopBtn.setTextColor(Color.parseColor("#0B131E"));
        stopBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f);
        stopBtn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable stopBg = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{ Color.parseColor("#F59E0B"), Color.parseColor("#FDE047"), Color.parseColor("#F59E0B") }
        );
        stopBg.setCornerRadius(dp(20));
        stopBtn.setBackground(stopBg);
        stopBtn.setPadding(dp(24), dp(15), dp(24), dp(15));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            stopBtn.setElevation(dp(8));
        }
        LinearLayout.LayoutParams stopLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        stopLp.bottomMargin = dp(12);
        stopBtn.setOnClickListener(v -> stopPlaybackAndDismiss());
        container.addView(stopBtn, stopLp);

        // دکمه دوم: ورود به اپلیکیشن نور (شیشه‌ای خوانا و بدون هیچ کاراکتر خراب)
        Button openAppBtn = new Button(this);
        openAppBtn.setText(profile.openButtonLabel);
        openAppBtn.setAllCaps(false);
        openAppBtn.setTextColor(profile.accentSecondary);
        openAppBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14.5f);
        openAppBtn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable openBg = new GradientDrawable();
        openBg.setColor(Color.parseColor("#2A0F2922"));
        openBg.setStroke(dp(1), Color.argb(165, Color.red(profile.accentSecondary), Color.green(profile.accentSecondary), Color.blue(profile.accentSecondary)));
        openBg.setCornerRadius(dp(20));
        openAppBtn.setBackground(openBg);
        openAppBtn.setPadding(dp(24), dp(14), dp(24), dp(14));
        openAppBtn.setOnClickListener(v -> {
            stopPlaybackQuietly();
            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(mainIntent);
            finish();
        });
        container.addView(openAppBtn, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));

        // امضای بسیار ظریف پایین صفحه
        TextView brandFooter = new TextView(this);
        brandFooter.setText("توقف سریع: فشردن دکمه‌های صدا (ولوم) یا قفل گوشی  •  همراه معنوی نور");
        brandFooter.setTextColor(Color.argb(120, 226, 232, 240));
        brandFooter.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f);
        brandFooter.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams footLp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        footLp.topMargin = dp(20);
        container.addView(brandFooter, footLp);

        scroll.addView(container);
        ViewCompat.setOnApplyWindowInsetsListener(scroll, (v, insets) -> {
            Insets bars = insets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
            );
            container.setPadding(
                    dp(22) + bars.left,
                    dp(42) + bars.top,
                    dp(22) + bars.right,
                    dp(34) + bars.bottom
            );
            return insets;
        });
        root.addView(scroll, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        setContentView(root);

        // شروع انیمیشن نرم اکولایزر و ساعت زنده
        eqAnimator = ValueAnimator.ofFloat(0f, (float) (Math.PI * 2.0));
        eqAnimator.setDuration(1400L);
        eqAnimator.setRepeatCount(ValueAnimator.INFINITE);
        eqAnimator.setInterpolator(new LinearInterpolator());
        eqAnimator.addUpdateListener(anim -> {
            if (equalizerView != null) {
                equalizerView.setPhase((float) anim.getAnimatedValue());
            }
        });
        eqAnimator.start();
        clockHandler.postDelayed(clockTicker, 15000L);
    }

    private AlarmVisualProfile resolveVisualProfile(
            String title,
            String body,
            String soundType,
            String adhanId,
            float playbackRate
    ) {
        String combined = (title + " " + body + " " + adhanId).toLowerCase(Locale.US);
        String speedNote = Math.abs(playbackRate - 1.0f) > 0.04f
                ? "  •  سرعت " + toPersianDigits(String.format(Locale.US, "%.2gx", playbackRate))
                : "";

        boolean isPreAdhan =
                title.contains("مانده تا اذان") ||
                title.contains("دقیقه تا اذان") ||
                title.contains("پیش از اذان") ||
                combined.contains("rabbana") ||
                title.contains("ربنا") ||
                combined.contains("nadali") ||
                title.contains("نادعلی") ||
                combined.contains("chant_");

        boolean isSurah =
                title.contains("سوره") ||
                title.contains("آیةالکرسی") ||
                title.contains("آیت‌الکرسی") ||
                title.contains("تلاوت") ||
                adhanId.startsWith("post_") ||
                adhanId.startsWith("surah_");

        boolean isTaqibat =
                !isPreAdhan && (
                        title.contains("تعقیبات") ||
                        title.contains("تسبیحات") ||
                        title.contains("پس از اذان") ||
                        "surah_chant".equals(soundType)
                );

        // ۱. تلاوت سوره قرآن (از صفحه قرآن یا بعد از اذان)
        if (isSurah) {
            String surahName = "قرآن کریم";
            String verse = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
            if (combined.contains("waqiah") || title.contains("واقعه")) {
                surahName = "سوره مبارکه واقعه";
                verse = "إِذَا وَقَعَتِ الْوَاقِعَةُ ۝ لَيْسَ لِوَقْعَتِهَا كَاذِبَةٌ";
            } else if (combined.contains("yasin") || title.contains("یس")) {
                surahName = "سوره مبارکه یس";
                verse = "يس ۝ وَالْقُرْآنِ الْحَكِيمِ";
            } else if (combined.contains("mulk") || title.contains("ملک")) {
                surahName = "سوره مبارکه ملک";
                verse = "تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ";
            } else if (combined.contains("rahman") || title.contains("الرحمن")) {
                surahName = "سوره مبارکه الرحمن";
                verse = "الرَّحْمَٰنُ ۝ عَلَّمَ الْقُرْآنَ";
            } else if (combined.contains("dhariyat") || title.contains("ذاریات")) {
                surahName = "سوره مبارکه ذاریات";
                verse = "وَالذَّارِيَاتِ ذَرْوًا ۝ فَالْحَامِلَاتِ وِقْرًا";
            } else if (combined.contains("saffat") || title.contains("صافات")) {
                surahName = "سوره مبارکه صافات";
                verse = "وَالصَّافَّاتِ صَفًّا ۝ فَالزَّاجِرَاتِ زَجْرًا";
            } else if (combined.contains("062") || title.contains("جمعه")) {
                surahName = "سوره مبارکه جمعه";
                verse = "يُسَبِّحُ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ";
            } else if (combined.contains("097") || title.contains("قدر")) {
                surahName = "سوره مبارکه قدر";
                verse = "إِنَّا أَنْزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ";
            } else if (combined.contains("112") || title.contains("توحید")) {
                surahName = "سوره مبارکه توحید";
                verse = "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ";
            } else if (combined.contains("kursi") || title.contains("کرسی")) {
                surahName = "آیةالکرسی شریف";
                verse = "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ";
            } else if (combined.contains("furqan") || title.contains("فرقان")) {
                surahName = "آیات عبادالرحمن (فرقان)";
                verse = "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ";
            }

            return new AlarmVisualProfile(
                    "تلاوت نورانی قرآن کریم",
                    "در حال پخش " + surahName + speedNote,
                    verse,
                    "توقف تلاوت و بستن",
                    "ورود به اپلیکیشن نور",
                    Color.parseColor("#061626"),
                    Color.parseColor("#0B2A3C"),
                    Color.parseColor("#05101B"),
                    Color.parseColor("#143648"),
                    Color.parseColor("#0B2130"),
                    Color.parseColor("#FCD34D"),
                    Color.parseColor("#38BDF8"),
                    Color.parseColor("#FEF08A"),
                    Color.parseColor("#1D4ED8")
            );
        }

        // ۲. پیش از اذان / تواشیح / ربنا / نادعلی
        if (isPreAdhan) {
            String verse = "أَقِمِ الصَّلَاةَ لِذِكْرِي";
            String status = "در حال پخش نوای پیش از اذان" + speedNote;
            if (combined.contains("rabbana") || title.contains("ربنا")) {
                verse = "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا";
                status = "در حال پخش دعای ربنا" + speedNote;
            } else if (combined.contains("nadali") || title.contains("نادعلی")) {
                verse = "نَادِ عَلِیًّا مَظْهَرَ الْعَجَائِبِ";
                status = "در حال پخش دعای شریف نادعلی (ع)" + speedNote;
            } else if (combined.contains("salawat") || title.contains("صلوات")) {
                verse = "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ";
                status = "در حال پخش صلوات و تواشیح" + speedNote;
            } else if (combined.contains("istighfar") || title.contains("استغفار")) {
                verse = "أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ";
                status = "در حال پخش نوای استغفار" + speedNote;
            } else if (combined.contains("tasbihat") || title.contains("تسبیحات")) {
                verse = "سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ";
                status = "در حال پخش تسبیحات پیش از اذان" + speedNote;
            }

            return new AlarmVisualProfile(
                    "آمادگی و مناجات پیش از اذان",
                    status,
                    verse,
                    "توقف نوا و بستن",
                    "ورود به اپلیکیشن نور",
                    Color.parseColor("#08132B"),
                    Color.parseColor("#11254A"),
                    Color.parseColor("#060D1E"),
                    Color.parseColor("#162E57"),
                    Color.parseColor("#0D1E3A"),
                    Color.parseColor("#FDE047"),
                    Color.parseColor("#7DD3FC"),
                    Color.parseColor("#FEF9C3"),
                    Color.parseColor("#2563EB")
            );
        }

        // ۳. تعقیبات عمومی پس از نماز
        if (isTaqibat) {
            return new AlarmVisualProfile(
                    "تعقیبات و ذکر پس از نماز",
                    "در حال پخش صوت تعقیبات" + speedNote,
                    "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
                    "توقف تعقیبات و بستن",
                    "ورود به اپلیکیشن نور",
                    Color.parseColor("#041B19"),
                    Color.parseColor("#0A342F"),
                    Color.parseColor("#041211"),
                    Color.parseColor("#0F3F38"),
                    Color.parseColor("#082622"),
                    Color.parseColor("#FBBF24"),
                    Color.parseColor("#34D399"),
                    Color.parseColor("#FEF08A"),
                    Color.parseColor("#059669")
            );
        }

        // ۴. اذان اصلی (صبح، ظهر، عصر، مغرب، عشاء، نماز شب)
        String adhanVerse = "حَیَّ عَلَی الصَّلَاةِ ۝ حَیَّ عَلَی الْفَلَاحِ";
        String adhanBadge = "وقت فضیلت نماز  •  همراه معنوی نور";
        if (title.contains("نماز شب")) {
            adhanBadge = "خلوت سحرگاهی و نماز شب";
            adhanVerse = "وَمِنَ اللَّيْلِ فَتَهَجَّدْ بِهِ نَافِلَةً لَكَ";
        } else if (title.contains("صبح")) {
            adhanBadge = "اذان صبح  •  آغاز نورانی روز";
        } else if (title.contains("ظهر")) {
            adhanBadge = "اذان ظهر  •  نماز اول وقت";
        } else if (title.contains("مغرب")) {
            adhanBadge = "اذان مغرب  •  وقت نیایش شامگاه";
        }

        return new AlarmVisualProfile(
                adhanBadge,
                "در حال پخش نوای ملکوتی اذان",
                adhanVerse,
                "توقف اذان و بستن",
                "ورود به اپلیکیشن نور",
                Color.parseColor("#03191B"),
                Color.parseColor("#083330"),
                Color.parseColor("#031014"),
                Color.parseColor("#0E3C37"),
                Color.parseColor("#072422"),
                Color.parseColor("#FBBF24"),
                Color.parseColor("#34D399"),
                Color.parseColor("#FEF08A"),
                Color.parseColor("#10B981")
        );
    }

    private static String stripBrokenChars(String text) {
        if (text == null) return "";
        return text.replace(String.valueOf((char) 0xFFFD), "").trim();
    }

    private static String formatNowPersianClock() {
        String raw = new SimpleDateFormat("HH:mm", Locale.US).format(new Date());
        return toPersianDigits(raw);
    }

    private static String toPersianDigits(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char ch = input.charAt(i);
            if (ch >= '0' && ch <= '9') {
                sb.append((char) (0x06F0 + (ch - '0')));
            } else {
                sb.append(ch);
            }
        }
        return sb.toString();
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                value,
                getResources().getDisplayMetrics()
        ));
    }

    private void turnScreenOnAndUnlock() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.parseColor("#031014"));
        }
        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
    }

    private void stopPlaybackQuietly() {
        try {
            getWindow().clearFlags(
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        } catch (Exception ignored) {}
        AdhanForegroundService.killActivePlayer(this);
        try {
            Intent stopIntent = new Intent(this, AdhanAlarmReceiver.class);
            stopIntent.setAction(AdhanAlarmReceiver.ACTION_STOP);
            sendBroadcast(stopIntent);
        } catch (Exception ignored) {}
    }

    private void stopPlaybackAndDismiss() {
        try {
            getWindow().clearFlags(
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        } catch (Exception ignored) {}
        AdhanForegroundService.killActivePlayer(this);
        try {
            Intent stopIntent = new Intent(this, AdhanAlarmReceiver.class);
            stopIntent.setAction(AdhanAlarmReceiver.ACTION_STOP);
            sendBroadcast(stopIntent);
        } catch (Exception ignored) {}
        finishAndRemoveTask();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if (code == KeyEvent.KEYCODE_VOLUME_UP ||
                code == KeyEvent.KEYCODE_VOLUME_DOWN ||
                code == KeyEvent.KEYCODE_VOLUME_MUTE ||
                code == KeyEvent.KEYCODE_HEADSETHOOK ||
                code == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE ||
                code == KeyEvent.KEYCODE_MEDIA_STOP ||
                code == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_DOWN) {
                stopPlaybackAndDismiss();
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    protected void onDestroy() {
        clockHandler.removeCallbacks(clockTicker);
        if (eqAnimator != null) {
            eqAnimator.cancel();
            eqAnimator = null;
        }
        try {
            unregisterReceiver(closeReceiver);
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    private static final class AlarmVisualProfile {
        final String topBadge;
        final String equalizerStatus;
        final String classicalVerse;
        final String stopButtonLabel;
        final String openButtonLabel;
        final int bgTop;
        final int bgMid;
        final int bgBottom;
        final int cardTop;
        final int cardBottom;
        final int accentGold;
        final int accentSecondary;
        final int titleColor;
        final int accentGlow;

        AlarmVisualProfile(
                String topBadge,
                String equalizerStatus,
                String classicalVerse,
                String stopButtonLabel,
                String openButtonLabel,
                int bgTop,
                int bgMid,
                int bgBottom,
                int cardTop,
                int cardBottom,
                int accentGold,
                int accentSecondary,
                int titleColor,
                int accentGlow
        ) {
            this.topBadge = topBadge;
            this.equalizerStatus = equalizerStatus;
            this.classicalVerse = classicalVerse;
            this.stopButtonLabel = stopButtonLabel;
            this.openButtonLabel = openButtonLabel;
            this.bgTop = bgTop;
            this.bgMid = bgMid;
            this.bgBottom = bgBottom;
            this.cardTop = cardTop;
            this.cardBottom = cardBottom;
            this.accentGold = accentGold;
            this.accentSecondary = accentSecondary;
            this.titleColor = titleColor;
            this.accentGlow = accentGlow;
        }
    }

    // بوم پس‌زمینه کلاسیک ایرانی-اسلامی: گرادیان عمیق + هاله نورانی + قاب قوس محراب طلایی ظریف
    private static final class MihrabBackdropView extends View {
        private final int topColor;
        private final int midColor;
        private final int bottomColor;
        private final int goldColor;
        private final int glowColor;
        private final Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint archPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint starPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path archPath = new Path();

        MihrabBackdropView(Context ctx, int topColor, int midColor, int bottomColor, int goldColor, int glowColor) {
            super(ctx);
            this.topColor = topColor;
            this.midColor = midColor;
            this.bottomColor = bottomColor;
            this.goldColor = goldColor;
            this.glowColor = glowColor;

            archPaint.setStyle(Paint.Style.STROKE);
            archPaint.setStrokeWidth(2.4f);
            starPaint.setStyle(Paint.Style.STROKE);
            starPaint.setStrokeWidth(1.4f);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float w = getWidth();
            float h = getHeight();
            if (w <= 0 || h <= 0) return;

            bgPaint.setShader(new LinearGradient(
                    0f, 0f, 0f, h,
                    new int[]{ topColor, midColor, bottomColor },
                    new float[]{ 0f, 0.45f, 1f },
                    Shader.TileMode.CLAMP
            ));
            canvas.drawRect(0f, 0f, w, h, bgPaint);

            // هاله نورانی بالای محراب
            glowPaint.setShader(new RadialGradient(
                    w * 0.5f, h * 0.16f, w * 0.72f,
                    Color.argb(62, Color.red(glowColor), Color.green(glowColor), Color.blue(glowColor)),
                    Color.TRANSPARENT,
                    Shader.TileMode.CLAMP
            ));
            canvas.drawCircle(w * 0.5f, h * 0.16f, w * 0.72f, glowPaint);

            // قوس محراب دوقلو کلاسیک در پس‌زمینه
            drawPointedArch(canvas, w * 0.06f, h * 0.04f, w * 0.94f, h * 0.96f, 44);
            drawPointedArch(canvas, w * 0.095f, h * 0.065f, w * 0.905f, h * 0.935f, 26);

            // شمسه هشت‌پر ظریف بالای قوس
            starPaint.setColor(Color.argb(38, Color.red(goldColor), Color.green(goldColor), Color.blue(goldColor)));
            float cx = w * 0.5f;
            float cy = h * 0.15f;
            float r = w * 0.24f;
            canvas.save();
            canvas.translate(cx, cy);
            canvas.drawRect(-r * 0.7f, -r * 0.7f, r * 0.7f, r * 0.7f, starPaint);
            canvas.rotate(45f);
            canvas.drawRect(-r * 0.7f, -r * 0.7f, r * 0.7f, r * 0.7f, starPaint);
            canvas.restore();
        }

        private void drawPointedArch(Canvas canvas, float left, float top, float right, float bottom, int alpha) {
            float midX = (left + right) * 0.5f;
            float shoulderY = top + (bottom - top) * 0.20f;
            archPath.reset();
            archPath.moveTo(left, bottom);
            archPath.lineTo(left, shoulderY);
            archPath.quadTo(left, top + (shoulderY - top) * 0.35f, midX, top);
            archPath.quadTo(right, top + (shoulderY - top) * 0.35f, right, shoulderY);
            archPath.lineTo(right, bottom);
            archPath.close();
            archPaint.setColor(Color.argb(alpha, Color.red(goldColor), Color.green(goldColor), Color.blue(goldColor)));
            canvas.drawPath(archPath, archPaint);
        }
    }

    // مدالیون طلایی محراب و نور
    private static final class GoldenEmblemView extends View {
        private final int gold;
        private final int secondary;
        private final Paint ringPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint archPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path mihrabPath = new Path();

        GoldenEmblemView(Context ctx, int gold, int secondary) {
            super(ctx);
            this.gold = gold;
            this.secondary = secondary;
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float w = getWidth();
            float h = getHeight();
            float cx = w * 0.5f;
            float cy = h * 0.5f;
            float r = Math.min(w, h) * 0.45f;

            fillPaint.setShader(new RadialGradient(
                    cx, cy * 0.85f, r,
                    Color.argb(65, Color.red(gold), Color.green(gold), Color.blue(gold)),
                    Color.argb(18, Color.red(secondary), Color.green(secondary), Color.blue(secondary)),
                    Shader.TileMode.CLAMP
            ));
            canvas.drawCircle(cx, cy, r, fillPaint);

            ringPaint.setStyle(Paint.Style.STROKE);
            ringPaint.setStrokeWidth(3.2f);
            ringPaint.setColor(gold);
            canvas.drawCircle(cx, cy, r, ringPaint);

            ringPaint.setStrokeWidth(1.5f);
            ringPaint.setColor(Color.argb(130, Color.red(secondary), Color.green(secondary), Color.blue(secondary)));
            canvas.drawCircle(cx, cy, r * 0.84f, ringPaint);

            // محراب کلاسیک داخلی
            float left = cx - r * 0.40f;
            float right = cx + r * 0.40f;
            float top = cy - r * 0.46f;
            float bottom = cy + r * 0.42f;
            float shoulder = cy - r * 0.04f;
            mihrabPath.reset();
            mihrabPath.moveTo(left, bottom);
            mihrabPath.lineTo(left, shoulder);
            mihrabPath.quadTo(left, top + (shoulder - top) * 0.35f, cx, top);
            mihrabPath.quadTo(right, top + (shoulder - top) * 0.35f, right, shoulder);
            mihrabPath.lineTo(right, bottom);

            archPaint.setStyle(Paint.Style.STROKE);
            archPaint.setStrokeCap(Paint.Cap.ROUND);
            archPaint.setStrokeJoin(Paint.Join.ROUND);
            archPaint.setStrokeWidth(4.5f);
            archPaint.setColor(gold);
            canvas.drawPath(mihrabPath, archPaint);

            // خط پایه و نقطه نورانی قلب محراب
            canvas.drawLine(left - r * 0.12f, bottom, right + r * 0.12f, bottom, archPaint);
            archPaint.setStyle(Paint.Style.FILL);
            archPaint.setColor(Color.parseColor("#FEF08A"));
            canvas.drawCircle(cx, cy + r * 0.06f, r * 0.13f, archPaint);
        }
    }

    // اکولایزر صوتی ۷ ستونه زنده
    private static final class AnimatedEqualizerView extends View {
        private final Paint barPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final RectF barRect = new RectF();
        private final int gold;
        private final int secondary;
        private float phase = 0f;

        AnimatedEqualizerView(Context ctx, int gold, int secondary) {
            super(ctx);
            this.gold = gold;
            this.secondary = secondary;
            barPaint.setStyle(Paint.Style.FILL);
        }

        void setPhase(float p) {
            this.phase = p;
            invalidate();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float w = getWidth();
            float h = getHeight();
            int bars = 7;
            float slot = w / bars;
            float barW = slot * 0.56f;
            for (int i = 0; i < bars; i++) {
                double wave = 0.30 + 0.70 * Math.abs(Math.sin(phase + i * 0.72));
                float barH = Math.max(h * 0.22f, (float) (h * wave));
                float left = i * slot + (slot - barW) * 0.5f;
                float top = (h - barH) * 0.5f;
                barPaint.setColor((i % 2 == 0) ? gold : secondary);
                barRect.set(left, top, left + barW, top + barH);
                canvas.drawRoundRect(barRect, barW * 0.5f, barW * 0.5f, barPaint);
            }
        }
    }
}
