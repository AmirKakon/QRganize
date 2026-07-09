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
} from "@mui/material";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import { setItemShoppingList } from "../../utilities/api";

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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

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

  if (visibleItems.length === 0) {
    return (
      <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
        Your shopping list is empty. Turn on &ldquo;Add to Shopping List&rdquo;
        on an item to add it here.
      </Typography>
    );
  }

  const total = visibleItems.reduce((sum, item) => sum + lineTotalOf(item), 0);
  const remaining = visibleItems
    .filter((item) => !checkedIds.includes(item.id))
    .reduce((sum, item) => sum + lineTotalOf(item), 0);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
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
