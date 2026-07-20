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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Typography,
} from "@mui/material";
import { createItem, deleteItem, addItemBarcode } from "../../utilities/api";
import { getImageSrc, generateRandomId } from "../../utilities/helpers";
import SearchIcon from "@mui/icons-material/Search";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import JsBarcode from "jsbarcode";
import StockList from "../StockList";

const ItemDetails = ({ item, setItem, setBarcode, lots = [], containers = [], onLotsChanged }) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [newBarcode, setNewBarcode] = useState("");
  const [addingBarcode, setAddingBarcode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

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
          setItem((prev) => ({ ...prev, image: canvas.toDataURL("image/jpeg", 0.8) }));
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleShoppingList = (e) =>
    setItem((prev) => ({ ...prev, shoppingList: e.target.checked }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const savedId = await createItem({
        ...item,
        quantity: 1, // stock is tracked as lots now; this keeps the endpoint happy
        shoppingList: item.shoppingList || false,
        expirationDate: null,
      });
      if (savedId) {
        if (typeof savedId === "string" && savedId !== item.id) {
          setItem((prev) => ({ ...prev, id: savedId }));
        }
        setSnackbar({ open: true, message: "Item saved.", severity: "success" });
      } else {
        setSnackbar({ open: true, message: "Failed to save item.", severity: "error" });
      }
    } catch (error) {
      console.error("Error saving item details:", error);
      setSnackbar({ open: true, message: "Failed to save item.", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirmDeleteOpen(false);
    setDeleting(true);
    try {
      const response = await deleteItem(item.id);
      setSnackbar({
        open: true,
        message: response ? "Item deleted." : "Failed to delete item.",
        severity: response ? "success" : "error",
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      setSnackbar({ open: true, message: "Failed to delete item.", severity: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const handleAddBarcode = async () => {
    const code = newBarcode.trim();
    if (!code) return;
    setAddingBarcode(true);
    try {
      await addItemBarcode(item.id, code);
      setItem((prev) => ({
        ...prev,
        barcodes: Array.from(new Set([...(prev.barcodes || []), code])),
      }));
      setNewBarcode("");
      setSnackbar({ open: true, message: "Barcode added.", severity: "success" });
    } catch (error) {
      console.error("Error adding barcode:", error);
      setSnackbar({
        open: true,
        message: "Couldn't add barcode. Save the item first, then try again.",
        severity: "error",
      });
    } finally {
      setAddingBarcode(false);
    }
  };

  const handleSearchForBarcode = () => {
    setBarcode(item.id);
    setSnackbar({ open: true, message: "searching for barcode...", severity: "info" });
  };

  const handleGenerateBarcode = () =>
    setItem((prev) => ({ ...prev, id: generateRandomId() }));

  const handleDownloadBarcode = () => {
    if (!item?.id) {
      setSnackbar({ open: true, message: "Item ID is not available.", severity: "error" });
      return;
    }
    try {
      const canvas = document.createElement("canvas");
      JsBarcode(canvas, item.id, { format: "CODE128", width: 2, height: 100, displayValue: true });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${item.id}_Barcode.png`;
      link.click();
    } catch (error) {
      console.error("Error generating barcode:", error);
      setSnackbar({ open: true, message: "Failed to generate barcode.", severity: "error" });
    }
  };

  return (
    <>
      <Paper elevation={2} sx={{ padding: 2, marginBottom: 2, maxWidth: 700, mx: "auto" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 2, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            <TextField label="Item ID" name="id" value={item.id || ""} onChange={handleInputChange} fullWidth />
            <Button variant="contained" color="primary" onClick={handleSearchForBarcode} sx={{ minWidth: "40px", padding: "8px" }}>
              <SearchIcon />
            </Button>
            <Button variant="contained" color="secondary" onClick={handleGenerateBarcode} sx={{ minWidth: "40px", padding: "8px" }}>
              <EmojiObjectsIcon />
            </Button>
          </Box>

          <TextField label="Item Name" name="name" value={item.name || ""} onChange={handleInputChange} fullWidth />
          <TextField label="Item Price" name="price" value={item.price || ""} onChange={handleInputChange} fullWidth />

          <label htmlFor="imageUpload" style={{ cursor: "pointer" }}>
            {item.image ? (
              <img src={getImageSrc(item.image)} alt="Item" style={{ width: 300, borderRadius: 8 }} />
            ) : (
              <p>Tap to upload a photo</p>
            )}
            <input id="imageUpload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
          </label>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button color="secondary" variant="contained" component="label">
              Take Photo
              <input hidden accept="image/*" capture="environment" type="file" onChange={handleImageChange} />
            </Button>
            <Button color="secondary" variant="outlined" component="label">
              Upload
              <input hidden accept="image/*" type="file" onChange={handleImageChange} />
            </Button>
          </Box>

          <FormControlLabel
            control={<Switch checked={item.shoppingList || false} onChange={handleToggleShoppingList} color="primary" />}
            label="Add to Shopping List"
            sx={{ alignSelf: "flex-start" }}
          />

          <StockList
            itemId={item.id}
            lots={lots}
            containers={containers}
            onChanged={onLotsChanged}
          />

          <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Barcodes
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              Extra barcodes let the same item be found from different packages
              or brands.
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
              {Array.from(new Set([item.id, ...(item.barcodes || [])]))
                .filter(Boolean)
                .map((code, i) => (
                  <Chip
                    key={code}
                    label={code}
                    size="small"
                    color={i === 0 ? "primary" : "default"}
                    variant={i === 0 ? "filled" : "outlined"}
                  />
                ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                label="Add a barcode"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddBarcode}
                disabled={addingBarcode || !newBarcode.trim()}
              >
                {addingBarcode ? <CircularProgress size={20} /> : "Add"}
              </Button>
            </Box>
          </Paper>

          <Button variant="contained" color="primary" onClick={handleDownloadBarcode} sx={{ width: "100%" }}>
            Download Barcode
          </Button>

          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 2 }}>
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
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting || !item.name || !item.price}
              sx={{ flex: 1 }}
            >
              {deleting ? <CircularProgress size={24} /> : "Delete Item"}
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete this item?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete{" "}
          <strong>{item.name || "this item"}</strong>? This also removes its stock. This action
          cannot be undone.
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

export default ItemDetails;
