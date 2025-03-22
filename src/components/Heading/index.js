import React from "react";
import { Box, useMediaQuery } from "@mui/material";
import BarcodeScanner from "../BarcodeScanner";

const Heading = ({ isSmallScreen }) => {
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

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
            <h3>Hello NEW World</h3>
            <BarcodeScanner isSmallScreen={isSmallScreen} />
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
          <h3>Hello World</h3>
          <BarcodeScanner isSmallScreen={isSmallScreen} />
        </Box>
      )}
    </>
  );
};

export default Heading;
