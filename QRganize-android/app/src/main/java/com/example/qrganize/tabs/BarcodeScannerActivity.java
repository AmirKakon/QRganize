package com.example.qrganize.tabs;

import android.Manifest;
import android.media.Image;
import android.os.Bundle;
import android.os.Vibrator;
import android.util.Log;
import android.view.Surface;
import android.widget.TextView;

import androidx.annotation.OptIn;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ExperimentalGetImage;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.example.qrganize.container.ContainerModel;
import com.example.qrganize.item.ItemModel;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.gson.Gson;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.ReaderException;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;

import java.nio.ByteBuffer;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class BarcodeScannerActivity extends AppCompatActivity {

    private PreviewView previewView;
    private TextView textView;
    private Vibrator vibrator;

    private ExecutorService cameraExecutor;
    private ProcessCameraProvider cameraProvider;
    private boolean isScanCompleted = false;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_barcode_scanner);

        previewView = findViewById(R.id.previewView);
        textView = findViewById(R.id.text);
        textView.setText(R.string.scan_barcode_title);
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE); // Initialize Vibrator

        cameraExecutor = Executors.newSingleThreadExecutor();

        requestCameraPermission(); // Request camera permission when the fragment is created

        startCamera();
    }

    private void requestCameraPermission() {
        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();

                // Set up the preview use case
                Preview preview = new Preview.Builder()
//                        .setTargetRotation(Surface.ROTATION_90)
                         .build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                // Set up the analysis use case
                ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .build();
                imageAnalysis.setAnalyzer(cameraExecutor, imageProxy -> {
                    scanBarcode(imageProxy);
                });

                // Select back camera as the default
                CameraSelector cameraSelector = new CameraSelector.Builder()
                        .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                        .build();

                // Bind the use cases to the lifecycle
                cameraProvider.unbindAll();
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageAnalysis);
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    @OptIn(markerClass = ExperimentalGetImage.class) private void scanBarcode(ImageProxy imageProxy) {
        if (!isScanCompleted) { // Check if a scan has already been performed
            Image image = imageProxy.getImage();
            if (image != null) {
                int rotationDegrees = imageProxy.getImageInfo().getRotationDegrees();
                int width = image.getWidth();
                int height = image.getHeight();

                ByteBuffer byteBuffer = image.getPlanes()[0].getBuffer();
                byte[] data = new byte[byteBuffer.remaining()];
                byteBuffer.get(data);

                byte[] rotatedData = rotateImageData(data, width, height, rotationDegrees);

                try {
                    PlanarYUVLuminanceSource source = new PlanarYUVLuminanceSource(rotatedData, width, height, 0, 0, width, height, false);
                    BinaryBitmap binaryBitmap = new BinaryBitmap(new HybridBinarizer(source));
                    MultiFormatReader reader = new MultiFormatReader();
                    Result result = reader.decode(binaryBitmap);
                    // Update the TextView with the decoded result
                    this.runOnUiThread(() -> {
                        isScanCompleted = true;
                        getItemByBarcode(result.getText());
                        // Vibrate when code is scanned
                        vibrate();
                    });
                } catch (ReaderException e) {
                    Log.e("BarcodeScanner", "Error decoding barcode", e);
                } finally {
                    imageProxy.close();
                }
            }
        }
    }

    private void getItemByBarcode(String barcode) {
        ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
        String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/items/searchBarcode/" + barcode;

        apiClient.Post(url, null, new ApiClient.ApiResponseListener<ApiResponse>() {
            @Override
            public void onSuccess(ApiResponse response) {
                Gson gson = new Gson();
                ItemModel itemModel = gson.fromJson(response.getData().toString(), ItemModel.class);
                textView.setText(itemModel.getName());
            }

            @Override
            public void onError(String errorMessage) {
                textView.setText("ERROR");
            }
        });
    }

    private void vibrate() {
        if (vibrator != null) {
            vibrator.vibrate(100); // Vibrate for 100 milliseconds
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (vibrator != null) {
            vibrator.cancel(); // Cancel vibration when fragment is destroyed
        }
        cameraExecutor.shutdown();
    }

    private byte[] rotateImageData(byte[] data, int width, int height, int rotationDegrees) {
        // Perform rotation based on rotation degrees
        if (rotationDegrees == 90) {
            return rotate90(data, width, height);
        } else if (rotationDegrees == 180) {
            return rotate180(data, width, height);
        } else if (rotationDegrees == 270) {
            return rotate270(data, width, height);
        } else {
            // No rotation needed
            return data;
        }
    }

    private byte[] rotate90(byte[] data, int width, int height) {
        byte[] rotatedData = new byte[data.length];
        int k = 0;
        for (int i = width - 1; i >= 0; i--) {
            for (int j = 0; j < height; j++) {
                rotatedData[k] = data[j * width + i];
                k++;
            }
        }
        return rotatedData;
    }

    private byte[] rotate180(byte[] data, int width, int height) {
        byte[] rotatedData = new byte[data.length];
        int k = 0;
        for (int i = width * height - 1; i >= 0; i--) {
            rotatedData[k] = data[i];
            k++;
        }
        return rotatedData;
    }

    private byte[] rotate270(byte[] data, int width, int height) {
        byte[] rotatedData = new byte[data.length];
        int k = 0;
        for (int i = 0; i < width; i++) {
            for (int j = height - 1; j >= 0; j--) {
                rotatedData[k] = data[j * width + i];
                k++;
            }
        }
        return rotatedData;
    }
}
