import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import {
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import { createContainer, deleteContainer, deleteContainerItem } from "../../utilities/api";
import { getImageSrc } from "../../utilities/helpers";

const ContainerDetails = ({ container, setContainer, items, setItems }) => {
  const navigate = useNavigate();
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [quantityChangeList, setQuantityChangeList] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (container?.id && !container.image) {
      QRCode.toDataURL(container.id)
        .then((url) => {
          setContainer((prev) => ({ ...prev, image: url })); // Update the container state with the QR code URL
        })
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, [container, setContainer]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContainer((prev) => ({ ...prev, [name]: value }));
    console.log("Container updated:", { ...container, [name]: value });
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
          setContainer((prev) => ({ ...prev, image: resizedImage }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    console.log("Saving container:", quantityChangeList);
    return; 

    setSaving(true);
    try {
      const updatedItem = {
        ...container,
      };

      const response = await createContainer(updatedItem);
      if (response) {
        setSnackbar({
          open: true,
          message: "Container details updated successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to save container details.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error saving container details:", error);
      setSnackbar({
        open: true,
        message: "Failed to save container details.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await deleteContainer(container.id);
      if (response) {
        setSnackbar({
          open: true,
          message: "Container deleted successfully!",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Failed to delete container.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting container:", error);
      setSnackbar({
        open: true,
        message: "Failed to delete container.",
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveItem = async (itemId, event) => {
    event.stopPropagation();

    var result = await deleteContainerItem(container.id, itemId);
    if (result) {
      setItems((prev) => prev.filter((item) => item.itemId !== itemId));
}
  };

  const handleItemClick = (item) => {
    navigate(`/item?id=${item.itemId}`);
  };

  const handleQuantityChange = (itemId, newQuantity, event) => {
    console.log("Quantity changed:", itemId, newQuantity);
    event.stopPropagation();

    if(quantityChangeList.some((item) => item.itemId === itemId)) {
    setQuantityChangeList((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  } else {
    setQuantityChangeList((prev) => [
      ...prev,
      { itemId, quantity: newQuantity },
    ]);
  }

    console.log(quantityChangeList);
  };

  const styles = {
    list: {
      width: "100%",
      border: "1px solid #ccc", // Add a border around the list
      borderRadius: "8px", // Optional: Add rounded corners
      padding: "8px", // Optional: Add padding inside the border
    },
    listItem: {
      transition: "background-color 0.3s ease",
      '&:hover': {
        backgroundColor: "#f0f0f0", // Highlight color on hover
      },
    },
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
          <TextField
            label="Container ID"
            name="id"
            value={container.id || ""}
            onChange={handleInputChange}
            fullWidth
            disabled
          />

          <TextField
            label="Container Name"
            name="name"
            value={container.name || ""}
            onChange={handleInputChange}
            fullWidth
          />

          <label htmlFor="imageUpload">
            {container.image ? (
              <img
                src={getImageSrc(container.image)}
                alt="container"
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

          <List sx={styles.list}>
            {items?.map((item) => (
              <ListItem
                key={item.itemId}
                sx={styles.listItem}
                secondaryAction={
                  <>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, width: "100%" }}>
                      <IconButton onClick={(event) => handleQuantityChange(item.itemId, (item.quantity || 1) - 1, event)}>
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        type="number"
                        label="Quantity"
                        value={item.quantity || 0}
                        onChange={(event) => handleQuantityChange(item.itemId, Number(event.target.value), event)}
                        inputProps={{ min: 1 }}
                        sx={{ width: "80px" }}
                      />
                      <IconButton onClick={(event) => handleQuantityChange(item.itemId, (item.quantity || 0) + 1, event)}>
                        <AddIcon />
                      </IconButton>
                    </Box>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(event) => handleRemoveItem(item.itemId, event)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
                onClick={() => handleItemClick(item)}
              >
                <ListItemAvatar>
                  <Avatar src={getImageSrc(item.image)} alt={item.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={item.name}
                  secondary={`Quantity: ${item.quantity}`}
                />
              </ListItem>
            ))}
          </List>

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
              disabled={saving || !container.name}
              sx={{ flex: 1 }}
            >
              {saving ? <CircularProgress size={24} /> : "Save Container"}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={deleting || !container.name}
              sx={{ flex: 1 }}
            >
              {deleting ? <CircularProgress size={24} /> : "Delete Container"}
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

export default ContainerDetails;
