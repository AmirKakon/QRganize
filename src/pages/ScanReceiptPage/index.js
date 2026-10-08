import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Button,
  ButtonBase,
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
  setItemTags,
} from "../../utilities/api";
import { useItems, useContainers, useRefreshInventory } from "../../utilities/queries";
import { filterItemOptions, tagCounts } from "../../utilities/helpers";
import {
  collapseRows,
  withSuggestions,
  matchExisting,
  hasName,
  normText,
  normBarcode,
  isRealBarcode,
} from "../../utilities/receiptSuggestions";

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const toDateString = (d) =>
  d ? dayjs(d).format("YYYY-MM-DD").concat("T00:00:00+00:00") : null;

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

const ScanReceiptPage = () => {
  const [image, setImage] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const { data: allItems } = useItems();
  const { data: containers } = useContainers();
  const refreshInventory = useRefreshInventory();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  // Index of the row whose "match to existing item" dialog is open (null = closed).
  const [matchRowIndex, setMatchRowIndex] = useState(null);
  // Index of the row whose container / tags / expiry are expanded for editing.
  const [editingIndex, setEditingIndex] = useState(null);
  const tagOptions = useMemo(() => tagCounts(allItems).map((t) => t.tag), [allItems]);

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const containerName = (id) => containers.find((c) => c.id === id)?.name || "No container";

  // One row per product, each with suggested tags, container and expiry.
  const suggestAll = (list) =>
    collapseRows(list).map((row) => withSuggestions(row, allItems, containers));

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRows([]);
    setEditingIndex(null);
    setParsing(true);
    try {
      const base64 = await resizeImage(file);
      setImage(base64);
      const items = await parseReceipt(base64, tagOptions);
      if (items.length === 0) {
        notify("No items found on that receipt. Try a clearer photo.", "warning");
      }
      setRows(
        suggestAll(
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
              aiTags: item.tags || [],
              aiShelfLife: item.shelfLifeDays || null,
            };
          })
        )
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

  // Change a suggested field. It is marked as the user's so suggestions never
  // overwrite it, and the fields that depend on it are refreshed: new tags can
  // change the container, a new container can change the expiry.
  const editSuggestion = (index, changes) =>
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? withSuggestions({ ...row, ...changes }, allItems, containers) : row
      )
    );

  const setAllContainers = (containerId) =>
    setRows((prev) =>
      prev.map((row) =>
        row.include
          ? withSuggestions(
              { ...row, containerId, containerTouched: true, containerReason: "set by you" },
              allItems,
              containers
            )
          : row
      )
    );

  // Link (or unlink) a review row to an existing inventory item. Passing null
  // resets it to a brand-new item. Rows now pointing at the same item merge.
  const setRowMatch = (index, item) => {
    setEditingIndex(null);
    setRows((prev) =>
      suggestAll(
        prev.map((row, i) =>
          i === index
            ? { ...row, matchedId: item ? item.id : null, matchedName: item ? item.name : null }
            : row
        )
      )
    );
  };

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
        const matchedItem = row.matchedId && allItems.find((i) => i.id === row.matchedId);
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
            tags: row.tags || [],
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
        // Always record the purchased quantity as stock, in the row's
        // container (no container = unassigned stock).
        if (typeof itemId === "string") {
          await addLot({
            itemId,
            containerId: row.containerId || null,
            quantity: Number(row.quantity) || 1,
            expirationDate: toDateString(row.expirationDate),
          });
        }
        // A matched item keeps its own tags unless it had none or the user
        // changed them here.
        if (
          matchedItem &&
          (row.tags || []).length &&
          (row.tagsTouched || !(matchedItem.tags || []).length)
        ) {
          try {
            await setItemTags(row.matchedId, row.tags);
          } catch (tagError) {
            console.error("Failed to save tags:", tagError);
          }
        }
        // Remember the printed text on the matched item so the next receipt
        // (which prints the same abbreviation) matches it by name, even
        // without a barcode.
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
      const mergedNote = merged ? ` · ${merged} added to existing items` : "";
      notify(`Saved: ${created} new item${created === 1 ? "" : "s"}${mergedNote}.`);
      setRows([]);
      setImage(null);
      setEditingIndex(null);
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
                    {((row.receiptName && normText(row.receiptName) !== normText(row.name)) || row.lines > 1) && (
                      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 5 }}>
                        {row.receiptName && normText(row.receiptName) !== normText(row.name) && (
                          <>On receipt: <span dir="auto">{row.receiptName}</span></>
                        )}
                        {row.lines > 1 && ` · ${row.lines} lines combined`}
                      </Typography>
                    )}

                    {/* Row 2: price, qty */}
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
                    </Box>

                    {/* Row 3: where it goes, tags, expiry — one line, tap to edit */}
                    <ButtonBase
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                      aria-expanded={editingIndex === index}
                      sx={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        mt: 1,
                        px: 1,
                        py: 0.75,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                      }}
                    >
                      <Typography variant="body2">
                        → <strong>{containerName(row.containerId)}</strong>
                        {" · "}
                        {(row.tags || []).length ? row.tags.join(", ") : "no tags"}
                        {" · "}
                        {row.expirationDate
                          ? `expires ${dayjs(row.expirationDate).format("D MMM YYYY")}`
                          : "no expiry"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {[
                          row.containerReason,
                          row.expiryReason && `expiry: ${row.expiryReason}`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        {editingIndex === index ? "" : " — tap to change"}
                      </Typography>
                    </ButtonBase>

                    {editingIndex === index && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1.5 }}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Container</InputLabel>
                          <Select
                            value={row.containerId || ""}
                            label="Container"
                            onChange={(e) =>
                              editSuggestion(index, {
                                containerId: e.target.value,
                                containerTouched: true,
                                containerReason: "set by you",
                              })
                            }
                          >
                            <MenuItem value="">
                              <em>No container</em>
                            </MenuItem>
                            {containers.map((c) => (
                              <MenuItem key={c.id} value={c.id}>
                                {c.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Autocomplete
                          multiple
                          freeSolo
                          size="small"
                          options={tagOptions}
                          value={row.tags || []}
                          onChange={(e, value) =>
                            editSuggestion(index, {
                              tags: [...new Set(value.map((t) => normText(t)).filter(Boolean))],
                              tagsTouched: true,
                            })
                          }
                          renderInput={(params) => <TextField {...params} label="Tags" />}
                        />
                        <DatePicker
                          label="Expires"
                          value={row.expirationDate || null}
                          onChange={(d) =>
                            editSuggestion(index, {
                              expirationDate: d,
                              expiryTouched: true,
                              expiryReason: "set by you",
                            })
                          }
                          slotProps={{
                            field: { clearable: true },
                            textField: { size: "small" },
                          }}
                        />
                      </Box>
                    )}

                    {/* Row 4: match status + relink */}
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
              <InputLabel>Set all to container…</InputLabel>
              <Select
                value=""
                label="Set all to container…"
                onChange={(e) => setAllContainers(e.target.value)}
              >
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
            onChange={(event, item) => {
              setRowMatch(matchRowIndex, item);
              setMatchRowIndex(null);
            }}
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
