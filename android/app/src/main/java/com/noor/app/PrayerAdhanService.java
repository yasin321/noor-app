package com.noor.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

public class PrayerAdhanService extends Service {
    static final String ACTION_PLAY = "com.noor.app.action.PLAY_ADHAN";
    static final String ACTION_STOP = "com.noor.app.action.STOP_ADHAN";
    private static final String CHANNEL_ID = "noor-prayer-adhan";
    private MediaPlayer player;

    @Override public void onCreate() {
        super.onCreate();
        createChannel();
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || ACTION_STOP.equals(intent.getAction())) {
            stopPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }
        if (!ACTION_PLAY.equals(intent.getAction())) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String id = intent.getStringExtra("id");
        String title = intent.getStringExtra("title");
        String audioUrl = intent.getStringExtra("audioUrl");
        if (audioUrl == null || !audioUrl.startsWith("https://")) {
            android.util.Log.e("NoorAlarm", "AUDIO_ASSET_MISSING_OR_INVALID_URL");
            stopSelf();
            return START_NOT_STICKY;
        }

        Intent fullScreen = new Intent(this, PrayerAdhanActivity.class);
        fullScreen.putExtra("id", id);
        fullScreen.putExtra("title", title);
        fullScreen.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent fullScreenPending = PendingIntent.getActivity(this, 7001,
                fullScreen, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent stop = new Intent(this, PrayerAdhanService.class);
        stop.setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(this, 7002, stop,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_icon)
                .setContentTitle(title == null ? "وقت اذان" : title)
                .setContentText("در حال پخش اذان")
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setFullScreenIntent(fullScreenPending, true)
                .addAction(0, "توقف اذان", stopPending)
                .build();

        startForeground(7003, notification);
        startPlayback(audioUrl);
        return START_NOT_STICKY;
    }

    private void startPlayback(String url) {
        stopPlayback();
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build());
            player.setOnPreparedListener(mp -> mp.start());
            player.setOnCompletionListener(mp -> {
                stopPlayback();
                stopForeground(STOP_FOREGROUND_REMOVE);
                stopSelf();
            });
            player.setOnErrorListener((mp, what, extra) -> {
                android.util.Log.e("NoorAlarm", "ADHAN_PLAYBACK_FAILED what=" + what + " extra=" + extra);
                stopPlayback();
                stopForeground(STOP_FOREGROUND_REMOVE);
                stopSelf();
                return true;
            });
            player.setDataSource(url);
            player.prepareAsync();
        } catch (Exception e) {
            android.util.Log.e("NoorAlarm", "ADHAN_PLAYBACK_FAILED", e);
            stopPlayback();
            stopForeground(STOP_FOREGROUND_REMOVE);
            stopSelf();
        }
    }

    private void stopPlayback() {
        if (player != null) {
            try { if (player.isPlaying()) player.stop(); } catch (Exception ignored) {}
            try { player.reset(); player.release(); } catch (Exception ignored) {}
            player = null;
        }
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "اذان نماز",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("پخش اذان در وقت نماز");
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}