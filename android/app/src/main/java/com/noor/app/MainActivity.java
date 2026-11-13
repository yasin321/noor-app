package com.noor.app;

import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NoorAlarmPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView webView = this.bridge.getWebView();
                // شفاف کردن پس‌زمینه اولیه WebView تا طرح launch_splash.xml در ثانیه صفر دیده شود
                // و به محض رندر شدن index.html («نور آپدیت») بدون حتی ۱ فریم سبز خالی روی آن بنشیند!
                webView.setBackgroundColor(Color.TRANSPARENT);
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                WebSettings ws = webView.getSettings();
                ws.setCacheMode(WebSettings.LOAD_DEFAULT);
                ws.setDomStorageEnabled(true);
                ws.setDatabaseEnabled(true);
            }
        } catch (Exception ignored) {}
    }
}
