import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { addLot, consumeLot, deleteLot } from "../../utilities/api";

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
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState(1);
  const [date, setDate] = useState(null);

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

  return (
    <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Contents: {total}
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
              <Typography variant="body2" noWrap>
                {nameOf(lot.itemId)} · ×{lot.quantity}
              </Typography>
              {lot.expirationDate && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Exp {dayjs(lot.expirationDate).format("MMM D, YYYY")}
                </Typography>
              )}
            </Box>
            <Button size="small" onClick={() => run(() => consumeLot(lot.id, 1))} disabled={busy}>
              Use
            </Button>
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
