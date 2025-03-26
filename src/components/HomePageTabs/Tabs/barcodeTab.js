import React from "react";
import { Box, Typography, useMediaQuery } from "@mui/material";
import BarcodeScanner from "../../BarcodeScanner";

const BarcodeTab = ({ isSmallScreen }) => {
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        height: isSmallScreen ? "90vh" : "80vh",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          marginTop: isSmallScreen ? 2 : 5,
          mb: 2,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Barcode Scanner
      </Typography>
      <BarcodeScanner isSmallScreen={isSmallScreen} />
    </Box>
  );
};

export default BarcodeTab;
