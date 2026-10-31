package com.noor.app;

import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class AdhanAlarmActivity extends AppCompatActivity {
    public static final String ACTION_CLOSE_UI = "com.noor.app.ACTION_CLOSE_ALARM_UI";

    private final BroadcastReceiver closeReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            finishAndRemoveTask();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        turnScreenOnAndUnlock();

        String titleText = getIntent() != null && getIntent().getStringExtra("title") != null
                ? getIntent().getStringExtra("title")
                : "وقت اذان و نیایش";
        String bodyText = getIntent() != null && getIntent().getStringExtra("body") != null
                ? getIntent().getStringExtra("body")
                : "حَیَّ عَلَی الصَّلَاة — وقت فضیلت نماز فرا رسیده است";

        boolean isPreAdhan = titleText.contains("مانده تا اذان") || titleText.contains("دقیقه تا اذان") || titleText.contains("پیش از اذان");
        boolean isPostAdhan = titleText.contains("پس از اذان") || titleText.contains("بعد از اذان") || titleText.contains("تعقیبات");

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor(isPreAdhan ? "#081C24" : isPostAdhan ? "#0F172A" : "#04151F"));
        root.setPadding(64, 64, 64, 64);

        TextView badge = new TextView(this);
        badge.setText(isPreAdhan ? "🔔 یادآور و ذکر پیش از اذان" : isPostAdhan ? "📿 تعقیبات و اعمال پس از نماز" : "🕌 همراه معنوی نور — وقت اذان");
        badge.setTextColor(Color.parseColor(isPreAdhan ? "#38BDF8" : isPostAdhan ? "#A78BFA" : "#34D399"));
        badge.setTextSize(18f);
        badge.setTypeface(Typeface.DEFAULT_BOLD);
        badge.setGravity(Gravity.CENTER);

        TextView eqIndicator = new TextView(this);
        eqIndicator.setText(isPreAdhan ? "ılılı در حال پخش تلاوت و ذکر پیش از اذان ılılı" : isPostAdhan ? "ılılı در حال پخش یادآور تعقیبات نماز ılılı" : "ılılı در حال پخش صدای مؤذن انتخابی شما ılılı");
        eqIndicator.setTextColor(Color.parseColor("#A7F3D0"));
        eqIndicator.setTextSize(13f);
        eqIndicator.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams eqParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        eqParams.setMargins(0, 14, 0, 22);
        eqIndicator.setLayoutParams(eqParams);

        TextView title = new TextView(this);
        title.setText(titleText);
        title.setTextColor(Color.parseColor("#FEF08A"));
        title.setTextSize(24f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleParams.setMargins(0, 10, 0, 26);
        title.setLayoutParams(titleParams);

        TextView body = new TextView(this);
        body.setText(bodyText);
        body.setTextColor(Color.parseColor("#FFFFFF"));
        body.setTextSize(18.5f);
        body.setTypeface(Typeface.DEFAULT_BOLD);
        body.setGravity(Gravity.CENTER);
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(Color.parseColor("#112E38"));
        cardBg.setStroke(3, Color.parseColor(isPreAdhan ? "#38BDF8" : isPostAdhan ? "#A78BFA" : "#10B981"));
        cardBg.setCornerRadius(36f);
        body.setBackground(cardBg);
        body.setPadding(42, 42, 42, 42);
        LinearLayout.LayoutParams bodyParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        bodyParams.setMargins(0, 0, 0, 56);
        body.setLayoutParams(bodyParams);

        Button stopBtn = new Button(this);
        stopBtn.setText("⏹️ توقف کامل صدا و بستن");
        stopBtn.setTextColor(Color.parseColor("#04151F"));
        stopBtn.setTextSize(17f);
        stopBtn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable stopBg = new GradientDrawable();
        stopBg.setColor(Color.parseColor("#FBBF24"));
        stopBg.setCornerRadius(48f);
        stopBtn.setBackground(stopBg);
        stopBtn.setPadding(60, 34, 60, 34);
        LinearLayout.LayoutParams stopParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        stopParams.setMargins(0, 0, 0, 22);
        stopBtn.setLayoutParams(stopParams);

        stopBtn.setOnClickListener(v -> {
            AdhanForegroundService.killActivePlayer(this);
            Intent stopIntent = new Intent(this, AdhanForegroundService.class);
            stopIntent.setAction(AdhanForegroundService.ACTION_STOP);
            startService(stopIntent);
            finishAndRemoveTask();
        });

        Button openAppBtn = new Button(this);
        openAppBtn.setText("🌿 باز کردن اپلیکیشن نور");
        openAppBtn.setTextColor(Color.parseColor("#34D399"));
        openAppBtn.setTextSize(15f);
        openAppBtn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable openBg = new GradientDrawable();
        openBg.setColor(Color.parseColor("#0F2922"));
        openBg.setStroke(3, Color.parseColor("#10B981"));
        openBg.setCornerRadius(48f);
        openAppBtn.setBackground(openBg);
        openAppBtn.setPadding(60, 28, 60, 28);
        LinearLayout.LayoutParams openParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        openAppBtn.setLayoutParams(openParams);

        openAppBtn.setOnClickListener(v -> {
            AdhanForegroundService.killActivePlayer(this);
            Intent stopIntent = new Intent(this, AdhanForegroundService.class);
            stopIntent.setAction(AdhanForegroundService.ACTION_STOP);
            startService(stopIntent);

            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(mainIntent);
            finish();
        });

        root.addView(badge);
        root.addView(eqIndicator);
        root.addView(title);
        root.addView(body);
        root.addView(stopBtn);
        root.addView(openAppBtn);
        setContentView(root);

        IntentFilter filter = new IntentFilter(ACTION_CLOSE_UI);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(closeReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(closeReceiver, filter);
        }
    }

    private void turnScreenOnAndUnlock() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        }
        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_FULLSCREEN
        );
    }

    @Override
    protected void onDestroy() {
        try {
            unregisterReceiver(closeReceiver);
        } catch (Exception ignored) {}
        super.onDestroy();
    }
}