import React from "react";
import { Box, Paper, Typography, Chip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const daysTo = (d) => dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");

const StatTile = ({ label, value, hint, color, onClick }) => (
  <Paper
    elevation={2}
    onClick={onClick}
    sx={{
      p: 2,
      flex: "1 1 130px",
      minWidth: 130,
      maxWidth: 200,
      textAlign: "center",
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.1s ease, box-shadow 0.1s ease",
      "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: 4 } : {},
    }}
  >
    <Typography variant="h4" sx={{ fontWeight: "bold", color: color || "text.primary" }}>
      {value}
    </Typography>
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {label}
    </Typography>
    <Typography variant="caption" sx={{ color: "text.secondary", visibility: hint ? "visible" : "hidden" }}>
      {hint || " "}
    </Typography>
  </Paper>
);

// At-a-glance overview: headline counts (each jumps to the relevant view) plus
// a peek at what's expiring next.
const HomeDashboard = ({ items = [], containers = [], onGoTo }) => {
  const navigate = useNavigate();

  const total = items.length;
  const inStock = items.filter((i) => (i.quantity || 0) > 0).length;
  const outOfStock = total - inStock;
  const dated = items.filter((i) => i.expirationDate);
  const expired = dated.filter((i) => daysTo(i.expirationDate) < 0).length;
  const expiringSoon = dated.filter((i) => {
    const d = daysTo(i.expirationDate);
    return d >= 0 && d <= 30;
  }).length;
  const shopping = items.filter((i) => i.shoppingList).length;

  const upcoming = [...dated]
    .sort((a, b) => dayjs(a.expirationDate).valueOf() - dayjs(b.expirationDate).valueOf())
    .slice(0, 3);

  return (
    <Box sx={{ py: 1 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: "center" }}>
        <StatTile label="Items" value={total} onClick={() => onGoTo?.("items")} />
        <StatTile
          label="In stock"
          value={inStock}
          hint={outOfStock ? `${outOfStock} out of stock` : ""}
          onClick={() => onGoTo?.("items")}
        />
        <StatTile
          label="Expiring ≤30d"
          value={expiringSoon}
          color={expiringSoon ? "warning.main" : undefined}
          onClick={() => onGoTo?.("expiring")}
        />
        <StatTile
          label="Expired"
          value={expired}
          color={expired ? "error.main" : undefined}
          onClick={() => onGoTo?.("expiring")}
        />
        <StatTile label="Shopping list" value={shopping} onClick={() => onGoTo?.("shopping")} />
        <StatTile label="Containers" value={containers.length} onClick={() => navigate("/qrcode")} />
      </Box>

      <Box sx={{ maxWidth: 600, mx: "auto", mt: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
          Next to expire
        </Typography>
        {upcoming.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Nothing has an expiration date yet.
          </Typography>
        ) : (
          upcoming.map((it) => {
            const d = daysTo(it.expirationDate);
            const color = d <= 7 ? "error" : d <= 30 ? "warning" : "success";
            return (
              <Box
                key={it.id}
                onClick={() => navigate(`/item?id=${it.id}`)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  py: 1,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  cursor: "pointer",
                }}
              >
                <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                  {it.name}
                </Typography>
                <Chip
                  size="small"
                  label={d < 0 ? "Expired" : d === 0 ? "Today" : `${d}d`}
                  color={d < 0 ? "error" : color}
                />
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default HomeDashboard;
