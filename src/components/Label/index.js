import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";

// A single printable label: a QR code (for containers) or a barcode (for items)
// with the name above and the id below. Renders into a <canvas> so it prints crisply.
const Label = ({ type, id, name }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !id) return;

    if (type === "qr") {
      QRCode.toCanvas(canvas, String(id), { width: 150, margin: 1 }, (err) => {
        if (err) console.error("QR generation error:", err);
      });
    } else {
      try {
        JsBarcode(canvas, String(id), {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: false,
          margin: 0,
        });
      } catch (err) {
        console.error("Barcode generation error:", err);
      }
    }
  }, [type, id]);

  return (
    <Box
      className="label"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        p: 1,
        border: "1px solid #cccccc",
        borderRadius: 1,
        backgroundColor: "#ffffff",
        color: "#000000",
        textAlign: "center",
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }} noWrap>
        {name || "(no name)"}
      </Typography>
      <canvas ref={canvasRef} style={{ maxWidth: "100%" }} />
      <Typography variant="caption" sx={{ wordBreak: "break-all" }}>
        {id}
      </Typography>
    </Box>
  );
};

export default Label;
