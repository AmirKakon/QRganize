package com.example.qrganize.api;

import com.google.gson.Gson;

import org.json.JSONException;
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

    public static ApiResponse fromJson(String jsonString) {
        try {
            JSONObject jsonObject = new JSONObject(jsonString);
            String status = jsonObject.getString("status");
            JSONObject data = jsonObject.optJSONObject("data");
            return new ApiResponse(status, data);
        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }
}
