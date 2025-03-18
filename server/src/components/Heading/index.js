import React from "react";
import { Box, useMediaQuery } from "@mui/material";

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
          <h3>Hello World</h3>
        </Box>
      )}

      {isSmallScreen && (
        <Box
          flex={1}
          display="flex"
          alignContent="center"
          justifyContent="center"
          flexDirection="column"
          sx={{ backgroundColor: "#010101", height: "90vh" }}
        >
          <h3>Hello World</h3>
        </Box>
      )}
    </>
  );
};

export default Heading;
