import React from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const BarcodeScanner = ({ isSmallScreen }) => {
  const navigate = useNavigate();
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  const videoConstraints = {
    facingMode: "environment", // Use back camera
    focusMode: "continuous", // Autofocus (if supported)
  };

  const onUpdateOfBarcode = (err, result) => {
    if (result) {
      const url = `/item/${result.text}`;
      navigate(url);
    }
  };

  return (
    <>
      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
          }}
        >
          <Box>
            <h2>Barcode Scanner</h2>
            <BarcodeScannerComponent
              width={500}
              height={500}
              videoConstraints={videoConstraints}
              onUpdate={onUpdateOfBarcode}
            />
          </Box>
        </Box>
      )}

      {isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: "90vh",
          }}
        >
          <h2>Barcode Scanner</h2>
          <BarcodeScannerComponent
            width={500}
            height={500}
            videoConstraints={videoConstraints}
            onUpdate={onUpdateOfBarcode}
          />
        </Box>
      )}
    </>
  );
};

export default BarcodeScanner;
