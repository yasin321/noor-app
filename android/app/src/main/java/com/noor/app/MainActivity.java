package com.noor.app;

import android.os.Bundle;
import android.graphics.Color;
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
                webView.setBackgroundColor(Color.parseColor("#041511"));
            }
            getWindow().getDecorView().setBackgroundColor(Color.parseColor("#041511"));
        } catch (Exception ignored) {}
    }
}
