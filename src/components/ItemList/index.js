import React from "react";
import {
  Box,
  useMediaQuery,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getImageSrc } from "../../utilities/helpers";

const ItemList = ({ items, isSmallScreen }) => {
  const navigate = useNavigate();
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  const handleItemClick = (item) => {
    navigate(`/item?id=${item.id}`);
  };

  return (
    <>
      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
            padding: 2,
            boxSizing: "border-box",
            overflowY: "auto", // Added to make the list scrollable
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
            {items.map((item) => (
              <ImageListItem
                key={item.id}
                onClick={() => handleItemClick(item)}
                sx={{ cursor: "pointer" }}
              >
                <img
                  src={getImageSrc(item.image)}
                  alt={item.name}
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                />
                <ImageListItemBar
                  title={item.name}
                  subtitle={`Price: ${item.price}`}
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
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: "90vh",
            boxSizing: "border-box",
            overflowY: "auto", // Added to make the list scrollable
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
            {items.map((item) => (
              <ImageListItem
                key={item.id}
                onClick={() => handleItemClick(item)}
                sx={{ cursor: "pointer" }}
              >
                <img
                  src={getImageSrc(item.image)}
                  alt={item.name}
                  loading="lazy"
                  style={{ objectFit: "cover" }}
                />
                <ImageListItemBar
                  title={item.name}
                  subtitle={`Price: ${item.price}`}
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}
    </>
  );
};

export default ItemList;
