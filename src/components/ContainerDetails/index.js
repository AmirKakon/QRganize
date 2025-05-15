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
  Checkbox,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { createContainer, deleteContainer, updateContainerItemsQuantity, getAllItems, addItemToContainer } from "../../utilities/api";
import { getImageSrc } from "../../utilities/helpers";
import ItemsInContainerList from "../ItemsInContainerList";

const ContainerDetails = ({ container, setContainer, items, setItems, isSmallScreen }) => {
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [allItems, setAllItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);

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

        await handleAddItemsToContainer(); 

        const itemQuantityList = items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        }));

        const itemQuantityResponse = await updateContainerItemsQuantity(container.id, itemQuantityList);
        if (!itemQuantityResponse) {
          setSnackbar({
            open: true,
            message: "Failed to update item quantities.",
            severity: "error",
          });
      };
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

  const fetchItems = async () => {
    try {
      const response = await getAllItems(); // Fetch all items from the API
      setAllItems(response || []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const handleOpenItemDialog = async () => {
    await fetchItems();
    const existingItemIds = items.map((item) => item.itemId); // Get IDs of items already in the container
    setSelectedItems(existingItemIds); // Pre-select these items
    setItemDialogOpen(true);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
  };

  const handleItemSelect = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleAddItemsToContainer = async () => {
    try {
      const newItems = allItems.filter(
        (item) => selectedItems.includes(item.id) && !items.some((existingItem) => existingItem.itemId === item.id)
      );

      for (const newItem of newItems) {
        await addItemToContainer(container.id, { itemId: newItem.id, quantity: 1 });
      }

      setSnackbar({
        open: true,
        message: "Items added to the container successfully!",
        severity: "success",
      });

      // Update the container's items list with new items
      setItems((prev) => [
        ...prev,
        ...newItems.map((item) => ({ itemId: item.id, name: item.name, image:item.image, quantity: 1 })),
      ]);
    } catch (error) {
      console.error("Error adding items to container:", error);
      setSnackbar({
        open: true,
        message: "Failed to add items to the container.",
        severity: "error",
      });
    } finally {
      handleCloseItemDialog();
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

          <ItemsInContainerList items={items} setItems={setItems} container={container} isSmallScreen={isSmallScreen}/>

          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenItemDialog}
            sx={{ width: "100%" }}
          >
            Add Items to Container
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

      <Dialog open={itemDialogOpen} onClose={handleCloseItemDialog}>
        <DialogTitle>Select Items</DialogTitle>
        <DialogContent>
          <List>
            {allItems.map((item) => {
              const isExistingItem = items.some((existingItem) => existingItem.itemId === item.id);
              return (
                <ListItem
                  key={item.id}
                  button={!isExistingItem} // Disable button if the item is already in the container
                  onClick={() => !isExistingItem && handleItemSelect(item.id)}
                >
                  <Checkbox
                    checked={selectedItems.includes(item.id)}
                    disabled={isExistingItem} // Disable checkbox for existing items
                    onChange={() => !isExistingItem && handleItemSelect(item.id)}
                  />
                  <ListItemText
                    primary={item.name}
                    secondary={isExistingItem ? "Already in container" : ""}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAddItemsToContainer} color="primary">
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

export default ContainerDetails;
