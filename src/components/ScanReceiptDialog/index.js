import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { scanReceipt, createItem } from "../../utilities/api";

const ScanReceiptDialog = ({ open, onClose }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result
          .replace("data:", "")
          .replace(/^.+,/, "");
        setImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanReceipt = async () => {
    if (!image) {
      setSnackbar({
        open: true,
        message: "Please select an image.",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await scanReceipt(image);
      setItems(response);
    } catch (error) {
      console.error("Error scanning receipt:", error);
      setSnackbar({
        open: true,
        message: "Failed to scan receipt.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSaveItems = async () => {
    setLoading(true);
    try {
      for (const item of items) {
        await createItem({
          ...item,
          image: "",
          shoppingList: false,
        });
      }
      setSnackbar({
        open: true,
        message: "Items saved successfully!",
        severity: "success",
      });
      onClose();
    } catch (error) {
      console.error("Error saving items:", error);
      setSnackbar({
        open: true,
        message: "Failed to save items.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Scan Receipt</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Button variant="contained" component="label">
              Upload Receipt Image
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleImageChange}
              />
            </Button>
            {image && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleScanReceipt}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Scan"}
              </Button>
            )}
            {items.length > 0 && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.price}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "price",
                                Number(e.target.value)
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSaveItems}
            color="primary"
            disabled={loading || items.length === 0}
          >
            Save Items
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

export default ScanReceiptDialog;
