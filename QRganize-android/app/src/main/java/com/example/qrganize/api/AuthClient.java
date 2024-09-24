package com.example.qrganize.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.util.Log;

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

    public String getAccessToken() { return accessToken; }
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

    public void verifyTokens(final AuthResponseListener<Boolean> listener) throws JSONException {
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("accessToken", accessToken);
            jsonObject.put("refreshToken", refreshToken);

            Verify(jsonObject, new AuthResponseListener<VerifyAuthResponse>() {
                @Override
                public void onSuccess(VerifyAuthResponse response) throws JSONException {
                    switch (response.getStatus()) {
                        case Valid:
                            listener.onSuccess(true);
                            break;
                        case ACCESSTOKEN:
                            refreshAccessToken(listener);
                            break;
                        case REFRESHTOKEN:
                            relogin(listener);
                            break;
                        default:
                            listener.onSuccess(false);
                            break;
                    }
                }

                @Override
                public void onError(String errorMessage) throws JSONException {
                    listener.onSuccess(false);
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
            listener.onSuccess(false);
        }
    }

    public void refreshAccessToken(final AuthResponseListener<Boolean> listener) throws JSONException {
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("token", refreshToken);

            Refresh(jsonObject, new AuthResponseListener<AuthResponse>() {
                @Override
                public void onSuccess(AuthResponse response) throws JSONException {
                    accessToken = response.getAccessToken();
                    saveTokens();
                    listener.onSuccess(true);
                }

                @Override
                public void onError(String errorMessage) throws JSONException {
                    listener.onSuccess(false);
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
            listener.onSuccess(false);
        }
    }

    public void relogin(final AuthResponseListener<Boolean> listener) throws JSONException {
        try {
            JSONObject jsonObject = new JSONObject();
            jsonObject.put("username", "test");
            jsonObject.put("id", 1);

            Login(jsonObject, new AuthResponseListener<AuthResponse>() {
                @Override
                public void onSuccess(AuthResponse response) throws JSONException {
                    accessToken = response.getAccessToken();
                    refreshToken = response.getRefreshToken();
                    saveTokens();
                    listener.onSuccess(true);
                }

                @Override
                public void onError(String errorMessage) throws JSONException {
                    listener.onSuccess(false);
                }
            });
        } catch (JSONException e) {
            e.printStackTrace();
            listener.onSuccess(false);
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
                        try {
                            listener.onSuccess(res);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                try {
                    listener.onError(error.getMessage());
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
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
                        try {
                            listener.onSuccess(res);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                try {
                    listener.onError(error.getMessage());
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
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
                        try {
                            listener.onSuccess(res);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                try {
                    listener.onError(error.getMessage());
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
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

    public void Verify(final JSONObject requestBody, final AuthResponseListener<VerifyAuthResponse> listener) {
        String url = baseUrl + "/api/auth/verify";
        StringRequest stringRequest = new StringRequest(Request.Method.POST, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        VerifyAuthResponse res = VerifyAuthResponse.fromJson(response);
                        try {
                            listener.onSuccess(res);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                try {
                    listener.onError(error.getMessage());
                } catch (JSONException e) {
                    throw new RuntimeException(e);
                }
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
        void onSuccess(T response) throws JSONException;
        void onError(String errorMessage) throws JSONException;
    }
}
