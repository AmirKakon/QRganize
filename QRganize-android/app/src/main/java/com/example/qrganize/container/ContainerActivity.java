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
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

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
            String qrCodeText = getIntent().getStringExtra("containerId");

            if (qrCodeText != null) {


                ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
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
                    ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
                    String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/containers/getAll";

                    apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
                        @Override
                        public void onSuccess(ApiResponse response) throws JSONException {

                                if (response.getData() instanceof JSONObject) {
                                    JSONObject jsonObject = (JSONObject) response.getData();
                                    textViewResult.setText(jsonObject.toString());
                                } else if (response.getData() instanceof JSONArray) {
                                    JSONArray jsonArray = (JSONArray) response.getData();
                                    List<ContainerModel> containerList = new ArrayList<>();
                                    Gson gson = new Gson();
                                    for (int i = 0; i < jsonArray.length(); i++) {
                                        JSONObject containerJson = jsonArray.getJSONObject(i);
                                        ContainerModel container = gson.fromJson(containerJson.toString(), ContainerModel.class);
                                        containerList.add(container);
                                    }
                                    textViewResult.setText("COunt: " + containerList.size());
                                }
                        }

                        @Override
                        public void onError(String errorMessage) {
                            textViewResult.setText("Error: " + errorMessage);
                        }
                    });

                } catch (Exception e) {
                    textViewResult.setText(e.getMessage());
                }
            }
        });
    }
}
