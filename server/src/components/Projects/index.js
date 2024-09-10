import React, { useEffect, useState } from "react";
import { getProjectCards } from "../../utilities/api";
import { Paper, Typography, Grid, CircularProgress } from "@mui/material";
import ProjectItem from "./ProjectItem";
const developer =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Fdeveloper.gif?alt=media&token=ff34df41-9454-4348-a934-32da86e8ac28";

  const projectList = ["bayit-abroad", "device-management-dashboard", "master-slave-simulator"]

const Projects = ({filter}) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectCards()
      .then((data) => {
        if(filter){
          data = data.filter((project) => projectList.includes(project.url))
        }
        setCards(data)
      })
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div id="projects">
      <Paper sx={{ margin: 1, padding: 1 }}>
        <Grid container direction="column" display="flex" alignItems="center">
          <Grid
            container
            item
            direction="row"
            display="flex"
            alignItems="center"
            justifyContent="center"
            spacing={1}
            sx={{ marginBottom: 1 }}
          >
            <Grid item>
              <img src={developer} alt="" style={{ width: 31 }} />
            </Grid>
            <Grid item>
              <Typography variant="h4" textAlign="center">
                Projects
              </Typography>
            </Grid>
          </Grid>
          {loading ? (
            <CircularProgress />
          ) : (
            <Grid
              container
              item
              direction="row"
              display="flex"
              alignItems="stretch"
              justifyContent="center"
              spacing={1}
              sx={{ flexGrow: 1 }}
            >
              {cards.map((item, index) => (
                <Grid item xs={12} sm={7} md={4} key={index}>
                  <ProjectItem project={item} />
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Paper>
    </div>
  );
};

export default Projects;
