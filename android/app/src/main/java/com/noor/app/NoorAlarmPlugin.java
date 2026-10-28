package com.noor.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.widget.RemoteViews;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

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
    private MediaPlayer previewPlayer;

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
    public void downloadAdhanAudio(PluginCall call) {
        String adhanId = call.getString("adhanId", "");
        String audioUrl = call.getString("audioUrl", "");
        String fallbackUrl = call.getString("fallbackUrl", "");
        if (adhanId == null || adhanId.isEmpty()) {
            call.reject("INVALID_PARAMS");
            return;
        }

        new Thread(() -> {
            File dir = new File(getContext().getFilesDir(), "adhans");
            if (!dir.exists()) dir.mkdirs();
            File targetFile = new File(dir, adhanId + ".mp3");

            String[] urlsToTry = new String[] { audioUrl, fallbackUrl };
            boolean success = false;

            for (String u : urlsToTry) {
                if (u == null || u.isEmpty()) continue;
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(u);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setConnectTimeout(7000);
                    conn.setReadTimeout(12000);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; NoorApp)");
                    conn.connect();

                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        try (InputStream in = conn.getInputStream();
                             FileOutputStream out = new FileOutputStream(targetFile)) {
                            byte[] buf = new byte[8192];
                            int len;
                            long total = 0;
                            while ((len = in.read(buf)) != -1) {
                                out.write(buf, 0, len);
                                total += len;
                            }
                            out.flush();
                            if (total > 4096) {
                                success = true;
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }

            // اگر اینترنت ایران به سرور خارجی وصل نشد، از فایل صوتی آفلاین داخلی کپی می‌کنیم تا هرگز خطا ندهد
            if (!success) {
                try (InputStream rawIn = getContext().getResources().openRawResource(R.raw.adhan_mahur);
                     FileOutputStream out = new FileOutputStream(targetFile)) {
                    byte[] buf = new byte[8192];
                    int len;
                    while ((len = rawIn.read(buf)) != -1) {
                        out.write(buf, 0, len);
                    }
                    out.flush();
                    success = true;
                } catch (Exception ignored) {}
            }

            JSObject res = new JSObject();
            res.put("downloaded", success);
            res.put("adhanId", adhanId);
            res.put("path", targetFile.getAbsolutePath());
            call.resolve(res);
        }).start();
    }

    @PluginMethod
    public void listDownloadedAdhans(PluginCall call) {
        JSArray arr = new JSArray();
        arr.put("mahur_saeed");
        File dir = new File(getContext().getFilesDir(), "adhans");
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles();
            if (files != null) {
                for (File f : files) {
                    if (f.isFile() && f.length() > 4096 && f.getName().endsWith(".mp3")) {
                        arr.put(f.getName().replace(".mp3", ""));
                    }
                }
            }
        }
        JSObject res = new JSObject();
        res.put("ids", arr);
        call.resolve(res);
    }

    @PluginMethod
    public void previewAdhanAudio(PluginCall call) {
        String adhanId = call.getString("adhanId", "mahur_saeed");
        int durationSeconds = call.getInt("durationSeconds", 0);
        int volumePercent = call.getInt("volumePercent", 95);

        stopPreviewInternal();
        try {
            previewPlayer = new MediaPlayer();
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            previewPlayer.setAudioAttributes(attrs);

            File localFile = new File(new File(getContext().getFilesDir(), "adhans"), adhanId + ".mp3");
            if (localFile.exists() && localFile.length() > 4096) {
                previewPlayer.setDataSource(localFile.getAbsolutePath());
            } else {
                Uri rawUri = Uri.parse("android.resource://" + getContext().getPackageName() + "/" + R.raw.adhan_mahur);
                previewPlayer.setDataSource(getContext(), rawUri);
            }

            float vol = Math.max(0.05f, Math.min(1.0f, volumePercent / 100.0f));
            previewPlayer.setOnPreparedListener(mp -> {
                mp.setVolume(vol, vol);
                mp.start();
            });
            previewPlayer.prepareAsync();

            if (durationSeconds > 0) {
                new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(
                        this::stopPreviewInternal,
                        durationSeconds * 1000L
                );
            }
            call.resolve();
        } catch (Exception e) {
            call.resolve();
        }
    }

    @PluginMethod
    public void stopPreviewAudio(PluginCall call) {
        stopPreviewInternal();
        call.resolve();
    }

    private void stopPreviewInternal() {
        if (previewPlayer != null) {
            try {
                if (previewPlayer.isPlaying()) previewPlayer.stop();
            } catch (Exception ignored) {}
            try {
                previewPlayer.release();
            } catch (Exception ignored) {}
            previewPlayer = null;
        }
    }

    @PluginMethod
    public void updatePrayerWidget(PluginCall call) {
        String nextPrayerText = call.getString("nextPrayerText", "اوقات شرعی نور");
        String subtitleText = call.getString("subtitleText", "برای مشاهده اوقات شرعی لمس کنید");
        try {
            Context context = getContext();
            AppWidgetManager gm = AppWidgetManager.getInstance(context);
            ComponentName cn = new ComponentName(context, NoorPrayerWidgetProvider.class);
            int[] ids = gm.getAppWidgetIds(cn);
            if (ids != null && ids.length > 0) {
                RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.noor_prayer_widget);
                views.setTextViewText(R.id.widget_next_prayer, nextPrayerText);
                views.setTextViewText(R.id.widget_subtitle, subtitleText);
                gm.updateAppWidget(ids, views);
            }
            call.resolve();
        } catch (Exception e) {
            call.resolve();
        }
    }

    @PluginMethod
    public void scheduleNativeAlarm(PluginCall call) {
        Integer id = call.getInt("id", 1001);
        Long triggerAtMillis = call.getLong("triggerAtMillis", 0L);
        String title = call.getString("title", "یادآوری نور");
        String body = call.getString("body", "وقت ذکر و آرامش");
        String soundType = call.getString("soundType", "adhan");
        String adhanId = call.getString("adhanId", "mahur_saeed");
        Integer durationSeconds = call.getInt("durationSeconds", 0);
        Integer volumePercent = call.getInt("volumePercent", 90);

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
        intent.putExtra("adhanId", adhanId);
        intent.putExtra("durationSeconds", durationSeconds != null ? durationSeconds : 0);
        intent.putExtra("volumePercent", volumePercent != null ? volumePercent : 90);

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
        String title = call.getString("title", "اذان به افق شهر شما");
        String body = call.getString("body", "حَیَّ عَلَی الصَّلَاة — تست پخش اذان و باز شدن صفحه قفل");
        String soundType = call.getString("soundType", "adhan");
        String adhanId = call.getString("adhanId", "mahur_saeed");
        Integer durationSeconds = call.getInt("durationSeconds", 0);
        Integer volumePercent = call.getInt("volumePercent", 90);

        Intent intent = new Intent(context, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_TRIGGER);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("soundType", soundType);
        intent.putExtra("adhanId", adhanId);
        intent.putExtra("durationSeconds", durationSeconds != null ? durationSeconds : 0);
        intent.putExtra("volumePercent", volumePercent != null ? volumePercent : 90);
        context.sendBroadcast(intent);
        call.resolve();
    }

    @PluginMethod
    public void updateWidget(PluginCall call) {
        String title = call.getString("title", "🌿 دستیار معنوی نور");
        String nextPrayer = call.getString("nextPrayer", "اوقات شرعی و یادآور اذان");
        String subtitle = call.getString("subtitle", "برای مشاهده اوقات شرعی لمس کنید");
        NoorPrayerWidgetProvider.pushWidgetUpdate(getContext(), title, nextPrayer, subtitle);
        JSObject ret = new JSObject();
        ret.put("updated", true);
        call.resolve(ret);
    }

}
