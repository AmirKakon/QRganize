package com.example.qrganize.container;

import android.os.Bundle;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.qrganize.R;

public class ContainerActivity extends AppCompatActivity {

    private TextView textViewResult;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_container);

        textViewResult = findViewById(R.id.textViewResult);

        // Get the scanned QR code text from the intent
        String qrCodeText = getIntent().getStringExtra("qrCodeText");

        // Display the scanned QR code text in the TextView
        if (qrCodeText != null) {
            textViewResult.setText(qrCodeText);
        } else {
            textViewResult.setText("No QR code text found.");
        }
    }
}
