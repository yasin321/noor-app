package com.noor.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "NoorAlarm",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            }
        )
    }
)
public class NoorAlarmPlugin extends Plugin {

    @PluginMethod
    public void requestAndGetLocation(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationPermsCallback");
        } else {
            resolveBestLocation(call);
        }
    }

    @PermissionCallback
    private void locationPermsCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            resolveBestLocation(call);
        } else {
            call.reject("LOCATION_PERMISSION_DENIED");
        }
    }

    @SuppressWarnings("MissingPermission")
    private void resolveBestLocation(PluginCall call) {
        try {
            LocationManager lm = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
            Location best = null;
            if (lm != null) {
                for (String provider : lm.getProviders(true)) {
                    Location l = lm.getLastKnownLocation(provider);
                    if (l != null && (best == null || l.getAccuracy() < best.getAccuracy())) {
                        best = l;
                    }
                }
            }
            JSObject res = new JSObject();
            res.put("granted", true);
            if (best != null) {
                res.put("lat", best.getLatitude());
                res.put("lng", best.getLongitude());
                res.put("hasCoords", true);
            } else {
                res.put("hasCoords", false);
            }
            call.resolve(res);
        } catch (Exception e) {
            call.reject("LOCATION_ERROR: " + e.getMessage());
        }
    }

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
