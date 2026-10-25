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
import android.os.IBinder;
import android.os.PowerManager;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class AdhanForegroundService extends Service {
    public static final String CHANNEL_ID = "NOOR_ALARM_FULLSCREEN_CHANNEL_V2";
    public static final int NOTIFICATION_ID = 7701;
    public static final String ACTION_STOP = "com.noor.app.ACTION_STOP_ADHAN_ALARM";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    public static volatile boolean isPlaying = false;

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel();
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "NoorApp::AdhanWakeLock"
            );
            wakeLock.acquire(8 * 60 * 1000L);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopAlarmAndCleanup();
            return START_NOT_STICKY;
        }

        String title = intent != null && intent.getStringExtra("title") != null
                ? intent.getStringExtra("title")
                : "یادآوری و اذان نور";
        String body = intent != null && intent.getStringExtra("body") != null
                ? intent.getStringExtra("body")
                : "وقت ذکر و نماز فرا رسیده است";
        String soundType = intent != null && intent.getStringExtra("soundType") != null
                ? intent.getStringExtra("soundType")
                : "adhan";

        Intent fullScreenIntent = new Intent(this, AdhanAlarmActivity.class);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent fullScreenPending = PendingIntent.getActivity(
                this, 201, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, AdhanForegroundService.class);
        stopIntent.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(
                this, 202, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_icon)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setFullScreenIntent(fullScreenPending, true)
                .addAction(android.R.drawable.ic_media_pause, "توقف صدا", stopPending)
                .build();

        startForeground(NOTIFICATION_ID, notification);

        try {
            startActivity(fullScreenIntent);
        } catch (Exception ignored) {}

        startAudio(soundType);
        return START_REDELIVER_INTENT;
    }

    private void startAudio(String soundType) {
        stopPlayer();
        try {
            mediaPlayer = new MediaPlayer();
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            mediaPlayer.setAudioAttributes(attrs);

            boolean loaded = false;
            if ("adhan".equalsIgnoreCase(soundType)) {
                int rawId = getResources().getIdentifier("adhan_mahur", "raw", getPackageName());
                if (rawId != 0) {
                    AssetFileDescriptor afd = getResources().openRawResourceFd(rawId);
                    if (afd != null) {
                        mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                        afd.close();
                        mediaPlayer.setLooping(false);
                        loaded = true;
                    }
                }
            }

            if (!loaded) {
                Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (alarmUri == null) {
                    alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                mediaPlayer.setDataSource(this, alarmUri);
                mediaPlayer.setLooping(true);
            }

            mediaPlayer.setOnCompletionListener(mp -> stopAlarmAndCleanup());
            mediaPlayer.prepare();
            mediaPlayer.start();
            isPlaying = true;
        } catch (Exception e) {
            e.printStackTrace();
            isPlaying = false;
        }
    }

    private void stopPlayer() {
        isPlaying = false;
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

    public void stopAlarmAndCleanup() {
        stopPlayer();
        Intent closeIntent = new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI);
        closeIntent.setPackage(getPackageName());
        sendBroadcast(closeIntent);
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        stopForeground(true);
        stopSelf();
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "آلارم تمام‌صفحه و اذان نور",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("روشن کردن صفحه قفل و پخش صدای اذان و یادآوری");
            channel.setSound(null, null);
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        stopPlayer();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
