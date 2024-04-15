package com.example.qrganize.container;

import java.util.ArrayList;

public class ContainerModel {
    private String id;
    private String name;
    private ArrayList<String> items;
    private String owner;

    // Constructor
    public ContainerModel(String id, String name, ArrayList<String> items, String owner) {
        this.id = id;
        this.name = name;
        this.items = items;
        this.owner = owner;
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

    public ArrayList<String> getItems() {
        return items;
    }

    public void setItems(ArrayList<String> items) {
        this.items = items;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }
}
