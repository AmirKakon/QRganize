import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import { deleteContainerItem } from "../../utilities/api";
import { getImageSrc } from "../../utilities/helpers";

const ItemsInContainerList = ({ items, setItems, container, isSmallScreen }) => {
    const navigate = useNavigate();

    const handleRemoveItem = async (itemId, event) => {
        event.stopPropagation();
    
        var result = await deleteContainerItem(container.id, itemId);
        if (result) {
          setItems((prev) => prev.filter((item) => item.itemId !== itemId));
        }
    };

    const handleItemClick = (item) => {
        navigate(`/item?id=${item.itemId}`);
    };

    const handleQuantityChange = (itemId, newQuantity, event) => {
        console.log("Quantity changed:", itemId, newQuantity);
        event.stopPropagation();
    
        setItems((prev) =>
          prev.map((item) => {
            if (item.itemId === itemId) {
              return { ...item, quantity: newQuantity };
            }
            return item;
          })
        );
    };

      const styles = {
        list: {
          width: "100%",
          border: "1px solid #ccc", // Add a border around the list
          borderRadius: "8px", // Optional: Add rounded corners
          padding: "8px", // Optional: Add padding inside the border
        },
        listItem: {
          marginY: "8px",
          transition: "background-color 0.3s ease",
          '&:hover': {
            backgroundColor: "#f0f0f0", // Highlight color on hover
          },
        },
      };

    return (
        <>
          {isSmallScreen ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {items?.map((item) => (
                <Card key={item.itemId} sx={{ padding: 2 }}>
                  <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar src={getImageSrc(item.image)} alt={item.name} />
                    <Box sx={{ flex: "1 1 auto" }}>
                      <Typography variant="h6">{item.name}</Typography>
                    </Box>
                  </CardContent>
                  <CardActions
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <IconButton
                        onClick={(event) =>
                          handleQuantityChange(item.itemId, (item.quantity || 1) - 1, event)
                        }
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        type="number"
                        label="Quantity"
                        value={item.quantity || 0}
                        onChange={(event) =>
                          handleQuantityChange(item.itemId, Number(event.target.value), event)
                        }
                        inputProps={{ min: 1 }}
                        sx={{ width: "80px" }}
                      />
                      <IconButton
                        onClick={(event) =>
                          handleQuantityChange(item.itemId, (item.quantity || 0) + 1, event)
                        }
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(event) => handleRemoveItem(item.itemId, event)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              ))}
            </Box>
          ) : (
            <List sx={styles.list}>
              {items?.map((item) => (
                <ListItem
                  key={item.itemId}
                  sx={{
                    ...styles.listItem,
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                  secondaryAction={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        justifyContent: "flex-end",
                        width: "auto",
                      }}
                    >
                      <IconButton
                        onClick={(event) =>
                          handleQuantityChange(item.itemId, (item.quantity || 1) - 1, event)
                        }
                      >
                        <RemoveIcon />
                      </IconButton>
                      <TextField
                        type="number"
                        label="Quantity"
                        value={item.quantity || 0}
                        onChange={(event) =>
                          handleQuantityChange(item.itemId, Number(event.target.value), event)
                        }
                        inputProps={{ min: 1 }}
                        sx={{ width: "80px" }}
                      />
                      <IconButton
                        onClick={(event) =>
                          handleQuantityChange(item.itemId, (item.quantity || 0) + 1, event)
                        }
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(event) => handleRemoveItem(item.itemId, event)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                  onClick={() => handleItemClick(item)}
                >
                  <ListItemAvatar>
                    <Avatar src={getImageSrc(item.image)} alt={item.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={item.name}
                    sx={{
                      flex: "1 1 auto",
                      minWidth: "150px",
                      wordWrap: "break-word",
                      whiteSpace: "normal",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </>
    );
}

export default ItemsInContainerList;