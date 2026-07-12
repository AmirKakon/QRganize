import React from "react";
import { Box, Avatar, Chip, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getImageSrc } from "../../utilities/helpers";
import { consumeLot, deleteLot } from "../../utilities/api";

const getStatus = (expirationDate) => {
  const days = dayjs(expirationDate)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day");
  if (days < 0) return { label: "Expired", color: "error" };
  if (days === 0) return { label: "Today", color: "error" };
  if (days <= 7) return { label: `${days}d`, color: "error" };
  if (days <= 30) return { label: `${days}d`, color: "warning" };
  return { label: `${days}d`, color: "success" };
};

// Lists every expiring *batch* (lot with a date), soonest first — an item with
// two differently-dated batches appears twice. Inline Used / Toss act on the lot.
const ExpiringItemsList = ({ items, containers = [], onChanged }) => {
  const navigate = useNavigate();

  const containerName = (id) =>
    containers.find((c) => c.id === id)?.name || "Unassigned";

  const batches = (items || [])
    .flatMap((item) =>
      (item.lots || [])
        .filter((lot) => lot.expirationDate)
        .map((lot) => ({
          lotId: lot.id,
          itemId: item.id,
          name: item.name,
          image: item.image,
          containerId: lot.containerId,
          quantity: lot.quantity,
          expirationDate: lot.expirationDate,
        }))
    )
    .sort(
      (a, b) =>
        dayjs(a.expirationDate).valueOf() - dayjs(b.expirationDate).valueOf()
    );

  if (batches.length === 0) {
    return (
      <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
        Nothing with an expiration date yet. Add a date to a batch on an item to
        track it here.
      </Typography>
    );
  }

  const act = async (fn) => {
    try {
      await fn();
      await onChanged?.();
    } catch (error) {
      console.error("Expiring action failed:", error);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      {batches.map((b) => {
        const status = getStatus(b.expirationDate);
        return (
          <Box
            key={b.lotId}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 1,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Avatar
              variant="rounded"
              src={getImageSrc(b.image)}
              alt={b.name}
              onClick={() => navigate(`/item?id=${b.itemId}`)}
              sx={{ cursor: "pointer" }}
            />
            <Box
              sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
              onClick={() => navigate(`/item?id=${b.itemId}`)}
            >
              <Typography variant="body2" noWrap>
                {b.name}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {containerName(b.containerId)} · ×{b.quantity} ·{" "}
                {dayjs(b.expirationDate).format("MMM D, YYYY")}
              </Typography>
            </Box>
            <Chip size="small" label={status.label} color={status.color} />
            <Button size="small" onClick={() => act(() => consumeLot(b.lotId, 1))}>
              Used
            </Button>
            <Button size="small" color="error" onClick={() => act(() => deleteLot(b.lotId))}>
              Toss
            </Button>
          </Box>
        );
      })}
    </Box>
  );
};

export default ExpiringItemsList;
