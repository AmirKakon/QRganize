import React from "react";
import { Box, Typography } from "@mui/material";
import ShoppingList from "../../ShoppingList";

const ShoppingListTab = ({ items, onListChanged }) => {
  return (
    <Box
      sx={{
        padding: 2,
        overflowY: "auto",
        maxHeight: "80vh",
      }}
    >
      <Typography
        variant="h5"
        sx={{ marginY: 2, fontWeight: "bold", textAlign: "center" }}
      >
        Shopping List
      </Typography>
      <ShoppingList items={items} onListChanged={onListChanged} />
    </Box>
  );
};

export default ShoppingListTab;
