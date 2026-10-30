package com.noor.app;

import android.graphics.Color;
import android.os.Bundle;
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
            getWindow().setBackgroundDrawableResource(android.R.color.black);
            getWindow().setStatusBarColor(Color.parseColor("#0a1f1a"));
            getWindow().setNavigationBarColor(Color.parseColor("#0f2922"));

            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setBackgroundColor(Color.parseColor("#0a1f1a"));
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                WebSettings ws = webView.getSettings();
                ws.setCacheMode(WebSettings.LOAD_DEFAULT);
                ws.setDomStorageEnabled(true);
                ws.setDatabaseEnabled(true);
                ws.setRenderPriority(WebSettings.RenderPriority.HIGH);
            }
        } catch (Exception ignored) {}
    }
}
