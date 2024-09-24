package com.example.qrganize.item;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import kotlin.text.UStringsKt;

public class ItemModel {
    private String id;
    private String name;

    private String image;

    // Constructor
    public ItemModel(String id, String name, String image) {
        this.id = id;
        this.name = name;
        this.image = image;
    }

    // Getter and Setter methods
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImage() { return image;}

    public void setImage(String image) { this.image = image; }

    public Bitmap getBitmapImage() {
        if(this.image == null) {
            return null;
        }
        byte[] decodedBytes = Base64.decode(this.image, Base64.DEFAULT);

        // Convert the byte array into a Bitmap
        return BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
    }
}
