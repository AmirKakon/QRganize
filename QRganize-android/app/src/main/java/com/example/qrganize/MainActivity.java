package com.example.qrganize;

import android.content.Context;
import android.net.ConnectivityManager;
import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager.widget.ViewPager;

import com.android.volley.Request;
import com.android.volley.RequestQueue;
import com.android.volley.Response;
import com.android.volley.VolleyError;
import com.android.volley.toolbox.StringRequest;
import com.android.volley.toolbox.Volley;
import com.example.qrganize.api.ApiClient;
import com.example.qrganize.tabs.ItemListFragment;
import com.example.qrganize.tabs.QRScannerFragment;
import com.example.qrganize.tabs.ViewPagerAdapter;
import com.google.android.material.tabs.TabLayout;

public class MainActivity extends AppCompatActivity {

    private ApiClient apiClient;
    private ViewPager viewPager;
    private TabLayout tabLayout;

    private TextView textView;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        try {
        viewPager = findViewById(R.id.viewPager);
        setupViewPager(viewPager);

        tabLayout = findViewById(R.id.tabLayout);
        tabLayout.setupWithViewPager(viewPager);

        textView = findViewById(R.id.test);

            apiClient = new ApiClient(this);
            String url = "https://us-central1-qrganize-f651b.cloudfunctions.net/helloWorld";

            apiClient.Get(url, new ApiClient.ApiResponseListener<String>() {
                @Override
                public void onSuccess(String response) {
                    textView.setText("Response is: " + response);
                }

                @Override
                public void onError(String errorMessage) {
                    textView.setText("Error: " + errorMessage);
                }
            });

        } catch (Exception e) {
            textView.setText(e.getMessage());
        }
    }

    private void setupViewPager(ViewPager viewPager) {
        ViewPagerAdapter adapter = new ViewPagerAdapter(getSupportFragmentManager());
        adapter.addFragment(new QRScannerFragment(), "QR Scanner");
        adapter.addFragment(new ItemListFragment(), "Item List");
        viewPager.setAdapter(adapter);

        TabLayout tabLayout = findViewById(R.id.tabLayout);
        tabLayout.setupWithViewPager(viewPager);
    }
}
