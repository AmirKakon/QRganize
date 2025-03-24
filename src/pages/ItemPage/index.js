import React, { useEffect, useState } from "react";
import { Box, TextField, Button, CircularProgress } from "@mui/material";
import { useParams } from "react-router-dom";
import { searchForBarcode, updateItemDetails } from "../../utilities/api"; // New API call for saving
import Loading from "../../components/Loading";

const ItemPage = ({ isSmallScreen }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    searchForBarcode(id)
      .then((res) => setItem(res))
      .catch((error) => console.error("Error fetching data:", error))
      .finally(() => setLoading(false));
  }, [id]);

  const getImageSrc = (image) => {
    if (image && image.startsWith("http")) return image;
    if (image && !image.startsWith("data:image"))
      return `data:image/png;base64,${image}`;
    return image;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setItem((prev) => ({ ...prev, image: reader.result })); // Convert to base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await updateItemDetails({ id, ...item });
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

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{ backgroundColor: "#e2e2e2", padding: 2 }}>
      <h3>Item Details</h3>

      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 500 }}
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

        <Box sx={{ marginTop: 2 }}>
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
          <Button variant="contained" component="label">
            Upload / Take Picture
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleImageChange}
            />
          </Button>
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : "Save Item"}
        </Button>
      </Box>
    </Box>
  );
};

export default ItemPage;
