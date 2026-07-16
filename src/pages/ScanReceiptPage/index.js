import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Button,
  TextField,
  Checkbox,
  Chip,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  Divider,
  IconButton,
  Tooltip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LinkIcon from "@mui/icons-material/Link";
import {
  parseReceipt,
  getAllItems,
  getAllContainers,
  createItem,
  addLot,
} from "../../utilities/api";

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

// Resize an uploaded image to a max dimension and return a base64 data URL.
const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      const img = new Image();
      img.onerror = reject;
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1200;
        let { width, height } = img;
        if (width > height && width > max) {
          height = Math.round((height * max) / width);
          width = max;
        } else if (height > max) {
          width = Math.round((width * max) / height);
          height = max;
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
    };
    reader.readAsDataURL(file);
  });

// Strip leading zeros so barcodes compare regardless of padding.
const normBarcode = (value) => String(value || "").replace(/\D/g, "").replace(/^0+/, "");

// A code short enough to be a store PLU (e.g. "22") is not a reliable key.
const isRealBarcode = (value) => normBarcode(value).length >= 8;

// Find an existing item that matches an extracted line. Barcode is the
// strongest key (items are keyed by barcode), so try it first; fall back to
// name (exact, then substring) when there is no usable barcode.
const matchExisting = (name, barcode, items) => {
  if (isRealBarcode(barcode)) {
    const bc = normBarcode(barcode);
    // Only compare against items whose id is itself numeric (a barcode),
    // never an alphanumeric Firestore auto-id.
    const byBarcode = items.find(
      (i) => /^\d+$/.test(String(i.id)) && normBarcode(i.id) === bc
    );
    if (byBarcode) return byBarcode;
  }
  const n = name.trim().toLowerCase();
  if (!n) return null;
  return (
    items.find((i) => (i.name || "").trim().toLowerCase() === n) ||
    items.find((i) => {
      const existing = (i.name || "").trim().toLowerCase();
      return existing && (existing.includes(n) || n.includes(existing));
    }) ||
    null
  );
};

const ScanReceiptPage = () => {
  const [image, setImage] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [containers, setContainers] = useState([]);
  const [containerId, setContainerId] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  // Index of the row whose "match to existing item" dialog is open (null = closed).
  const [matchRowIndex, setMatchRowIndex] = useState(null);

  useEffect(() => {
    getAllItems().then((res) => setAllItems(res || [])).catch(() => {});
    getAllContainers().then((res) => setContainers(res || [])).catch(() => {});
  }, []);

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRows([]);
    setParsing(true);
    try {
      const base64 = await resizeImage(file);
      setImage(base64);
      const items = await parseReceipt(base64);
      if (items.length === 0) {
        notify("No items found on that receipt. Try a clearer photo.", "warning");
      }
      setRows(
        items.map((item) => {
          const match = matchExisting(item.name, item.barcode, allItems);
          return {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            barcode: item.barcode || "",
            include: true,
            matchedId: match ? match.id : null,
            matchedName: match ? match.name : null,
          };
        })
      );
    } catch (error) {
      console.error("Error parsing receipt:", error);
      notify(error.message || "Failed to scan receipt.", "error");
    } finally {
      setParsing(false);
    }
  };

  const updateRow = (index, field, value) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  // Link (or unlink) a review row to an existing inventory item. Passing null
  // resets it to a brand-new item.
  const setRowMatch = (index, item) =>
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              matchedId: item ? item.id : null,
              matchedName: item ? item.name : null,
            }
          : row
      )
    );

  const includedRows = rows.filter((row) => row.include);
  const total = includedRows.reduce(
    (sum, row) => sum + (Number(row.price) || 0) * (Number(row.quantity) || 1),
    0
  );

  const handleSave = async () => {
    setSaving(true);
    let created = 0;
    let merged = 0;
    try {
      for (const row of includedRows) {
        let itemId = row.matchedId;
        if (itemId) {
          merged += 1;
        } else {
          const result = await createItem({
            name: row.name,
            price: String(row.price),
            quantity: Number(row.quantity) || 1,
            image: null,
            expirationDate: null,
            shoppingList: false,
            // Key the item by its barcode when one is present, so future
            // receipt scans (and the barcode scanner) match it by id.
            ...(isRealBarcode(row.barcode)
              ? { id: normBarcode(row.barcode) }
              : {}),
          });
          if (typeof result === "string") {
            itemId = result;
            created += 1;
          }
        }
        // Always record the purchased quantity as stock. A lot with no
        // container is "unassigned" stock; picking a container files it there.
        if (typeof itemId === "string") {
          await addLot({
            itemId,
            containerId: containerId || null,
            quantity: Number(row.quantity) || 1,
            expirationDate: null,
          });
        }
      }
      const mergedNote = merged ? ` · ${merged} merged into existing` : "";
      const containerNote = containerId ? " · filed to container" : "";
      notify(
        `Saved: ${created} new item${created === 1 ? "" : "s"}` +
          `${mergedNote}${containerNote}.`
      );
      setRows([]);
      setImage(null);
      getAllItems().then((res) => setAllItems(res || [])).catch(() => {});
    } catch (error) {
      console.error("Error saving receipt items:", error);
      notify("Failed to save some items. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box flex={1} sx={{ backgroundColor: "background.default", padding: 2 }}>
      <h2 style={{ textAlign: "center" }}>Scan Receipt</h2>

      <Paper elevation={2} sx={{ maxWidth: 700, mx: "auto", p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<ReceiptLongIcon />}
            disabled={parsing}
          >
            {parsing ? "Scanning…" : "Take / Upload Receipt Photo"}
            <input
              hidden
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImage}
            />
          </Button>
        </Box>

        {parsing && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {image && !parsing && rows.length === 0 && (
          <Typography sx={{ textAlign: "center", color: "text.secondary" }}>
            No items to review.
          </Typography>
        )}

        {rows.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Review {rows.length} item{rows.length === 1 ? "" : "s"}
            </Typography>

            <List>
              {rows.map((row, index) => (
                <ListItem
                  key={index}
                  disableGutters
                  sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}
                >
                  <Checkbox
                    checked={row.include}
                    onChange={(e) => updateRow(index, "include", e.target.checked)}
                  />
                  <TextField
                    label="Name"
                    size="small"
                    value={row.name}
                    onChange={(e) => updateRow(index, "name", e.target.value)}
                    sx={{ flex: 1, minWidth: 140 }}
                  />
                  <TextField
                    label="Price"
                    size="small"
                    type="number"
                    value={row.price}
                    onChange={(e) => updateRow(index, "price", e.target.value)}
                    sx={{ width: 90 }}
                  />
                  <TextField
                    label="Qty"
                    size="small"
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, "quantity", Number(e.target.value))}
                    sx={{ width: 70 }}
                  />
                  <Chip
                    size="small"
                    label={row.matchedId ? `Matches: ${row.matchedName}` : "New item"}
                    color={row.matchedId ? "success" : "secondary"}
                    variant={row.matchedId ? "filled" : "outlined"}
                  />
                  <Tooltip title="Match to an existing item">
                    <IconButton
                      size="small"
                      onClick={() => setMatchRowIndex(index)}
                    >
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Add all to container (optional)</InputLabel>
              <Select
                value={containerId}
                label="Add all to container (optional)"
                onChange={(e) => setContainerId(e.target.value)}
              >
                <MenuItem value="">
                  <em>Don&apos;t add to a container</em>
                </MenuItem>
                {containers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={{ fontWeight: "bold" }}>
                {includedRows.length} selected · {money(total)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={saving || includedRows.length === 0}
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : null}
              >
                Save items
              </Button>
            </Box>
          </>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={matchRowIndex !== null}
        onClose={() => setMatchRowIndex(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Match to an existing item</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            {matchRowIndex !== null && rows[matchRowIndex]
              ? `Receipt line: "${rows[matchRowIndex].name}"`
              : ""}
          </Typography>
          <Autocomplete
            options={allItems}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={
              matchRowIndex !== null && rows[matchRowIndex]?.matchedId
                ? allItems.find(
                    (i) => i.id === rows[matchRowIndex].matchedId
                  ) || null
                : null
            }
            onChange={(event, item) => setRowMatch(matchRowIndex, item)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {option.quantity ?? 0} in stock · id {option.id}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Search items" autoFocus />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRowMatch(matchRowIndex, null);
              setMatchRowIndex(null);
            }}
          >
            Keep as new item
          </Button>
          <Button variant="contained" onClick={() => setMatchRowIndex(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ScanReceiptPage;
