package com.example.qrganize.container;

import android.os.Bundle;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.google.gson.Gson;

public class ContainerActivity extends AppCompatActivity {

    private TextView textViewResult;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_container);

        textViewResult = findViewById(R.id.textViewResult);

        try {
            // Get the scanned QR code text from the intent
            String qrCodeText = getIntent().getStringExtra("qrCodeText");

            if (qrCodeText != null) {


            ApiClient apiClient = new ApiClient(this);
            String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/containers/get/dOod7kV1sYOHE6pP7iOh";

            apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
                @Override
                public void onSuccess(ApiResponse response) {
//                    Gson gson = new Gson();
//                    ContainerModel containerModel = gson.fromJson(response, ContainerModel.class);
                    textViewResult.setText("Response is: " + response.getStatus());
                }

                @Override
                public void onError(String errorMessage) {
                    textViewResult.setText("Error: " + errorMessage);
                }
            }); }
            else {
                textViewResult.setText("No Text Found");
            }

        } catch (Exception e) {
            textViewResult.setText(e.getMessage());
        }
    }
}
