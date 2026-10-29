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

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#04151F"));
        root.setPadding(72, 72, 72, 72);

        TextView badge = new TextView(this);
        badge.setText("🕌 همراه معنوی نور");
        badge.setTextColor(Color.parseColor("#34D399"));
        badge.setTextSize(20f);
        badge.setTypeface(Typeface.DEFAULT_BOLD);
        badge.setGravity(Gravity.CENTER);

        TextView title = new TextView(this);
        title.setText(titleText);
        title.setTextColor(Color.parseColor("#FEF08A"));
        title.setTextSize(30f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleParams.setMargins(0, 40, 0, 24);
        title.setLayoutParams(titleParams);

        TextView body = new TextView(this);
        body.setText(bodyText);
        body.setTextColor(Color.parseColor("#E2E8F0"));
        body.setTextSize(18f);
        body.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bodyParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        bodyParams.setMargins(0, 0, 0, 84);
        body.setLayoutParams(bodyParams);

        Button stopBtn = new Button(this);
        stopBtn.setText("⏹️ توقف اذان و بستن");
        stopBtn.setTextColor(Color.parseColor("#04151F"));
        stopBtn.setTextSize(18f);
        stopBtn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable stopBg = new GradientDrawable();
        stopBg.setColor(Color.parseColor("#FBBF24"));
        stopBg.setCornerRadius(48f);
        stopBtn.setBackground(stopBg);
        stopBtn.setPadding(64, 36, 64, 36);
        LinearLayout.LayoutParams stopParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        stopParams.setMargins(0, 0, 0, 28);
        stopBtn.setLayoutParams(stopParams);

        stopBtn.setOnClickListener(v -> {
            Intent stopIntent = new Intent(this, AdhanForegroundService.class);
            stopIntent.setAction(AdhanForegroundService.ACTION_STOP);
            startService(stopIntent);
            finishAndRemoveTask();
        });

        Button openAppBtn = new Button(this);
        openAppBtn.setText("🌿 ورود به اپلیکیشن نور");
        openAppBtn.setTextColor(Color.parseColor("#34D399"));
        openAppBtn.setTextSize(16f);
        openAppBtn.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable openBg = new GradientDrawable();
        openBg.setColor(Color.parseColor("#0F2922"));
        openBg.setStroke(3, Color.parseColor("#10B981"));
        openBg.setCornerRadius(48f);
        openAppBtn.setBackground(openBg);
        openAppBtn.setPadding(64, 32, 64, 32);
        LinearLayout.LayoutParams openParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        openAppBtn.setLayoutParams(openParams);

        openAppBtn.setOnClickListener(v -> {
            Intent stopIntent = new Intent(this, AdhanForegroundService.class);
            stopIntent.setAction(AdhanForegroundService.ACTION_STOP);
            startService(stopIntent);

            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(mainIntent);
            finish();
        });

        root.addView(badge);
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
