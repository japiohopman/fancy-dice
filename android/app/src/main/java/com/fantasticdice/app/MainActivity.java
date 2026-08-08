package com.fantasticdice.app;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity implements SensorEventListener {
    private SensorManager sensorManager;
    private float accelCurrent = SensorManager.GRAVITY_EARTH;
    private float accelLast = SensorManager.GRAVITY_EARTH;
    private float shakeThreshold = 12.0f;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (sensorManager != null) {
            sensorManager.registerListener(
                this,
                sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER),
                SensorManager.SENSOR_DELAY_GAME
            );
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        float x = event.values[0];
        float y = event.values[1];
        float z = event.values[2];

        accelLast = accelCurrent;
        accelCurrent = (float) Math.sqrt((double) (x * x + y * y + z * z));
        float delta = accelCurrent - accelLast;

        if (delta > shakeThreshold) {
            // Dispatch custom event to WebGL Javascript context
            bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    bridge.getWebView().evaluateJavascript("window.dispatchEvent(new Event('devicemotion'));", null);
                }
            });
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
