package com.noor.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.content.Intent;

public class PrayerAdhanActivity extends Activity {
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);

        String title = getIntent().getStringExtra("title");
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(android.view.Gravity.CENTER);
        layout.setPadding(32, 32, 32, 32);
        layout.setBackgroundColor(0xFF102A24);

        TextView heading = new TextView(this);
        heading.setText(title == null ? "وقت اذان" : title);
        heading.setTextColor(0xFFFFFFFF);
        heading.setTextSize(30);
        heading.setGravity(android.view.Gravity.CENTER);
        layout.addView(heading, new LinearLayout.LayoutParams(-1, -2));

        TextView subtitle = new TextView(this);
        subtitle.setText("اذان در حال پخش است");
        subtitle.setTextColor(0xFFD9C38A);
        subtitle.setTextSize(18);
        subtitle.setGravity(android.view.Gravity.CENTER);
        LinearLayout.LayoutParams subtitleParams = new LinearLayout.LayoutParams(-1, -2);
        subtitleParams.topMargin = 24;
        layout.addView(subtitle, subtitleParams);

        Button stop = new Button(this);
        stop.setText("توقف اذان");
        stop.setOnClickListener(v -> {
            Intent service = new Intent(this, PrayerAdhanService.class);
            service.setAction(PrayerAdhanService.ACTION_STOP);
            startService(service);
            finish();
        });
        LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(-1, -2);
        buttonParams.topMargin = 48;
        layout.addView(stop, buttonParams);
        setContentView(layout);
    }
}