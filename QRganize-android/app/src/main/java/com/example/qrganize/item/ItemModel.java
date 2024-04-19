package com.example.qrganize.item;

public class ItemModel {
    private String id;
    private String name;

    // Constructor
    public ItemModel(String id, String name) {
        this.id = id;
        this.name = name;
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
}
