import React from "react";
import { Box, Typography } from "@mui/material";
import ExpiringItemsList from "../../ExpiringItemsList";

const ExpiringTab = ({ items }) => {
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
        Expiring Soon
      </Typography>
      <ExpiringItemsList items={items} />
    </Box>
  );
};

export default ExpiringTab;
