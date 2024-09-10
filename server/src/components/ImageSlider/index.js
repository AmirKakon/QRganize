import React, { useState } from "react";
import { Pagination, Box, Grid, Paper } from "@mui/material";

const ImageSlider = ({ images, isSmallScreen }) => {
  const [currentIndex, setCurrentIndex] = useState(1);

  const handlePageChange = (event, value) => {
    setCurrentIndex(value);
  };

  return (
    <Paper sx={{ padding: 2 }}>
      <Grid container direction="column" alignItems="center" spacing={2}>
        <Grid item>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{ height: "100%" }}
          >
            <img
              src={images[currentIndex-1].image}
              alt={images[currentIndex-1].alt}
              style={{ maxWidth: isSmallScreen ? "100%" : "50%" }}
            />
          </Box>
        </Grid>
        <Grid item>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{ height: "100%" }}
          >
            <Pagination color="primary" count={images.length || 0} page={currentIndex} onChange={handlePageChange} />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ImageSlider;
