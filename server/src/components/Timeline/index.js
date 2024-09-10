import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Divider,
  Grid,
  CardMedia,
  CircularProgress,
} from "@mui/material";
import Brightness1Icon from "@mui/icons-material/Brightness1";
import { getTimeline } from "../../utilities/api";

const Timeline = ({ isSmallScreen }) => {
  const [iconSize, setIconSize] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTimeline()
      .then((response) => {
        setData(response);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isSmallScreen) {
      setIconSize(70);
    } else {
      setIconSize(90);
    }
  }, [isSmallScreen]);

  const VerticalLineWithDot = () => {
    return (
      <Box
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{ height: "100%" }}
      >
        <Divider
          orientation="vertical"
          sx={{ bgcolor: "#a1a1a1", height: "100%", width: "2px" }}
        />
        <Brightness1Icon
          fontSize="small"
          sx={{ color: "#2c3c30", position: "absolute" }}
        />
      </Box>
    );
  };

  const renderTimeline = data.map((event) => (
    <React.Fragment key={event.id}>
      <Grid item xs={5}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ height: "100%" }}
        >
          <CardMedia
            component="img"
            sx={{ height: iconSize, width: iconSize }}
            image={event.image}
            alt="Event gif"
          />
        </Box>
      </Grid>
      <Grid item xs={2}>
        <VerticalLineWithDot />
      </Grid>

      <Grid item xs={5} sx={{ marginTop: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="start">
          <Typography variant={isSmallScreen ? "h6" : "h5"} fontWeight="bold">
            {event.title}
          </Typography>
          <Typography variant={isSmallScreen ? "body1" : "subtitle1"}>
            {event.location}
          </Typography>
          <Typography variant="body1">{event.date}</Typography>
        </Box>
      </Grid>
    </React.Fragment>
  ));

  const renderCurrent = [{ size: 6 }, { size: 8 }, { size: 10 }].map(
    (event) => (
      <React.Fragment key={event.size}>
        <Grid item xs={5}></Grid>
        <Grid item xs={2}>
          {" "}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{ height: "100%" }}
          >
            <Brightness1Icon sx={{ color: "#a1a1a1", fontSize: event.size }} />
          </Box>
        </Grid>
        <Grid item xs={5}></Grid>
      </React.Fragment>
    )
  );

  return (
    <Paper
      sx={{
        margin: 1,
        padding: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container sx={{ width: isSmallScreen ? "100wv" : "50vw" }}>
          {renderCurrent}
          {renderTimeline}
        </Grid>
      )}
    </Paper>
  );
};

export default Timeline;
