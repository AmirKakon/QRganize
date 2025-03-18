import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
const logo =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Famir-icon.png?alt=media&token=076c331b-7332-4ff6-b299-78e2d71a52ad";
const logo_tongue =
  "https://firebasestorage.googleapis.com/v0/b/amir-portfolio-9fe8a.appspot.com/o/assets%2Famir-tongue-icon.png?alt=media&token=d44e04e1-ec1a-416c-84c4-0e917e4046ae";

// Define the animation
const sway = keyframes`
  0% {
    transform: rotate(-20deg);
  }
  50% {
    transform: rotate(20deg);
  }
  100% {
    transform: rotate(-20deg);
  }
`;

// Create a styled img component with the animation
const SwayingImage = styled.img`
  animation: ${sway} 2s ease-in-out infinite;
`;

const Loading = () => {
  const [currentLogo, setCurrentLogo] = useState(logo);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLogo((prevLogo) => (prevLogo === logo ? logo_tongue : logo));
    }, 500); // Change logo every 600ms

    return () => {
      clearInterval(timer); // Clean up on component unmount
    };
  }, []);

  return (
    <Box
      display="flex"
      flexDirection="row"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      gap={3}
    >
      <SwayingImage src={currentLogo} alt="logo" width="100" />
    </Box>
  );
};

export default Loading;
