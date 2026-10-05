import React, { useState } from "react";
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  parseReceipt,
  createItem,
  addLot,
  addItemBarcode,
  addItemAliases,
} from "../../utilities/api";
import { useItems, useContainers, useRefreshInventory } from "../../utilities/queries";
import { itemNames, filterItemOptions } from "../../utilities/helpers";

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const toDateString = (d) =>
  d ? dayjs(d).format("YYYY-MM-DD").concat("T00:00:00+00:00") : null;

// Rough household shelf life (days) for perishables, keyed by name substrings
// (English + Hebrew). First matching entry wins, so list more-specific first.
// Non-perishables (pasta, rice, cans, cleaning, snacks…) match nothing → no
// suggested date. These are just editable defaults, not guarantees.
const SHELF_LIFE = [
  { days: 30, keys: ["תפוח אדמה", "תפוד", "potato", "בצל", "onion", "שום", "garlic"] },
  { days: 2, keys: ["salmon", "סלמון", "fresh fish", "דג טרי", "טונה טרי"] },
  { days: 4, keys: ["strawberr", "raspberr", "blueberr", "berry", "berries", "תות", "פטל"] },
  {
    days: 5,
    keys: [
      "lettuce", "spinach", "salad", "greens", "arugula", "herb", "basil",
      "cilantro", "parsley", "mushroom", "banana", "avocado", "asparagus",
      "bread", "pita", "חסה", "תרד", "פטרוזיליה", "כוסברה", "בזיליקום",
      "פטריות", "בננה", "אבוקדו", "לחם", "פיתה",
    ],
  },
  {
    days: 7,
    keys: [
      "cucumber", "tomato", "pepper", "zucchini", "broccoli", "cauliflower",
      "grape", "milk", "cream", "מלפפון", "עגבני", "פלפל", "קישוא", "ברוקולי",
      "כרובית", "ענב", "חלב", "שמנת",
    ],
  },
  { days: 10, keys: ["yogurt", "יוגורט", "יורט"] },
  { days: 14, keys: ["cheese", "feta", "celery", "cabbage", "tofu", "גבינ", "סלרי", "כרוב", "טופו"] },
  { days: 21, keys: ["apple", "orange", "citrus", "lemon", "carrot", "egg", "תפוח", "תפוז", "לימון", "גזר", "ביצ"] },
];

// Suggest an expiry (dayjs) from an item name, or null if not a known perishable.
const suggestExpiry = (name) => {
  const n = (name || "").toLowerCase();
  if (!n) return null;
  const hit = SHELF_LIFE.find((e) => e.keys.some((k) => n.includes(k)));
  return hit ? dayjs().add(hit.days, "day") : null;
};

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

const normText = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();

// Letters and digits only, so "מלפפון," and "מלפפון" compare as one word.
const words = (value) => ` ${normText(value).replace(/[^\p{L}\p{N}%']+/gu, " ").trim()} `;

const hasName = (item, text) => itemNames(item).some((n) => normText(n) === normText(text));

// Find an existing item that matches an extracted line, strongest key first:
// barcode (items are keyed by barcode, plus barcode aliases), then an exact
// name or alternate name (receipt text learned from earlier receipts, then
// the English name), then an alternate name appearing as whole words in the
// receipt line (longest wins, so "עגבניות שרי" beats "עגבניות"), and finally
// the older loose substring match on names.
const matchExisting = (receiptName, englishName, barcode, items) => {
  if (isRealBarcode(barcode)) {
    const bc = normBarcode(barcode);
    const byBarcode = items.find(
      (i) =>
        (/^\d+$/.test(String(i.id)) && normBarcode(i.id) === bc) ||
        (Array.isArray(i.barcodes) && i.barcodes.includes(bc))
    );
    if (byBarcode) return byBarcode;
  }

  for (const text of [receiptName, englishName]) {
    if (!normText(text)) continue;
    const exact = items.find((i) => hasName(i, text));
    if (exact) return exact;
  }

  const line = words(receiptName);
  let best = null;
  let bestLength = 0;
  for (const item of items) {
    for (const alias of item.aliases || []) {
      const phrase = words(alias);
      const length = phrase.trim().length;
      if (length >= 3 && length > bestLength && line.includes(phrase)) {
        best = item;
        bestLength = length;
      }
    }
  }
  if (best) return best;

  for (const text of [englishName, receiptName]) {
    const n = normText(text);
    if (!n) continue;
    const loose = items.find((i) => {
      const existing = normText(i.name);
      return existing && (existing.includes(n) || n.includes(existing));
    });
    if (loose) return loose;
  }
  return null;
};

const ScanReceiptPage = () => {
  const [image, setImage] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const { data: allItems } = useItems();
  const { data: containers } = useContainers();
  const refreshInventory = useRefreshInventory();
  const [containerId, setContainerId] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  // Index of the row whose "match to existing item" dialog is open (null = closed).
  const [matchRowIndex, setMatchRowIndex] = useState(null);

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
          const match = matchExisting(item.name, item.englishName, item.barcode, allItems);
          return {
            // Items are named in English; the printed text is kept so it can
            // be saved as an alternate name and matched next time.
            name: item.englishName || item.name,
            receiptName: item.name,
            price: item.price,
            quantity: item.quantity,
            barcode: item.barcode || "",
            include: true,
            matchedId: match ? match.id : null,
            matchedName: match ? match.name : null,
            // Pre-fill a suggested expiry for known perishables (editable).
            expirationDate: suggestExpiry(`${item.englishName || ""} ${item.name}`),
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
            aliases: normText(row.receiptName) !== normText(row.name) ? [row.receiptName] : [],
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
            expirationDate: toDateString(row.expirationDate),
          });
        }
        // Remember the printed text on the matched item so the next receipt
        // (which prints the same abbreviation) matches it by name, even
        // without a barcode.
        const matchedItem = row.matchedId && allItems.find((i) => i.id === row.matchedId);
        if (matchedItem && normText(row.receiptName) && !hasName(matchedItem, row.receiptName)) {
          try {
            await addItemAliases(row.matchedId, row.receiptName);
          } catch (aliasError) {
            console.error("Failed to save the receipt name:", aliasError);
          }
        }
        // If this line was linked to an existing item but carries a different
        // barcode (a new package of the same product), remember that barcode so
        // scanning it later still resolves to this item.
        if (
          row.matchedId &&
          isRealBarcode(row.barcode) &&
          normBarcode(row.matchedId) !== normBarcode(row.barcode)
        ) {
          try {
            await addItemBarcode(row.matchedId, row.barcode);
          } catch (barcodeError) {
            console.error("Failed to attach barcode alias:", barcodeError);
          }
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
    } catch (error) {
      console.error("Error saving receipt items:", error);
      notify("Failed to save some items. Please try again.", "error");
    } finally {
      // Even a partial failure may have created items/stock.
      refreshInventory();
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

            <List disablePadding>
              {rows.map((row, index) => (
                <ListItem key={index} disableGutters sx={{ display: "block", px: 0, py: 0.75 }}>
                  <Paper variant="outlined" sx={{ p: 1, opacity: row.include ? 1 : 0.55 }}>
                    {/* Row 1: include + name */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Checkbox
                        checked={row.include}
                        onChange={(e) => updateRow(index, "include", e.target.checked)}
                        sx={{ p: 0.5 }}
                      />
                      <TextField
                        label="Name"
                        size="small"
                        value={row.name}
                        onChange={(e) => updateRow(index, "name", e.target.value)}
                        sx={{ flex: 1, minWidth: 0 }}
                      />
                    </Box>
                    {row.receiptName && normText(row.receiptName) !== normText(row.name) && (
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 5 }}>
                        On receipt: <span dir="auto">{row.receiptName}</span>
                      </Typography>
                    )}

                    {/* Row 2: price, qty, expiry */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
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
                      <DatePicker
                        label="Expires"
                        value={row.expirationDate || null}
                        onChange={(d) => updateRow(index, "expirationDate", d)}
                        slotProps={{
                          field: { clearable: true },
                          textField: { size: "small", sx: { width: 160 } },
                        }}
                      />
                    </Box>

                    {/* Row 3: match status + relink */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                      <Chip
                        size="small"
                        label={row.matchedId ? `Matches: ${row.matchedName}` : "New item"}
                        color={row.matchedId ? "success" : "secondary"}
                        variant={row.matchedId ? "filled" : "outlined"}
                        sx={{ maxWidth: "70%" }}
                      />
                      <Tooltip title="Match to an existing item">
                        <IconButton size="small" onClick={() => setMatchRowIndex(index)}>
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
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
              ? `Receipt line: "${rows[matchRowIndex].receiptName || rows[matchRowIndex].name}"`
              : ""}
          </Typography>
          <Autocomplete
            options={allItems}
            getOptionLabel={(option) => option.name || ""}
            filterOptions={filterItemOptions}
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
                    {(option.aliases || []).length > 0 && (
                      <> · <span dir="auto">{option.aliases.join(", ")}</span></>
                    )}
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
