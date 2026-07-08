import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import qrganizeLogo from "../../assets/QRganize-logo.png";

const logo = qrganizeLogo;
const logo_tongue = qrganizeLogo;

// Define the animation — sway left to right so it reads as "loading"
const sway = keyframes`
  0% {
    transform: translateX(-40px);
  }
  50% {
    transform: translateX(40px);
  }
  100% {
    transform: translateX(-40px);
  }
`;

// Create a styled img component with the animation
const SwayingImage = styled.img`
  animation: ${sway} 1.5s ease-in-out infinite;
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
