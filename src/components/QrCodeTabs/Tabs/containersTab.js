import React from "react";
import { Box, Typography } from "@mui/material";
import ContainerList from "../../ContainerList";

const ContainersTab = ({ isSmallScreen, containers }) => {
  return (
    <Box
      sx={{
        padding: 2,
        overflow: "hidden",
      }}
    >
      <Typography
        variant="h5"
        sx={{ marginY: 2, fontWeight: "bold", textAlign: "center" }}
      >
        Containers List
      </Typography>
      <ContainerList containers={containers} isSmallScreen={isSmallScreen} />
    </Box>
  );
};

export default ContainersTab;
