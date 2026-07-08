import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import qrganizeLogo from "../../assets/QRganize-logo.png";

const logo = qrganizeLogo;
const logo_tongue = qrganizeLogo;

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
