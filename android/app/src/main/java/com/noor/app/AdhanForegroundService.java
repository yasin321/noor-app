package com.noor.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import java.io.File;

public class AdhanForegroundService extends Service {
    public static final String ACTION_STOP = "com.noor.app.STOP_ADHAN";
    public static final String CHANNEL_ID = "noor_adhan_fullscreen_channel_v3";
    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private final Handler stopHandler = new Handler(Looper.getMainLooper());
    private final Runnable stopRunnable = new Runnable() {
        @Override
        public void run() {
            stopSelf();
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        createHighPriorityChannel();
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "NoorApp::AdhanWakeLock"
            );
            wakeLock.setReferenceCounted(false);
            wakeLock.acquire(5 * 60 * 1000L);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && (AdhanAlarmReceiver.ACTION_STOP.equals(intent.getAction()) || ACTION_STOP.equals(intent.getAction()))) {
            sendBroadcast(new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI));
            notifyCloseActivity();
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
        int volumePercent = intent != null ? intent.getIntExtra("volumePercent", 90) : 90;

        Intent fullScreenIntent = new Intent(this, AdhanAlarmActivity.class);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("title", title);
        fullScreenIntent.putExtra("body", body);

        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this, 2001, fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(this, AdhanAlarmReceiver.class);
        stopIntent.setAction(AdhanAlarmReceiver.ACTION_STOP);
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(
                this, 2002, stopIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.noor_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .addAction(android.R.drawable.ic_media_pause, "توقف صدا", stopPendingIntent)
                .build();

        startForeground(3001, notification);

        if (!"silent".equals(soundType)) {
            startAudioPlayback(soundType, adhanId, volumePercent, durationSeconds);
        } else {
            stopHandler.removeCallbacks(stopRunnable);
            stopHandler.postDelayed(stopRunnable, 15000L);
        }

        try {
            startActivity(fullScreenIntent);
        } catch (Exception ignored) {}

        return START_NOT_STICKY;
    }

    private void requestAlarmAudioFocus(AudioAttributes attrs) {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                        .setAudioAttributes(attrs)
                        .setOnAudioFocusChangeListener(new AudioManager.OnAudioFocusChangeListener() {
                            @Override
                            public void onAudioFocusChange(int focusChange) {
                                if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                                    stopSelf();
                                }
                            }
                        })
                        .build();
                audioManager.requestAudioFocus(focusRequest);
            }
        } catch (Exception ignored) {}
    }

    private void abandonAlarmAudioFocus() {
        if (audioManager == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
                audioManager.abandonAudioFocusRequest(focusRequest);
            }
        } catch (Exception ignored) {}
    }

    private void startAudioPlayback(String soundType, String adhanId, int volumePercent, int durationSeconds) {
        stopAudioPlayback();
        try {
            mediaPlayer = new MediaPlayer();
            AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            mediaPlayer.setAudioAttributes(attrs);
            requestAlarmAudioFocus(attrs);

            float vol = Math.max(0.05f, Math.min(1.0f, volumePercent / 100.0f));

            boolean isAdhanVoice = "adhan".equals(soundType)
                    || "full_adhan".equals(soundType)
                    || "short_10s".equals(soundType);

            if (isAdhanVoice) {
                File downloadedFile = new File(new File(getFilesDir(), "adhans"), adhanId + ".mp3");
                if (downloadedFile.exists() && downloadedFile.length() > 4096) {
                    mediaPlayer.setDataSource(downloadedFile.getAbsolutePath());
                } else {
                    Uri rawUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.adhan_mahur);
                    mediaPlayer.setDataSource(this, rawUri);
                }
                mediaPlayer.setLooping(false);
                mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                    @Override
                    public void onCompletion(MediaPlayer mp) {
                        stopSelf();
                    }
                });
            } else {
                Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (alarmUri == null) {
                    alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                }
                mediaPlayer.setDataSource(this, alarmUri);
                int fallbackSec = "short_beep".equals(soundType) ? 6 : durationSeconds;
                mediaPlayer.setLooping(fallbackSec <= 0);
                if (fallbackSec > 0) {
                    durationSeconds = fallbackSec;
                }
            }

            mediaPlayer.prepare();
            mediaPlayer.setVolume(vol, vol);
            mediaPlayer.start();

            int limitSec = "short_10s".equals(soundType) ? 10 : durationSeconds;
            if (limitSec > 0) {
                stopHandler.removeCallbacks(stopRunnable);
                stopHandler.postDelayed(stopRunnable, limitSec * 1000L);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void stopAudioPlayback() {
        stopHandler.removeCallbacks(stopRunnable);
        abandonAlarmAudioFocus();
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

    private void notifyCloseActivity() {
        try {
            Intent closeIntent = new Intent(AdhanAlarmActivity.ACTION_CLOSE_UI);
            closeIntent.setPackage(getPackageName());
            sendBroadcast(closeIntent);
        } catch (Exception ignored) {}
    }

    private void createHighPriorityChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "آلارم تمام‌صفحه و اذان نور",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("پخش اذان با صدای مؤذن انتخابی و بیدار کردن صفحه قفل");
            channel.setSound(null, null);
            channel.enableVibration(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        stopAudioPlayback();
        notifyCloseActivity();
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {}
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
