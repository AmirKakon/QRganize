package com.example.qrganize.login;

import static androidx.core.content.ContentProviderCompat.requireContext;

import static java.security.AccessController.getContext;

import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.qrganize.MainActivity;
import com.example.qrganize.R;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.api.ApiResponse;
import com.example.qrganize.api.AuthClient;
import com.example.qrganize.api.AuthResponse;
import com.example.qrganize.container.ContainerActivity;
import com.example.qrganize.item.ItemListAdapter;
import com.example.qrganize.item.ItemModel;
import com.example.qrganize.tabs.BarcodeScannerActivity;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class LoginActivity extends AppCompatActivity {
    private TextView title;
    private Button loginButton;
    private Button refreshButton;
    private Button logoutButton;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        title = findViewById(R.id.title);
        loginButton = findViewById(R.id.loginButton);
        refreshButton = findViewById(R.id.refreshButton);
        logoutButton = findViewById(R.id.logoutButton);
        loginButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    AuthClient authClient = AuthClient.getInstance(getApplicationContext());
                    authClient.verifyTokens(new AuthClient.AuthResponseListener<Boolean>() {
                        @Override
                        public void onSuccess(Boolean isValid) {
                            if (isValid) {
                                Toast.makeText(LoginActivity.this, "Tokens are valid!", Toast.LENGTH_SHORT).show();
                                // Proceed with the application logic
                            } else {
                                Toast.makeText(LoginActivity.this, "Tokens are invalid or refreshed!", Toast.LENGTH_SHORT).show();
                                // Handle invalid tokens or refreshed tokens logic
                            }
                        }

                        @Override
                        public void onError(String errorMessage) {
                            Toast.makeText(LoginActivity.this, "Error verifying tokens: " + errorMessage, Toast.LENGTH_SHORT).show();
                            // Handle error case
                        }
                    });

                } catch (Exception e) {
                    title.setText("FAILED" + e.getMessage());
                }
            }
        });

        refreshButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                startActivity(intent);
            }
        });
    }
}
