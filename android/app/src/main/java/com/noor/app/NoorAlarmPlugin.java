package com.noor.app;

import android.Manifest;
import android.os.VibratorManager;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.media.AudioTrack;
import android.media.AudioFormat;
import android.media.AudioAttributes;
import android.app.AlarmManager;
import android.hardware.SensorManager;
import android.hardware.SensorEventListener;
import android.hardware.SensorEvent;
import android.hardware.Sensor;
import android.hardware.GeomagneticField;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.Looper;
import android.provider.Settings;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PermissionState;
import com.google.android.gms.location.CurrentLocationRequest;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.Granularity;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.CancellationTokenSource;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.json.JSONObject;

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
    public static final String ALARM_STORE_PREFS = "noor_native_alarms_store_v1";

    // متد مرکزی ثبت آلارم در سیستم‌عامل اندروید (هم از داخل اپ و هم پس از ریستارت گوشی)
    public static void scheduleExactWithSystem(
            Context ctx,
            int alarmId,
            long targetTime,
            String title,
            String body,
            String soundType,
            String adhanId,
            int durationSeconds,
            int volumePercent
    ) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        Intent intent = new Intent(ctx, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_TRIGGER);
        intent.setData(Uri.parse("noor://alarm/" + alarmId));
        intent.putExtra("id", alarmId);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("soundType", soundType);
        intent.putExtra("adhanId", adhanId);
        intent.putExtra("durationSeconds", durationSeconds);
        intent.putExtra("volumePercent", volumePercent);
        SharedPreferences sp = ctx.getSharedPreferences(ALARM_STORE_PREFS, Context.MODE_PRIVATE);
        float savedRate = sp.getFloat("rate_" + alarmId, 1.0f);
        String savedAudioUrl = sp.getString("audioUrl_" + alarmId, "");
        intent.putExtra("playbackRate", savedRate);
        intent.putExtra("audioUrl", savedAudioUrl);

        PendingIntent pi = PendingIntent.getBroadcast(
                ctx,
                alarmId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Intent showIntent = new Intent(ctx, MainActivity.class);
                PendingIntent showPi = PendingIntent.getActivity(
                        ctx,
                        alarmId,
                        showIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(targetTime, showPi);
                am.setAlarmClock(clockInfo, pi);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, targetTime, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, targetTime, pi);
            }
        } catch (SecurityException se) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, targetTime, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, targetTime, pi);
            }
        }
    }

    // بازیابی خودکار تمام آلارم‌های آینده از حافظه دائم نیتیو بلافاصله پس از روشن شدن یا ریستارت گوشی
    public static void restorePersistedAlarms(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(ALARM_STORE_PREFS, Context.MODE_PRIVATE);
            Map<String, ?> all = prefs.getAll();
            if (all == null || all.isEmpty()) return;
            long now = System.currentTimeMillis();
            SharedPreferences.Editor editor = prefs.edit();
            for (Map.Entry<String, ?> entry : all.entrySet()) {
                if (!entry.getKey().startsWith("alarm_")) continue;
                try {
                    String rawJson = String.valueOf(entry.getValue());
                    JSONObject obj = new JSONObject(rawJson);
                    int id = obj.optInt("id", -1);
                    long triggerAt = obj.optLong("triggerAtMillis", 0L);
                    if (id == -1 || triggerAt <= now) {
                        editor.remove(entry.getKey());
                        continue;
                    }
                    scheduleExactWithSystem(
                            ctx,
                            id,
                            triggerAt,
                            obj.optString("title", "وقت اذان و نیایش"),
                            obj.optString("body", "حَیَّ عَلَی الصَّلَاة"),
                            obj.optString("soundType", "adhan"),
                            obj.optString("adhanId", "ahlolbait_30"),
                            obj.optInt("durationSeconds", 0),
                            obj.optInt("volumePercent", 100)
                    );
                } catch (Exception ignored) {}
            }
            editor.apply();
        } catch (Exception ignored) {}
    }

    // تکرار خودکار روزانه آلارم سوره‌های قرآن برای ۲۴ ساعت بعد (حتی بدون باز کردن اپلیکیشن)
    public static void rescheduleDailyAlarmTomorrow(Context ctx, int alarmId) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(ALARM_STORE_PREFS, Context.MODE_PRIVATE);
            String rawJson = prefs.getString("alarm_" + alarmId, null);
            if (rawJson == null || rawJson.isEmpty()) return;
            JSONObject obj = new JSONObject(rawJson);
            long prevTrigger = obj.optLong("triggerAtMillis", System.currentTimeMillis());
            long nextTrigger = prevTrigger + (24L * 60L * 60L * 1000L);
            long now = System.currentTimeMillis();
            while (nextTrigger <= now + 60_000L) {
                nextTrigger += (24L * 60L * 60L * 1000L);
            }
            obj.put("triggerAtMillis", nextTrigger);
            prefs.edit().putString("alarm_" + alarmId, obj.toString()).apply();

            scheduleExactWithSystem(
                    ctx,
                    alarmId,
                    nextTrigger,
                    obj.optString("title", "تلاوت قرآن کریم"),
                    obj.optString("body", "وقت تلاوت روزانه سوره"),
                    obj.optString("soundType", "surah_chant"),
                    obj.optString("adhanId", "full_surah_056"),
                    obj.optInt("durationSeconds", 0),
                    obj.optInt("volumePercent", 100)
            );
        } catch (Exception ignored) {}
    }

    public static void removePersistedAlarm(Context ctx, int alarmId) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(ALARM_STORE_PREFS, Context.MODE_PRIVATE);
            prefs.edit().remove("alarm_" + alarmId).apply();
        } catch (Exception ignored) {}
    }

    @PluginMethod
    public void scheduleNativeAlarm(PluginCall call) {
        Integer idObj = call.getInt("id", 1001);
        int alarmId = idObj != null ? idObj : 1001;
        Long triggerAtMillis = call.getLong("triggerAtMillis", System.currentTimeMillis() + 5000L);
        long targetTime = triggerAtMillis != null ? triggerAtMillis : System.currentTimeMillis() + 5000L;
        String title = call.getString("title", "وقت اذان و نیایش");
        String body = call.getString("body", "حَیَّ عَلَی الصَّلَاة");
        String soundType = call.getString("soundType", "adhan");
        String adhanId = call.getString("adhanId", "ahlolbait_30");
        String audioUrl = call.getString("audioUrl", "");
        Integer durationObj = call.getInt("durationSeconds", 0);
        int durationSeconds = durationObj != null ? durationObj : 0;
        Float rateObj = call.getFloat("playbackRate", 1.0f);
        float reqRate = rateObj != null ? rateObj : 1.0f;
        getContext().getSharedPreferences(ALARM_STORE_PREFS, Context.MODE_PRIVATE)
            .edit()
            .putFloat("rate_" + alarmId, reqRate)
            .putFloat("last_playback_rate", reqRate)
            .putString("audioUrl_" + alarmId, audioUrl != null ? audioUrl : "")
            .apply();
        Integer volumeObj = call.getInt("volumePercent", 100);
        int volumePercent = volumeObj != null ? volumeObj : 100;

        Context ctx = getContext();

        // ۱. ذخیره در حافظه دائم نیتیو برای بازیابی خودکار پس از ریستارت گوشی
        try {
            JSONObject record = new JSONObject();
            record.put("id", alarmId);
            record.put("triggerAtMillis", targetTime);
            record.put("title", title);
            record.put("body", body);
            record.put("soundType", soundType);
            record.put("adhanId", adhanId);
            record.put("audioUrl", audioUrl != null ? audioUrl : "");
            record.put("durationSeconds", durationSeconds);
            record.put("volumePercent", volumePercent);
            SharedPreferences prefs = ctx.getSharedPreferences(ALARM_STORE_PREFS, Context.MODE_PRIVATE);
            prefs.edit().putString("alarm_" + alarmId, record.toString()).apply();
        } catch (Exception ignored) {}

        // ۲. ثبت در AlarmManager هسته اندروید با اکشن صریح ACTION_TRIGGER
        scheduleExactWithSystem(ctx, alarmId, targetTime, title, body, soundType, adhanId, durationSeconds, volumePercent);

        JSObject ret = new JSObject();
        ret.put("scheduled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelNativeAlarm(PluginCall call) {
        Integer idObj = call.getInt("id", 1001);
        int alarmId = idObj != null ? idObj : 1001;
        Context ctx = getContext();
        removePersistedAlarm(ctx, alarmId);

        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(ctx, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_TRIGGER);
        intent.setData(Uri.parse("noor://alarm/" + alarmId));
        PendingIntent pi = PendingIntent.getBroadcast(
                ctx,
                alarmId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        if (am != null) {
            am.cancel(pi);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopActiveAlarm(PluginCall call) {
        Context ctx = getContext();
        AdhanForegroundService.killActivePlayer(ctx);
        Intent stopIntent = new Intent(ctx, AdhanForegroundService.class);
        stopIntent.setAction(AdhanForegroundService.ACTION_STOP);
        ctx.startService(stopIntent);
        call.resolve();
    }

    @PluginMethod
    public void openBatteryOptimizationSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    Intent direct = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    direct.setData(Uri.parse("package:" + ctx.getPackageName()));
                    direct.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(direct);
                    call.resolve();
                    return;
                } catch (Exception ignored) {}
            }
            Intent intent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void updatePrayerWidget(PluginCall call) {
        String nextPrayerText = call.getString("nextPrayerText", "همراه معنوی نور");
        String subtitleText = call.getString("subtitleText", "اوقات شرعی و ذکر روزانه");
        String titleText = call.getString("titleText", "📍 افق شهر شما");
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences("noor_widget_prefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor ed = prefs.edit();
        if (call.getString("fajr") != null) ed.putString("fajr", call.getString("fajr"));
        if (call.getString("sunrise") != null) ed.putString("sunrise", call.getString("sunrise"));
        if (call.getString("dhuhr") != null) ed.putString("dhuhr", call.getString("dhuhr"));
        if (call.getString("maghrib") != null) ed.putString("maghrib", call.getString("maghrib"));
        if (call.getString("midnight") != null) ed.putString("midnight", call.getString("midnight"));
        ed.apply();
        NoorPrayerWidgetProvider.pushWidgetUpdate(ctx, titleText, nextPrayerText, subtitleText);
        call.resolve();
    }

    @PluginMethod
    public void requestAndGetLocation(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationPermCallback");
        } else {
            fetchFusedHighAccuracyLocation(call);
        }
    }

    @PermissionCallback
    private void locationPermCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            fetchFusedHighAccuracyLocation(call);
        } else {
            JSObject ret = new JSObject();
            ret.put("hasCoords", false);
            call.resolve(ret);
        }
    }

    private String getOfflineAndroidAddress(Context ctx, double lat, double lng) {
        try {
            Geocoder geocoder = new Geocoder(ctx, new Locale("fa", "IR"));
            List<Address> addresses = geocoder.getFromLocation(lat, lng, 1);
            if (addresses != null && !addresses.isEmpty()) {
                Address a = addresses.get(0);
                StringBuilder sb = new StringBuilder();
                if (a.getLocality() != null) sb.append(a.getLocality());
                if (a.getSubLocality() != null) {
                    if (sb.length() > 0) sb.append("، ");
                    sb.append(a.getSubLocality());
                }
                if (a.getThoroughfare() != null) {
                    if (sb.length() > 0) sb.append("، ");
                    sb.append(a.getThoroughfare());
                }
                if (sb.length() > 0) return sb.toString();
                if (a.getAddressLine(0) != null) return a.getAddressLine(0);
            }
        } catch (Exception ignored) {}
        return "";
    }

    private void resolveWithLocation(PluginCall call, Context ctx, Location loc, String providerName) {
        JSObject ret = new JSObject();
        ret.put("hasCoords", true);
        ret.put("lat", loc.getLatitude());
        ret.put("lng", loc.getLongitude());
        ret.put("accuracy", loc.hasAccuracy() ? Math.round(loc.getAccuracy()) : 12);
        ret.put("provider", providerName);
        String nativeAddr = getOfflineAndroidAddress(ctx, loc.getLatitude(), loc.getLongitude());
        if (nativeAddr != null && !nativeAddr.isEmpty()) {
            ret.put("nativeAddress", nativeAddr);
        }
        call.resolve(ret);
    }

    private void fetchFusedHighAccuracyLocation(final PluginCall call) {
        final Context ctx = getContext();
        boolean fine = ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarse = ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        if (!fine && !coarse) {
            JSObject ret = new JSObject();
            ret.put("hasCoords", false);
            call.resolve(ret);
            return;
        }

        try {
            final FusedLocationProviderClient fusedClient = LocationServices.getFusedLocationProviderClient(ctx);
            final boolean[] resolved = new boolean[]{false};

            CurrentLocationRequest currentReq = new CurrentLocationRequest.Builder()
                    .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
                    .setGranularity(Granularity.GRANULARITY_FINE)
                    .setMaxUpdateAgeMillis(0)
                    .setDurationMillis(4500)
                    .build();

            CancellationTokenSource cts = new CancellationTokenSource();
            fusedClient.getCurrentLocation(currentReq, cts.getToken())
                    .addOnSuccessListener(loc -> {
                        if (!resolved[0] && loc != null) {
                            resolved[0] = true;
                            resolveWithLocation(call, ctx, loc, "gms_fused_current");
                        }
                    });

            LocationRequest liveReq = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 500)
                    .setMinUpdateIntervalMillis(250)
                    .setWaitForAccurateLocation(false)
                    .setMaxUpdates(3)
                    .build();

            final LocationCallback callback = new LocationCallback() {
                @Override
                public void onLocationResult(@NonNull LocationResult result) {
                    Location best = result.getLastLocation();
                    if (best == null) return;
                    if (!resolved[0] && (!best.hasAccuracy() || best.getAccuracy() <= 65f)) {
                        resolved[0] = true;
                        fusedClient.removeLocationUpdates(this);
                        resolveWithLocation(call, ctx, best, "gms_fused_stream");
                    }
                }
            };

            fusedClient.requestLocationUpdates(liveReq, callback, Looper.getMainLooper());

            new android.os.Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (!resolved[0]) {
                    try { fusedClient.removeLocationUpdates(callback); } catch (Exception ignored) {}
                    fusedClient.getLastLocation().addOnSuccessListener(lastLoc -> {
                        if (!resolved[0] && lastLoc != null) {
                            resolved[0] = true;
                            resolveWithLocation(call, ctx, lastLoc, "gms_fused_last");
                        } else if (!resolved[0]) {
                            fallbackToAndroidGpsManager(call, ctx);
                        }
                    }).addOnFailureListener(e -> {
                        if (!resolved[0]) fallbackToAndroidGpsManager(call, ctx);
                    });
                }
            }, 3800L);

        } catch (Exception e) {
            fallbackToAndroidGpsManager(call, ctx);
        }
    }

    private void fallbackToAndroidGpsManager(PluginCall call, Context ctx) {
        try {
            LocationManager lm = (LocationManager) ctx.getSystemService(Context.LOCATION_SERVICE);
            if (lm != null) {
                Location gps = lm.isProviderEnabled(LocationManager.GPS_PROVIDER) ? lm.getLastKnownLocation(LocationManager.GPS_PROVIDER) : null;
                if (gps != null) {
                    resolveWithLocation(call, ctx, gps, "android_gps");
                    return;
                }
            }
        } catch (Exception ignored) {}
        JSObject ret = new JSObject();
        ret.put("hasCoords", false);
        call.resolve(ret);
    }

    @PluginMethod
    public void downloadAdhanAudio(PluginCall call) {
        final String adhanId = call.getString("adhanId", "ahlolbait_30");
        final String audioUrl = call.getString("audioUrl", "");
        final String fallbackUrl = call.getString("fallbackUrl", "");
        if (audioUrl == null || audioUrl.isEmpty()) {
            JSObject ret = new JSObject();
            ret.put("downloaded", false);
            call.resolve(ret);
            return;
        }
        new Thread(() -> {
            File dir = new File(getContext().getFilesDir(), "adhans");
            if (!dir.exists()) dir.mkdirs();
            String ext = audioUrl.endsWith(".ogg") ? ".ogg" : ".mp3";
            File outFile = new File(dir, adhanId + ext);
            boolean ok = downloadFileUrl(audioUrl, outFile);
            if (!ok && fallbackUrl != null && !fallbackUrl.isEmpty()) {
                ok = downloadFileUrl(fallbackUrl, outFile);
            }
            JSObject ret = new JSObject();
            ret.put("downloaded", ok);
            if (ok) ret.put("path", outFile.getAbsolutePath());
            call.resolve(ret);
        }).start();
    }

    private boolean downloadFileUrl(String urlStr, File dest) {
        try {
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);
            conn.connect();
            if (conn.getResponseCode() != HttpURLConnection.HTTP_OK) return false;
            InputStream is = conn.getInputStream();
            FileOutputStream fos = new FileOutputStream(dest);
            byte[] buf = new byte[8192];
            int len;
            while ((len = is.read(buf)) > 0) {
                fos.write(buf, 0, len);
            }
            fos.flush();
            fos.close();
            is.close();
            return dest.length() > 1024;
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void listDownloadedAdhans(PluginCall call) {
        File dir = new File(getContext().getFilesDir(), "adhans");
        JSArray arr = new JSArray();
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.length() > 1024) {
                        String name = f.getName().replace(".mp3", "").replace(".ogg", "");
                        arr.put(name);
                    }
                }
            }
        }
        JSObject ret = new JSObject();
        ret.put("ids", arr);
        call.resolve(ret);
    }

    @PluginMethod
    public void previewAdhanAudio(PluginCall call) {
        String adhanId = call.getString("adhanId", "ahlolbait_30");
        Integer durationSeconds = call.getInt("durationSeconds", 15);
        Integer volumePercent = call.getInt("volumePercent", 95);
        Context ctx = getContext();
        Intent srv = new Intent(ctx, AdhanForegroundService.class);
        srv.putExtra("title", "پیش‌نمایش صوتی نور");
        srv.putExtra("body", "در حال پخش نمونه صوتی...");
        srv.putExtra("soundType", "adhan");
        srv.putExtra("adhanId", adhanId);
        srv.putExtra("audioUrl", call.getString("audioUrl", ""));
        srv.putExtra("durationSeconds", durationSeconds != null ? durationSeconds : 15);
        srv.putExtra("volumePercent", volumePercent != null ? volumePercent : 95);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ctx.startForegroundService(srv);
        } else {
            ctx.startService(srv);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopPreviewAudio(PluginCall call) {
        Context ctx = getContext();
        AdhanForegroundService.killActivePlayer(ctx);
        Intent stopIntent = new Intent(ctx, AdhanForegroundService.class);
        stopIntent.setAction(AdhanForegroundService.ACTION_STOP);
        ctx.startService(stopIntent);
        call.resolve();
    }

    @PluginMethod
    public void checkFullScreenIntentPermission(PluginCall call) {
        JSObject ret = new JSObject();
        int apiLevel = Build.VERSION.SDK_INT;
        boolean granted = true;
        if (apiLevel >= 34) {
            try {
                NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
                granted = nm != null && nm.canUseFullScreenIntent();
            } catch (Exception ignored) {
                granted = false;
            }
        }
        ret.put("granted", granted);
        ret.put("apiLevel", apiLevel);
        ret.put("needsSettings", apiLevel >= 34 && !granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void openFullScreenIntentSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            if (Build.VERSION.SDK_INT >= 34) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                    intent.setData(Uri.parse("package:" + ctx.getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(intent);
                    call.resolve();
                    return;
                } catch (Exception ignored) {}
            }
            Intent fallback = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            fallback.putExtra(Settings.EXTRA_APP_PACKAGE, ctx.getPackageName());
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(fallback);
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED;
            if (!granted && getActivity() != null) {
                ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                        9001
                );
            }
            ret.put("granted", granted);
        } else {
            ret.put("granted", true);
        }
        call.resolve(ret);
    }


    @PluginMethod
    public void vibrateTick(PluginCall call) {
        String kind = call.getString("kind", "bead");
        try {
            Context ctx = getContext();
            Vibrator vibrator = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager vm = (VibratorManager) ctx.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                if (vm != null) vibrator = vm.getDefaultVibrator();
            } else {
                vibrator = (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator != null && vibrator.hasVibrator()) {
                if ("complete".equals(kind)) {
                    long[] timings = new long[]{0, 45, 55, 105};
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createWaveform(timings, -1));
                    } else {
                        vibrator.vibrate(timings, -1);
                    }
                } else if ("milestone".equals(kind)) {
                    long[] timings = new long[]{0, 30, 45, 65};
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createWaveform(timings, -1));
                    } else {
                        vibrator.vibrate(timings, -1);
                    }
                } else {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createOneShot(20L, 185));
                    } else {
                        vibrator.vibrate(20L);
                    }
                }
            }
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void playBeadClick(PluginCall call) {
        final String kind = call.getString("kind", "bead");
        new Thread(() -> {
            AudioTrack track = null;
            try {
                final int sampleRate = 22050;
                final int durationMs = "complete".equals(kind) ? 300 : ("milestone".equals(kind) ? 190 : 48);
                final int numSamples = (sampleRate * durationMs) / 1000;
                final short[] pcm = new short[numSamples];

                for (int i = 0; i < numSamples; i++) {
                    double t = (double) i / sampleRate;
                    double sample;
                    if ("complete".equals(kind)) {
                        double env = Math.exp(-t * 9.5);
                        double attack = Math.min(1.0, t / 0.008);
                        sample = attack * env * (
                            0.45 * Math.sin(2.0 * Math.PI * 523.25 * t) +
                            0.35 * Math.sin(2.0 * Math.PI * 659.25 * t) +
                            0.28 * Math.sin(2.0 * Math.PI * 783.99 * t)
                        );
                    } else if ("milestone".equals(kind)) {
                        double env = Math.exp(-t * 14.0);
                        double attack = Math.min(1.0, t / 0.006);
                        sample = attack * env * (
                            0.55 * Math.sin(2.0 * Math.PI * 587.33 * t) +
                            0.40 * Math.sin(2.0 * Math.PI * 880.0 * t)
                        );
                    } else {
                        // صدای طبیعی و دلنشین تق دانه چوبی/کهربایی تسبیح
                        double env = Math.exp(-t * 78.0);
                        double attack = Math.min(1.0, t / 0.002);
                        double freq = 860.0 - 420.0 * Math.min(1.0, t / 0.04);
                        sample = attack * env * (
                            0.65 * Math.sin(2.0 * Math.PI * freq * t) +
                            0.35 * Math.sin(2.0 * Math.PI * 2150.0 * t) * Math.exp(-t * 140.0)
                        );
                    }
                    int val = (int) Math.round(sample * 27000.0);
                    if (val > 32767) val = 32767;
                    if (val < -32768) val = -32768;
                    pcm[i] = (short) val;
                }

                track = new AudioTrack.Builder()
                    .setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build())
                    .setAudioFormat(new AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build())
                    .setBufferSizeInBytes(pcm.length * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build();

                track.write(pcm, 0, pcm.length);
                track.play();
                Thread.sleep(durationMs + 45);
            } catch (Exception ignored) {
            } finally {
                if (track != null) {
                    try { track.stop(); } catch (Exception ignored) {}
                    try { track.release(); } catch (Exception ignored) {}
                }
            }
        }).start();
        call.resolve();
    }


    // =========================================================================
    // موتور قطب‌نمای سخت‌افزاری نیتیو ۵لایه + Pull Snapshot (اندروید ۷ تا ۱۶)
    // =========================================================================
    private SensorManager compassSensorManager = null;
    private SensorEventListener compassListener = null;
    private final Handler compassMainHandler = new Handler(Looper.getMainLooper());
    private Runnable compassWatchdogRunnable = null;
    private float compassDeclinationDeg = 0f;
    private final float[] compassAccel = new float[3];
    private final float[] compassMag = new float[3];
    private boolean hasCompassAccel = false;
    private boolean hasCompassMag = false;
    private long lastCompassEmitMs = 0L;
    private volatile int compassSampleCount = 0;
    private volatile double latestCompassHeading = -1.0;
    private volatile double latestCompassPitch = 0.0;
    private volatile double latestCompassRoll = 0.0;
    private volatile int lastCompassAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM;
    private volatile String activeCompassMode = "none";
    private volatile boolean diagHasMag = false;
    private volatile boolean diagHasUncalMag = false;
    private volatile boolean diagHasAccel = false;
    private volatile boolean diagHasGyro = false;
    private volatile boolean diagHasRotVec = false;
    private volatile boolean diagHasGeoRot = false;

    @SuppressWarnings("deprecation")
    @PluginMethod
    public void startCompass(PluginCall call) {
        final Context ctx = getContext();
        final SensorManager sm = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) {
            JSObject ret = new JSObject();
            ret.put("available", false);
            ret.put("mode", "no_sensor_service");
            call.resolve(ret);
            return;
        }

        Double latObj = call.getDouble("lat", 35.6892);
        Double lngObj = call.getDouble("lng", 51.3890);
        final double lat = latObj != null ? latObj : 35.6892;
        final double lng = lngObj != null ? lngObj : 51.3890;

        compassMainHandler.post(() -> {
            stopCompassInternal();

            try {
                GeomagneticField geoField = new GeomagneticField(
                        (float) lat,
                        (float) lng,
                        0f,
                        System.currentTimeMillis()
                );
                compassDeclinationDeg = geoField.getDeclination();
            } catch (Exception ignored) {
                compassDeclinationDeg = 0f;
            }

            final Sensor rotSensor = sm.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
            final Sensor geoRotSensor = sm.getDefaultSensor(Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR);
            final Sensor accelSensor = sm.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            Sensor magSensorTmp = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
            if (magSensorTmp == null) {
                try {
                    java.util.List<Sensor> magList = sm.getSensorList(Sensor.TYPE_MAGNETIC_FIELD);
                    if (magList != null && !magList.isEmpty()) magSensorTmp = magList.get(0);
                } catch (Exception ignored) {}
            }
            final Sensor magSensor = magSensorTmp;
            final Sensor gameRotSensor = sm.getDefaultSensor(Sensor.TYPE_GAME_ROTATION_VECTOR);
            final Sensor uncalMagSensor = sm.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED);
            final Sensor gyroSensor = sm.getDefaultSensor(Sensor.TYPE_GYROSCOPE);
            final Sensor legacyOrientSensor = sm.getDefaultSensor(Sensor.TYPE_ORIENTATION);

            diagHasMag = magSensor != null;
            diagHasUncalMag = uncalMagSensor != null;
            diagHasAccel = accelSensor != null;
            diagHasGyro = gyroSensor != null;
            diagHasRotVec = rotSensor != null;
            diagHasGeoRot = geoRotSensor != null;

            boolean anyMagneticHardware = diagHasMag || diagHasUncalMag || diagHasGeoRot || (diagHasRotVec && diagHasMag);
            if (!anyMagneticHardware && legacyOrientSensor == null) {
                JSObject ret = new JSObject();
                ret.put("available", false);
                ret.put("mode", "no_magnetometer");
                ret.put("hasMag", false);
                ret.put("hasUncalMag", false);
                ret.put("hasAccel", diagHasAccel);
                ret.put("hasGyro", diagHasGyro);
                ret.put("hasRotVec", diagHasRotVec);
                ret.put("hasGeoRot", diagHasGeoRot);
                call.resolve(ret);
                return;
            }

            compassSensorManager = sm;
            hasCompassAccel = false;
            hasCompassMag = false;
            lastCompassEmitMs = 0L;
            compassSampleCount = 0;
            latestCompassHeading = -1.0;
            lastCompassAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM;

            compassListener = new SensorEventListener() {
                private final float[] rotMatrix = new float[9];
                private final float[] inclMatrix = new float[9];
                private final float[] truncatedRot = new float[4];

                @Override
                public void onSensorChanged(SensorEvent event) {
                    if (event == null || event.values == null) return;
                    int type = event.sensor.getType();
                    double trueHeading = -1.0;
                    double pitchDeg = 0.0;
                    double rollDeg = 0.0;
                    boolean headingReady = false;

                    if (type == Sensor.TYPE_ORIENTATION && event.values.length >= 3) {
                        trueHeading = (event.values[0] + compassDeclinationDeg + 360.0) % 360.0;
                        pitchDeg = event.values[1];
                        rollDeg = event.values[2];
                        headingReady = true;
                    } else {
                        boolean matrixReady = false;
                        if (type == Sensor.TYPE_ROTATION_VECTOR || type == Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR || type == Sensor.TYPE_GAME_ROTATION_VECTOR) {
                            try {
                                if (event.values.length > 4) {
                                    System.arraycopy(event.values, 0, truncatedRot, 0, 4);
                                    SensorManager.getRotationMatrixFromVector(rotMatrix, truncatedRot);
                                } else {
                                    SensorManager.getRotationMatrixFromVector(rotMatrix, event.values);
                                }
                                matrixReady = true;
                            } catch (Exception ignored) {
                                try {
                                    if (event.values.length >= 3) {
                                        float[] v3 = new float[]{ event.values[0], event.values[1], event.values[2] };
                                        SensorManager.getRotationMatrixFromVector(rotMatrix, v3);
                                        matrixReady = true;
                                    }
                                } catch (Exception ignored2) {}
                            }
                        } else if (type == Sensor.TYPE_ACCELEROMETER && event.values.length >= 3) {
                            final float a = 0.28f;
                            if (!hasCompassAccel) {
                                System.arraycopy(event.values, 0, compassAccel, 0, 3);
                                hasCompassAccel = true;
                            } else {
                                compassAccel[0] += a * (event.values[0] - compassAccel[0]);
                                compassAccel[1] += a * (event.values[1] - compassAccel[1]);
                                compassAccel[2] += a * (event.values[2] - compassAccel[2]);
                            }
                            if (hasCompassMag) {
                                matrixReady = SensorManager.getRotationMatrix(rotMatrix, inclMatrix, compassAccel, compassMag);
                            }
                        } else if ((type == Sensor.TYPE_MAGNETIC_FIELD || type == Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED) && event.values.length >= 3) {
                            final float a = 0.28f;
                            if (!hasCompassMag) {
                                compassMag[0] = event.values[0];
                                compassMag[1] = event.values[1];
                                compassMag[2] = event.values[2];
                                hasCompassMag = true;
                            } else {
                                compassMag[0] += a * (event.values[0] - compassMag[0]);
                                compassMag[1] += a * (event.values[1] - compassMag[1]);
                                compassMag[2] += a * (event.values[2] - compassMag[2]);
                            }
                            if (hasCompassAccel) {
                                matrixReady = SensorManager.getRotationMatrix(rotMatrix, inclMatrix, compassAccel, compassMag);
                            }
                        }

                        if (matrixReady) {
                            double r1 = rotMatrix[1];
                            double r2 = rotMatrix[2];
                            double r4 = rotMatrix[4];
                            double r5 = rotMatrix[5];
                            double r6 = rotMatrix[6];
                            double r7 = rotMatrix[7];
                            double r8 = rotMatrix[8];

                            double east = (r7 >= 0.0) ? (r1 + (-r2) * r7) : (r1 + r2 * (-r7));
                            double north = (r7 >= 0.0) ? (r4 + (-r5) * r7) : (r4 + r5 * (-r7));

                            double magAzimuth = Math.toDegrees(Math.atan2(east, north));
                            trueHeading = (magAzimuth + compassDeclinationDeg + 360.0) % 360.0;
                            pitchDeg = Math.toDegrees(Math.asin(Math.max(-1.0, Math.min(1.0, r7))));
                            rollDeg = Math.toDegrees(Math.atan2(-r6, r8));
                            headingReady = true;
                        }
                    }

                    if (!headingReady || Double.isNaN(trueHeading)) return;

                    int acc = event.accuracy >= 0 ? event.accuracy : lastCompassAccuracy;
                    latestCompassHeading = trueHeading;
                    latestCompassPitch = pitchDeg;
                    latestCompassRoll = rollDeg;
                    lastCompassAccuracy = acc;
                    compassSampleCount++;

                    long nowMs = android.os.SystemClock.elapsedRealtime();
                    if (compassSampleCount > 1 && (nowMs - lastCompassEmitMs < 33L)) return;
                    lastCompassEmitMs = nowMs;

                    JSObject payload = new JSObject();
                    payload.put("heading", trueHeading);
                    payload.put("pitch", pitchDeg);
                    payload.put("roll", rollDeg);
                    payload.put("accuracy", acc);
                    payload.put("mode", activeCompassMode);
                    payload.put("samples", compassSampleCount);
                    notifyListeners("compassHeading", payload);
                }

                @Override
                public void onAccuracyChanged(Sensor sensor, int accuracy) {
                    lastCompassAccuracy = accuracy;
                }
            };

            boolean registered = false;
            try {
                if (rotSensor != null && magSensor != null) {
                    registered = sm.registerListener(compassListener, rotSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                    if (registered) activeCompassMode = "rotation_vector";
                }
                if (!registered && geoRotSensor != null) {
                    registered = sm.registerListener(compassListener, geoRotSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                    if (registered) activeCompassMode = "geomagnetic_rotation_vector";
                }
                if (!registered && accelSensor != null && magSensor != null) {
                    boolean r1 = sm.registerListener(compassListener, accelSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                    boolean r2 = sm.registerListener(compassListener, magSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                    registered = r1 && r2;
                    if (registered) activeCompassMode = "accel_mag";
                }
                if (!registered && accelSensor != null && uncalMagSensor != null) {
                    boolean r1 = sm.registerListener(compassListener, accelSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                    boolean r2 = sm.registerListener(compassListener, uncalMagSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                    registered = r1 && r2;
                    if (registered) activeCompassMode = "accel_uncal_mag";
                }
                if (!registered && legacyOrientSensor != null) {
                    registered = sm.registerListener(compassListener, legacyOrientSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                    if (registered) activeCompassMode = "legacy_orientation";
                }
            } catch (Exception ignored) {
                registered = false;
            }

            if (!registered) {
                stopCompassInternal();
            } else {
                // Watchdog آبشاری ۱.۲ ثانیه‌ای: اگر سنسور اول روی اندروید ۱۵ خروجی نداد، خودکار به accel+mag و سپس uncalibrated سوییچ کن
                compassWatchdogRunnable = () -> {
                    if (compassSampleCount == 0 && compassSensorManager != null && compassListener != null) {
                        try {
                            compassSensorManager.unregisterListener(compassListener);
                            boolean switched = false;
                            if (accelSensor != null && magSensor != null && !"accel_mag".equals(activeCompassMode)) {
                                switched = compassSensorManager.registerListener(compassListener, accelSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler)
                                        && compassSensorManager.registerListener(compassListener, magSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                                if (switched) activeCompassMode = "accel_mag_watchdog";
                            }
                            if (!switched && accelSensor != null && uncalMagSensor != null) {
                                switched = compassSensorManager.registerListener(compassListener, accelSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler)
                                        && compassSensorManager.registerListener(compassListener, uncalMagSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                                if (switched) activeCompassMode = "accel_uncal_watchdog";
                            }
                            if (!switched && legacyOrientSensor != null) {
                                switched = compassSensorManager.registerListener(compassListener, legacyOrientSensor, SensorManager.SENSOR_DELAY_UI, compassMainHandler);
                                if (switched) activeCompassMode = "legacy_orient_watchdog";
                            }
                        } catch (Exception ignored) {}
                    }
                };
                compassMainHandler.postDelayed(compassWatchdogRunnable, 1200L);
            }

            JSObject ret = new JSObject();
            ret.put("available", registered);
            ret.put("mode", activeCompassMode);
            ret.put("declination", compassDeclinationDeg);
            ret.put("hasMag", diagHasMag);
            ret.put("hasUncalMag", diagHasUncalMag);
            ret.put("hasAccel", diagHasAccel);
            ret.put("hasGyro", diagHasGyro);
            ret.put("hasRotVec", diagHasRotVec);
            ret.put("hasGeoRot", diagHasGeoRot);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void getCompassSnapshot(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("hasSample", compassSampleCount > 0 && latestCompassHeading >= 0.0);
        ret.put("heading", latestCompassHeading >= 0.0 ? latestCompassHeading : 0.0);
        ret.put("pitch", latestCompassPitch);
        ret.put("roll", latestCompassRoll);
        ret.put("accuracy", lastCompassAccuracy);
        ret.put("samples", compassSampleCount);
        ret.put("mode", activeCompassMode);
        ret.put("hasMag", diagHasMag);
        ret.put("hasUncalMag", diagHasUncalMag);
        ret.put("hasGyro", diagHasGyro);
        ret.put("hasRotVec", diagHasRotVec);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopCompass(PluginCall call) {
        compassMainHandler.post(this::stopCompassInternal);
        call.resolve();
    }

    private void stopCompassInternal() {
        if (compassWatchdogRunnable != null) {
            compassMainHandler.removeCallbacks(compassWatchdogRunnable);
            compassWatchdogRunnable = null;
        }
        if (compassSensorManager != null && compassListener != null) {
            try {
                compassSensorManager.unregisterListener(compassListener);
            } catch (Exception ignored) {}
        }
        compassListener = null;
        compassSensorManager = null;
        activeCompassMode = "none";
    }

    @PluginMethod
    public void openAppNotificationSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                intent.putExtra(Settings.EXTRA_APP_PACKAGE, ctx.getPackageName());
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception e) {
            try {
                Context ctx = getContext();
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + ctx.getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(fallback);
            } catch (Exception ignored) {}
        }
        call.resolve();
    }

    @PluginMethod
    public void checkExactAlarmPermission(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                AlarmManager am = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
                granted = am != null && am.canScheduleExactAlarms();
            } catch (Exception ignored) {}
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        ret.put("apiLevel", Build.VERSION.SDK_INT);
        call.resolve(ret);
    }

    @PluginMethod
    public void openExactAlarmSettings(PluginCall call) {
        try {
            Context ctx = getContext();
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + ctx.getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Exception ignored) {}
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        compassMainHandler.post(this::stopCompassInternal);
        super.handleOnDestroy();
    }

}
