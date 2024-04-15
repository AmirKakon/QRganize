package com.example.qrganize.api;

import com.google.gson.Gson;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class ApiResponse {
    private String status;
    private Object data; // Change type to Object

    public ApiResponse(String status, Object data) {
        this.status = status;
        this.data = data;
    }

    public String getStatus() {
        return status;
    }

    public Object getData() { // Change return type to Object
        return data;
    }

    public static ApiResponse fromJson(String jsonString) {
        try {
            JSONObject jsonObject = new JSONObject(jsonString);
            String status = jsonObject.getString("status");
            Object data = jsonObject.opt("data");
            return new ApiResponse(status, data);
        } catch (JSONException e) {
            e.printStackTrace();
            return null;
        }
    }
}
