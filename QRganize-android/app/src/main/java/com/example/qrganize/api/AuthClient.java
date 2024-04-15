package com.example.qrganize.api;

import android.content.Context;
import com.android.volley.AuthFailureError;
import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Map;

public class AuthClient {

    private static AuthClient instance;
    private static String accessToken;
    private static String refreshToken;
    private final Context context;
    private final RequestQueue requestQueue;
    private AuthClient(Context context) {
        this.context = context;
        this.requestQueue = Volley.newRequestQueue(context);
    }

    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }

    public static synchronized AuthClient getInstance(Context context) {
        if (instance == null) {
            instance = new AuthClient(context);
        }
        return instance;
    }

    public void Post(String url, final JSONObject requestBody, final AuthResponseListener<AuthResponse> listener) {
        StringRequest stringRequest = new StringRequest(Request.Method.POST, url,
                new Response.Listener<String>() {
                    @Override
                    public void onResponse(String response) {
                        AuthResponse res = AuthResponse.fromJson(response);
                        accessToken = res.getAccessToken();
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
