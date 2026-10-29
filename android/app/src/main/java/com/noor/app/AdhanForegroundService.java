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
import android.media.AudioManager;
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
    public static final String ACTION_STOP = "com.noor.app.STOP_ADHAN";
    public static final String CHANNEL_ID = "noor_adhan_fullscreen_channel_v5";
    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private final Handler stopHandler = new Handler(Looper.getMainLooper());
    private final Runnable stopRunnable = this::stopSelf;

    @Override
    public void onCreate() {
        super.onCreate();
        createHighPriorityChannel();
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                    "NoorApp::AdhanWakeLock"
            );
            wakeLock.acquire(5 * 60 * 1000L);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && (AdhanAlarmReceiver.ACTION_STOP.equals(intent.getAction()) || ACTION_STOP.equals(intent.getAction()))) {
            sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
            stopSelf();
            return START_NOT_STICKY;
        }

        String title = intent != null && intent.getStringExtra("title") != null
                ? intent.getStringExtra("title") : "وقت اذان و نیایش";
        String body = intent != null && intent.getStringExtra("body") != null
                ? intent.getStringExtra("body") : "حَیَّ عَلَی الصَّلَاة — وقت نماز فرا رسیده است";
        String soundType = intent != null && intent.getStringExtra("soundType") != null
                ? intent.getStringExtra("soundType") : "adhan";
        String adhanId = intent != null && intent.getStringExtra("adhanId") != null
                ? intent.getStringExtra("adhanId") : "mahur_saeed";
        int durationSeconds = intent != null ? intent.getIntExtra("durationSeconds", 0) : 0;

        Intent fullScreenIntent = new Intent(this, AdhanAlarmActivity.class);
        fullScreenIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this, 2001, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openAppPendingIntent = PendingIntent.getActivity(
                this, 2003, openAppIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, AdhanAlarmReceiver.class);
        stopIntent.setAction(AdhanAlarmReceiver.ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
                this, 2002, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_icon)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(true)
                .setContentIntent(fullScreenPendingIntent)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .addAction(android.R.drawable.ic_lock_silent_mode_off, "باز کردن برنامه", openAppPendingIntent)
                .addAction(android.R.drawable.ic_media_pause, "توقف اذان", stopPendingIntent)
                .build();

        startForeground(3001, notification);

        triggerVibration();
        startAudioPlayback(soundType, adhanId, durationSeconds);

        try {
            startActivity(fullScreenIntent);
        } catch (Exception ignored) {}

        return START_STICKY;
    }

    private void triggerVibration() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createWaveform(new long[]{0, 500, 300, 500}, -1));
                } else {
                    v.vibrate(1000);
                }
            }
        } catch (Exception ignored) {}
    }

    private void startAudioPlayback(String soundType, String adhanId, int durationSeconds) {
        stopAudioPlayback();
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                int curVol = am.getStreamVolume(AudioManager.STREAM_ALARM);
                if (curVol < maxVol / 2) {
                    am.setStreamVolume(AudioManager.STREAM_ALARM, (int) (maxVol * 0.85), 0);
                }
            }

            mediaPlayer = new MediaPlayer();
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(attrs);

            if ("adhan".equals(soundType) || "short_10s".equals(soundType)) {
                boolean sourceSet = false;
                File downloadedFile = new File(new File(getFilesDir(), "adhans"), adhanId + ".mp3");
                if (downloadedFile.exists() && downloadedFile.length() > 15000 && downloadedFile.length() != 2289817L) {
                    try {
                        mediaPlayer.setDataSource(downloadedFile.getAbsolutePath());
                        sourceSet = true;
                    } catch (Exception ignored) {}
                }
                if (!sourceSet && !"mahur_saeed".equals(adhanId)) {
                    try {
                        AssetFileDescriptor afd = getAssets().openFd("public/adhans/" + adhanId + ".mp3");
                        mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                        afd.close();
                        sourceSet = true;
                    } catch (Exception ignored) {}
                }
                if (!sourceSet) {
                    Uri rawUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.adhan_mahur);
                    mediaPlayer.setDataSource(this, rawUri);
                }
                mediaPlayer.setLooping(false);
                mediaPlayer.setOnCompletionListener(mp -> {
                    sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
                    stopSelf();
                });
            } else {
                Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (alarmUri == null) {
                    alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                mediaPlayer.setDataSource(this, alarmUri);
                mediaPlayer.setLooping(false);
            }

            mediaPlayer.prepare();
            mediaPlayer.setVolume(1.0f, 1.0f);
            mediaPlayer.start();

            int limitSec = "short_10s".equals(soundType) ? 10 : durationSeconds;
            if (limitSec > 0) {
                stopHandler.removeCallbacks(stopRunnable);
                stopHandler.postDelayed(() -> {
                    sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
                    stopSelf();
                }, limitSec * 1000L);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopAudioPlayback() {
        stopHandler.removeCallbacks(stopRunnable);
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
            } catch (Exception ignored) {}
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    private void createHighPriorityChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "پخش اذان و آلارم تمام‌صفحه نور",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("پخش خودکار اذان و روشن شدن صفحه در وقت نماز");
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
        stopAudioPlayback();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
