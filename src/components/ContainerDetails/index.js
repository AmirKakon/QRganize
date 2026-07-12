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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { createContainer, deleteContainer, getAllAreas } from "../../utilities/api";
import { getImageSrc } from "../../utilities/helpers";
import ContainerContents from "../ContainerContents";

const ContainerDetails = ({ container, setContainer, lots = [], allItems = [], onLotsChanged }) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [areas, setAreas] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    getAllAreas()
      .then((res) => setAreas(res || []))
      .catch((error) => console.error("Error fetching areas:", error));
  }, []);

  useEffect(() => {
    if (container?.id && !container.image) {
      QRCode.toDataURL(container.id)
        .then((url) => setContainer((prev) => ({ ...prev, image: url })))
        .catch((err) => console.error("Error generating QR code:", err));
    }
  }, [container, setContainer]);

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContainer((prev) => ({ ...prev, [name]: value }));
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
          const maxWidth = 800;
          const maxHeight = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d").drawImage(img, 0, 0, width, height);
          setContainer((prev) => ({ ...prev, image: canvas.toDataURL("image/jpeg", 0.8) }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await createContainer({ ...container });
      setSnackbar({
        open: true,
        message: response ? "Container saved." : "Failed to save container.",
        severity: response ? "success" : "error",
      });
    } catch (error) {
      console.error("Error saving container details:", error);
      setSnackbar({ open: true, message: "Failed to save container.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      const response = await deleteContainer(container.id);
      setSnackbar({
        open: true,
        message: response ? "Container deleted." : "Failed to delete container.",
        severity: response ? "success" : "error",
      });
    } catch (error) {
      console.error("Error deleting container:", error);
      setSnackbar({ open: true, message: "Failed to delete container.", severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadQRCode = () => {
    if (!container?.id) {
      setSnackbar({ open: true, message: "Container ID is not available.", severity: "error" });
      return;
    }
    QRCode.toDataURL(container.id)
      .then((qrCodeUrl) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const qrCodeSize = 300;
        const textHeight = 30;
        canvas.width = qrCodeSize;
        canvas.height = qrCodeSize + textHeight;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const qrImage = new Image();
        qrImage.src = qrCodeUrl;
        qrImage.onload = () => {
          ctx.drawImage(qrImage, 0, 0, qrCodeSize, qrCodeSize);
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillStyle = "black";
          ctx.fillText(container.name || "", qrCodeSize / 2, qrCodeSize + 5);
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `${container.id}_QRCode.png`;
          link.click();
        };
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
        setSnackbar({ open: true, message: "Failed to generate QR code.", severity: "error" });
      });
  };

  return (
    <>
      <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 2, gap: 2 }}>
          <TextField label="Container ID" name="id" value={container.id || ""} onChange={handleInputChange} fullWidth disabled />
          <TextField label="Container Name" name="name" value={container.name || ""} onChange={handleInputChange} fullWidth />

          <FormControl fullWidth>
            <InputLabel>Area</InputLabel>
            <Select
              label="Area"
              value={container.areaId || ""}
              onChange={(e) => setContainer((prev) => ({ ...prev, areaId: e.target.value || null }))}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {areas.map((area) => (
                <MenuItem key={area.id} value={area.id}>
                  {area.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <label htmlFor="imageUpload">
            {container.image ? (
              <img src={getImageSrc(container.image)} alt="container" style={{ width: 300, borderRadius: 8 }} />
            ) : (
              <p>No image available</p>
            )}
            <input id="imageUpload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </label>
          <Button color="secondary" variant="contained" component="label">
            Upload / Take Picture
            <input hidden accept="image/*" type="file" onChange={handleImageChange} />
          </Button>

          <ContainerContents
            containerId={container.id}
            lots={lots}
            allItems={allItems}
            onChanged={onLotsChanged}
          />

          <Button variant="contained" color="primary" onClick={handleDownloadQRCode} sx={{ width: "100%" }}>
            Download QR Code
          </Button>

          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleSave} disabled={saving || !container.name} sx={{ flex: 1 }}>
              {saving ? <CircularProgress size={24} /> : "Save Container"}
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting || !container.name}
              sx={{ flex: 1 }}
            >
              {deleting ? <CircularProgress size={24} /> : "Delete Container"}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete this container?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete{" "}
          <strong>{container.name || "this container"}</strong>? Its stock records are removed too.
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContainerDetails;
