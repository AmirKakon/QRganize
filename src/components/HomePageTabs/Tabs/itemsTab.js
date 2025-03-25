import React from "react";
import {
  Box,
  useMediaQuery,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import { getImageSrc } from "../../../utilities/helpers";

const ItemsTab = ({ isSmallScreen, items }) => {
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  return (
    <Box
      sx={{
        padding: 2, 
        overflow: "hidden",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "16px" }}>Items List</h2>

      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
            padding: 2,
            boxSizing: "border-box",
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
              <ImageListItem key={item.id}>
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
            padding: 2,
            boxSizing: "border-box",
          }}
        >
          <ImageList
            cols={1}
            gap={16}
            sx={{
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            {items.map((item) => (
              <ImageListItem key={item.id} onClick={() => console.log(item)}>
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
    </Box>
  );
};

export default ItemsTab;