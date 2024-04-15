package com.example.qrganize.container;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.example.qrganize.api.AuthClient;
import com.example.qrganize.api.AuthResponse;
import com.google.gson.Gson;

import org.json.JSONException;
import org.json.JSONObject;

public class ContainerActivity extends AppCompatActivity {

    private TextView textViewResult;
    private Button button;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_container);

        textViewResult = findViewById(R.id.textViewResult);
        button = findViewById(R.id.button);

        try {
            // Get the scanned QR code text from the intent
            String qrCodeText = getIntent().getStringExtra("qrCodeText");

            if (qrCodeText != null) {


            ApiClient apiClient = ApiClient.getInstance(this);
            String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/containers/get/" + qrCodeText;

            apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
                @Override
                public void onSuccess(ApiResponse response) {
                    Gson gson = new Gson();
                    ContainerModel containerModel = gson.fromJson(response.getData().toString(), ContainerModel.class);
                    textViewResult.setText("Response is: " + containerModel.getName());
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

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    AuthClient authClient = AuthClient.getInstance(getApplicationContext());
                    String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/auth/login";
                    JSONObject jsonObject = new JSONObject();
                        jsonObject.put("username", "test");
                        jsonObject.put("id", "2");


                    authClient.Post(url, jsonObject, new AuthClient.AuthResponseListener<AuthResponse>() {
                        @Override
                        public void onSuccess(AuthResponse response) {
                            textViewResult.setText("Response is: " + response.getAccessToken());
                        }

                        @Override
                        public void onError(String errorMessage) {
                            textViewResult.setText("Login Fail: " + errorMessage);
                        }
                    });
                } catch (Exception e) {
                    textViewResult.setText("Error: " + e.getMessage());
                }
            }
        });
    }
}
