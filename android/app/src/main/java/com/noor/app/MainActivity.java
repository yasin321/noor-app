package com.noor.app;

import android.graphics.Color;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NoorAlarmPlugin.class);
        super.onCreate(savedInstanceState);
        try {
            getWindow().getDecorView().setBackgroundColor(Color.parseColor("#062E22"));
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setBackgroundColor(Color.parseColor("#062E22"));
            }
        } catch (Exception ignored) {}
    }
}
