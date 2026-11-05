package com.noor.app;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private View nativeRoyalSplashView = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NoorAlarmPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            getWindow().setStatusBarColor(Color.parseColor("#071A16"));
            getWindow().setNavigationBarColor(Color.parseColor("#071A16"));

            FrameLayout rootLayout = (FrameLayout) getWindow().getDecorView().findViewById(android.R.id.content);
            if (rootLayout != null) {
                LinearLayout splash = new LinearLayout(this);
                splash.setOrientation(LinearLayout.VERTICAL);
                splash.setGravity(Gravity.CENTER);
                GradientDrawable bg = new GradientDrawable(
                        GradientDrawable.Orientation.TOP_BOTTOM,
                        new int[]{Color.parseColor("#0F3D33"), Color.parseColor("#071A16"), Color.parseColor("#030C0A")}
                );
                splash.setBackground(bg);
                splash.setPadding(56, 80, 56, 80);

                TextView bismillah = new TextView(this);
                bismillah.setText("بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ");
                bismillah.setTextColor(Color.parseColor("#FDE68A"));
                bismillah.setTextSize(15f);
                bismillah.setTypeface(Typeface.SERIF, Typeface.BOLD);
                bismillah.setGravity(Gravity.CENTER);
                GradientDrawable pillBg = new GradientDrawable();
                pillBg.setColor(Color.parseColor("#113E33"));
                pillBg.setStroke(2, Color.parseColor("#66FBBF24"));
                pillBg.setCornerRadius(99f);
                bismillah.setBackground(pillBg);
                bismillah.setPadding(48, 18, 48, 18);

                TextView emblem = new TextView(this);
                emblem.setText("🕌");
                emblem.setTextSize(64f);
                emblem.setGravity(Gravity.CENTER);
                LinearLayout.LayoutParams emParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                emParams.setMargins(0, 56, 0, 20);
                emblem.setLayoutParams(emParams);

                TextView appTitle = new TextView(this);
                appTitle.setText("همراه معنوی نور");
                appTitle.setTextColor(Color.parseColor("#ECFDF5"));
                appTitle.setTextSize(28f);
                appTitle.setTypeface(Typeface.DEFAULT_BOLD);
                appTitle.setGravity(Gravity.CENTER);

                TextView appSub = new TextView(this);
                appSub.setText("اوقات شرعی · مصحف عثمان طه · آب‌وهوا و مسجدیاب");
                appSub.setTextColor(Color.parseColor("#6EE7B7"));
                appSub.setTextSize(12f);
                appSub.setTypeface(Typeface.DEFAULT_BOLD);
                appSub.setGravity(Gravity.CENTER);
                LinearLayout.LayoutParams subParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                subParams.setMargins(0, 10, 0, 56);
                appSub.setLayoutParams(subParams);

                LinearLayout duaCard = new LinearLayout(this);
                duaCard.setOrientation(LinearLayout.VERTICAL);
                duaCard.setGravity(Gravity.CENTER);
                GradientDrawable cardBg = new GradientDrawable();
                cardBg.setColor(Color.parseColor("#0D2E26"));
                cardBg.setStroke(3, Color.parseColor("#99FBBF24"));
                cardBg.setCornerRadius(48f);
                duaCard.setBackground(cardBg);
                duaCard.setPadding(52, 48, 52, 48);

                TextView duaArabic = new TextView(this);
                duaArabic.setText("اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ (عج)");
                duaArabic.setTextColor(Color.parseColor("#FEF08A"));
                duaArabic.setTextSize(21f);
                duaArabic.setTypeface(Typeface.SERIF, Typeface.BOLD);
                duaArabic.setGravity(Gravity.CENTER);

                TextView duaFa = new TextView(this);
                duaFa.setText("خدایا برای مولای ما حضرت صاحب‌الزمان (عج) برکت و گشایش قرار ده");
                duaFa.setTextColor(Color.parseColor("#D1FAE5"));
                duaFa.setTextSize(12f);
                duaFa.setGravity(Gravity.CENTER);
                LinearLayout.LayoutParams faParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
                faParams.setMargins(0, 18, 0, 0);
                duaFa.setLayoutParams(faParams);

                duaCard.addView(duaArabic);
                duaCard.addView(duaFa);

                splash.addView(bismillah);
                splash.addView(emblem);
                splash.addView(appTitle);
                splash.addView(appSub);
                splash.addView(duaCard);

                rootLayout.addView(splash, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                nativeRoyalSplashView = splash;
            }

            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setBackgroundColor(Color.parseColor("#071A16"));
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                WebSettings ws = webView.getSettings();
                ws.setCacheMode(WebSettings.LOAD_DEFAULT);
                ws.setDomStorageEnabled(true);
                ws.setDatabaseEnabled(true);
                ws.setRenderPriority(WebSettings.RenderPriority.HIGH);
            }

            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (nativeRoyalSplashView != null) {
                    nativeRoyalSplashView.animate()
                            .alpha(0f)
                            .setDuration(420)
                            .withEndAction(() -> {
                                if (nativeRoyalSplashView != null && nativeRoyalSplashView.getParent() instanceof ViewGroup) {
                                    ((ViewGroup) nativeRoyalSplashView.getParent()).removeView(nativeRoyalSplashView);
                                    nativeRoyalSplashView = null;
                                }
                            })
                            .start();
                }
            }, 2200);
        } catch (Exception ignored) {}
    }
}
