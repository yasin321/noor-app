package com.noor.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Looper;
import androidx.annotation.NonNull;
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
    public void scheduleNativeAlarm(PluginCall call) {
        Integer id = call.getInt("id", 1001);
        Long triggerAtMillis = call.getLong("triggerAtMillis", System.currentTimeMillis() + 5000L);
        String title = call.getString("title", "وقت اذان و نیایش");
        String body = call.getString("body", "حَیَّ عَلَی الصَّلَاة");
        String soundType = call.getString("soundType", "adhan");
        String adhanId = call.getString("adhanId", "mahur_saeed");
        Integer durationSeconds = call.getInt("durationSeconds", 0);
        Integer volumePercent = call.getInt("volumePercent", 100);

        Context ctx = getContext();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(ctx, AdhanAlarmReceiver.class);
        intent.putExtra("id", id != null ? id : 1001);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("soundType", soundType);
        intent.putExtra("adhanId", adhanId);
        intent.putExtra("durationSeconds", durationSeconds != null ? durationSeconds : 0);
        intent.putExtra("volumePercent", volumePercent != null ? volumePercent : 100);

        PendingIntent pi = PendingIntent.getBroadcast(
                ctx,
                id != null ? id : 1001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        long targetTime = triggerAtMillis != null ? triggerAtMillis : System.currentTimeMillis() + 5000L;
        if (am != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    Intent showIntent = new Intent(ctx, MainActivity.class);
                    PendingIntent showPi = PendingIntent.getActivity(
                            ctx, id != null ? id : 1001, showIntent,
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
        call.resolve();
    }

    @PluginMethod
    public void cancelNativeAlarm(PluginCall call) {
        Integer id = call.getInt("id", 1001);
        Context ctx = getContext();
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(ctx, AdhanAlarmReceiver.class);
        PendingIntent pi = PendingIntent.getBroadcast(
                ctx,
                id != null ? id : 1001,
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
    public void updatePrayerWidget(PluginCall call) {
        String nextPrayerText = call.getString("nextPrayerText", "همراه معنوی نور");
        String subtitleText = call.getString("subtitleText", "اوقات شرعی و ذکر روزانه");
        Context ctx = getContext();
        SharedPreferences prefs = ctx.getSharedPreferences("noor_widget_prefs", Context.MODE_PRIVATE);
        prefs.edit()
                .putString("next_prayer_text", nextPrayerText)
                .putString("subtitle_text", subtitleText)
                .apply();
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

    // دریافت آدرس آفلاین از Geocoder داخلی سیستم‌عامل اندروید (برای مواقع بدون اینترنت یا مکمل نشان)
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

    // پیاده‌سازی دقیق مستندات رسمی نشان با Google Play Services FusedLocationProviderClient
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

            // ۱. درخواست موقعیت لحظه‌ای (Fresh High-Accuracy Fix) با maxUpdateAgeMillis = 0 (بدون کش قدیمی!)
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

            // ۲. اجرای هم‌زمان requestLocationUpdates با بازه ۵۰۰ میلی‌ثانیه برای قفل فوری مثل اپ نشان
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
                    // اگر دقت عالی (زیر ۶۵ متر) است، بلافاصله قفل کن
                    if (!resolved[0] && (!best.hasAccuracy() || best.getAccuracy() <= 65f)) {
                        resolved[0] = true;
                        fusedClient.removeLocationUpdates(this);
                        resolveWithLocation(call, ctx, best, "gms_fused_stream");
                    }
                }
            };

            fusedClient.requestLocationUpdates(liveReq, callback, Looper.getMainLooper());

            // ۳. تایم‌اوت ایمنی ۳.۸ ثانیه در صورت بودن در زیرزمین یا گوشی بدون گوگل‌پلی
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
        final String adhanId = call.getString("adhanId", "mahur_saeed");
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
        String adhanId = call.getString("adhanId", "mahur_saeed");
        Integer durationSeconds = call.getInt("durationSeconds", 15);
        Integer volumePercent = call.getInt("volumePercent", 95);
        Context ctx = getContext();
        Intent srv = new Intent(ctx, AdhanForegroundService.class);
        srv.putExtra("title", "پیش‌نمایش صوتی نور");
        srv.putExtra("body", "در حال پخش نمونه صوتی...");
        srv.putExtra("soundType", "adhan");
        srv.putExtra("adhanId", adhanId);
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
}
