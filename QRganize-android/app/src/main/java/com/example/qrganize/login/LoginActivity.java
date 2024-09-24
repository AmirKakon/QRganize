package com.example.qrganize.login;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.qrganize.R;
import com.example.qrganize.api.AuthClient;

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
                try {
                    AuthClient authClient = AuthClient.getInstance(getApplicationContext());
                    authClient.refreshAccessToken(new AuthClient.AuthResponseListener<Boolean>() {
                        @Override
                        public void onSuccess(Boolean isValid) {
                            if (isValid) {
                                Toast.makeText(LoginActivity.this, "Tokens are valid!", Toast.LENGTH_SHORT).show();
                                // Proceed with the application logic
                            } else {
                                Toast.makeText(LoginActivity.this, "Tokens are invalid!", Toast.LENGTH_SHORT).show();
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

        logoutButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    AuthClient authClient = AuthClient.getInstance(getApplicationContext());
                    authClient.relogin(new AuthClient.AuthResponseListener<Boolean>() {
                        @Override
                        public void onSuccess(Boolean isValid) {
                            if (isValid) {
                                Toast.makeText(LoginActivity.this, "Tokens are valid!", Toast.LENGTH_SHORT).show();
                                // Proceed with the application logic
                            } else {
                                Toast.makeText(LoginActivity.this, "Tokens are invalid!", Toast.LENGTH_SHORT).show();
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
    }
}
