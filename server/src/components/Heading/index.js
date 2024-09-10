import React from "react";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { keyframes } from "@emotion/react";
const video =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Fbackground-video.mp4?alt=media&token=010c51d1-68ab-440e-b2c9-61301757489e";
const name =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Fbackground-name.mp4?alt=media&token=a892745e-1564-4526-bf59-dfceeef23011";
const squareVideo =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Fbackground-video-square.mp4?alt=media&token=b5a75743-5b43-47aa-bafb-124df0c509f2";
const squareName =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Fbackground-name-square.mp4?alt=media&token=5b37df2e-d1a6-4ce9-833a-7418e213151d";



const jumpAnimation = keyframes`
  0% { transform: translateY(0); }
  20% { transform: translateY(-12px); }
  40% { transform: translateY(0); }
  60% { transform: translateY(-7px); }
  100% { transform: translateY(0); }
`;

const Heading = ({ isSmallScreen, handleArrowClick }) => {
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  return (
    <>
      {!isSmallScreen && (
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
          }}
        >
          <video
            src={name}
            autoPlay
            muted
            style={{
              position: "absolute",
              width: "30vw",
              left: "2vw",
              top: "2vh",
              zIndex: "2",
            }}
          />
          <video
            autoPlay
            loop
            muted
            style={{
              position: "absolute",
              width: "100vw",
              zIndex: "1",
            }}
            src={video}
          />
        </Box>
      )}

      {isSmallScreen && (
        <Box
          flex={1}
          display="flex"
          alignContent="center"
          justifyContent="center"
          flexDirection="column"
          sx={{ backgroundColor: "#010101", height: "90vh" }}
        >
          <video
            autoPlay
            loop
            muted
            src={squareVideo}
            style={{ height: "50vh" }}
          />
          <video
            autoPlay
            muted
            src={squareName}
            style={{ height: "37vh", paddingLeft: 5 }}
          />
          <IconButton
            color="secondary"
            sx={{ animation: `${jumpAnimation} 1.5s ease-in-out infinite` }}
            onClick={handleArrowClick}
          >
            <ArrowDownwardIcon />
          </IconButton>
        </Box>
      )}
    </>
  );
};

export default Heading;
