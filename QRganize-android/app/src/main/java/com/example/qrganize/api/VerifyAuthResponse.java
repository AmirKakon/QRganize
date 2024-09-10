package com.example.qrganize.api;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

public class VerifyAuthResponse {
    private Verifications status;
    private String message;

    public VerifyAuthResponse(Verifications status, String accessToken) {
        this.status = status;
        this.message = accessToken;
    }

    public Verifications getStatus() {
        return status;
    }
    public String getMessage() { return message; }

    // Static method to parse JSON response
    public static VerifyAuthResponse fromJson(String jsonObject) {
        Gson gson = new GsonBuilder()
                .registerTypeAdapter(Verifications.class, new VerificationsDeserializer())
                .create();
        return gson.fromJson(jsonObject, VerifyAuthResponse.class);
    }
}

