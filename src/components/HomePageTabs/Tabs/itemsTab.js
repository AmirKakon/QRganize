import React from "react";
import { Box, Typography } from "@mui/material";
import ItemList from "../../ItemList";

const ItemsTab = ({ isSmallScreen, items, containers = [], areas = [] }) => {
  return (
    <Box
      sx={{
        padding: 2,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h5"
        sx={{ marginY: 2, fontWeight: "bold", textAlign: "center" }}
      >
        Items List
      </Typography>
      <ItemList
        items={items}
        isSmallScreen={isSmallScreen}
        containers={containers}
        areas={areas}
      />
    </Box>
  );
};

export default ItemsTab;
