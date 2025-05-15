import React, { useState } from "react";
import {
  Box,
  TextField,
  useMediaQuery,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getImageSrc } from "../../utilities/helpers";
import defaultImage from "../../assets/qrcode-default-image.png";

const ContainerList = ({ containers, isSmallScreen }) => {
  const navigate = useNavigate();
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");
  const [searchQuery, setSearchQuery] = useState("");

  const handleItemClick = (container) => {
    navigate(`/container/${container.id}`);
  };

  const filteredContainers = containers.filter((container) =>
    container.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 2,
        }}
      >
        <TextField
          type="text"
          placeholder="Search for container..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
          }}
        />
      </Box>

      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
            padding: 2,
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <ImageList
            cols={isMediumScreen ? 2 : isLargeScreen ? 3 : 4}
            gap={16}
            sx={{
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            {filteredContainers.map((container) => (
              <ImageListItem
                key={container.id}
                onClick={() => handleItemClick(container)}
                sx={{ cursor: "pointer" }}
              >
                <img
                  src={getImageSrc(container.image) ?? defaultImage}
                  alt={container.name}
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                />
                <ImageListItemBar
                  title={container.name}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}

      {isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            height: "90vh",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          <ImageList
            cols={2}
            gap={5}
            sx={{
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            {filteredContainers.map((container) => (
              <ImageListItem
                key={container.id}
                onClick={() => handleItemClick(container)}
                sx={{ cursor: "pointer" }}
              >
                <img
                  src={getImageSrc(container.image) ?? defaultImage}
                  alt={container.name}
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                />
                <ImageListItemBar
                  title={container.name}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}
    </>
  );
};

export default ContainerList;
