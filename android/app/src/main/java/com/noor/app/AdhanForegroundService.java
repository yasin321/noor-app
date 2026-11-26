package com.noor.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
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
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import java.io.File;

public class AdhanForegroundService extends Service {
    public static final String CHANNEL_ID = "noor_fullscreen_alarm_v8";
    public static final String ACTION_STOP = "com.noor.app.ACTION_STOP_ADHAN";
    private static final int NOTIF_ID = 88001;

    private static final Object PLAYER_LOCK = new Object();
    private static MediaPlayer activePlayer = null;
    private static final Handler stopHandler = new Handler(Looper.getMainLooper());
    private static Runnable stopRunnable = null;
    private PowerManager.WakeLock wakeLock;
    private BroadcastReceiver hardwareStopReceiver = null;
    private long alarmStartElapsedMs = 0L;

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
            stopAlarmAndCloseUi();
            return START_NOT_STICKY;
        }

        killActivePlayer(this);

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
                : "ahlolbait_30";
        int durationSeconds = intent != null ? intent.getIntExtra("durationSeconds", 0) : 0;
        float playbackRate = intent != null ? intent.getFloatExtra("playbackRate", 1.0f) : 1.0f;
        int volumePercent = intent != null ? intent.getIntExtra("volumePercent", 100) : 100;
        String audioUrl = intent != null ? intent.getStringExtra("audioUrl") : "";

        boolean isLongSurah = "surah_chant".equals(soundType) || adhanId.startsWith("full_surah_");
        // فقط PARTIAL_WAKE_LOCK می‌گیریم تا پیش از ثبت FullScreenIntent نمایشگر روشن نشود و اندروید ۱۵ صفحه آلارم را بالا بیاورد
        acquireCpuWakeLock(isLongSurah);

        Intent fullScreenIntent = new Intent(this, AdhanAlarmActivity.class);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);
        fullScreenIntent.putExtra("soundType", soundType);
        fullScreenIntent.putExtra("adhanId", adhanId);
        fullScreenIntent.putExtra("playbackRate", playbackRate);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent fullScreenPi = PendingIntent.getActivity(
                this, 201, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // استفاده از Broadcast برای دکمه توقف نوتیفیکیشن (۱۰۰٪ پایدار در اندروید ۱۴، ۱۵ و ۱۶)
        Intent stopIntent = new Intent(this, AdhanAlarmReceiver.class);
        stopIntent.setAction(AdhanAlarmReceiver.ACTION_STOP);
        PendingIntent stopPi = PendingIntent.getBroadcast(
                this, 202, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body + "\n(فشردن ولوم یا قفل گوشی = توقف فوری)"))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setFullScreenIntent(fullScreenPi, true)
                .setContentIntent(fullScreenPi)
                .setDeleteIntent(stopPi)
                .addAction(android.R.drawable.ic_media_pause, "⏹️ توقف کامل صدا", stopPi)
                .build();

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIF_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIF_ID, notification);
            }
        } catch (Exception e) {
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.notify(NOTIF_ID, notification);
            } catch (Exception ignored) {}
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
            releaseWakeLocks();
            stopForeground(Service.STOP_FOREGROUND_REMOVE);
            stopSelf();
            return START_NOT_STICKY;
        }

        // در اندروید ۹ و پایین‌تر باز کردن مستقیم اکتیویتی؛ در اندروید ۱۰ تا ۱۶ خود FullScreenIntent پس از startForeground آن را باز می‌کند
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            try {
                startActivity(fullScreenIntent);
            } catch (Exception ignored) {}
        }

        alarmStartElapsedMs = SystemClock.elapsedRealtime();
        registerHardwareStopReceiver();
        triggerShortVibration();
        startAudioPlayback(soundType, adhanId, audioUrl, durationSeconds, volumePercent, playbackRate);

        return START_NOT_STICKY;
    }

    // گوش دادن سراسری به دکمه قفل/پاور (ACTION_SCREEN_OFF) و دکمه‌های ولوم صدا حتی وقتی صفحه آلارم بالا نباشد
    private void registerHardwareStopReceiver() {
        unregisterHardwareStopReceiver();
        hardwareStopReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null) return;
                String action = intent.getAction();
                long elapsed = SystemClock.elapsedRealtime() - alarmStartElapsedMs;
                if (Intent.ACTION_SCREEN_OFF.equals(action) && elapsed >= 1200L) {
                    stopAlarmAndCloseUi();
                } else if ("android.media.VOLUME_CHANGED_ACTION".equals(action) && elapsed >= 700L) {
                    stopAlarmAndCloseUi();
                }
            }
        };
        try {
            IntentFilter filter = new IntentFilter();
            filter.addAction(Intent.ACTION_SCREEN_OFF);
            filter.addAction("android.media.VOLUME_CHANGED_ACTION");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(hardwareStopReceiver, filter, Context.RECEIVER_EXPORTED);
            } else {
                registerReceiver(hardwareStopReceiver, filter);
            }
        } catch (Exception ignored) {}
    }

    private void unregisterHardwareStopReceiver() {
        if (hardwareStopReceiver != null) {
            try {
                unregisterReceiver(hardwareStopReceiver);
            } catch (Exception ignored) {}
            hardwareStopReceiver = null;
        }
    }

    private void startAudioPlayback(
            String soundType,
            String adhanId,
            String audioUrl,
            int durationSeconds,
            int volumePercent,
            float playbackRate
    ) {
        if ("silent".equals(soundType) || volumePercent <= 0) {
            return;
        }
        if (adhanId == null || adhanId.trim().isEmpty()) {
            adhanId = "ahlolbait_30";
        }
        adhanId = adhanId
                .replace("/adhans/", "")
                .replace("public/adhans/", "")
                .replace(".mp3", "")
                .replace(".ogg", "")
                .trim();

        if (adhanId.equals("salawat_zarrab_esfahani") || adhanId.equals("zarrab_esfahani") || adhanId.equals("zarrab")) adhanId = "post_zarrab_esfahani";
        else if (adhanId.equals("post_surah_waqiah") || adhanId.equals("surah_waqiah") || adhanId.equals("waqiah")) adhanId = "post_waqiah";
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

        boolean isPreOrPostChantOrSurah =
                adhanId.startsWith("full_surah_") ||
                adhanId.startsWith("post_") ||
                adhanId.startsWith("chant_") ||
                adhanId.startsWith("surah_") ||
                "surah_chant".equals(soundType);

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
                    String mappedAssetPath = null;
                    if ("post_zarrab_esfahani".equals(adhanId)) mappedAssetPath = "public/adhans/post_zarrab_esfahani.mp3";
                    if ("ahlolbait_30".equals(adhanId)) mappedAssetPath = "public/adhans/ahlolbait_30.mp3";
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
                    if (mappedAssetPath == null && adhanId.startsWith("ahlolbait_")) {
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

                    String[] candidates = new String[] {
                            directAssetPath != null ? directAssetPath : "",
                            mappedAssetPath != null ? mappedAssetPath : "",
                            "public/adhans/" + adhanId + ".mp3",
                            "public/adhans/" + adhanId + ".ogg"
                    };

                    for (String assetPath : candidates) {
                        if (assetPath == null || assetPath.isEmpty()) continue;
                        try {
                            AssetFileDescriptor afd = getAssets().openFd(assetPath);
                            mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                            afd.close();
                            loaded = true;
                            break;
                        } catch (Exception ignored) {}
                    }
                }

                boolean usingRemoteStream = false;
                if (!loaded && audioUrl != null && (audioUrl.startsWith("http://") || audioUrl.startsWith("https://"))) {
                    try {
                        mp.setDataSource(audioUrl.trim());
                        loaded = true;
                        usingRemoteStream = true;
                    } catch (Exception ignored) {}
                }

                if (!loaded) {
                    String emergencyAsset = isPreOrPostChantOrSurah
                            ? "public/adhans/rabbana.mp3"
                            : "public/adhans/ahlolbait_01.mp3";
                    try {
                        AssetFileDescriptor afd = getAssets().openFd(emergencyAsset);
                        mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                        afd.close();
                        loaded = true;
                    } catch (Exception ignored) {}
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
                mp.setOnCompletionListener(player -> stopAlarmAndCloseUi());

                final float safeRate = playbackRate;
                final Runnable applyRateAndStart = () -> {
                    synchronized (PLAYER_LOCK) {
                        if (activePlayer != mp) {
                            try { mp.release(); } catch (Exception ignored) {}
                            return;
                        }
                        try {
                            mp.start();
                            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && safeRate >= 0.5f && safeRate <= 3.0f && Math.abs(safeRate - 1.0f) > 0.04f) {
                                PlaybackParams params = mp.getPlaybackParams();
                                params.setSpeed(safeRate);
                                params.setPitch(1.0f);
                                mp.setPlaybackParams(params);
                            }
                        } catch (Exception ignored) {}
                    }
                };

                if (usingRemoteStream) {
                    mp.setOnPreparedListener(player -> applyRateAndStart.run());
                    mp.setOnErrorListener((player, what, extra) -> {
                        synchronized (PLAYER_LOCK) {
                            if (activePlayer != mp) return true;
                            try {
                                mp.reset();
                                AssetFileDescriptor afd = getAssets().openFd("public/adhans/post_kursi.mp3");
                                mp.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                                afd.close();
                                mp.prepare();
                                applyRateAndStart.run();
                            } catch (Exception ignored) {
                                stopAlarmAndCloseUi();
                            }
                        }
                        return true;
                    });
                    mp.prepareAsync();
                } else {
                    mp.prepare();
                    applyRateAndStart.run();
                }

                if (!isPreOrPostChantOrSurah && durationSeconds > 0) {
                    stopRunnable = () -> stopAlarmAndCloseUi();
                    stopHandler.postDelayed(stopRunnable, durationSeconds * 1000L);
                }
            } catch (Exception e) {
                stopAlarmAndCloseUi();
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

    private void stopAlarmAndCloseUi() {
        unregisterHardwareStopReceiver();
        killActivePlayer(this);
        releaseWakeLocks();
        try {
            Intent closeUi = new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI);
            closeUi.setPackage(getPackageName());
            sendBroadcast(closeUi);
        } catch (Exception ignored) {}
        try {
            stopForeground(Service.STOP_FOREGROUND_REMOVE);
        } catch (Exception ignored) {}
        stopSelf();
    }

    private void releaseWakeLocks() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception ignored) {}
        wakeLock = null;
    }

    private void acquireCpuWakeLock(boolean isLongSurah) {
        releaseWakeLocks();
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                long cpuDurationMs = isLongSurah ? (35 * 60 * 1000L) : (6 * 60 * 1000L);
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "noor:AdhanAudioCpuWakeLock");
                wakeLock.acquire(cpuDurationMs);
            }
        } catch (Exception ignored) {}
    }

    private void createAlarmChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "پخش تمام‌صفحه اذان و سوره نور",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("نمایش تمام‌صفحه روی قفل گوشی و پخش اذان، تواشیح و تلاوت سوره‌ها");
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
        unregisterHardwareStopReceiver();
        killActivePlayer(this);
        releaseWakeLocks();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
