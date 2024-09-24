package com.example.qrganize.tabs;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Vibrator;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.example.qrganize.R;
import com.example.qrganize.container.ContainerActivity;
import com.google.common.util.concurrent.ListenableFuture;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;

import java.nio.ByteBuffer;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class BarcodeScannerFragment extends Fragment {
    private PreviewView previewView;
    private TextView textView;
    private Vibrator vibrator;

    private ExecutorService cameraExecutor;
    private ProcessCameraProvider cameraProvider;
    private boolean isScanCompleted = false;
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 100;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_barcode_scanner, container, false);

        previewView = rootView.findViewById(R.id.previewView);
        textView = rootView.findViewById(R.id.text);
        textView.setText(R.string.scan_barcode_title);
        vibrator = (Vibrator) requireContext().getSystemService(Context.VIBRATOR_SERVICE); // Initialize Vibrator

        cameraExecutor = Executors.newSingleThreadExecutor();

        requestCameraPermission(); // Request camera permission when the fragment is created

        startCamera();

        return rootView;
    }

    @Override
    public void onStart() {
        super.onStart();
        isScanCompleted = false;
        startCamera();
    }

    @Override
    public void onResume() {
        super.onResume();
        isScanCompleted = false;
        startCamera();
    }

    @Override
    public void onStop() {
        super.onStop();
        releaseCamera();
        isScanCompleted = true;
    }

    @Override
    public void onPause() {
        super.onPause();
        releaseCamera();
        isScanCompleted = true;
    }

    private void releaseCamera() {
        if (cameraProvider != null) {
            cameraProvider.unbindAll();
        }
    }


    private void requestCameraPermission() {
        ActivityCompat.requestPermissions(requireActivity(), new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(requireContext());
        cameraProviderFuture.addListener(() -> {
            try {
                cameraProvider = cameraProviderFuture.get();

                // Set up the preview use case
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());

                // Set up the analysis use case
                ImageAnalysis imageAnalysis = new ImageAnalysis.Builder()
                        .build();
                imageAnalysis.setAnalyzer(cameraExecutor, imageProxy -> {
                    scanBarCode(imageProxy);
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
        }, ContextCompat.getMainExecutor(requireContext()));
    }

    private void scanBarCode(ImageProxy imageProxy) {
        if (!isScanCompleted) { // Check if a scan has already been performed

            // Convert the imageProxy to a BinaryBitmap
            BinaryBitmap bitmap = createBinaryBitmap(imageProxy);

            // Use the MultiFormatReader to decode the barcode
            MultiFormatReader reader = new MultiFormatReader();
            try {
                Result result = reader.decode(bitmap);
                // Update the TextView with the decoded result
                requireActivity().runOnUiThread(() -> {
                    isScanCompleted = true;
                    // Start Activity and pass the scanned barcode text as an extra
//                    Intent intent = new Intent(requireContext(), ContainerActivity.class);
//                    intent.putExtra("barcode", result.getText());
//                    startActivity(intent);
                    textView.setText(result.getText());
                    // Vibrate when code is scanned
                    vibrate();
                });
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                imageProxy.close();
            }
        }
    }

    private BinaryBitmap createBinaryBitmap(ImageProxy imageProxy) {
        byte[] imageData = imageProxyToByteArray(imageProxy);
        int width = imageProxy.getWidth();
        int height = imageProxy.getHeight();

        // Get the rotation degrees from ImageProxy and adjust the image data accordingly
        int rotationDegrees = imageProxy.getImageInfo().getRotationDegrees();
        if (rotationDegrees != 0) {
            // Rotate the image data to adjust for the camera orientation
            imageData = rotateImage(imageData, width, height, rotationDegrees);
        }

        // Create a luminance source using the adjusted image data
        PlanarYUVLuminanceSource luminanceSource = new PlanarYUVLuminanceSource(
                imageData, width, height, 0, 0, width, height, false);
        return new BinaryBitmap(new HybridBinarizer(luminanceSource));
    }

    private byte[] imageProxyToByteArray(ImageProxy imageProxy) {
        ByteBuffer buffer = imageProxy.getPlanes()[0].getBuffer();
        byte[] data = new byte[buffer.remaining()];
        buffer.get(data);
        return data;
    }

    private byte[] rotateImage(byte[] data, int width, int height, int rotationDegrees) {
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
}
