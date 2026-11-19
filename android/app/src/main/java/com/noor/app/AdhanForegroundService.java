package com.noor.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
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
    public static final String CHANNEL_ID = "noor_fullscreen_alarm_v7";
    public static final String ACTION_STOP = "com.noor.app.ACTION_STOP_ADHAN";
    private static final int NOTIF_ID = 88001;

    private static final Object PLAYER_LOCK = new Object();
    private static MediaPlayer activePlayer = null;
    private static final Handler stopHandler = new Handler(Looper.getMainLooper());
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
                    if (nm != null) nm.cancel(NOTIF_ID);
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
        if (intent != null && "ACTION_RESTORE_ALARMS".equals(intent.getAction())) {
            NoorAlarmPlugin.restorePersistedAlarms(this);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null && (ACTION_STOP.equals(intent.getAction()) || AdhanAlarmReceiver.ACTION_STOP.equals(intent.getAction()))) {
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
        float playbackRate = intent != null ? intent.getFloatExtra("playbackRate", 1.0f) : 1.0f;
        int volumePercent = intent != null ? intent.getIntExtra("volumePercent", 100) : 100;
        String audioUrl = intent != null ? intent.getStringExtra("audioUrl") : "";

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

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, notification);
        }

        if ("silent".equals(soundType) || "notification_only".equals(soundType) || volumePercent <= 0) {
            triggerShortVibration();
            try {
                Notification alertNotif = new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setCategory(NotificationCompat.CATEGORY_REMINDER)
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setAutoCancel(true)
                        .setContentIntent(fullScreenPi)
                        .build();
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIF_ID + 1, alertNotif);
            } catch (Exception ignored) {}
            stopForeground(Service.STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        try {
            startActivity(fullScreenIntent);
        } catch (Exception ignored) {}

        triggerShortVibration();
        startAudioPlayback(soundType, adhanId, audioUrl, durationSeconds, volumePercent, playbackRate);

        return START_NOT_STICKY;
    }

    private void startAudioPlayback(String soundType, String adhanId, String audioUrl, int durationSeconds, int volumePercent, float playbackRate) {
        if ("silent".equals(soundType) || volumePercent <= 0) {
            return;
        }
        if (adhanId == null || adhanId.trim().isEmpty()) {
            adhanId = "mahur_saeed";
        }
        adhanId = adhanId.replace("/adhans/", "").replace("public/adhans/" /* supports rabbana.mp3 and nadali_alifani.mp3 */ + "" + "", "").replace(".mp3", "").replace(".ogg", "").trim();
        if (adhanId.equals("post_surah_waqiah") || adhanId.equals("surah_waqiah") || adhanId.equals("waqiah")) adhanId = "post_waqiah";
        else if (adhanId.equals("post_surah_yasin") || adhanId.equals("surah_yasin") || adhanId.equals("yasin")) adhanId = "post_yasin";
        else if (adhanId.equals("post_surah_mulk") || adhanId.equals("surah_mulk") || adhanId.equals("mulk")) adhanId = "post_mulk";
        else if (adhanId.equals("post_surah_dhariyat") || adhanId.equals("surah_dhariyat") || adhanId.equals("dhariyat")) adhanId = "post_dhariyat";
        else if (adhanId.equals("post_surah_rahman") || adhanId.equals("surah_rahman") || adhanId.equals("rahman")) adhanId = "post_rahman";
        else if (adhanId.equals("post_surah_saffat") || adhanId.equals("surah_saffat") || adhanId.equals("saffat")) adhanId = "post_saffat";
        else if (adhanId.equals("post_ayat_kursi") || adhanId.equals("ayatul_kursi") || adhanId.equals("kursi")) adhanId = "post_kursi";
        else if (adhanId.equals("post_dhuhr_bahjat_rizq") || adhanId.equals("dua_after_adhan") || adhanId.equals("furqan")) adhanId = "post_furqan";
        else if (adhanId.equals("post_all_tasbihat_zahra") || adhanId.equals("tasbihat_pre") || adhanId.equals("tasbihat")) adhanId = "chant_tasbihat";
        else if (adhanId.equals("post_fajr_ya_fatima") || adhanId.equals("salawat_reza") || adhanId.equals("salawat")) adhanId = "chant_salawat";
        else if (adhanId.equals("post_asr_istighfar_qadi") || adhanId.equals("istighfar_pre") || adhanId.equals("istighfar")) adhanId = "chant_istighfar";
        else if (adhanId.equals("munajat_sahar") || adhanId.equals("aqim")) adhanId = "chant_aqim";
        else if (adhanId.equals("rabbana_shajarian") || adhanId.equals("rabbana") || adhanId.equals("chant_fatiha") || adhanId.equals("rabbanaghfir")) adhanId = "rabbana";
        else if (adhanId.equals("nadali_alifani") || adhanId.equals("nadali") || adhanId.equals("nad_ali")) adhanId = "nadali_alifani";
        boolean isPreOrPostChantOrSurah = adhanId.startsWith("post_") || adhanId.startsWith("chant_") || "surah_chant".equals(soundType);
        synchronized (PLAYER_LOCK) {
            try {
                MediaPlayer mp = new MediaPlayer();
                activePlayer = mp;
                mp.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
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
                    // AUTO_ADHAN_MAP_START
                    String mappedAssetPath = null;
                    if ("moazenzadeh_ardabili".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_01.mp3";
                    if ("ahlolbait_2".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_02.mp3";
                    if ("ahlolbait_3".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_03.mp3";
                    if ("ahlolbait_4".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_04.mp3";
                    if ("ahlolbait_5".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_05.mp3";
                    if ("ahlolbait_6".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_06.mp3";
                    if ("ahlolbait_7".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_07.mp3";
                    if ("ahlolbait_24".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_24.mp3";
                    if ("ahlolbait_31".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_31.mp3";
                    if ("mahur_saeed".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_01.mp3";
                    if (mappedAssetPath == null && adhanId != null && adhanId.startsWith("ahlolbait_")) {
                        String numPart = adhanId.replace("ahlolbait_", "").trim();
                        if (numPart.length() == 1) mappedAssetPath = "public/adhans/ahlolbait_0" + numPart + ".mp3";
                    }
                    String directAssetPath = null;
                    if (audioUrl != null && !audioUrl.trim().isEmpty()) {
                        String cleanUrl = audioUrl.trim();
                        if (cleanUrl.startsWith("/")) cleanUrl = cleanUrl.substring(1);
                        if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
                            directAssetPath = cleanUrl.startsWith("public/") ? cleanUrl : ("public/" + cleanUrl);
                        }
                    }
                    String fallbackTrack = isPreOrPostChantOrSurah ? "public/adhans/rabbana.mp3" : "public/adhans/ahlolbait_01.mp3";
                    String[] candidates = new String[] {
                            directAssetPath != null ? directAssetPath : "",
                            mappedAssetPath != null ? mappedAssetPath : "",
                            "public/adhans/" + adhanId + ".mp3",
                            "public/adhans/" + adhanId + ".ogg",
                            fallbackTrack
                    };
// AUTO_ADHAN_MAP_END
                    for (String path : candidates) {
                        if (path == null || path.isEmpty()) continue;
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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && playbackRate >= 0.5f && playbackRate <= 3.0f && Math.abs(playbackRate - 1.0f) > 0.04f) {
                try {
                    PlaybackParams params = new PlaybackParams();
                    params.setSpeed(playbackRate);
                    params.setPitch(1.0f);
                    mp.setPlaybackParams(params);
                } catch (Exception ignored) {}
            }

                // اگر کاربر حالت پخش کامل (durationSeconds <= 0) را انتخاب کرده یا اعلان قبل/بعد از اذان کامل است،
                // اجازه بده تا انتهای فایل صوتی (OnCompletionListener) به طور کامل پخش شود و زود قطع نشود!
                if (!isPreOrPostChantOrSurah && durationSeconds > 0 && "short_10s".equals(soundType)) {
                    stopRunnable = () -> {
                        killActivePlayer(AdhanForegroundService.this);
                        sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
                        stopForeground(true);
                        stopSelf();
                    };
                    stopHandler.postDelayed(stopRunnable, durationSeconds * 1000L);
                }
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
            channel.setDescription("روشن شدن صفحه قفل و پخش اذان، تواشیح قبل از اذان و تعقیبات");
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
