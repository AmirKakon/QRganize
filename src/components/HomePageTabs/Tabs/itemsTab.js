import React from "react";
import {
  Box,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
} from "@mui/material";

const ItemsTab = ({ isSmallScreen, items }) => {
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  return (
    <>
      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "80vh",
          }}
        >
          <Box>
            <h2>Items List is here</h2>
            <List>
              {items.map((item) => (
                <ListItem key={item.id}>
                  <ListItemAvatar>
                    <Avatar src={item.image} alt={item.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.name}
                    secondary={`Price: ${item.price}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
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
          }}
        >
          <h2>Items List is here</h2>
          <List>
            {items.map((item) => (
              <ListItem key={item.id}>
                <ListItemAvatar>
                  <Avatar src={item.image} alt={item.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={item.name}
                  secondary={`Price: ${item.price}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </>
  );
};

export default ItemsTab;
