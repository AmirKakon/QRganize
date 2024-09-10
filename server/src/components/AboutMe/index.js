import React from "react";
import { Paper, Typography, Grid } from "@mui/material";
const info =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Famir-icon-info.mp4?alt=media&token=f21ba6fb-da90-4224-bb44-4b78106fa603";

const AboutMe = ({ isSmallScreen }) => {
  return (
    <div id="about-me">
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
          >
            <Grid item>
              <video autoPlay loop muted src={info} style={{ width: 45 }} />
            </Grid>
            <Grid item>
              <Typography variant="h4" textAlign="center">
                About Me
              </Typography>
            </Grid>
          </Grid>
          <Grid item>
            <Typography>
              I am an enthusiastic Software Engineer and Oleh Chadash (New
              Immigrant) with a wide range of professional experience.
              <br />
              Expertise in Object-Oriented programming, algorithms, and data
              structures.
              <br />
              Extensive background in Azure systems, Full Stack programming and
              IoT devices.
              <br />I like to experiment with and learn new technical skills,
              such as website development, photography, and piano playing.
              <br />
              <i>Fluent in Hebrew and English as mother tongue.</i>
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

export default AboutMe;
