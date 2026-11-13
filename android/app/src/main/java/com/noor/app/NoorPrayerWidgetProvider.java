package com.noor.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.util.Calendar;

public class NoorPrayerWidgetProvider extends AppWidgetProvider {
    private static final String PREFS_NAME = "noor_widget_prefs";

    // تولید هوشمند ذکر متناسب با روز هفته و ساعت شبانه‌روز به صورت خودکار
    public static String getDynamicHourlyAndDailyDhikr() {
        Calendar cal = Calendar.getInstance();
        int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
        int hour = cal.get(Calendar.HOUR_OF_DAY);

        String dayDhikr;
        String dayName;
        switch (dayOfWeek) {
            case Calendar.SATURDAY:
                dayName = "شنبه";
                dayDhikr = "يَا رَبَّ الْعَالَمِينَ";
                break;
            case Calendar.SUNDAY:
                dayName = "یکشنبه";
                dayDhikr = "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ";
                break;
            case Calendar.MONDAY:
                dayName = "دوشنبه";
                dayDhikr = "يَا قَاضِيَ الْحَاجَاتِ";
                break;
            case Calendar.TUESDAY:
                dayName = "سه‌شنبه";
                dayDhikr = "يَا أَرْحَمَ الرَّاحِمِينَ";
                break;
            case Calendar.WEDNESDAY:
                dayName = "چهارشنبه";
                dayDhikr = "يَا حَيُّ يَا قَيُّومُ";
                break;
            case Calendar.THURSDAY:
                dayName = "پنجشنبه";
                dayDhikr = "لَا إِلَهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ";
                break;
            case Calendar.FRIDAY:
            default:
                dayName = "جمعه";
                dayDhikr = "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَآلِ مُحَمَّدٍ وَعَجِّلْ فَرَجَهُمْ";
                break;
        }

        String timeMoment;
        if (hour >= 3 && hour < 6) {
            timeMoment = "🌌 ذکر سحر و صبح: اللَّهُمَّ بَارِكْ لِمَوْلَانَا صَاحِبِ الزَّمَانِ";
        } else if (hour >= 6 && hour < 11) {
            timeMoment = "☀️ ذکر آغاز روز (" + dayName + "): " + dayDhikr + " (۱۰۰ مرتبه)";
        } else if (hour >= 11 && hour < 15) {
            timeMoment = "🕌 وقت فضیلت ظهر (" + dayName + "): " + dayDhikr;
        } else if (hour >= 15 && hour < 18) {
            timeMoment = "🌿 ذکر عصرگاهی: أَسْتَغْفِرُ اللَّهَ رَبِّي وَأَتُوبُ إِلَيْهِ";
        } else if (hour >= 18 && hour < 21) {
            timeMoment = "🌙 ذکر شامگاه (" + dayName + "): " + dayDhikr;
        } else {
            timeMoment = "✨ پیش از خواب: سوره مبارکه واقعه و تسبیحات حضرت زهرا (س)";
        }
        return timeMoment;
    }

    public static void pushWidgetUpdate(Context context, String title, String nextPrayer, String subtitle) {
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            if (title != null && nextPrayer != null && subtitle != null) {
                prefs.edit()
                    .putString("title", title)
                    .putString("nextPrayer", nextPrayer)
                    .putString("subtitle", subtitle)
                    .apply();
            }
            String savedTitle = prefs.getString("title", "📍 به افق شهر شما");
            String savedNext = prefs.getString("nextPrayer", "اذان بعدی: در حال محاسبه");
            String savedSub = prefs.getString("subtitle", "همراه معنوی نور");
            String fajr = prefs.getString("fajr", "۰۴:۵۵");
            String sunrise = prefs.getString("sunrise", "۰۶:۲۰");
            String dhuhr = prefs.getString("dhuhr", "۱۱:۵۰");
            String maghrib = prefs.getString("maghrib", "۱۷:۲۵");
            String midnight = prefs.getString("midnight", "۲۳:۰۵");

            AppWidgetManager gm = AppWidgetManager.getInstance(context);
            ComponentName cn = new ComponentName(context, NoorPrayerWidgetProvider.class);
            int[] ids = gm.getAppWidgetIds(cn);
            if (ids != null && ids.length > 0) {
                Intent intent = new Intent(context, MainActivity.class);
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                String dynamicDhikr = getDynamicHourlyAndDailyDhikr();
                for (int appWidgetId : ids) {
                    RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.noor_prayer_widget);
                    views.setTextViewText(R.id.widget_title, savedTitle);
                    views.setTextViewText(R.id.widget_next_prayer, savedNext);
                    views.setTextViewText(R.id.widget_subtitle, savedSub);
                    views.setTextViewText(R.id.widget_time_fajr, fajr);
                    views.setTextViewText(R.id.widget_time_sunrise, sunrise);
                    views.setTextViewText(R.id.widget_time_dhuhr, dhuhr);
                    views.setTextViewText(R.id.widget_time_maghrib, maghrib);
                    views.setTextViewText(R.id.widget_time_midnight, midnight);
                    views.setTextViewText(R.id.widget_dynamic_dhikr, dynamicDhikr);
                    views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
                    gm.updateAppWidget(appWidgetId, views);
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        pushWidgetUpdate(context, null, null, null);
    }
}
