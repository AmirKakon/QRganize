package com.example.qrganize.container;

import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ContainerActivity extends AppCompatActivity {

    private TextView id;
    private TextView name;
    private TextView owner;
    private TextView items;
    private Button button;
    private ImageView qrCodeImage;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_container);

        id = findViewById(R.id.id);
        id = findViewById(R.id.name);
        id = findViewById(R.id.owner);
        id = findViewById(R.id.items);
        button = findViewById(R.id.button);
        qrCodeImage = findViewById(R.id.qr_code_image);
        try {
            // Get the scanned QR code text from the intent
            String containerId = getIntent().getStringExtra("containerId");

            if (containerId != null) {


                ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
                String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/containers/get/" + containerId;

                apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
                    @Override
                    public void onSuccess(ApiResponse response) {
                        Gson gson = new Gson();
                        ContainerModel containerModel = gson.fromJson(response.getData().toString(), ContainerModel.class);
                        id.setText(containerModel.getId());
                        id.setText(containerModel.getName());
                        id.setText(containerModel.getOwner());
                        id.setText(containerModel.getItems().toString());
                    }

                    @Override
                    public void onError(String errorMessage) {
                    }
                }); }
            else {
            }

        } catch (Exception e) {
        }

        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    String containerId = getIntent().getStringExtra("containerId");
                    ApiClient apiClient = ApiClient.getInstance(getApplicationContext());

                    apiClient.GetQrCodeImage(containerId, new ApiClient.ApiResponseListener<Bitmap>() {
                        @Override
                        public void onSuccess(Bitmap response) {
                            qrCodeImage.setImageBitmap(response);
                        }

                        @Override
                        public void onError(String errorMessage) {
                            System.out.println("BITERROR" + errorMessage);
                        }
                    });

                } catch (Exception e) {
                }
            }
        });
    }
}
