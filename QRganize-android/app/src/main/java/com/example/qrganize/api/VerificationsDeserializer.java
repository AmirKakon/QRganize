package com.example.qrganize.api;

import com.google.gson.JsonDeserializationContext;
import com.google.gson.JsonDeserializer;
import com.google.gson.JsonElement;
import com.google.gson.JsonParseException;

import java.lang.reflect.Type;

public class VerificationsDeserializer implements JsonDeserializer<Verifications> {
    @Override
    public Verifications deserialize(JsonElement json, Type typeOfT, JsonDeserializationContext context) throws JsonParseException {
        int value = json.getAsInt();
        return Verifications.fromValue(value);
    }
}
