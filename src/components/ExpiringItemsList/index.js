import React from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Chip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getImageSrc } from "../../utilities/helpers";

// Color-code how close an item is to expiring.
const getStatus = (expirationDate) => {
  const days = dayjs(expirationDate)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day");

  if (days < 0) return { label: "Expired", color: "error" };
  if (days === 0) return { label: "Today", color: "error" };
  if (days <= 7) return { label: `${days}d left`, color: "error" };
  if (days <= 30) return { label: `${days}d left`, color: "warning" };
  return { label: `${days}d left`, color: "success" };
};

const ExpiringItemsList = ({ items }) => {
  const navigate = useNavigate();

  const withDates = items
    .filter((item) => item.expirationDate)
    .sort(
      (a, b) =>
        dayjs(a.expirationDate).valueOf() - dayjs(b.expirationDate).valueOf()
    );

  if (withDates.length === 0) {
    return (
      <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
        No items with expiration dates yet. Add an expiration date to an item to
        track it here.
      </Typography>
    );
  }

  return (
    <List sx={{ maxWidth: 600, mx: "auto" }}>
      {withDates.map((item) => {
        const status = getStatus(item.expirationDate);
        return (
          <ListItem
            key={item.id}
            disablePadding
            secondaryAction={
              <Chip label={status.label} color={status.color} size="small" />
            }
          >
            <ListItemButton onClick={() => navigate(`/item?id=${item.id}`)}>
              <ListItemAvatar>
                <Avatar
                  variant="rounded"
                  src={getImageSrc(item.image)}
                  alt={item.name}
                />
              </ListItemAvatar>
              <ListItemText
                primary={item.name}
                secondary={`Expires ${dayjs(item.expirationDate).format(
                  "MMM D, YYYY"
                )}`}
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default ExpiringItemsList;
