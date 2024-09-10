import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProjectOverview } from "../../utilities/api";
import {
  Box,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import Loading from "../../components/Loading";

const ProjectOverviewPage = ({ isSmallScreen }) => {
  const { projectId } = useParams();
  const [project, setProject] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    getProjectOverview(projectId)
      .then((data) => {
        setProject(data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId]);

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} sx={{ backgroundColor: "#e2e2e2", padding: 1 }}>
      <Paper sx={{ padding: 1 }}>
        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign={isSmallScreen ? "center" : "left"}
          padding={isSmallScreen ? 0 : 1}
        >
          {project.title}
        </Typography>

        <Grid container spacing={2} sx={{ padding: 1 }}>
          {isSmallScreen && (
            <Grid item xs={12} sm={5}>
              <img width="100%" src={project.image} alt="Master" />
            </Grid>
          )}

          <Grid item sm={7}>
            <Typography variant="body1" gutterBottom>
              {project.description.split("\\n").map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </Typography>

            <Typography
              variant="body1"
              fontWeight="bold"
              backgroundColor="#d4d4d4"
              paddingLeft={1}
            >
              Features:
            </Typography>
            <List sx={{ marginTop: -1 }}>
              {project.features.map((feature, index) => (
                <ListItem key={index} disablePadding sx={{ paddingLeft: 1 }}>
                  <ListItemText primary={"• " + feature} />
                </ListItem>
              ))}
            </List>

            <Typography
              variant="body1"
              fontWeight="bold"
              backgroundColor="#d4d4d4"
              paddingLeft={1}
            >
              Technologies Used:
            </Typography>
            <List sx={{ marginTop: -1 }}>
              {project.technologies.map((technology, index) => (
                <ListItem key={index} disablePadding sx={{ paddingLeft: 1 }}>
                  <ListItemText primary={"• " + technology} />
                </ListItem>
              ))}
            </List>
            {project.reference && (
              <Typography
                textAlign="center"
                variant="body1"
                fontWeight="bold"
                backgroundColor="#d4d4d4"
              >
                <Link href={project.reference} underline="hover">
                  Click here to check it out!
                </Link>
              </Typography>
            )}
          </Grid>
          {!isSmallScreen && (
            <Grid item sm={5}>
              <img width="100%" src={project.image} alt="Master" />
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProjectOverviewPage;
