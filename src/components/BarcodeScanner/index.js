import React, { useEffect, useRef, useState } from "react";
import { Box, useMediaQuery, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/library";

const BarcodeScanner = ({ isSmallScreen }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [message, setMessage] = useState("");

  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let stopScanning = false;

    const startScanner = async () => {
      try {
        const videoElement = videoRef.current;
        const canvasElement = canvasRef.current;
        const canvasContext = canvasElement.getContext("2d");

        if (videoElement) {
          await codeReader.decodeFromVideoDevice(null, videoElement, (result, error) => {
            if (result) {
              // Draw rectangle around barcode
              const points = result.getResultPoints();
              if (points.length === 4 && canvasElement && canvasContext) {
                canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);
                canvasContext.strokeStyle = "red";
                canvasContext.lineWidth = 4;

                // Draw the rectangle around the detected barcode
                canvasContext.beginPath();
                canvasContext.moveTo(points[0].x, points[0].y);
                points.forEach((point, index) => {
                  if (index > 0) canvasContext.lineTo(point.x, point.y);
                });
                canvasContext.closePath();
                canvasContext.stroke();
              }

              setMessage(`Barcode detected: ${result.getText()}`);
              // Trigger vibration for feedback (500 ms)
              if (navigator.vibrate) {
                navigator.vibrate(500);
              }

              setTimeout(() => navigate(`/item/${result.getText()}`), 2000); // Navigate after 2s
              stopScanning = true; // Stop after successful detection
              codeReader.reset();
            }

            if (error && !(error.name === "NotFoundException")) {
              setMessage("Failed to detect barcode. Please try again.");
            }
          });
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
            position: "relative",
          }}
        >
          <Box>
            <h2>Barcode Scanner</h2>
            <div style={{ position: "relative" }}>
              <video ref={videoRef} style={{ width: 500, height: 500 }} />
              <canvas
                ref={canvasRef}
                width={500}
                height={500}
                style={{ position: "absolute", top: 0, left: 0 }}
              />
            </div>
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
            position: "relative",
          }}
        >
          <h2>Barcode Scanner</h2>
          <div style={{ position: "relative" }}>
            <video ref={videoRef} style={{ width: 500, height: 500 }} />
            <canvas
              ref={canvasRef}
              width={500}
              height={500}
              style={{ position: "absolute", top: 0, left: 0 }}
            />
          </div>
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
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          {message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default BarcodeScanner;
