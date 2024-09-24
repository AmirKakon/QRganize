package com.example.qrganize.tabs;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.example.qrganize.item.ItemListAdapter;
import com.example.qrganize.item.ItemModel;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ItemsListFragment extends Fragment {

    private RecyclerView recyclerView;
    private ItemListAdapter itemListAdapter;
    private List<ItemModel> itemsList;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup items, @Nullable Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_items_list, items, false);

        recyclerView = rootView.findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        itemsList = new ArrayList<>();
        generateItemList();
        itemListAdapter = new ItemListAdapter(itemsList, getContext());
        recyclerView.setAdapter(itemListAdapter);

        return rootView;
    }

    private void generateItemList() {
        try {
            ApiClient apiClient = ApiClient.getInstance(getContext().getApplicationContext());
            String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/items/getAll";

            apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
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

                            itemListAdapter.notifyDataSetChanged();
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
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
