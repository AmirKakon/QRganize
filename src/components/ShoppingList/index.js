import React, { useState } from "react";
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  TextField,
} from "@mui/material";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { setItemShoppingList, createItem } from "../../utilities/api";

const money = (n) => `$${n.toFixed(2)}`;

const priceOf = (item) => {
  const p = parseFloat(item.price);
  return isNaN(p) ? 0 : p;
};

// Treat quantity as "how many to buy"; default to 1 when unset/zero.
const qtyOf = (item) => (item.quantity && item.quantity > 0 ? item.quantity : 1);

const lineTotalOf = (item) => priceOf(item) * qtyOf(item);

// Shopping list with per-item line totals, running totals, and in-cart check-off.
const ShoppingList = ({ items, onListChanged }) => {
  const [checkedIds, setCheckedIds] = useState([]);
  const [removing, setRemoving] = useState(false);
  // Items removed locally but not yet gone from the (slow) refetch — hide them
  // immediately so there's no window where a purchased item lingers un-crossed.
  const [hiddenIds, setHiddenIds] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [adding, setAdding] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Add an arbitrary "to buy" item that isn't in the inventory yet. It's created
  // as a normal item (price 0, no photo) flagged onto the shopping list.
  const handleAddFreeText = async () => {
    const name = newItem.trim();
    if (!name) return;
    setAdding(true);
    try {
      await createItem({ name, price: "0", image: null, shoppingList: true, expirationDate: null });
      setNewItem("");
      setSnackbar({ open: true, message: `Added "${name}" to the list.`, severity: "success" });
      await onListChanged?.();
    } catch (error) {
      console.error("Error adding shopping-list item:", error);
      setSnackbar({ open: true, message: "Failed to add item. Please try again.", severity: "error" });
    } finally {
      setAdding(false);
    }
  };

  const toggle = (id) =>
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // Persist: take the checked ("bought") items off the shopping list.
  const handleRemovePurchased = async () => {
    const ids = [...checkedIds];
    setRemoving(true);
    try {
      for (const id of ids) {
        await setItemShoppingList(id, false);
      }
      // Optimistically drop them from the view right away, then reconcile once
      // the refetch returns.
      setHiddenIds((prev) => [...prev, ...ids]);
      setCheckedIds([]);
      setSnackbar({
        open: true,
        message: `Removed ${ids.length} item${ids.length === 1 ? "" : "s"} from the list.`,
        severity: "success",
      });
      await onListChanged?.();
      setHiddenIds([]);
    } catch (error) {
      console.error("Error removing purchased items:", error);
      setSnackbar({
        open: true,
        message: "Failed to update the list. Please try again.",
        severity: "error",
      });
    } finally {
      setRemoving(false);
    }
  };

  const visibleItems = items.filter((item) => !hiddenIds.includes(item.id));
  const isEmpty = visibleItems.length === 0;

  const total = visibleItems.reduce((sum, item) => sum + lineTotalOf(item), 0);
  const remaining = visibleItems
    .filter((item) => !checkedIds.includes(item.id))
    .reduce((sum, item) => sum + lineTotalOf(item), 0);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <TextField
          size="small"
          fullWidth
          label="Add something to buy"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddFreeText();
          }}
        />
        <Button
          variant="contained"
          onClick={handleAddFreeText}
          disabled={adding || !newItem.trim()}
          startIcon={adding ? <CircularProgress size={18} color="inherit" /> : <AddShoppingCartIcon />}
        >
          Add
        </Button>
      </Box>

      {isEmpty && (
        <Typography sx={{ mt: 2, color: "text.secondary", textAlign: "center" }}>
          Your shopping list is empty. Add something above, or turn on
          &ldquo;Add to Shopping List&rdquo; on any item.
        </Typography>
      )}

      {!isEmpty && (
      <>
      <Paper
        variant="outlined"
        sx={{ p: 2, mb: 2, display: "flex", justifyContent: "space-between" }}
      >
        <Box>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            Left to buy
          </Typography>
          <Typography variant="h6">{money(remaining)}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="overline" sx={{ color: "text.secondary" }}>
            List total
          </Typography>
          <Typography variant="h6">{money(total)}</Typography>
        </Box>
      </Paper>

      {checkedIds.length > 0 && (
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={removing ? <CircularProgress size={18} color="inherit" /> : <RemoveShoppingCartIcon />}
          onClick={handleRemovePurchased}
          disabled={removing}
          sx={{ mb: 2 }}
        >
          Remove purchased ({checkedIds.length})
        </Button>
      )}

      <List>
        {visibleItems.map((item) => {
          const checked = checkedIds.includes(item.id);
          return (
            <ListItem
              key={item.id}
              disablePadding
              secondaryAction={
                <Typography
                  sx={{ color: checked ? "text.disabled" : "text.primary" }}
                >
                  {money(lineTotalOf(item))}
                </Typography>
              }
            >
              <ListItemButton onClick={() => toggle(item.id)} dense>
                <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple />
                <ListItemText
                  primary={item.name}
                  secondary={`${qtyOf(item)} × ${money(priceOf(item))}`}
                  sx={{
                    "& .MuiListItemText-primary": {
                      textDecoration: checked ? "line-through" : "none",
                      color: checked ? "text.disabled" : "text.primary",
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      </>
      )}

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
    </Box>
  );
};

export default ShoppingList;
