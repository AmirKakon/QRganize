import React, { useEffect, useRef, useState } from "react";
import { Box, useMediaQuery, Snackbar, Button, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/library";

const BarcodeScanner = ({ isSmallScreen }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [message, setMessage] = useState("");

  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let stopScanning = false;

    const startScanner = async () => {
      try {
        const videoElement = videoRef.current;

        if (videoElement) {
          await codeReader.decodeFromVideoDevice(
            null,
            videoElement,
            (result, error) => {
              if (result) {
                navigate(`/item/${result.getText()}`);
                stopScanning = true; // Stop after successful detection
                codeReader.reset();
              }

              if (error && !(error.name === "NotFoundException")) {
                setMessage("Failed to detect barcode. Please try again.");
              }
            }
          );
        }
      } catch (err) {
        setMessage("Camera access error. Please check permissions.");
      }
    };

    if (!stopScanning) startScanner();

    return () => {
      codeReader.reset();
    };
  }, [navigate]);

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
            overflow: "visible",
          }}
        >
          <Box>
            <h2>Barcode Scanner</h2>
            <video ref={videoRef} style={{ width: 500, height: 500 }} />
            <Button onClick={() => setMessage("TEST")}>Open Snackbar</Button>
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
          <video ref={videoRef} style={{ width: 500, height: 500 }} />
        </Box>
      )}

      <Snackbar
        anchorOrigin={{
          vertical: isSmallScreen ? "bottom" : "top",
          horizontal: "center",
        }}
        open={message !== ""}
        onClose={() => {
          setMessage("");
        }}
        key={"barcode-snackbar"}
        autoHideDuration={6000}
      >
        <Alert
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BarcodeScanner;
