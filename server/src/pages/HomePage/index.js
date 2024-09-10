import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import Heading from "../../components/Heading";
import Projects from "../../components/Projects";
import AccessTokenExpiration from "../../components/AccessTokenExpiration";
import Loading from "../../components/Loading";


const HomePage = ({ isSmallScreen }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setLoading(false);
  }, []);

  const jumpToProjects = () => {
    const projects = document.getElementById("projects");
    projects.scrollIntoView({ behavior: "smooth" });
  };

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{backgroundColor: "#e2e2e2"}}>
      <Heading isSmallScreen={isSmallScreen} handleArrowClick={jumpToProjects}/>
      <Projects isSmallScreen={isSmallScreen} filter={true} />
      <AccessTokenExpiration />
    </Box>
  );
};

export default HomePage;
