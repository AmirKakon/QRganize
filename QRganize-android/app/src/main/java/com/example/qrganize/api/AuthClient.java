package com.example.qrganize.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.Preference;
import android.preference.PreferenceManager;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;

public class AuthClient {

    private static AuthClient instance;
    private static String accessToken;
    private static String refreshToken;
    private static final String PREF_ACCESS_TOKEN = "pref_access_token";
    private static final String PREF_REFRESH_TOKEN = "pref_refresh_token";

    private static String baseUrl = "https://us-central1-qrganize-f651b.cloudfunctions.net/dev";
    private final Context context;
    private final RequestQueue requestQueue;
    private AuthClient(Context context) {
        this.context = context;
        this.requestQueue = Volley.newRequestQueue(context);
        loadTokens();
    }

    public String getAccessToken() {
        if(isTokenExpired(accessToken)) {
            try {
                JSONObject jsonObject = new JSONObject();
                jsonObject.put("token", refreshToken);
                Refresh(jsonObject, new AuthResponseListener<AuthResponse>() {
                    @Override
                    public void onSuccess(AuthResponse response) {
                        accessToken = response.getAccessToken();
                        saveTokens();
                    }

                    @Override
                    public void onError(String errorMessage) {
                        System.out.println("ERROR" + errorMessage);
                    }
                });
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return accessToken;
    }
    public String getRefreshToken() { return refreshToken; }

    private void loadTokens() {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        accessToken = preferences.getString(PREF_ACCESS_TOKEN, null);
        refreshToken = preferences.getString(PREF_REFRESH_TOKEN, null);
    }

    private void saveTokens() {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(PREF_ACCESS_TOKEN, accessToken);
        editor.putString(PREF_REFRESH_TOKEN, refreshToken);
        editor.apply();
    }

    public boolean isTokenExpired(String token) {
        try {
            // Parse the JWT token
            Jws<Claims> claimsJws = Jwts.parser().parseClaimsJws(token);

            // Get the claims from the token
            Claims claims = claimsJws.getBody();

            // Get the expiration time from the claims
            long expirationTimeMillis = claims.getExpiration().getTime();

            // Get the current time
            long currentTimeMillis = System.currentTimeMillis();

            // Compare current time with the expiry time
            return currentTimeMillis >= expirationTimeMillis;
        } catch (Exception e) {
            // Error parsing the token or missing expiration claim
            e.printStackTrace();
            return true; // Token is considered expired if unable to parse or missing expiration claim
        }
    }

    public static synchronized AuthClient getInstance(Context context) {
        if (instance == null) {
            instance = new AuthClient(context);
        }
        return instance;
    }

    public void Login(final JSONObject requestBody, final AuthResponseListener<AuthResponse> listener) {
        String url = baseUrl + "/api/auth/login";
        StringRequest stringRequest = new StringRequest(Request.Method.POST, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        AuthResponse res = AuthResponse.fromJson(response);
                        accessToken = res.getAccessToken();
                        refreshToken = res.getRefreshToken();
                        saveTokens();
                        listener.onSuccess(res);
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                listener.onError(error.getMessage());
            }
        }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();
                headers.put("Content-Type", "application/json");
                return headers;
            }
            @Override
            public byte[] getBody() throws AuthFailureError {
                return requestBody.toString().getBytes();
            }
        };

        // Add the request to the RequestQueue.
        requestQueue.add(stringRequest);
    }

    public void Refresh(final JSONObject requestBody, final AuthResponseListener<AuthResponse> listener) {
        String url = baseUrl + "/api/auth/refresh";
        StringRequest stringRequest = new StringRequest(Request.Method.POST, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        AuthResponse res = AuthResponse.fromJson(response);
                        accessToken = res.getAccessToken();
                        saveTokens();
                        listener.onSuccess(res);
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                listener.onError(error.getMessage());
            }
        }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();
                headers.put("Content-Type", "application/json");
                return headers;
            }
            @Override
            public byte[] getBody() throws AuthFailureError {
                return requestBody.toString().getBytes();
            }
        };

        // Add the request to the RequestQueue.
        requestQueue.add(stringRequest);
    }
    public void Logout(final JSONObject requestBody, final AuthResponseListener<AuthResponse> listener) {
        String url = baseUrl + "/api/auth/logout";
        StringRequest stringRequest = new StringRequest(Request.Method.DELETE, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        AuthResponse res = AuthResponse.fromJson(response);
                        accessToken = null;
                        refreshToken = null;
                        saveTokens();
                        listener.onSuccess(res);
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                listener.onError(error.getMessage());
            }
        }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                Map<String, String> headers = new HashMap<>();
                headers.put("Content-Type", "application/json");
                return headers;
            }
            @Override
            public byte[] getBody() throws AuthFailureError {
                return requestBody.toString().getBytes();
            }
        };

        // Add the request to the RequestQueue.
        requestQueue.add(stringRequest);
    }

    public interface AuthResponseListener<T> {
        void onSuccess(T response);

        void onError(String errorMessage);
    }
}
