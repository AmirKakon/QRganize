package com.example.qrganize.api;

import com.google.gson.Gson;

public class AuthResponse {
    private String status;
    private String accessToken;
    private String refreshToken;

    public AuthResponse(String status, String accessToken, String refreshToken) {
        this.status = status;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    public String getStatus() {
        return status;
    }
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }

    // Static method to parse JSON response
    public static AuthResponse fromJson(String jsonObject) {
        Gson gson = new Gson();
        AuthResponse authResponse = gson.fromJson(jsonObject, AuthResponse.class);

        return authResponse;
    }
}
