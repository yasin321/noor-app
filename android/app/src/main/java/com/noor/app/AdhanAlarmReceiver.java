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

        // ۱. اگر رویداد ریستارت گوشی، آپدیت برنامه یا تغییر ساعت بود، تمام آلارم‌های آینده را در AlarmManager بازنشانی کن
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
                Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action) ||
                "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
                Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
                "android.intent.action.TIME_SET".equals(action) ||
                Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            NoorAlarmPlugin.restorePersistedAlarms(context);
            return;
        }

        // ۲. اگر دستور توقف آلارم بود
        if (ACTION_STOP.equals(action) || AdhanForegroundService.ACTION_STOP.equals(action)) {
            AdhanForegroundService.killActivePlayer(context);
            Intent stopService = new Intent(context, AdhanForegroundService.class);
            stopService.setAction(AdhanForegroundService.ACTION_STOP);
            context.stopService(stopService);
            context.sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
            return;
        }

        // ۳. اجرای آلارم اذان، پیش از اذان یا تعقیبات (حتی اگر action خالی باشد ولی دارای title یا id باشد)
        if (ACTION_TRIGGER.equals(action) || intent.hasExtra("title") || intent.hasExtra("id")) {
            // گرفتن WakeLock فوری ۱۰ ثانیه‌ای برای تضمین بالا آمدن سرویس روی صفحه قفل خاموش
            try {
                PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    PowerManager.WakeLock wl = pm.newWakeLock(
                            PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                            "noor:ReceiverTransitionWakeLock"
                    );
                    wl.acquire(10000L);
                }
            } catch (Exception ignored) {}

            int alarmId = intent.getIntExtra("id", -1);
            if (alarmId != -1) {
                NoorAlarmPlugin.removePersistedAlarm(context, alarmId);
            }

            Intent serviceIntent = new Intent(context, AdhanForegroundService.class);
            serviceIntent.putExtra("title", intent.getStringExtra("title"));
            serviceIntent.putExtra("body", intent.getStringExtra("body"));
            serviceIntent.putExtra("soundType", intent.getStringExtra("soundType"));
            serviceIntent.putExtra("adhanId", intent.getStringExtra("adhanId"));
            serviceIntent.putExtra("durationSeconds", intent.getIntExtra("durationSeconds", 0));
            serviceIntent.putExtra("volumePercent", intent.getIntExtra("volumePercent", 100));

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}
