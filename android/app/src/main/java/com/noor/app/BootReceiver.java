package com.noor.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class BootReceiver extends BroadcastReceiver {
    private static final String TAG = "NoorBootReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
                Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(intent.getAction()) ||
                "android.intent.action.QUICKBOOT_POWERON".equals(intent.getAction()))) {
            Log.i(TAG, "گوشی ریستارت شد؛ در حال فعال‌سازی مجدد سرویس‌های اذان نور...");
            try {
                // بیدار کردن سرویس پس‌زمینه برای بارگذاری مجدد تنظیمات و آلارم‌ها
                Intent serviceIntent = new Intent(context, AdhanForegroundService.class);
                serviceIntent.setAction("ACTION_RESTORE_ALARMS");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            } catch (Exception e) {
                Log.e(TAG, "خطا در بازیابی آلارم‌ها پس از ریستارت: " + e.getMessage());
            }
        }
    }
}
