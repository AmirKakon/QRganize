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
import com.example.qrganize.container.ContainerListAdapter;
import com.example.qrganize.container.ContainerModel;
import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class ContainerListFragment extends Fragment {

    private RecyclerView recyclerView;
    private ContainerListAdapter containerListAdapter;
    private List<ContainerModel> containerList;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View rootView = inflater.inflate(R.layout.fragment_container_list, container, false);

        recyclerView = rootView.findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        containerList = new ArrayList<>();
        generateItemList();
        containerListAdapter = new ContainerListAdapter(containerList, getContext());
        recyclerView.setAdapter(containerListAdapter);

        return rootView;
    }

    private void generateItemList() {
        try {
            ApiClient apiClient = ApiClient.getInstance(getContext());
            String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev/api/containers/getAll";

            apiClient.Get(url, new ApiClient.ApiResponseListener<ApiResponse>() {
                @Override
                public void onSuccess(ApiResponse response) {
                    if (response.getData() != null) {
                        try {
                            Gson gson = new Gson();

                            if (response.getData() instanceof JSONObject) {
                                JSONObject jsonObject = (JSONObject) response.getData();
                                ContainerModel container = gson.fromJson(jsonObject.toString(), ContainerModel.class);
                                containerList.add(container);
                            } else if (response.getData() instanceof JSONArray) {
                                JSONArray jsonArray = (JSONArray) response.getData();

                                for (int i = 0; i < jsonArray.length(); i++) {
                                    JSONObject containerJson = jsonArray.getJSONObject(i);
                                    ContainerModel container = gson.fromJson(containerJson.toString(), ContainerModel.class);
                                    containerList.add(container);
                                }
                            }

                            containerListAdapter.notifyDataSetChanged();
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
