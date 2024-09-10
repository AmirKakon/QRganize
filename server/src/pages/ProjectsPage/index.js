import React, { useEffect } from "react";
import { Box } from "@mui/material";
import Projects from "../../components/Projects";
import Loading from "../../components/Loading";

const ProjectsPage = ({ isSmallScreen }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return false ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{ backgroundColor: "#e2e2e2", paddingTop: 1 }}>
      <Projects isSmallScreen={isSmallScreen} filter={false}/>
    </Box>
  );
};

export default ProjectsPage;
