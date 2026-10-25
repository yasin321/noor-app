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
                : "اذان و یادآوری نور";
        String bodyText = getIntent() != null && getIntent().getStringExtra("body") != null
                ? getIntent().getStringExtra("body")
                : "حَیَّ عَلَی الصَّلَاة — وقت آرامش و نیایش";

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#062E22"));
        root.setPadding(72, 72, 72, 72);

        TextView badge = new TextView(this);
        badge.setText("🌿 اپلیکیشن نور");
        badge.setTextColor(Color.parseColor("#34D399"));
        badge.setTextSize(18f);
        badge.setGravity(Gravity.CENTER);

        TextView title = new TextView(this);
        title.setText(titleText);
        title.setTextColor(Color.parseColor("#FEF3C7"));
        title.setTextSize(32f);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleParams.setMargins(0, 36, 0, 24);
        title.setLayoutParams(titleParams);

        TextView body = new TextView(this);
        body.setText(bodyText);
        body.setTextColor(Color.parseColor("#D1FAE5"));
        body.setTextSize(18f);
        body.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams bodyParams = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        );
        bodyParams.setMargins(0, 0, 0, 96);
        body.setLayoutParams(bodyParams);

        Button stopBtn = new Button(this);
        stopBtn.setText("توقف صدا و بستن صفحه");
        stopBtn.setTextColor(Color.parseColor("#062E22"));
        stopBtn.setTextSize(18f);
        stopBtn.setTypeface(Typeface.DEFAULT_BOLD);

        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.parseColor("#FBBF24"));
        btnBg.setCornerRadius(48f);
        stopBtn.setBackground(btnBg);
        stopBtn.setPadding(64, 36, 64, 36);

        stopBtn.setOnClickListener(v -> {
            Intent stopIntent = new Intent(this, AdhanForegroundService.class);
            stopIntent.setAction(AdhanForegroundService.ACTION_STOP);
            startService(stopIntent);
            finishAndRemoveTask();
        });

        root.addView(badge);
        root.addView(title);
        root.addView(body);
        root.addView(stopBtn);
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
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
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
