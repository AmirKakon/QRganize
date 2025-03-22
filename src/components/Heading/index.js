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
            position: "relative",
            overflow: "hidden",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
          }}
        >
          <h3>Hello NEW World</h3>
          <BarcodeScanner />
        </Box>
      )}

      {isSmallScreen && (
        <Box
          flex={1}
          display="flex"
          alignContent="center"
          justifyContent="center"
          flexDirection="column"
          sx={{ height: "90vh" }}
        >
          <h3>Hello World</h3>
          <BarcodeScanner />
        </Box>
      )}
    </>
  );
};

export default Heading;
