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
  Checkbox,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import IconButton from "@mui/material/IconButton";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { createItem, deleteItem, getAllContainers, addItemToContainer, getContainersOfItem } from "../../utilities/api";
import { getImageSrc, generateRandomId } from "../../utilities/helpers";
import SearchIcon from "@mui/icons-material/Search";
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import dayjs from "dayjs";

const ItemDetails = ({ item, setItem, setBarcode }) => {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [containers, setContainers] = useState([]);
  const [selectedContainers, setSelectedContainers] = useState([]);
  const [containerDialogOpen, setContainerDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [existingContainers, setExistingContainers] = useState([]); // List of containers where the item already exists

  const filteredContainers = containers.filter((container) =>
    container.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const setDateString = (date) => {
    const d = dayjs(date);
    const formatedDate = d.format("YYYY-MM-DD").concat("T00:00:00+00:00");
    return formatedDate;
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date) => {
    const formattedDate = setDateString(date);
    setItem((prev) => ({ ...prev, expirationDate: formattedDate }));
  }

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

  const handleQuantityChange = (value) => {
    if (value >= 1) {
      setItem((prev) => ({ ...prev, quantity: value }));
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

  const handleGenerateBarcode = () => {
    const newBarcode = generateRandomId();
    setItem((prev) => ({ ...prev, id: newBarcode }));
  };

  const fetchContainers = async () => {
    try {
      const response = await getAllContainers(); // Fetch containers from the API
      setContainers(response || []);

      const existingContainersResponse = await getContainersOfItem(item.id); // Fetch containers where the item already exists
      setExistingContainers(existingContainersResponse || []); // Set existing containers
    } catch (error) {
      console.error("Error fetching containers:", error);
    }
  };

  const handleOpenContainerDialog = async () => {
    await fetchContainers();
    setSelectedContainers(existingContainers);
    setContainerDialogOpen(true);
  };

  const handleCloseContainerDialog = () => {
    setContainerDialogOpen(false);
    setSelectedContainers([]);
  };

  const handleContainerSelect = (containerId) => {
    setSelectedContainers((prev) =>
      prev.includes(containerId)
        ? prev.filter((id) => id !== containerId)
        : [...prev, containerId]
    );
  };

  const handleAddToContainers = async () => {
    try {
      const newContainers = selectedContainers.filter(
        (containerId) => !existingContainers.includes(containerId) // Only include newly added containers
      );

      for (const containerId of newContainers) {
        await addItemToContainer(containerId, { itemId: item.id, quantity: 1 });
      }

      setSnackbar({
        open: true,
        message: "Item added to selected containers successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding item to containers:", error);
      setSnackbar({
        open: true,
        message: "Failed to add item to containers.",
        severity: "error",
      });
    } finally {
      handleCloseContainerDialog();
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
            <Button
              variant="contained"
              color="secondary"
              onClick={handleGenerateBarcode}
              sx={{ minWidth: "40px", padding: "8px" }}
            >
             <EmojiObjectsIcon />
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

          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, width: "100%" }}>
            <IconButton onClick={() => handleQuantityChange((item.quantity || 0) - 1)}>
              <RemoveIcon />
            </IconButton>
            <TextField
              type="number"
              label="Quantity"
              value={item.quantity || 0}
              onChange={(e) => handleQuantityChange(Number(e.target.value))}
              inputProps={{ min: 1 }}
              sx={{ width: "80px" }}
            />
            <IconButton onClick={() => handleQuantityChange((item.quantity || 0) + 1)}>
              <AddIcon />
            </IconButton>
          </Box>

          <DatePicker
            label="Expiration Date"
            name="expirationDate"
            value={dayjs(item.expirationDate) || null}
            onChange={handleDateChange}
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

          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenContainerDialog}
            sx={{ width: "100%" }}
          >
            Add to Containers
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

      <Dialog open={containerDialogOpen} onClose={handleCloseContainerDialog}>
        <DialogTitle>Select Containers</DialogTitle>
        <DialogContent>
          <TextField
            label="Search Containers"
            variant="outlined"
            fullWidth
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <List>
            {filteredContainers.map((container) => {
              const isExistingContainer = existingContainers.some(
                (existingContainer) => existingContainer === container.id
              );
              return (
                <ListItem
                  key={container.id}
                  button={!isExistingContainer} // Disable button if the container is already associated with the item
                  onClick={() => !isExistingContainer && handleContainerSelect(container.id)}
                >
                  <Checkbox
                    checked={selectedContainers.includes(container.id) || isExistingContainer} // Ensure checkbox is checked for existing containers
                    disabled={isExistingContainer} // Disable checkbox for existing containers
                    onChange={() => !isExistingContainer && handleContainerSelect(container.id)}
                  />
                  <ListItemText
                    primary={container.name}
                    secondary={isExistingContainer ? "Already contains this item" : ""}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContainerDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddToContainers} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

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
