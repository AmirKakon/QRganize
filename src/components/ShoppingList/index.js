import React, { useState } from "react";
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Typography,
} from "@mui/material";

const money = (n) => `$${n.toFixed(2)}`;

const priceOf = (item) => {
  const p = parseFloat(item.price);
  return isNaN(p) ? 0 : p;
};

// Treat quantity as "how many to buy"; default to 1 when unset/zero.
const qtyOf = (item) => (item.quantity && item.quantity > 0 ? item.quantity : 1);

const lineTotalOf = (item) => priceOf(item) * qtyOf(item);

// Shopping list with per-item line totals, running totals, and in-cart check-off.
const ShoppingList = ({ items }) => {
  const [checkedIds, setCheckedIds] = useState([]);

  const toggle = (id) =>
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  if (items.length === 0) {
    return (
      <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
        Your shopping list is empty. Turn on &ldquo;Add to Shopping List&rdquo;
        on an item to add it here.
      </Typography>
    );
  }

  const total = items.reduce((sum, item) => sum + lineTotalOf(item), 0);
  const remaining = items
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

      <List>
        {items.map((item) => {
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
    </Box>
  );
};

export default ShoppingList;
