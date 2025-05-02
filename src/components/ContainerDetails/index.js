import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { createContainer, deleteContainer } from "../../utilities/api";
import { getImageSrc } from "../../utilities/helpers";

const ContainerDetails = ({ container, setContainer }) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
