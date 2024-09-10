package com.example.qrganize.container;

import static androidx.core.content.ContentProviderCompat.requireContext;

import static java.security.AccessController.getContext;

import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.example.qrganize.item.ItemListAdapter;
import com.example.qrganize.item.ItemModel;
import com.example.qrganize.tabs.BarcodeScannerActivity;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ContainerActivity extends AppCompatActivity {

    private ContainerModel containerModel;
    private RecyclerView recyclerView;
    private ItemListAdapter itemListAdapter;
    private List<ItemModel> itemsList;
    private TextView title;
    private TextView id;
    private TextView name;
    private TextView owner;
    private TextView items;
    private Button button;
    private ImageView qrCodeImage;
    private ImageButton editButton;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_container);

        View header = findViewById(R.id.header);
        title = header.findViewById(R.id.title);

        id = findViewById(R.id.id);
        name = findViewById(R.id.name);
        owner = findViewById(R.id.owner);
        items = findViewById(R.id.items);
        button = findViewById(R.id.button);
        qrCodeImage = findViewById(R.id.qr_code_image);
        editButton = findViewById(R.id.edit_icon);

        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        itemsList = new ArrayList<>();
        generateItemList();
        itemListAdapter = new ItemListAdapter(itemsList, this);
        recyclerView.setAdapter(itemListAdapter);

        try {
            // Get the scanned QR code text from the intent
            String containerId = getIntent().getStringExtra("containerId");
            title.setText(containerId);
            if (containerId != null) {


                ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
                String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/containers/get/" + containerId;

                apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
                    @Override
                    public void onSuccess(ApiResponse response) {
                        Gson gson = new Gson();
                        containerModel = gson.fromJson(response.getData().toString(), ContainerModel.class);
//                        title.setText(containerModel.getName());
                        id.setText(containerModel.getId());
                        name.setText(containerModel.getName());
                        owner.setText(containerModel.getOwner());
                        items.setText(containerModel.getItems().toString());
                    }

                    @Override
                    public void onError(String errorMessage) {
                    }
                });
            }
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

        editButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
//                    ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
//                    String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/items/getBatch";
//                    JSONObject body = new JSONObject();
//                    body.put("items", containerModel.getItems());
//                    apiClient.Post(url, body, new ApiClient.ApiResponseListener<ApiResponse>() {
//                        @Override
//                        public void onSuccess(ApiResponse response) {
//                            Gson gson = new Gson();
//                            itemsList = gson.fromJson(response.getData().toString(), new TypeToken<List<ItemModel>>(){}.getType());
//
//                            // Check if the items list is not empty
//                            if (!itemsList.isEmpty()) {
//                                id.setText(itemsList.get(0).getId());
//                                name.setText(itemsList.get(0).getName());
//                                owner.setText(containerModel.getOwner());
//                                items.setText(containerModel.getItems().toString());
//                            } else {
//                                // Handle empty response
//                                Toast.makeText(getApplicationContext(), "No items found", Toast.LENGTH_SHORT).show();
//                            }
//                        }
//
//                        @Override
//                        public void onError(String errorMessage) {
//                            System.out.println("BITERROR" + errorMessage);
//                        }
//                    });

                    Intent intent = new Intent(ContainerActivity.this, BarcodeScannerActivity.class);
                    startActivity(intent);


                } catch (Exception e) {
                    // Handle exception
                }
            }
        });
    }

    private void generateItemList() {
        try {
            ApiClient apiClient = ApiClient.getInstance(getApplicationContext());
            String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/items/getBatch";
            JSONObject body = new JSONObject();
            body.put("items", containerModel.getItems());

            apiClient.Post(url, body, new ApiClient.ApiResponseListener<ApiResponse>() {
                @Override
                public void onSuccess(ApiResponse response) {
                    if (response.getData() != null) {
                        Gson gson = new Gson();
                        itemsList = gson.fromJson(response.getData().toString(), new TypeToken<List<ItemModel>>(){}.getType());
                        itemListAdapter.notifyDataSetChanged();
                    }
                }

                @Override
                public void onError(String errorMessage) {
                    System.out.println("FAIL!");
                }
            });

        } catch (Exception e) {
            System.out.println("FAIL%");
        }
    }
}
