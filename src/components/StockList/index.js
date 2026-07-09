import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { addLot, consumeLot, updateLot, deleteLot } from "../../utilities/api";

const UNASSIGNED = "__unassigned__";

const toDateString = (date) =>
  date ? dayjs(date).format("YYYY-MM-DD").concat("T00:00:00+00:00") : null;

// Color-code a batch by how close it is to expiring.
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

const sortByExpiry = (lots) =>
  [...lots].sort((a, b) => {
    if (!a.expirationDate) return 1;
    if (!b.expirationDate) return -1;
    return dayjs(a.expirationDate).valueOf() - dayjs(b.expirationDate).valueOf();
  });

// Stock manager for one item: its batches (lots) across containers and dates.
const StockList = ({ itemId, lots, containers, onChanged }) => {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editLot, setEditLot] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Add form state
  const [addContainer, setAddContainer] = useState(UNASSIGNED);
  const [addQty, setAddQty] = useState(1);
  const [addDate, setAddDate] = useState(null);

  const containerName = (id) =>
    containers.find((c) => c.id === id)?.name || "Unassigned";

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const run = async (fn, successMsg) => {
    setBusy(true);
    try {
      await fn();
      if (successMsg) notify(successMsg);
      await onChanged?.();
    } catch (error) {
      console.error(error);
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const sorted = sortByExpiry(lots);
  const total = lots.reduce((sum, l) => sum + (l.quantity || 0), 0);

  const handleAdd = () =>
    run(async () => {
      await addLot({
        itemId,
        containerId: addContainer === UNASSIGNED ? null : addContainer,
        quantity: Number(addQty) || 1,
        expirationDate: toDateString(addDate),
      });
      setAdding(false);
      setAddContainer(UNASSIGNED);
      setAddQty(1);
      setAddDate(null);
    }, "Stock added.");

  const handleUseFefo = () => {
    const target = sorted[0];
    if (!target) return;
    run(
      () => consumeLot(target.id, 1),
      `Used 1 from ${containerName(target.containerId)}${
        target.expirationDate ? ` (exp ${dayjs(target.expirationDate).format("MMM D")})` : ""
      }.`
    );
  };

  const handleSaveEdit = () =>
    run(async () => {
      await updateLot(editLot.id, {
        containerId: editLot.containerId === UNASSIGNED ? null : editLot.containerId,
        quantity: Number(editLot.quantity) || 0,
        expirationDate: toDateString(editLot.expirationDate),
      });
      setEditLot(null);
    }, "Batch updated.");

  return (
    <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          In stock: {total}
        </Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAdding((v) => !v)}
          disabled={!itemId}
        >
          Add stock
        </Button>
      </Box>

      {!itemId && (
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          Save the item first to start tracking stock.
        </Typography>
      )}

      {adding && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Container</InputLabel>
            <Select
              value={addContainer}
              label="Container"
              onChange={(e) => setAddContainer(e.target.value)}
            >
              <MenuItem value={UNASSIGNED}>
                <em>Unassigned</em>
              </MenuItem>
              {containers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="number"
            label="Qty"
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
            inputProps={{ min: 1 }}
            sx={{ width: 80 }}
          />
          <DatePicker
            label="Expires"
            value={addDate}
            onChange={setAddDate}
            disablePast
            slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
            sx={{ width: 170 }}
          />
          <Button variant="contained" onClick={handleAdd} disabled={busy}>
            Add
          </Button>
        </Box>
      )}

      {total > 0 && (
        <Button
          size="small"
          variant="outlined"
          onClick={handleUseFefo}
          disabled={busy}
          sx={{ mb: 1 }}
        >
          Use one (soonest to expire)
        </Button>
      )}

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
                {containerName(lot.containerId)} · ×{lot.quantity}
              </Typography>
              {lot.expirationDate && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Exp {dayjs(lot.expirationDate).format("MMM D, YYYY")}
                </Typography>
              )}
            </Box>
            <Button size="small" onClick={() => run(() => consumeLot(lot.id, 1), "Used 1.")} disabled={busy}>
              Use
            </Button>
            <IconButton
              size="small"
              onClick={() =>
                setEditLot({
                  ...lot,
                  containerId: lot.containerId ?? UNASSIGNED,
                  expirationDate: lot.expirationDate ? dayjs(lot.expirationDate) : null,
                })
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => run(() => deleteLot(lot.id), "Batch tossed.")}
              disabled={busy}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      })}

      {total === 0 && itemId && (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          No stock yet — use "Add stock" to log some.
        </Typography>
      )}

      <Dialog open={Boolean(editLot)} onClose={() => setEditLot(null)}>
        <DialogTitle>Edit batch</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1, minWidth: 260 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Container</InputLabel>
            <Select
              value={editLot?.containerId ?? UNASSIGNED}
              label="Container"
              onChange={(e) => setEditLot((p) => ({ ...p, containerId: e.target.value }))}
            >
              <MenuItem value={UNASSIGNED}>
                <em>Unassigned</em>
              </MenuItem>
              {containers.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            type="number"
            label="Quantity"
            value={editLot?.quantity ?? 0}
            onChange={(e) => setEditLot((p) => ({ ...p, quantity: e.target.value }))}
            inputProps={{ min: 0 }}
            helperText="Set to 0 to remove this batch"
          />
          <DatePicker
            label="Expires"
            value={editLot?.expirationDate ?? null}
            onChange={(d) => setEditLot((p) => ({ ...p, expirationDate: d }))}
            slotProps={{ field: { clearable: true }, textField: { size: "small" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLot(null)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={busy}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default StockList;
