package com.example.qrganize.item;

import android.os.Bundle;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.example.qrganize.container.ContainerModel;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ItemActivity extends AppCompatActivity {

    private TextView itemId;
    private TextView itemName;
    private Button saveButton;
    private ImageView itemImage;
    private List<ItemModel> itemsList;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_item);

        itemId = findViewById(R.id.item_id);
        itemName = findViewById(R.id.item_name);
        saveButton = findViewById(R.id.save_item_button);
        itemImage = findViewById(R.id.item_image);

        itemsList = new ArrayList<>();

        try {
            // Get the scanned QR code text from the intent
            String barcode = getIntent().getStringExtra("barcode");
            itemId.setText("barcode recieved");
            if (barcode != null) {


                ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
                String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/items/searchBarcode/" + barcode;

                apiClient.Post(url, null, new ApiClient.ApiResponseListener<ApiResponse>() {
                    @Override
                    public void onSuccess(ApiResponse response) {
                        if (response.getData() != null) {
                            try {
                                Gson gson = new Gson();

                                if (response.getData() instanceof JSONObject) {
                                    JSONObject jsonObject = (JSONObject) response.getData();
                                    ItemModel item = gson.fromJson(jsonObject.toString(), ItemModel.class);
                                    itemsList.add(item);
                                } else if (response.getData() instanceof JSONArray) {
                                    JSONArray jsonArray = (JSONArray) response.getData();

                                    for (int i = 0; i < jsonArray.length(); i++) {
                                        JSONObject itemJson = jsonArray.getJSONObject(i);
                                        ItemModel item = gson.fromJson(itemJson.toString(), ItemModel.class);
                                        itemsList.add(item);
                                    }
                                }

                                ItemModel itemModel = itemsList.get(0);
                                itemId.setText(itemModel.getId());
                                itemName.setText(itemModel.getName());
                                itemImage.setImageBitmap(itemModel.getBitmapImage());
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    }

                    @Override
                    public void onError(String errorMessage) {
                    }
                });
            }
            else {
            }

        } catch (Exception e) {
            itemName.setText(e.getMessage());
        }

//        saveButton.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View v) {
//                try {
//                    String barcode = getIntent().getStringExtra("barcode");
//                    ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
//
//                    apiClient.GetQrCodeImage(containerId, new ApiClient.ApiResponseListener<Bitmap>() {
//                        @Override
//                        public void onSuccess(Bitmap response) {
//                            qrCodeImage.setImageBitmap(response);
//                        }
//
//                        @Override
//                        public void onError(String errorMessage) {
//                            System.out.println("BITERROR" + errorMessage);
//                        }
//                    });
//
//                } catch (Exception e) {
//                }
//            }
//        });
    }
}
