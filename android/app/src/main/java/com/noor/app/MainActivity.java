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
            getWindow().getDecorView().setBackgroundColor(Color.parseColor("#041511"));
            if (this.bridge != null && this.bridge.getWebView() != null) {
                WebView webView = this.bridge.getWebView();
                webView.setBackgroundColor(Color.parseColor("#041511"));
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                WebSettings ws = webView.getSettings();
                ws.setCacheMode(WebSettings.LOAD_DEFAULT);
                ws.setDomStorageEnabled(true);
                ws.setDatabaseEnabled(true);
            }
        } catch (Exception ignored) {}
    }
}
