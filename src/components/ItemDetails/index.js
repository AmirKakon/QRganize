import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createItem, deleteItem } from "../../utilities/api";
import { getImageSrc } from "../../utilities/helpers";
import SearchIcon from "@mui/icons-material/Search";

const ItemDetails = ({ item, setItem, setBarcode }) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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

  const handleToggleShoppingList = (e) => {
    const { checked } = e.target;
    setItem((prev) => ({ ...prev, shoppingList: checked }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedItem = {
        ...item,
        shoppingList: item.shoppingList || false,
      };

      const response = await createItem(updatedItem);
      if (response) {
        setSnackbar({
          open: true,
          message: "Item details updated successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to save item details.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error saving item details:", error);
      setSnackbar({
        open: true,
        message: "Failed to save item details.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await deleteItem(item.id);
      if (response) {
        setSnackbar({
          open: true,
          message: "Item deleted successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to delete item.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete item.",
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchForBarcode = () => {
    setBarcode(item.id);
    setSnackbar({
      open: true,
      message: "searching for barcode...",
      severity: "info",
    });
  };

  return (
    <>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            <TextField
              label="Item ID"
              name="id"
              value={item.id || ""}
              onChange={handleInputChange}
              fullWidth
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearchForBarcode}
              sx={{ minWidth: "40px", padding: "8px" }}
            >
              <SearchIcon />
            </Button>
          </Box>

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

          <DatePicker
            label="Expiration Date"
            name="expirationDate"
            onChange={handleInputChange}
            disablePast
            sx={{ width: "100%" }}
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
          <Button color="secondary" variant="contained" component="label">
            Upload / Take Picture
            <input
              hidden
              accept="image/*"
              type="file"
              onChange={handleImageChange}
            />
          </Button>

          <FormControlLabel
            control={
              <Switch
                checked={item.shoppingList || false}
                onChange={handleToggleShoppingList}
                color="primary"
              />
            }
            label="Add to Shopping List"
            sx={{ alignSelf: "flex-start" }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              gap: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving || !item.name || !item.price}
              sx={{ flex: 1 }}
            >
              {saving ? <CircularProgress size={24} /> : "Save Item"}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleting || !item.name || !item.price}
              sx={{ flex: 1 }}
            >
              {deleting ? <CircularProgress size={24} /> : "Delete Item"}
            </Button>
          </Box>
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ItemDetails;
