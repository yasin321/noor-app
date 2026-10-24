package com.noor.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

@CapacitorPlugin(name = "NoorAlarm")
public class NoorAlarmPlugin extends Plugin {
    @PluginMethod
    public void schedule(PluginCall call) {
        String id = call.getString("id");
        String title = call.getString("title", "اذان");
        String audioUrl = call.getString("audioUrl");
        Long at = call.getLong("at");
        if (id == null || id.trim().isEmpty() || at == null || at <= System.currentTimeMillis()
                || audioUrl == null || !audioUrl.startsWith("https://")) {
            call.reject("شناسه، زمان آینده و نشانی امن فایل اذان لازم است", "INVALID_ALARM");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager manager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (manager == null || !manager.canScheduleExactAlarms()) {
                call.reject("اجازه آلارم دقیق اندروید فعال نیست", "EXACT_ALARM_PERMISSION_REQUIRED");
                return;
            }
        }
        try {
            JSONObject data = new JSONObject();
            data.put("id", id);
            data.put("title", title);
            data.put("audioUrl", audioUrl);
            data.put("at", at);
            getContext().getSharedPreferences("noor_prayer_alarms", Context.MODE_PRIVATE)
                    .edit().putString(id, data.toString()).apply();
            scheduleStoredAlarm(getContext(), data);
            call.resolve();
        } catch (Exception e) {
            call.reject("زمان‌بندی اذان انجام نشد: " + e.getMessage(), "SCHEDULE_FAILED");
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.trim().isEmpty()) {
            call.reject("شناسه آلارم لازم است");
            return;
        }
        cancelStoredAlarm(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences("noor_prayer_alarms", Context.MODE_PRIVATE);
        for (String id : prefs.getAll().keySet()) cancelStoredAlarm(context, id);
        call.resolve();
    }

    static void scheduleStoredAlarm(Context context, JSONObject data) throws Exception {
        long at = data.getLong("at");
        if (at <= System.currentTimeMillis()) return;
        String id = data.getString("id");
        Intent intent = new Intent(context, PrayerAdhanReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("title", data.optString("title", "اذان"));
        intent.putExtra("audioUrl", data.getString("audioUrl"));
        PendingIntent pending = PendingIntent.getBroadcast(context, id.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager == null) throw new IllegalStateException("AlarmManager unavailable");
        AlarmManager.AlarmClockInfo info = new AlarmManager.AlarmClockInfo(at, pending);
        manager.setAlarmClock(info, pending);
    }

    static void cancelStoredAlarm(Context context, String id) {
        Intent intent = new Intent(context, PrayerAdhanReceiver.class);
        PendingIntent pending = PendingIntent.getBroadcast(context, id.hashCode(), intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (manager != null) manager.cancel(pending);
        context.getSharedPreferences("noor_prayer_alarms", Context.MODE_PRIVATE).edit().remove(id).apply();
    }

    @PluginMethod
    public void checkFullScreenAccess(PluginCall call) {
        boolean allowed = true;
        if (Build.VERSION.SDK_INT >= 34) {
            android.app.NotificationManager manager =
                (android.app.NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            allowed = manager != null && manager.canUseFullScreenIntent();
        }
        com.getcapacitor.JSObject result = new com.getcapacitor.JSObject();
        result.put("allowed", allowed);
        call.resolve(result);
    }

    @PluginMethod
    public void openFullScreenSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 34) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
            intent.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }
}