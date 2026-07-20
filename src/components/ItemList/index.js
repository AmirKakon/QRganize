import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  FormControlLabel,
  Switch,
  useMediaQuery,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getImageSrc, PLACEHOLDER_IMAGE } from "../../utilities/helpers";

const ItemList = ({ items, isSmallScreen }) => {
  const navigate = useNavigate();
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

    const [searchQuery, setSearchQuery] = useState("");
    const [inStockOnly, setInStockOnly] = useState(false);

    const filteredItems = items
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .filter((item) => !inStockOnly || (item.quantity || 0) > 0);

  const handleItemClick = (item) => {
    navigate(`/item?id=${item.id}`);
  };

  let emptyMessage = "No items match your search.";
  if (items.length === 0) {
    emptyMessage = "No items yet — scan a barcode to add your first one.";
  } else if (inStockOnly) {
    emptyMessage = "No items in stock match your search.";
  }
  const emptyState = (
    <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
      {emptyMessage}
    </Typography>
  );

  return (
    <>
      <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              marginBottom: 2,
            }}
          >
            <TextField
              type="text"
              placeholder="Search for item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                maxWidth: "400px",
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  color="primary"
                />
              }
              label="In stock only"
            />
      </Box>

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
          {filteredItems.length === 0 ? emptyState : (
          <ImageList
            cols={isMediumScreen ? 2 : isLargeScreen ? 3 : 4}
            gap={16}
            sx={{
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            {filteredItems.map((item) => (
              <ImageListItem
                key={item.id}
                onClick={() => handleItemClick(item)}
                sx={{ cursor: "pointer" }}
              >
                <img
                  src={getImageSrc(item.image)}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                  style={{ objectFit: "cover" }}
                />
                <ImageListItemBar
                  title={item.name}
                  subtitle={`Price: ${item.price} · ${item.quantity ?? 0} in stock`}
                />
              </ImageListItem>
            ))}
          </ImageList>
          )}
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
          {filteredItems.length === 0 ? emptyState : (
          <ImageList
            cols={2}
            gap={5}
            sx={{
              width: "100%",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            {filteredItems.map((item) => (
              <ImageListItem
                key={item.id}
                onClick={() => handleItemClick(item)}
                sx={{ cursor: "pointer" }}
              >
                <img
                  src={getImageSrc(item.image)}
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                  style={{ objectFit: "cover" }}
                />
                <ImageListItemBar
                  title={item.name}
                  subtitle={`Price: ${item.price} · ${item.quantity ?? 0} in stock`}
                />
              </ImageListItem>
            ))}
          </ImageList>
          )}
        </Box>
      )}
    </>
  );
};

export default ItemList;
