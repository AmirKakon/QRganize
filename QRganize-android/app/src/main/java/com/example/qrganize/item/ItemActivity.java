package com.example.qrganize.item;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ItemActivity extends AppCompatActivity {

    private Map<String, TextView> itemIdMap;
    private Map<String, TextView> itemNameMap;
    private Button saveButton;
    private ImageView itemImageView;
    private List<ItemModel> itemsList;
    private FrameLayout loadingOverlay;
    private ProgressBar loadingSpinner;

    private boolean itemExists = false;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_item);

        itemIdMap = buildLabelTextviewPair(R.id.item_id);
        itemNameMap = buildLabelTextviewPair(R.id.item_name);
        saveButton = findViewById(R.id.save_item_button);
        itemImageView = findViewById(R.id.item_image);
        loadingOverlay = findViewById(R.id.loading_overlay);
        loadingSpinner = findViewById(R.id.loading_spinner);

        setLabelTextviewPair(itemIdMap, "ID", "");
        setLabelTextviewPair(itemNameMap, "Name", "");

        itemsList = new ArrayList<>();

        try {
            // Get the scanned QR code text from the intent
            String barcode = getIntent().getStringExtra("barcode");
            if (barcode != null && barcode != "$") {
                loadingOverlay.setVisibility(View.VISIBLE);
                GetItem(barcode);

                if(!itemExists) {
                    Toast.makeText(ItemActivity.this, "Searching barcode...", Toast.LENGTH_SHORT).show();
                    SearchBarcode(barcode);
                }

            }
        } catch (Exception e) {
            itemIdMap.get("text").setText(e.getMessage());
        }
    }


    private Map<String, TextView> buildLabelTextviewPair(int view) {
        Map<String, TextView> map = new HashMap<>();
        View includedLayout = findViewById(view);
        TextView labelView = includedLayout.findViewById(R.id.label);
        TextView textView = includedLayout.findViewById(R.id.textview);
        map.put("label", labelView);
        map.put("text", textView);

        return map;
    }

    private void setLabelTextviewPair(Map<String, TextView> pair, String label, String text) {
        pair.get("label").setText(label);
        pair.get("text").setText(text);
    }

    private void GetItem(String barcode) {
        ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
        String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/items/get/" + barcode;

        apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
            @Override
            public void onSuccess(ApiResponse response) {
                if (response.getData() != null) {
                    try {
                        Gson gson = new Gson();
                        JSONObject jsonObject = (JSONObject) response.getData();
                        ItemModel item = gson.fromJson(jsonObject.toString(), ItemModel.class);
                        itemsList.add(item);

                        // Update the views with the first item data
                        if (!itemsList.isEmpty()) {
                            itemExists = true;
                            ItemModel itemModel = itemsList.get(0);
                            setLabelTextviewPair(itemIdMap, "ID", itemModel.getId());
                            setLabelTextviewPair(itemNameMap, "Name", itemModel.getName());
                            itemImageView.setImageBitmap(itemModel.getBitmapImage());  // Set the image for the ImageView
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }

            @Override
            public void onError(String errorMessage) {
                // Handle the error
                Toast.makeText(ItemActivity.this, "ERROR", Toast.LENGTH_SHORT).show();
            }
        };
    }

    private void SearchBarcode(String barcode) {
        ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
        String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/items/searchBarcode/" + barcode;

        apiClient.Post(url, null, new ApiClient.ApiResponseListener<ApiResponse>() {
            @Override
            public void onSuccess(ApiResponse response) {
                if (response.getData() != null) {
                    try {
                        Gson gson = new Gson();

                        // Parse the response data
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

                        // Update the views with the first item data
                        if (!itemsList.isEmpty()) {
                            itemExists = true;
                            ItemModel itemModel = itemsList.get(0);
                            setLabelTextviewPair(itemIdMap, "ID", itemModel.getId());
                            setLabelTextviewPair(itemNameMap, "Name", itemModel.getName());
                            itemImageView.setImageBitmap(itemModel.getBitmapImage());  // Set the image for the ImageView
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    } finally {
                        loadingOverlay.setVisibility(View.GONE);
                    }
                }
            }

            @Override
            public void onError(String errorMessage) {
                // Handle the error
                loadingOverlay.setVisibility(View.GONE);
            }
        });
    }
}
