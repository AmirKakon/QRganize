package com.example.qrganize.api;

import com.google.gson.Gson;

import org.json.JSONObject;

public class ApiResponse {
    private String status;
    private JSONObject data;

    public ApiResponse(String status, JSONObject data) {
        this.status = status;
        this.data = data;
    }

    public String getStatus() {
        return status;
    }

    public JSONObject getData() {
        return data;
    }

    // Static method to parse JSON response
    public static ApiResponse fromJson(String jsonObject) {
        Gson gson = new Gson();
        ApiResponse apiResponse = gson.fromJson(jsonObject, ApiResponse.class);

        return apiResponse;
    }
}
