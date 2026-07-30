import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { addLot, consumeLot, deleteLot, updateLot, getAllContainers } from "../../utilities/api";

const toDateString = (date) =>
  date ? dayjs(date).format("YYYY-MM-DD").concat("T00:00:00+00:00") : null;

const expiryChip = (expirationDate) => {
  if (!expirationDate) return { label: "No date", color: "default" };
  const days = dayjs(expirationDate)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day");
  if (days < 0) return { label: "Expired", color: "error" };
  if (days === 0) return { label: "Today", color: "error" };
  if (days <= 7) return { label: `${days}d`, color: "error" };
  if (days <= 30) return { label: `${days}d`, color: "warning" };
  return { label: `${days}d`, color: "success" };
};

// The batches (lots) stored in one container, with add / use / toss.
const ContainerContents = ({ containerId, lots, allItems, onChanged }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(null);
  const [containers, setContainers] = useState([]);
  const [moveMenu, setMoveMenu] = useState(null); // { anchorEl, lot }

  useEffect(() => {
    getAllContainers()
      .then((res) => setContainers(res || []))
      .catch((error) => console.error("Error fetching containers:", error));
  }, []);

  const nameOf = (itemId) =>
    allItems.find((i) => i.id === itemId)?.name || "(unknown item)";

  const total = lots.reduce((sum, l) => sum + (l.quantity || 0), 0);
  const sorted = [...lots].sort((a, b) =>
    nameOf(a.itemId).localeCompare(nameOf(b.itemId))
  );
  const filtered = allItems.filter((i) =>
    (i.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await onChanged?.();
    } catch (error) {
      console.error("Container contents action failed:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () =>
    run(async () => {
      await addLot({
        itemId: picked.id,
        containerId,
        quantity: Number(qty) || 1,
        expirationDate: toDateString(date),
      });
      setAddOpen(false);
      setPicked(null);
      setSearch("");
      setQty(1);
      setDate(null);
    });

  const handleMove = (targetContainerId) => {
    const lot = moveMenu?.lot;
    setMoveMenu(null);
    if (!lot) return;
    run(() => updateLot(lot.id, { containerId: targetContainerId }));
  };

  const otherContainers = containers.filter((c) => c.id !== containerId);

  return (
    <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Contents: {Number.isInteger(total) ? total : Math.round(total * 100) / 100}{" "}
          {total === 1 ? "item" : "items"}
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
          disabled={!containerId}
        >
          Add item
        </Button>
      </Box>

      {sorted.map((lot) => {
        const chip = expiryChip(lot.expirationDate);
        return (
          <Box
            key={lot.id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              py: 0.5,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Chip size="small" label={chip.label} color={chip.color} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                onClick={() => navigate(`/item?id=${lot.itemId}`)}
                sx={{
                  fontWeight: 500,
                  cursor: "pointer",
                  wordBreak: "break-word",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {nameOf(lot.itemId)}
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                ×{lot.quantity}
                {lot.expirationDate
                  ? ` · Exp ${dayjs(lot.expirationDate).format("MMM D, YYYY")}`
                  : ""}
              </Typography>
            </Box>
            <Button size="small" onClick={() => run(() => consumeLot(lot.id, 1))} disabled={busy}>
              Use
            </Button>
            <Tooltip title="Move to another container">
              <IconButton
                size="small"
                onClick={(e) => setMoveMenu({ anchorEl: e.currentTarget, lot })}
                disabled={busy}
              >
                <DriveFileMoveOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <IconButton size="small" color="error" onClick={() => run(() => deleteLot(lot.id))} disabled={busy}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}

      {total === 0 && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nothing stored here yet — use "Add item".
        </Typography>
      )}

      <Menu
        anchorEl={moveMenu?.anchorEl}
        open={Boolean(moveMenu)}
        onClose={() => setMoveMenu(null)}
      >
        {otherContainers.length === 0 ? (
          <MenuItem disabled>No other containers</MenuItem>
        ) : (
          otherContainers.map((c) => (
            <MenuItem key={c.id} onClick={() => handleMove(c.id)}>
              {c.name}
            </MenuItem>
          ))
        )}
      </Menu>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add an item to this container</DialogTitle>
        <DialogContent>
          <TextField
            label="Search items"
            size="small"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 1, mt: 1 }}
          />
          <List sx={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.map((i) => (
              <ListItem key={i.id} disablePadding>
                <ListItemButton
                  selected={picked?.id === i.id}
                  onClick={() => setPicked(i)}
                  dense
                >
                  <ListItemText primary={i.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 1 }}>
            <TextField
              size="small"
              type="number"
              label="Qty"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              inputProps={{ min: 1 }}
              sx={{ width: 80 }}
            />
            <DatePicker
              label="Expires"
              value={date}
              onChange={setDate}
              disablePast
              slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleAdd} variant="contained" disabled={busy || !picked}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ContainerContents;
