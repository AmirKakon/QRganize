package com.example.qrganize.api;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;

import java.lang.reflect.Type;

public enum Verifications {
    Valid(0),
    ACCESSTOKEN(1),
    REFRESHTOKEN(2),
    ERROR(3);

    private final int value;

    Verifications(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    public static Verifications fromValue(int value) {
        for (Verifications verification : Verifications.values()) {
            if (verification.getValue() == value) {
                return verification;
            }
        }
        throw new IllegalArgumentException("Unknown enum value: " + value);
    }
}