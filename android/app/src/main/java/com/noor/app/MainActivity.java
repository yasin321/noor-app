package com.noor.app;

import android.Manifest;
import android.animation.ObjectAnimator;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.animation.ValueAnimator;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.DecelerateInterpolator;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import android.graphics.drawable.ClipDrawable;
import android.graphics.drawable.LayerDrawable;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private FrameLayout nativeSplashOverlay;
    private boolean splashDismissed = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private long lastRootBackPressMs = 0L;

    private int dp(int v) {
        return Math.round(TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()
        ));
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NoorAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        applyAndroid15EdgeToEdgeSafeInsets();
        attachZeroMillisecondNativeSplash();
        requestStartupNotificationPermission();
        setupSystemBackGesture();
        try {
            WebView wv = getBridge() != null ? getBridge().getWebView() : null;
            if (wv != null && wv.getSettings() != null) {
                wv.getSettings().setMediaPlaybackRequiresUserGesture(false);
                // قفل کردن زوم فونت سیستم در WebView تا تنظیمات فونت گوشی چیدمان برنامه را به‌هم نریزد
                wv.getSettings().setTextZoom(100);
                wv.getSettings().setSupportZoom(false);
                wv.getSettings().setBuiltInZoomControls(false);
                wv.getSettings().setDisplayZoomControls(false);
            }
        } catch (Exception ignored) {}
    }

    private void applyAndroid15EdgeToEdgeSafeInsets() {
        try {
            View content = findViewById(android.R.id.content);
            if (content != null) {
                content.setBackgroundColor(Color.parseColor("#041511"));
                if (Build.VERSION.SDK_INT >= 35) {
                    ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
                        Insets bars = windowInsets.getInsets(
                                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                        );
                        Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
                        v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
                        return WindowInsetsCompat.CONSUMED;
                    });
                    ViewCompat.requestApplyInsets(content);
                }
            }
            WindowInsetsControllerCompat controller =
                    WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (controller != null) {
                controller.setAppearanceLightStatusBars(false);
                controller.setAppearanceLightNavigationBars(false);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    private void attachZeroMillisecondNativeSplash() {
        try {
            final ViewGroup root = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
            if (root == null) return;

            nativeSplashOverlay = new FrameLayout(this);
            GradientDrawable bgGrad = new GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{ Color.parseColor("#07261E"), Color.parseColor("#041612"), Color.parseColor("#020D0A") }
            );
            nativeSplashOverlay.setBackground(bgGrad);
            nativeSplashOverlay.setClickable(true);
            nativeSplashOverlay.setFocusable(true);

            // کادر طلایی دور صفحه
            FrameLayout outerFrame = new FrameLayout(this);
            GradientDrawable outerBorder = new GradientDrawable();
            outerBorder.setColor(Color.TRANSPARENT);
            outerBorder.setCornerRadius(dp(26));
            outerBorder.setStroke(dp(1), Color.parseColor("#44D4AF37"));
            outerFrame.setBackground(outerBorder);
            FrameLayout.LayoutParams outerLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            );
            outerLp.setMargins(dp(14), dp(18), dp(14), dp(18));
            nativeSplashOverlay.addView(outerFrame, outerLp);

            // ۱. کادر بالا: بسم الله الرحمن الرحیم
            TextView bismillahView = new TextView(this);
            bismillahView.setText("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
            bismillahView.setTextColor(Color.parseColor("#FDE68A"));
            bismillahView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            bismillahView.setTypeface(Typeface.DEFAULT_BOLD);
            bismillahView.setGravity(Gravity.CENTER);
            GradientDrawable pillBg = new GradientDrawable();
            pillBg.setColor(Color.parseColor("#CC082B22"));
            pillBg.setCornerRadius(dp(20));
            pillBg.setStroke(dp(1), Color.parseColor("#66FBBF24"));
            bismillahView.setBackground(pillBg);
            bismillahView.setPadding(dp(22), dp(8), dp(22), dp(8));
            FrameLayout.LayoutParams topLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.TOP | Gravity.CENTER_HORIZONTAL
            );
            topLp.topMargin = dp(28);
            outerFrame.addView(bismillahView, topLp);

            // ۲. بخش مرکزی: آیکون برنامه + همراه معنوی نور + زیرعنوان
            LinearLayout centerBox = new LinearLayout(this);
            centerBox.setOrientation(LinearLayout.VERTICAL);
            centerBox.setGravity(Gravity.CENTER);

            FrameLayout iconWrapper = new FrameLayout(this);
            GradientDrawable iconBorder = new GradientDrawable();
            iconBorder.setColor(Color.parseColor("#092C23"));
            iconBorder.setCornerRadius(dp(28));
            iconBorder.setStroke(dp(2), Color.parseColor("#FBBF24"));
            iconWrapper.setBackground(iconBorder);
            iconWrapper.setPadding(dp(6), dp(6), dp(6), dp(6));

            ImageView appLogo = new ImageView(this);
            int iconRes = getResources().getIdentifier("ic_launcher_foreground", "mipmap", getPackageName());
            if (iconRes == 0) {
                iconRes = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
            }
            if (iconRes != 0) {
                appLogo.setImageResource(iconRes);
            }
            appLogo.setScaleType(ImageView.ScaleType.FIT_CENTER);
            iconWrapper.addView(appLogo, new FrameLayout.LayoutParams(dp(96), dp(96), Gravity.CENTER));

            LinearLayout.LayoutParams iconLp = new LinearLayout.LayoutParams(dp(112), dp(112));
            iconLp.bottomMargin = dp(20);
            centerBox.addView(iconWrapper, iconLp);

            TextView titleView = new TextView(this);
            titleView.setText("همراه معنوی نور");
            titleView.setTextColor(Color.WHITE);
            titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
            titleView.setTypeface(Typeface.DEFAULT_BOLD);
            titleView.setGravity(Gravity.CENTER);
            centerBox.addView(titleView);

            TextView subTitleView = new TextView(this);
            subTitleView.setText("اوقات شرعی دقیق · مصحف عثمان‌طه · قبله‌نمای هوشمند · مسجدیاب");
            subTitleView.setTextColor(Color.parseColor("#A7F3D0"));
            subTitleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
            subTitleView.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams subLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            subLp.topMargin = dp(8);
            centerBox.addView(subTitleView, subLp);

            FrameLayout.LayoutParams centerLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            );
            outerFrame.addView(centerBox, centerLp);

            // ۳. بخش پایین: کادر دعای حضرت صاحب‌الزمان (عج) + نوار پیشرفت واقعی و متحرک
            LinearLayout bottomWrapper = new LinearLayout(this);
            bottomWrapper.setOrientation(LinearLayout.VERTICAL);
            bottomWrapper.setGravity(Gravity.CENTER);

            LinearLayout duaCard = new LinearLayout(this);
            duaCard.setOrientation(LinearLayout.VERTICAL);
            duaCard.setGravity(Gravity.CENTER);
            GradientDrawable duaBg = new GradientDrawable();
            duaBg.setColor(Color.parseColor("#CC082920"));
            duaBg.setCornerRadius(dp(18));
            duaBg.setStroke(dp(1), Color.parseColor("#55FBBF24"));
            duaCard.setBackground(duaBg);
            duaCard.setPadding(dp(16), dp(14), dp(16), dp(14));

            TextView duaAr = new TextView(this);
            duaAr.setText("اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)");
            duaAr.setTextColor(Color.parseColor("#FBBF24"));
            duaAr.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            duaAr.setTypeface(Typeface.DEFAULT_BOLD);
            duaAr.setGravity(Gravity.CENTER);
            duaCard.addView(duaAr);

            TextView duaFa = new TextView(this);
            duaFa.setText("خدایا برای مولای ما حضرت صاحب‌الزمان (عج) برکت و گشایش قرار ده");
            duaFa.setTextColor(Color.parseColor("#D1FAE5"));
            duaFa.setTextSize(TypedValue.COMPLEX_UNIT_SP, 10);
            duaFa.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams duaFaLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            duaFaLp.topMargin = dp(6);
            duaCard.addView(duaFa, duaFaLp);

            LinearLayout.LayoutParams duaCardLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            duaCardLp.setMargins(dp(18), 0, dp(18), dp(16));
            bottomWrapper.addView(duaCard, duaCardLp);

            // نوار پیشرفت طلایی/زمردی متحرک
            final ProgressBar progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
            progressBar.setMax(100);
            progressBar.setProgress(12);
            GradientDrawable progTrack = new GradientDrawable();
            progTrack.setColor(Color.parseColor("#33FFFFFF"));
            progTrack.setCornerRadius(dp(6));
            GradientDrawable progFill = new GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                new int[]{ Color.parseColor("#10B981"), Color.parseColor("#FBBF24") }
            );
            progFill.setCornerRadius(dp(6));
            ClipDrawable progClip = new ClipDrawable(progFill, Gravity.START, ClipDrawable.HORIZONTAL);
            LayerDrawable progLayers = new LayerDrawable(new android.graphics.drawable.Drawable[]{ progTrack, progClip });
            progLayers.setId(0, android.R.id.background);
            progLayers.setId(1, android.R.id.progress);
            progressBar.setProgressDrawable(progLayers);
            LinearLayout.LayoutParams progLp = new LinearLayout.LayoutParams(dp(160), dp(5));
            progLp.bottomMargin = dp(18);
            bottomWrapper.addView(progressBar, progLp);

            FrameLayout.LayoutParams bottomLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
            );
            outerFrame.addView(bottomWrapper, bottomLp);

            root.addView(nativeSplashOverlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            ));

            // انیمیشن پر شدن نرم نوار پیشرفت از 12% تا 95%
            ValueAnimator animator = ValueAnimator.ofInt(12, 95);
            animator.setDuration(1800);
            animator.setInterpolator(new DecelerateInterpolator());
            animator.addUpdateListener(animation -> {
                if (!splashDismissed) {
                    progressBar.setProgress((Integer) animation.getAnimatedValue());
                }
            });
            animator.start();

            // بررسی آماده شدن کامل صفحه ری‌اکت در WebView برای محو کردن نرم صفحه آغازین
            pollWebViewReady(progressBar);
        } catch (Exception ignored) {}
    }

    private void pollWebViewReady(final ProgressBar progressBar) {
        final long startTime = System.currentTimeMillis();
        final Runnable checkTask = new Runnable() {
            @Override
            public void run() {
                if (splashDismissed) return;
                long elapsed = System.currentTimeMillis() - startTime;
                try {
                    WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                    if (wv != null && wv.getProgress() >= 100 && elapsed >= 900) {
                        dismissNativeSplash(progressBar);
                        return;
                    }
                } catch (Exception ignored) {}

                if (elapsed >= 2600) {
                    dismissNativeSplash(progressBar);
                } else {
                    handler.postDelayed(this, 120);
                }
            }
        };
        handler.postDelayed(checkTask, 300);
    }

    private void dismissNativeSplash(ProgressBar progressBar) {
        if (splashDismissed || nativeSplashOverlay == null) return;
        splashDismissed = true;
        try {
            progressBar.setProgress(100);
            ObjectAnimator fadeOut = ObjectAnimator.ofFloat(nativeSplashOverlay, View.ALPHA, 1f, 0f);
            fadeOut.setDuration(280);
            fadeOut.start();
            handler.postDelayed(() -> {
                try {
                    ViewGroup parent = (ViewGroup) nativeSplashOverlay.getParent();
                    if (parent != null) parent.removeView(nativeSplashOverlay);
                    nativeSplashOverlay = null;
                } catch (Exception ignored) {}
            }, 300);
        } catch (Exception ignored) {}
    }

    private void setupSystemBackGesture() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                try {
                    WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                    if (wv != null) {
                        wv.evaluateJavascript(
                                "(function(){ try { return window.__noorHandleNativeBack ? !!window.__noorHandleNativeBack() : false; } catch(e) { return false; } })()",
                                result -> {
                                    if ("true".equals(result)) {
                                        return;
                                    }
                                    handleRootBackExit();
                                }
                        );
                        return;
                    }
                } catch (Exception ignored) {}
                handleRootBackExit();
            }
        });
    }

    private void handleRootBackExit() {
        long now = System.currentTimeMillis();
        if (now - lastRootBackPressMs < 2000L) {
            moveTaskToBack(true);
        } else {
            lastRootBackPressMs = now;
            Toast.makeText(this, "برای خروج از نور، یک بار دیگر بازگشت را بزنید", Toast.LENGTH_SHORT).show();
        }
    }

    private void requestStartupNotificationPermission() {
        handler.postDelayed(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                            != PackageManager.PERMISSION_GRANTED) {
                        ActivityCompat.requestPermissions(
                                this,
                                new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                                9001
                        );
                    }
                }
            } catch (Exception ignored) {}
        }, 1400);
    }

}
