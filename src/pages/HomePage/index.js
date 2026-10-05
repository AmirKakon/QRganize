import React from "react";
import { Box } from "@mui/material";
import HomePageTabs from "../../components/HomePageTabs";

const HomePage = ({ isSmallScreen }) => (
  <Box flex={1} spacing={1} sx={{ backgroundColor: "background.default", padding: 2 }}>
    <HomePageTabs isSmallScreen={isSmallScreen} />
  </Box>
);

export default HomePage;
