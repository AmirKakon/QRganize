import React, { useState } from "react";
import { Box, Paper, TextField, Button, CircularProgress } from "@mui/material";
import { updateItemDetails } from "../../utilities/api";
import { getImageSrc } from "../../utilities/helpers";

const SaveItem = ({ item, setItem }) => {
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result;

        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxWidth = 800; // Set a maximum width for the image
          const maxHeight = 800; // Set a maximum height for the image

          let width = img.width;
          let height = img.height;

          // Resize the image while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert the resized image to Base64
          const resizedImage = canvas.toDataURL("image/jpeg", 0.8); // Adjust quality (0.8 = 80%)
          setItem((prev) => ({ ...prev, image: resizedImage }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await updateItemDetails(item);
      if (response) {
        alert("Item details updated successfully!");
      } else {
        alert("Failed to save item details.");
      }
    } catch (error) {
      console.error("Error saving item details:", error);
      alert("Failed to save item details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 2,
        gap: 2,
      }}
    >
      
        <TextField
          label="Item ID"
          name="id"
          value={item.id || ""}
          onChange={handleInputChange}
          fullWidth
          disabled
        />

        <TextField
          label="Item Name"
          name="name"
          value={item.name || ""}
          onChange={handleInputChange}
          fullWidth
        />

        <TextField
          label="Item Price"
          name="price"
          value={item.price || ""}
          onChange={handleInputChange}
          fullWidth
        />

          <label htmlFor="imageUpload">
            {item.image ? (
              <img
                src={getImageSrc(item.image)}
                alt="Item"
                style={{ width: 300, borderRadius: 8 }}
              />
            ) : (
              <p>No image available</p>
            )}
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </label>
          <Button
          color="secondary"
            variant="contained"
            component="label"
          >
            Upload / Take Picture
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleImageChange}
            />
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={saving}
            fullWidth
            sx={{ padding: "12px 24px", fontSize: "16px" }}
          >
            {saving ? <CircularProgress size={24} /> : "Save Item"}
          </Button>
      
    </Box>
    </Paper>
  );
};

export default SaveItem;
