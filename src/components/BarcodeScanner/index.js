import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  useMediaQuery,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { BrowserMultiFormatReader } from "@zxing/library";

const BarcodeScanner = ({ isSmallScreen, itemType }) => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [message, setMessage] = useState("");
  const [selectedCamera, setSelectedCamera] = useState("");
  const [cameras, setCameras] = useState([]);

  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        // Request camera permissions
        await navigator.mediaDevices.getUserMedia({ video: true });

        // List available video input devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        if (videoDevices.length > 0) {
          // Try to auto-select the best back-facing camera
          const backFacingCamera = videoDevices
            .sort((a, b) => a.label.localeCompare(b.label))
            .find(
              (device) =>
                device.label.toLowerCase().includes("back") ||
                device.label.toLowerCase().includes("environment")
            );

          const bestDefaultCamera =
            backFacingCamera ||
            videoDevices.find((device) =>
              device.label.toLowerCase().includes("camera2")
            ) ||
            videoDevices[0]; // Fallback to the first camera

          setCameras(videoDevices);
          setSelectedCamera(bestDefaultCamera.deviceId); // Set the best option as default
        }
      } catch (error) {
        setMessage("Error accessing cameras. Please check permissions.");
      }
    };

    fetchCameras();
  }, []);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let stopScanning = false;

    const startScanner = async () => {
      try {
        const videoElement = videoRef.current;

        if (videoElement && selectedCamera) {
          await codeReader.decodeFromVideoDevice(
            selectedCamera,
            videoElement,
            (result, error) => {
              if (result) {
                navigator.vibrate(200);
                navigate(`/${itemType}?id=${result.getText()}`);
                stopScanning = true;
                codeReader.reset();
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
  }, [navigate, selectedCamera]);

  return (
    <>
      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
            overflow: "visible",
          }}
        >

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Camera</InputLabel>
            <Select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              label="Select Camera"
            >
              {cameras.map((camera, index) => (
                <MenuItem key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${index + 1}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <video ref={videoRef} style={{ width: 500, height: 500 }} />
        </Box>
      )}

      {isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            height: "90vh",
          }}
        >

          <FormControl sx={{ mb: 2 }}>
            <InputLabel>Select Camera</InputLabel>
            <Select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              label="Select Camera"
            >
              {cameras.map((camera, index) => (
                <MenuItem key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Camera ${index + 1}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <video ref={videoRef} style={{ width: "95%", height: "40%" }} />
        </Box>
      )}

      <Snackbar
        anchorOrigin={{
          vertical: isSmallScreen ? "bottom" : "top",
          horizontal: "center",
        }}
        open={Boolean(message)}
        onClose={() => setMessage("")}
        key={"barcode-snackbar"}
        autoHideDuration={6000}
      >
        <Alert
          onClose={() => setMessage("")}
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
