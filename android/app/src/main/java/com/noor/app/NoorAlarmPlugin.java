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
import android.hardware.display.DisplayManager;
import android.os.HandlerThread;
import android.view.Display;
import android.view.Surface;
import android.view.WindowManager;
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
import com.google.android.gms.location.DeviceOrientation;
import com.google.android.gms.location.DeviceOrientationListener;
import com.google.android.gms.location.DeviceOrientationRequest;
import com.google.android.gms.location.FusedOrientationProviderClient;
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
        String titleText = call.getString("titleText", "افق شهر شما");
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences("noor_widget_prefs", Context.MODE_PRIVATE);
        SharedPreferences.Editor ed = prefs.edit();
        if (call.getString("fajr") != null) ed.putString("fajr", call.getString("fajr"));
        if (call.getString("sunrise") != null) ed.putString("sunrise", call.getString("sunrise"));
        if (call.getString("dhuhr") != null) ed.putString("dhuhr", call.getString("dhuhr"));
        if (call.getString("maghrib") != null) ed.putString("maghrib", call.getString("maghrib"));
        if (call.getString("midnight") != null) ed.putString("midnight", call.getString("midnight"));
        ed.commit();
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
    // موتور قطب‌نمای جهانی ترکیبی (اندروید ۷ تا ۱۶):
    // شروع موازی Native (HandlerThread) + Google FOP با موتور داوری (Orientation Arbitration)
    // remapCoordinateSystem استاندارد + استخراج pitch/roll واقعی از FOP getAttitude()
    // =========================================================================
    private SensorManager compassSensorManager = null;
    private SensorEventListener compassListener = null;
    private HandlerThread compassSensorThread = null;
    private Handler compassSensorHandler = null;
    private FusedOrientationProviderClient fusedOrientationClient = null;
    private DeviceOrientationListener fusedOrientationListener = null;
    private FusedLocationProviderClient compassGpsClient = null;
    private LocationCallback compassGpsCallback = null;
    private Location lastCompassGpsLoc = null;
    private final Handler compassMainHandler = new Handler(Looper.getMainLooper());
    private Runnable compassWatchdogRunnable = null;
    private float compassDeclinationDeg = 0f;
    private final float[] compassAccel = new float[3];
    private final float[] compassMag = new float[3];
    private boolean hasCompassAccel = false;
    private boolean hasCompassMag = false;
    private long lastCompassEmitMs = 0L;
    private volatile long lastFopFreshMs = 0L;
    private volatile float lastFopErrorDeg = 180f;
    private volatile int nativeSampleCount = 0;
    private volatile int compassSampleCount = 0;
    private volatile double latestCompassHeading = -1.0;
    private volatile double latestCompassPitch = 0.0;
    private volatile double latestCompassRoll = 0.0;
    private volatile double latestGpsLat = Double.NaN;
    private volatile double latestGpsLng = Double.NaN;
    private volatile float latestGpsAccuracy = -1f;
    private volatile int lastCompassAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM;
    private volatile String activeCompassMode = "none";
    private volatile String activeNorthRef = "MAGNETIC";
    private volatile String activeConfidenceState = "INITIALIZING";
    private volatile boolean activeCompassIsMagnetic = false;
    private volatile boolean activeCompassIsGps = false;
    private volatile boolean diagFopActive = false;
    private volatile boolean diagGpsActive = false;
    private volatile boolean diagNeedsLocationPerm = false;
    private volatile boolean diagHasMag = false;
    private volatile boolean diagHasUncalMag = false;
    private volatile boolean diagHasAccel = false;
    private volatile boolean diagHasGyro = false;
    private volatile boolean diagHasRotVec = false;
    private volatile boolean diagHasGeoRot = false;
    private volatile String diagSensorSummary = "";

    private Sensor findFirstSensor(SensorManager sm, int sensorType) {
        try {
            Sensor s = sm.getDefaultSensor(sensorType);
            if (s != null) return s;
            java.util.List<Sensor> list = sm.getSensorList(sensorType);
            if (list != null && !list.isEmpty()) return list.get(0);
        } catch (Exception ignored) {}
        return null;
    }

    // خواندن چرخش صفحه سازگار با API 24 تا 36 (بدون getDefaultDisplay منسوخ در API 30+)
    @SuppressWarnings("deprecation")
    private int getScreenSurfaceRotation() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                Display d = getActivity() != null ? getActivity().getDisplay() : null;
                if (d != null) return d.getRotation();
                DisplayManager dm = (DisplayManager) getContext().getSystemService(Context.DISPLAY_SERVICE);
                if (dm != null) {
                    Display def = dm.getDisplay(Display.DEFAULT_DISPLAY);
                    if (def != null) return def.getRotation();
                }
            } else {
                WindowManager wm = (WindowManager) getContext().getSystemService(Context.WINDOW_SERVICE);
                if (wm != null && wm.getDefaultDisplay() != null) {
                    return wm.getDefaultDisplay().getRotation();
                }
            }
        } catch (Exception ignored) {}
        return Surface.ROTATION_0;
    }

    // تبدیل استاندارد محورها بر اساس چرخش نمایشگر (Portrait / Landscape / Upside-down)
    private void remapForScreenRotation(float[] inR, float[] outR) {
        int rotation = getScreenSurfaceRotation();
        boolean ok;
        switch (rotation) {
            case Surface.ROTATION_90:
                ok = SensorManager.remapCoordinateSystem(inR, SensorManager.AXIS_Y, SensorManager.AXIS_MINUS_X, outR);
                break;
            case Surface.ROTATION_180:
                ok = SensorManager.remapCoordinateSystem(inR, SensorManager.AXIS_MINUS_X, SensorManager.AXIS_MINUS_Y, outR);
                break;
            case Surface.ROTATION_270:
                ok = SensorManager.remapCoordinateSystem(inR, SensorManager.AXIS_MINUS_Y, SensorManager.AXIS_X, outR);
                break;
            case Surface.ROTATION_0:
            default:
                ok = SensorManager.remapCoordinateSystem(inR, SensorManager.AXIS_X, SensorManager.AXIS_Y, outR);
                break;
        }
        if (!ok) {
            System.arraycopy(inR, 0, outR, 0, 9);
        }
    }

    private String computeConfidenceState(int acc, float headingErrDeg) {
        if (headingErrDeg >= 0f && headingErrDeg <= 22f) return "STABLE";
        if (acc >= SensorManager.SENSOR_STATUS_ACCURACY_HIGH) return "STABLE";
        if (acc == SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM && (headingErrDeg < 0f || headingErrDeg <= 35f)) {
            return "STABLE";
        }
        return "LOW_CONFIDENCE";
    }

    // موتور داوری مرکزی (Orientation Arbitration Engine)
    private synchronized void arbitrateAndEmit(
            double trueHeading,
            double pitchDeg,
            double rollDeg,
            int acc,
            String source,
            String northRef,
            float headingErrDeg,
            boolean isMagnetic,
            boolean isGps
    ) {
        if (Double.isNaN(trueHeading)) return;
        long nowMs = android.os.SystemClock.elapsedRealtime();

        // اگر FOP تازه و دقیق (<1.5 ثانیه و خطای <= 25 درجه) فعال است، نمونه نیتیو را جایگزین آن نکن
        if (isMagnetic && !"GOOGLE_FOP".equals(source)) {
            boolean fopFreshAndStrong = diagFopActive
                    && (nowMs - lastFopFreshMs < 1500L)
                    && lastFopErrorDeg <= 25f;
            if (fopFreshAndStrong) {
                return;
            }
        }

        double cleanHeading = (trueHeading % 360.0 + 360.0) % 360.0;
        latestCompassHeading = cleanHeading;
        latestCompassPitch = pitchDeg;
        latestCompassRoll = rollDeg;
        lastCompassAccuracy = acc;
        activeCompassMode = source;
        activeNorthRef = northRef;
        activeConfidenceState = isGps ? "STABLE" : computeConfidenceState(acc, headingErrDeg);
        activeCompassIsMagnetic = isMagnetic;
        activeCompassIsGps = isGps;
        compassSampleCount++;

        if (!isGps && compassSampleCount > 1 && (nowMs - lastCompassEmitMs < 20L)) return;
        lastCompassEmitMs = nowMs;

        final JSObject payload = new JSObject();
        payload.put("heading", cleanHeading);
        payload.put("pitch", pitchDeg);
        payload.put("roll", rollDeg);
        payload.put("accuracy", acc);
        payload.put("headingErrorDegrees", headingErrDeg >= 0f ? headingErrDeg : -1f);
        payload.put("confidence", activeConfidenceState);
        payload.put("northReference", northRef);
        payload.put("mode", source);
        payload.put("isMagnetic", isMagnetic);
        payload.put("isGpsBearing", isGps);
        payload.put("samples", compassSampleCount);
        payload.put("sensorSummary", diagSensorSummary);
        if (!Double.isNaN(latestGpsLat) && !Double.isNaN(latestGpsLng)) {
            payload.put("gpsLat", latestGpsLat);
            payload.put("gpsLng", latestGpsLng);
            payload.put("gpsAccuracy", latestGpsAccuracy);
        }
        compassMainHandler.post(() -> notifyListeners("compassHeading", payload));
    }

    private void emitGpsPositionOnly(double lat, double lng, float accMeters) {
        latestGpsLat = lat;
        latestGpsLng = lng;
        latestGpsAccuracy = accMeters;
        final JSObject payload = new JSObject();
        payload.put("gpsLat", lat);
        payload.put("gpsLng", lng);
        payload.put("gpsAccuracy", accMeters);
        payload.put("mode", activeCompassMode);
        payload.put("isGpsBearing", true);
        payload.put("gpsOnly", true);
        payload.put("sensorSummary", diagSensorSummary);
        compassMainHandler.post(() -> notifyListeners("compassHeading", payload));
    }

    private String buildHardwareSensorSummary() {
        StringBuilder sb = new StringBuilder();
        if (diagHasMag || diagHasUncalMag) sb.append("مغناطیس‌سنج");
        if (diagHasGyro) {
            if (sb.length() > 0) sb.append(" + ");
            sb.append("ژیروسکوپ");
        }
        if (diagHasRotVec || diagHasGeoRot) {
            if (sb.length() > 0) sb.append(" + ");
            sb.append("بردار چرخش");
        }
        if (diagHasAccel) {
            if (sb.length() > 0) sb.append(" + ");
            sb.append("شتاب‌سنج");
        }
        if (sb.length() == 0) return "بدون سنسور مغناطیسی";
        return sb.toString();
    }

    // موتور نیتیو لوکیشن/GPS برای مختصات زنده نقشه + GPS Bearing کمکی فضای باز
    private boolean startNativeGpsHeading(final Context ctx) {
        boolean fine = ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarse = ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        if (!fine && !coarse) {
            diagNeedsLocationPerm = true;
            diagGpsActive = false;
            return false;
        }
        diagNeedsLocationPerm = false;
        try {
            stopNativeGpsHeading();
            compassGpsClient = LocationServices.getFusedLocationProviderClient(ctx);
            lastCompassGpsLoc = null;

            compassGpsClient.getLastLocation().addOnSuccessListener(loc -> {
                if (loc != null) {
                    emitGpsPositionOnly(loc.getLatitude(), loc.getLongitude(), loc.hasAccuracy() ? loc.getAccuracy() : 25f);
                    lastCompassGpsLoc = loc;
                }
            });

            LocationRequest gpsReq = new LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 1000L)
                    .setMinUpdateIntervalMillis(500L)
                    .setMinUpdateDistanceMeters(1.0f)
                    .build();

            compassGpsCallback = new LocationCallback() {
                @Override
                public void onLocationResult(@NonNull LocationResult result) {
                    Location loc = result.getLastLocation();
                    if (loc == null) return;
                    latestGpsLat = loc.getLatitude();
                    latestGpsLng = loc.getLongitude();
                    latestGpsAccuracy = loc.hasAccuracy() ? loc.getAccuracy() : 20f;

                    if (activeCompassIsMagnetic) {
                        emitGpsPositionOnly(loc.getLatitude(), loc.getLongitude(), latestGpsAccuracy);
                        return;
                    }

                    double bearingDeg = -1.0;
                    if (loc.hasBearing() && (!loc.hasSpeed() || loc.getSpeed() >= 0.55f)) {
                        bearingDeg = (loc.getBearing() + 360.0) % 360.0;
                        lastCompassGpsLoc = loc;
                    } else if (lastCompassGpsLoc != null) {
                        float distM = lastCompassGpsLoc.distanceTo(loc);
                        if (distM >= 3.0f && (!loc.hasAccuracy() || loc.getAccuracy() <= 35f)) {
                            bearingDeg = (lastCompassGpsLoc.bearingTo(loc) + 360.0) % 360.0;
                            lastCompassGpsLoc = loc;
                        }
                    } else {
                        lastCompassGpsLoc = loc;
                    }

                    if (bearingDeg >= 0.0) {
                        arbitrateAndEmit(
                                bearingDeg, 0.0, 0.0,
                                SensorManager.SENSOR_STATUS_ACCURACY_HIGH,
                                "gps_bearing", "TRUE", -1f, false, true
                        );
                    } else {
                        emitGpsPositionOnly(loc.getLatitude(), loc.getLongitude(), latestGpsAccuracy);
                    }
                }
            };

            compassGpsClient.requestLocationUpdates(gpsReq, compassGpsCallback, Looper.getMainLooper());
            diagGpsActive = true;
            return true;
        } catch (Exception ignored) {
            diagGpsActive = false;
            return false;
        }
    }

    private void stopNativeGpsHeading() {
        if (compassGpsClient != null && compassGpsCallback != null) {
            try {
                compassGpsClient.removeLocationUpdates(compassGpsCallback);
            } catch (Exception ignored) {}
        }
        compassGpsCallback = null;
        compassGpsClient = null;
        lastCompassGpsLoc = null;
        diagGpsActive = false;
    }

    private boolean registerNativeSensorEngine(
            final SensorManager sm,
            final Sensor rotSensor,
            final Sensor geoRotSensor,
            final Sensor accelSensor,
            final Sensor magSensor,
            final Sensor uncalMagSensor,
            final boolean skipPrimaryRot
    ) {
        if (sm == null) return false;
        if (compassListener != null && compassSensorManager != null) {
            try { compassSensorManager.unregisterListener(compassListener); } catch (Exception ignored) {}
        }

        if (compassSensorThread == null) {
            compassSensorThread = new HandlerThread("NoorQiblaSensor");
            compassSensorThread.start();
            compassSensorHandler = new Handler(compassSensorThread.getLooper());
        }

        compassSensorManager = sm;
        hasCompassAccel = false;
        hasCompassMag = false;
        nativeSampleCount = 0;

        compassListener = new SensorEventListener() {
            private final float[] rotMatrix = new float[9];
            private final float[] remappedMatrix = new float[9];
            private final float[] inclMatrix = new float[9];
            private final float[] orientRad = new float[3];
            private final float[] truncatedRot = new float[4];

            @Override
            public void onSensorChanged(SensorEvent event) {
                if (event == null || event.values == null) return;
                int type = event.sensor.getType();
                boolean matrixReady = false;
                float estErrDeg = -1f;
                String sourceName = activeCompassMode;

                if (type == Sensor.TYPE_ROTATION_VECTOR || type == Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR) {
                    sourceName = (type == Sensor.TYPE_ROTATION_VECTOR) ? "ROTATION_VECTOR" : "GEOMAGNETIC_VECTOR";
                    // استخراج تخمین خطای Heading از values[4] (برحسب رادیان) طبق مستندات اندروید
                    if (event.values.length >= 5 && event.values[4] >= 0f && !Float.isNaN(event.values[4])) {
                        estErrDeg = (float) Math.toDegrees(event.values[4]);
                    }
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
                } else if ((type == Sensor.TYPE_ACCELEROMETER || type == Sensor.TYPE_GRAVITY) && event.values.length >= 3) {
                    final float a = 0.25f;
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
                    float mx = event.values[0];
                    float my = event.values[1];
                    float mz = event.values[2];
                    // جبران سخت‌افزاری Bias برای سنسور Uncalibrated در صورت وجود ۶ مولفه
                    if (type == Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED && event.values.length >= 6) {
                        mx -= event.values[3];
                        my -= event.values[4];
                        mz -= event.values[5];
                    }
                    final float a = 0.25f;
                    if (!hasCompassMag) {
                        compassMag[0] = mx;
                        compassMag[1] = my;
                        compassMag[2] = mz;
                        hasCompassMag = true;
                    } else {
                        compassMag[0] += a * (mx - compassMag[0]);
                        compassMag[1] += a * (my - compassMag[1]);
                        compassMag[2] += a * (mz - compassMag[2]);
                    }
                    if (hasCompassAccel) {
                        matrixReady = SensorManager.getRotationMatrix(rotMatrix, inclMatrix, compassAccel, compassMag);
                    }
                }

                if (!matrixReady) return;

                // Remap استاندارد برای Portrait / Landscape (بدون فرمول دستی)
                remapForScreenRotation(rotMatrix, remappedMatrix);
                SensorManager.getOrientation(remappedMatrix, orientRad);

                double magAzimuth = Math.toDegrees(orientRad[0]);
                double pitchDeg = Math.toDegrees(orientRad[1]);
                double rollDeg = Math.toDegrees(orientRad[2]);
                // سنسور نیتیو شمال مغناطیسی است -> اضافه کردن Declination یک‌بار
                double trueHeading = (magAzimuth + compassDeclinationDeg + 360.0) % 360.0;

                nativeSampleCount++;
                int acc = event.accuracy >= 0 ? event.accuracy : lastCompassAccuracy;
                arbitrateAndEmit(trueHeading, pitchDeg, rollDeg, acc, sourceName, "MAGNETIC", estErrDeg, true, false);
            }

            @Override
            public void onAccuracyChanged(Sensor sensor, int accuracy) {
                lastCompassAccuracy = accuracy;
            }
        };

        final int rate = SensorManager.SENSOR_DELAY_GAME;
        boolean registered = false;
        try {
            if (!skipPrimaryRot && rotSensor != null) {
                registered = sm.registerListener(compassListener, rotSensor, rate, compassSensorHandler);
                if (registered) activeCompassMode = "ROTATION_VECTOR";
            }
            if (!registered && geoRotSensor != null) {
                registered = sm.registerListener(compassListener, geoRotSensor, rate, compassSensorHandler);
                if (registered) activeCompassMode = "GEOMAGNETIC_VECTOR";
            }
            if (!registered && accelSensor != null && magSensor != null) {
                boolean r1 = sm.registerListener(compassListener, accelSensor, rate, compassSensorHandler);
                boolean r2 = sm.registerListener(compassListener, magSensor, rate, compassSensorHandler);
                registered = r1 && r2;
                if (registered) activeCompassMode = skipPrimaryRot ? "accel_mag_watchdog" : "ACCEL_MAG";
            }
            if (!registered && accelSensor != null && uncalMagSensor != null) {
                boolean r1 = sm.registerListener(compassListener, accelSensor, rate, compassSensorHandler);
                boolean r2 = sm.registerListener(compassListener, uncalMagSensor, rate, compassSensorHandler);
                registered = r1 && r2;
                if (registered) activeCompassMode = "ACCEL_UNCAL_MAG";
            }
        } catch (Exception ignored) {
            registered = false;
        }
        return registered;
    }

    // شروع موازی Google FOP (با استخراج pitch/roll واقعی از getAttitude و بدون چرخش دوگانه)
    private boolean startGoogleFopParallel(final Context ctx) {
        try {
            fusedOrientationClient = LocationServices.getFusedOrientationProviderClient(ctx);
            DeviceOrientationRequest fopReq = new DeviceOrientationRequest.Builder(
                    DeviceOrientationRequest.OUTPUT_PERIOD_DEFAULT
            ).build();

            final float[] fopRotMatrix = new float[9];
            final float[] fopRemapped = new float[9];
            final float[] fopOrient = new float[3];

            fusedOrientationListener = (DeviceOrientation orientation) -> {
                if (orientation == null) return;
                float headingDeg = orientation.getHeadingDegrees();
                // استفاده از getHeadingErrorDegrees به‌جای conservative (تا شروع اولیه روی ۱۸۰° بلاک نشود)
                float errDeg = orientation.getHeadingErrorDegrees();
                if (Float.isNaN(headingDeg) || errDeg >= 120.0f) return;

                // استخراج واقعی pitch و roll از کواترنیون getAttitude()
                double pitchDeg = 0.0;
                double rollDeg = 0.0;
                try {
                    float[] attitude = orientation.getAttitude();
                    if (attitude != null && attitude.length >= 4) {
                        SensorManager.getRotationMatrixFromVector(fopRotMatrix, attitude);
                        remapForScreenRotation(fopRotMatrix, fopRemapped);
                        SensorManager.getOrientation(fopRemapped, fopOrient);
                        pitchDeg = Math.toDegrees(fopOrient[1]);
                        rollDeg = Math.toDegrees(fopOrient[2]);
                    }
                } catch (Exception ignored) {}

                int acc = errDeg <= 15f
                        ? SensorManager.SENSOR_STATUS_ACCURACY_HIGH
                        : (errDeg <= 35f ? SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM : SensorManager.SENSOR_STATUS_ACCURACY_LOW);

                // FOP خودش چرخش صفحه و انحراف محلی را اعمال می‌کند -> عدم جمع مجدد!
                diagFopActive = true;
                lastFopFreshMs = android.os.SystemClock.elapsedRealtime();
                lastFopErrorDeg = errDeg;
                arbitrateAndEmit(headingDeg, pitchDeg, rollDeg, acc, "GOOGLE_FOP", "TRUE", errDeg, true, false);
            };

            java.util.concurrent.Executor mainExec = command -> compassMainHandler.post(command);
            fusedOrientationClient.requestOrientationUpdates(fopReq, mainExec, fusedOrientationListener)
                    .addOnFailureListener(e -> diagFopActive = false);
            return true;
        } catch (Exception ignored) {
            diagFopActive = false;
            return false;
        }
    }

    @PluginMethod
    public void startCompass(PluginCall call) {
        final Context ctx = getContext();
        final SensorManager sm = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        if (sm == null) {
            JSObject ret = new JSObject();
            ret.put("available", false);
            ret.put("isMagnetic", false);
            ret.put("isGpsBearing", false);
            ret.put("fopActive", false);
            ret.put("mode", "no_sensor_service");
            ret.put("sensorSummary", "سرویس سنسور در دسترس نیست");
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

            final Sensor rotSensor = findFirstSensor(sm, Sensor.TYPE_ROTATION_VECTOR);
            final Sensor geoRotSensor = findFirstSensor(sm, Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR);
            Sensor accTmp = findFirstSensor(sm, Sensor.TYPE_ACCELEROMETER);
            if (accTmp == null) accTmp = findFirstSensor(sm, Sensor.TYPE_GRAVITY);
            final Sensor accelSensor = accTmp;
            final Sensor magSensor = findFirstSensor(sm, Sensor.TYPE_MAGNETIC_FIELD);
            final Sensor uncalMagSensor = findFirstSensor(sm, Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED);
            final Sensor gyroSensor = findFirstSensor(sm, Sensor.TYPE_GYROSCOPE);

            diagHasMag = magSensor != null;
            diagHasUncalMag = uncalMagSensor != null;
            diagHasAccel = accelSensor != null;
            diagHasGyro = gyroSensor != null;
            diagHasRotVec = rotSensor != null;
            diagHasGeoRot = geoRotSensor != null;
            diagSensorSummary = buildHardwareSensorSummary();

            // تشخیص فوری سخت‌افزار مغناطیس‌سنج (در کمتر از ۵۰ میلی‌ثانیه — مستقل از مدل گوشی)
            final boolean hasMagnetometer = diagHasMag || diagHasUncalMag || diagHasGeoRot;
            final boolean hasNativeCompass = hasMagnetometer && (diagHasRotVec || diagHasGeoRot || diagHasAccel);

            compassSampleCount = 0;
            nativeSampleCount = 0;
            latestCompassHeading = -1.0;
            lastCompassEmitMs = 0L;
            lastFopFreshMs = 0L;
            lastFopErrorDeg = 180f;
            lastCompassAccuracy = SensorManager.SENSOR_STATUS_ACCURACY_MEDIUM;
            activeConfidenceState = "INITIALIZING";
            diagFopActive = false;

            // شروع GPS نیتیو برای مختصات دقیق نقشه و شعاع خطا
            boolean gpsStarted = startNativeGpsHeading(ctx);

            if (!hasNativeCompass) {
                // دستگاه فاقد مغناطیس‌سنج (مثل Galaxy A05s) -> اعلام فوری no_magnetometer برای ورود مستقیم به Map Mode
                activeCompassIsMagnetic = false;
                activeCompassIsGps = gpsStarted;
                activeCompassMode = "no_magnetometer";
                JSObject ret = new JSObject();
                ret.put("available", false);
                ret.put("isMagnetic", false);
                ret.put("isGpsBearing", gpsStarted);
                ret.put("needsLocationPermission", diagNeedsLocationPerm);
                ret.put("fopActive", false);
                ret.put("mode", "no_magnetometer");
                ret.put("hasMag", false);
                ret.put("hasUncalMag", false);
                ret.put("hasAccel", diagHasAccel);
                ret.put("hasGyro", diagHasGyro);
                ret.put("hasRotVec", diagHasRotVec);
                ret.put("hasGeoRot", diagHasGeoRot);
                ret.put("sensorSummary", diagSensorSummary);
                call.resolve(ret);
                return;
            }

            // ۱. شروع فوری موتور Native (زیر ۲۰ms بدون انتظار برای گوگل)
            boolean nativeRegistered = registerNativeSensorEngine(
                    sm, rotSensor, geoRotSensor, accelSensor, magSensor, uncalMagSensor, false
            );

            // ۲. شروع موازی Google FOP برای ارتقای کیفیت در صورت دسترسی GMS
            boolean fopRequested = startGoogleFopParallel(ctx);

            activeCompassIsMagnetic = nativeRegistered || fopRequested;
            activeCompassIsGps = false;

            // Watchdog سلامت ۱.۲ ثانیه‌ای فقط اگر Rotation Vector در برخی رام‌های OEM هیچ خروجی نداد -> سوییچ به accel_mag_watchdog
            if (nativeRegistered && "ROTATION_VECTOR".equals(activeCompassMode)) {
                compassWatchdogRunnable = () -> {
                    if (nativeSampleCount == 0 && compassSensorManager != null) {
                        registerNativeSensorEngine(
                                sm, rotSensor, geoRotSensor, accelSensor, magSensor, uncalMagSensor, true
                        );
                    }
                };
                compassMainHandler.postDelayed(compassWatchdogRunnable, 1200L);
            }

            JSObject ret = new JSObject();
            ret.put("available", activeCompassIsMagnetic);
            ret.put("isMagnetic", activeCompassIsMagnetic);
            ret.put("isGpsBearing", false);
            ret.put("needsLocationPermission", diagNeedsLocationPerm);
            ret.put("fopActive", fopRequested);
            ret.put("mode", activeCompassMode);
            ret.put("confidence", activeConfidenceState);
            ret.put("declination", compassDeclinationDeg);
            ret.put("hasMag", diagHasMag);
            ret.put("hasUncalMag", diagHasUncalMag);
            ret.put("hasAccel", diagHasAccel);
            ret.put("hasGyro", diagHasGyro);
            ret.put("hasRotVec", diagHasRotVec);
            ret.put("hasGeoRot", diagHasGeoRot);
            ret.put("sensorSummary", diagSensorSummary);
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
        ret.put("confidence", activeConfidenceState);
        ret.put("northReference", activeNorthRef);
        ret.put("samples", compassSampleCount);
        ret.put("mode", activeCompassMode);
        ret.put("isMagnetic", activeCompassIsMagnetic);
        ret.put("isGpsBearing", activeCompassIsGps);
        ret.put("needsLocationPermission", diagNeedsLocationPerm);
        ret.put("fopActive", diagFopActive);
        ret.put("hasMag", diagHasMag);
        ret.put("hasUncalMag", diagHasUncalMag);
        ret.put("hasAccel", diagHasAccel);
        ret.put("hasGyro", diagHasGyro);
        ret.put("hasRotVec", diagHasRotVec);
        ret.put("hasGeoRot", diagHasGeoRot);
        ret.put("sensorSummary", diagSensorSummary);
        if (!Double.isNaN(latestGpsLat) && !Double.isNaN(latestGpsLng)) {
            ret.put("gpsLat", latestGpsLat);
            ret.put("gpsLng", latestGpsLng);
            ret.put("gpsAccuracy", latestGpsAccuracy);
        }
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
        stopNativeGpsHeading();
        if (fusedOrientationClient != null && fusedOrientationListener != null) {
            try {
                fusedOrientationClient.removeOrientationUpdates(fusedOrientationListener);
            } catch (Exception ignored) {}
        }
        fusedOrientationListener = null;
        fusedOrientationClient = null;
        diagFopActive = false;

        if (compassSensorManager != null && compassListener != null) {
            try {
                compassSensorManager.unregisterListener(compassListener);
            } catch (Exception ignored) {}
        }
        compassListener = null;
        compassSensorManager = null;

        if (compassSensorThread != null) {
            try {
                compassSensorThread.quitSafely();
            } catch (Exception ignored) {}
            compassSensorThread = null;
            compassSensorHandler = null;
        }

        activeCompassMode = "none";
        activeConfidenceState = "INITIALIZING";
        activeCompassIsMagnetic = false;
        activeCompassIsGps = false;
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
