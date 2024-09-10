import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Typography,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
} from "@mui/material";

const ProjectItem = ({ project }) => {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    navigate(`/projects/${project.url}`);
  };

  return (
    <Card
      sx={{
        padding: 1,
        backgroundColor: "#e6deca",
        height: "96%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardMedia
        component="img"
        height="220"
        image={project.image}
        alt={project.alt}
      />
      <CardContent sx={{ flex: 1 }}>
        <Typography variant="h5" fontWeight="bold">
          {project.title}
        </Typography>
        <Typography variant="subtitle1" color="GrayText">
          {project.technologies}
        </Typography>
        <Typography variant="body1" sx={{ flex: 1, overflow: "auto" }}>
          {project.description}
        </Typography>
      </CardContent>
      <CardActions>
        <Button variant="outlined" onClick={handleLearnMore} fullWidth>
          Learn More
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProjectItem;
