package com.example.qrganize.api;

import android.content.Context;

import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;
import com.google.gson.Gson;

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
                System.out.println("TOKEN: " + AuthClient.getInstance(context.getApplicationContext()).getAccessToken());
                Map<String, String> headers = new HashMap<>();
                headers.put("Authorization", "Bearer " + AuthClient.getInstance(context.getApplicationContext()).getAccessToken());
                return headers;
            }
        };

        // Add the request to the RequestQueue.
        requestQueue.add(stringRequest);
    }

    public interface ApiResponseListener<T> {
        void onSuccess(T response);

        void onError(String errorMessage);
    }
}
