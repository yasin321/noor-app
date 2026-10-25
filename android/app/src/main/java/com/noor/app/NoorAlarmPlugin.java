package com.noor.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NoorAlarm")
public class NoorAlarmPlugin extends Plugin {

    @PluginMethod
    public void scheduleNativeAlarm(PluginCall call) {
        Integer id = call.getInt("id", 1001);
        Long triggerAtMillis = call.getLong("triggerAtMillis", 0L);
        String title = call.getString("title", "یادآوری نور");
        String body = call.getString("body", "وقت ذکر و آرامش");
        String soundType = call.getString("soundType", "adhan");

        if (triggerAtMillis == null || triggerAtMillis <= System.currentTimeMillis()) {
            call.reject("Invalid triggerAtMillis");
            return;
        }

        Context context = getContext();
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) {
            call.reject("AlarmManager unavailable");
            return;
        }

        Intent intent = new Intent(context, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_TRIGGER);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("soundType", soundType);

        PendingIntent operation = PendingIntent.getBroadcast(
                context,
                id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent showIntent = new Intent(context, MainActivity.class);
        PendingIntent showPending = PendingIntent.getActivity(
                context,
                id,
                showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(triggerAtMillis, showPending);
        am.setAlarmClock(clockInfo, operation);

        JSObject res = new JSObject();
        res.put("scheduled", true);
        call.resolve(res);
    }

    @PluginMethod
    public void cancelNativeAlarm(PluginCall call) {
        Integer id = call.getInt("id", 1001);
        Context context = getContext();
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        Intent intent = new Intent(context, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_TRIGGER);

        PendingIntent operation = PendingIntent.getBroadcast(
                context,
                id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (am != null) am.cancel(operation);
        operation.cancel();
        call.resolve();
    }

    @PluginMethod
    public void triggerTestAlarmNow(PluginCall call) {
        Context context = getContext();
        String title = call.getString("title", "اذان ظهر به افق شهر شما");
        String body = call.getString("body", "حَیَّ عَلَی الصَّلَاة — تست پخش اذان و باز شدن صفحه قفل");
        Intent intent = new Intent(context, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_TRIGGER);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("soundType", "adhan");
        context.sendBroadcast(intent);
        call.resolve();
    }
}
