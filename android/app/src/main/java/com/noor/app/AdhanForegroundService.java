package com.noor.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import java.io.File;

public class AdhanForegroundService extends Service {
    public static final String CHANNEL_ID = "noor_fullscreen_alarm_v6";
    public static final String ACTION_STOP = "com.noor.app.ACTION_STOP_ADHAN";
    private static final int NOTIF_ID = 88001;

    private static final Object PLAYER_LOCK = new Object();
    private static MediaPlayer activePlayer = null;
    private static Handler stopHandler = new Handler(Looper.getMainLooper());
    private static Runnable stopRunnable = null;
    private PowerManager.WakeLock wakeLock;

    public static void killActivePlayer(Context ctx) {
        synchronized (PLAYER_LOCK) {
            if (stopRunnable != null) {
                stopHandler.removeCallbacks(stopRunnable);
                stopRunnable = null;
            }
            if (activePlayer != null) {
                try {
                    if (activePlayer.isPlaying()) {
                        activePlayer.stop();
                    }
                } catch (Exception ignored) {}
                try {
                    activePlayer.reset();
                    activePlayer.release();
                } catch (Exception ignored) {}
                activePlayer = null;
            }
            if (ctx != null) {
                try {
                    Vibrator vib = (Vibrator) ctx.getSystemService(Context.VIBRATOR_SERVICE);
                    if (vib != null) vib.cancel();
                } catch (Exception ignored) {}
                try {
                    NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
                    if (nm != null) nm.cancelAll();
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createAlarmChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            killActivePlayer(this);
            sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        killActivePlayer(this);
        acquireWakeLock();

        String title = intent != null && intent.getStringExtra("title") != null
                ? intent.getStringExtra("title")
                : "وقت اذان و نیایش";
        String body = intent != null && intent.getStringExtra("body") != null
                ? intent.getStringExtra("body")
                : "حَیَّ عَلَی الصَّلَاة";
        String soundType = intent != null && intent.getStringExtra("soundType") != null
                ? intent.getStringExtra("soundType")
                : "adhan";
        String adhanId = intent != null && intent.getStringExtra("adhanId") != null
                ? intent.getStringExtra("adhanId")
                : "mahur_saeed";
        int durationSeconds = intent != null ? intent.getIntExtra("durationSeconds", 0) : 0;
        int volumePercent = intent != null ? intent.getIntExtra("volumePercent", 100) : 100;

        Intent fullScreenIntent = new Intent(this, AdhanAlarmActivity.class);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent fullScreenPi = PendingIntent.getActivity(
                this, 201, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, AdhanForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getService(
                this, 202, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setFullScreenIntent(fullScreenPi, true)
                .setContentIntent(fullScreenPi)
                .addAction(android.R.drawable.ic_media_pause, "⏹️ توقف کامل صدا", stopPi)
                .build();

        startForeground(NOTIF_ID, notification);

        try {
            startActivity(fullScreenIntent);
        } catch (Exception ignored) {}

        triggerShortVibration();
        startAudioPlayback(soundType, adhanId, durationSeconds, volumePercent);

        return START_NOT_STICKY;
    }

    private void startAudioPlayback(String soundType, String adhanId, int durationSeconds, int volumePercent) {
        if ("silent".equals(soundType) || volumePercent <= 0) {
            return;
        }
        synchronized (PLAYER_LOCK) {
            try {
                MediaPlayer mp = new MediaPlayer();
                activePlayer = mp;
                mp.setAudioAttributes(
                        new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                                .build()
                );

                boolean loaded = false;
                File downloadedDir = new File(getFilesDir(), "adhans");
                File customMp3 = new File(downloadedDir, adhanId + ".mp3");
                File customOgg = new File(downloadedDir, adhanId + ".ogg");

                if (customMp3.exists() && customMp3.length() > 1024) {
                    mp.setDataSource(customMp3.getAbsolutePath());
                    loaded = true;
                } else if (customOgg.exists() && customOgg.length() > 1024) {
                    mp.setDataSource(customOgg.getAbsolutePath());
                    loaded = true;
                }

                if (!loaded) {
                    String[] candidates = new String[] {
                            "public/adhans/" + adhanId + ".mp3",
                            "public/adhans/" + adhanId + ".ogg",
                            "public/adhans/chant_salawat.mp3",
                            "public/adhans/mahur_saeed.ogg"
                    };
                    for (String path : candidates) {
                        try {
                            AssetFileDescriptor afd = getAssets().openFd(path);
                            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                            afd.close();
                            loaded = true;
                            break;
                        } catch (Exception ignored) {}
                    }
                }

                if (!loaded) {
                    int rawId = getResources().getIdentifier("adhan_mahur", "raw", getPackageName());
                    if (rawId != 0) {
                        AssetFileDescriptor afd = getResources().openRawResourceFd(rawId);
                        mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                        afd.close();
                        loaded = true;
                    }
                }

                if (!loaded) {
                    Uri fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                    mp.setDataSource(this, fallbackUri);
                }

                float vol = Math.max(0.05f, Math.min(1.0f, volumePercent / 100.0f));
                mp.setVolume(vol, vol);
                mp.setLooping(false);
                mp.setOnCompletionListener(player -> {
                    killActivePlayer(AdhanForegroundService.this);
                    sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
                    stopForeground(true);
                    stopSelf();
                });
                mp.prepare();
                mp.start();

                int maxSeconds = durationSeconds > 0 ? durationSeconds : ("short_10s".equals(soundType) ? 16 : 210);
                stopRunnable = () -> {
                    killActivePlayer(AdhanForegroundService.this);
                    sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
                    stopForeground(true);
                    stopSelf();
                };
                stopHandler.postDelayed(stopRunnable, maxSeconds * 1000L);
            } catch (Exception e) {
                killActivePlayer(this);
            }
        }
    }

    private void triggerShortVibration() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createWaveform(new long[]{0, 400, 250, 400}, -1));
                } else {
                    v.vibrate(600);
                }
            }
        } catch (Exception ignored) {}
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(
                        PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                        "noor:AdhanAlarmWakeLock"
                );
                wakeLock.acquire(4 * 60 * 1000L);
            }
        } catch (Exception ignored) {}
    }

    private void createAlarmChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "پخش تمام‌صفحه اذان و تواشیح نور",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("روشن شدن صفحه قفل و پخش اذان و ذکر قبل و بعد از اذان");
            channel.setSound(null, null);
            channel.enableVibration(true);
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        killActivePlayer(this);
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}