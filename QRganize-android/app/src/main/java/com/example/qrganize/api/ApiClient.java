package com.example.qrganize.api;

import android.content.Context;
import android.graphics.Bitmap;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.ImageRequest;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;
import com.google.gson.Gson;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class ApiClient {

    private static ApiClient instance;
    private final Context context;
    private final RequestQueue requestQueue;

    private ApiClient(Context context) {
        this.context = context;
        this.requestQueue = Volley.newRequestQueue(context);
    }

    public static synchronized ApiClient getInstance(Context context) {
        if (instance == null) {
            instance = new ApiClient(context);
        }
        return instance;
    }

    public void Get(String url, final ApiResponseListener<ApiResponse> listener) {
            StringRequest stringRequest = new StringRequest(Request.Method.GET, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        ApiResponse res = ApiResponse.fromJson(response);
                        try {
                            listener.onSuccess(res);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                listener.onError(error.getMessage());
            }
        }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                String token = AuthClient.getInstance(context.getApplicationContext()).getAccessToken();
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + token);
                return headers;
            }
        };
            // Add the request to the RequestQueue.
            requestQueue.add(stringRequest);
    }

    public void Post(String url, final JSONObject requestBody, final ApiResponseListener<ApiResponse> listener) {
        StringRequest stringRequest = new StringRequest(Request.Method.POST, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        ApiResponse res = ApiResponse.fromJson(response);
                        try {
                            listener.onSuccess(res);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                }, new Response.ErrorListener() {
            @Override
            public void onErrorResponse(VolleyError error) {
                listener.onError(error.getMessage());
            }
        }) {
            @Override
            public Map<String, String> getHeaders() throws AuthFailureError {
                String token = AuthClient.getInstance(context.getApplicationContext()).getAccessToken();
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + token);
                headers.put("Content-Type", "application/json");
                return headers;
            }
            @Override
            public byte[] getBody() throws AuthFailureError {
                if(requestBody != null) {
                    return requestBody.toString().getBytes();
                }
                return null;
            }
        };

        // Add the request to the RequestQueue.
        requestQueue.add(stringRequest);
    }

    public void GetQrCodeImage(String containerId, final ApiResponseListener<Bitmap> listener) {
        String url = "https://quickchart.io/qr?text=" + containerId;

        ImageRequest imageRequest = new ImageRequest(url,
                new Response.Listener<Bitmap>() {
                    @Override
                    public void onResponse(Bitmap response) {
                        try {
                            listener.onSuccess(response);
                        } catch (JSONException e) {
                            throw new RuntimeException(e);
                        }
                    }
                },
                0,
                0,
                null,
                new Response.ErrorListener() {
                    @Override
                    public void onErrorResponse(VolleyError error) {
                        listener.onError(error.getMessage());
                    }
                });

        requestQueue.add(imageRequest);
    }

    public interface ApiResponseListener<T> {
        void onSuccess(T response) throws JSONException;

        void onError(String errorMessage);
    }
}
