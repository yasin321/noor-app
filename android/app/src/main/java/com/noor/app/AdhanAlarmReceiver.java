package com.noor.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;

public class AdhanAlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_TRIGGER = "com.noor.app.ACTION_TRIGGER_ADHAN_ALARM";
    public static final String ACTION_STOP = "com.noor.app.ACTION_STOP_ADHAN_ALARM";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        // ۱. بازیابی تمام آلارم‌های آینده پس از ریستارت گوشی، آپدیت برنامه یا تغییر ساعت
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) ||
                "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
                Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
                "android.intent.action.TIME_SET".equals(action) ||
                Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            NoorAlarmPlugin.restorePersistedAlarms(context);
            return;
        }

        // ۲. توقف فوری اذان/سوره و بستن صفحه آلارم (از دکمه نوتیفیکیشن یا کلیدهای سخت‌افزاری)
        if (ACTION_STOP.equals(action) || AdhanForegroundService.ACTION_STOP.equals(action)) {
            AdhanForegroundService.killActivePlayer(context);
            Intent stopService = new Intent(context, AdhanForegroundService.class);
            stopService.setAction(AdhanForegroundService.ACTION_STOP);
            try {
                context.stopService(stopService);
            } catch (Exception ignored) {}
            Intent closeUi = new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI);
            closeUi.setPackage(context.getPackageName());
            context.sendBroadcast(closeUi);
            return;
        }

        // ۳. اجرای آلارم اذان، تواشیح یا تلاوت سوره
        if (ACTION_TRIGGER.equals(action) || intent.hasExtra("title") || intent.hasExtra("id")) {
            // نکته حیاتی اندروید ۱۴ و ۱۵: فقط PARTIAL_WAKE_LOCK می‌گیریم تا نمایشگر پیش از ثبت FullScreenIntent روشن نشود
            try {
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    PowerManager.WakeLock wl = pm.newWakeLock(
                            PowerManager.PARTIAL_WAKE_LOCK,
                            "noor:ReceiverTransitionWakeLock"
                    );
                    wl.acquire(10_000L);
                }
            } catch (Exception ignored) {}

            int alarmId = intent.getIntExtra("id", -1);
            if (alarmId >= 73001 && alarmId <= 73114) {
                NoorAlarmPlugin.rescheduleDailyAlarmTomorrow(context, alarmId);
            } else if (alarmId != -1) {
                NoorAlarmPlugin.removePersistedAlarm(context, alarmId);
            }

            Intent serviceIntent = new Intent(context, AdhanForegroundService.class);
            serviceIntent.putExtra("title", intent.getStringExtra("title"));
            serviceIntent.putExtra("body", intent.getStringExtra("body"));
            serviceIntent.putExtra("soundType", intent.getStringExtra("soundType"));
            serviceIntent.putExtra("adhanId", intent.getStringExtra("adhanId"));
            serviceIntent.putExtra("audioUrl", intent.getStringExtra("audioUrl"));
            serviceIntent.putExtra("durationSeconds", intent.getIntExtra("durationSeconds", 0));
            serviceIntent.putExtra("playbackRate", intent.getFloatExtra("playbackRate", 1.0f));
            serviceIntent.putExtra("volumePercent", intent.getIntExtra("volumePercent", 100));

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
