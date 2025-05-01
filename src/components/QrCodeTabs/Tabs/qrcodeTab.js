import React from "react";
import { Box, Typography } from "@mui/material";
import BarcodeScanner from "../../BarcodeScanner";

const QrCodeTab = ({ isSmallScreen }) => {

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
      <BarcodeScanner isSmallScreen={isSmallScreen} itemType={"container"} />
    </Box>
  );
};

export default QrCodeTab;
