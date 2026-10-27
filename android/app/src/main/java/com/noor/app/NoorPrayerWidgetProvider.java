package com.noor.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class NoorPrayerWidgetProvider extends AppWidgetProvider {
    private static final String PREFS_NAME = "noor_widget_prefs";

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
            String savedTitle = prefs.getString("title", "🌿 دستیار معنوی نور");
            String savedNext = prefs.getString("nextPrayer", "اوقات شرعی و یادآور اذان");
            String savedSub = prefs.getString("subtitle", "برای مشاهده اوقات شرعی و تسبیح لمس کنید");

            AppWidgetManager gm = AppWidgetManager.getInstance(context);
            ComponentName cn = new ComponentName(context, NoorPrayerWidgetProvider.class);
            int[] ids = gm.getAppWidgetIds(cn);
            if (ids != null && ids.length > 0) {
                Intent intent = new Intent(context, MainActivity.class);
                PendingIntent pendingIntent = PendingIntent.getActivity(
                    context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                for (int appWidgetId : ids) {
                    RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.noor_prayer_widget);
                    views.setTextViewText(R.id.widget_title, savedTitle);
                    views.setTextViewText(R.id.widget_next_prayer, savedNext);
                    views.setTextViewText(R.id.widget_subtitle, savedSub);
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
