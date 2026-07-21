import React, { useMemo, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import { consumeItemOne, finishItem } from "../../utilities/api";

// Consumption-optimized list: in-stock items, recently-used first, with big
// "Use 1" / "Finish" buttons and no scanning. Built for the day-to-day
// "I just used this" moment.
const QuickUse = ({ items = [], onChanged }) => {
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [overrides, setOverrides] = useState({}); // id -> optimistic quantity
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const qtyOf = (i) => overrides[i.id] ?? i.quantity ?? 0;
  const notify = (message, severity = "success") => setSnackbar({ open: true, message, severity });

  const inStock = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items
      .filter((i) => (overrides[i.id] ?? i.quantity ?? 0) > 0)
      .filter((i) => (i.name || "").toLowerCase().includes(term))
      .sort((a, b) => {
        const la = a.lastUsedAt || "";
        const lb = b.lastUsedAt || "";
        if (la !== lb) return lb.localeCompare(la); // most recently used first
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [items, q, overrides]);

  const clearOverride = (id) =>
    setOverrides((o) => {
      const next = { ...o };
      delete next[id];
      return next;
    });

  const act = async (item, optimisticQty, fn, message) => {
    setBusyId(item.id);
    const prev = qtyOf(item);
    setOverrides((o) => ({ ...o, [item.id]: optimisticQty }));
    try {
      await fn();
      notify(message);
      await onChanged?.();
      clearOverride(item.id);
    } catch (error) {
      console.error("Quick use failed:", error);
      setOverrides((o) => ({ ...o, [item.id]: prev }));
      notify("Couldn't update. Please try again.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const doUse = (item) =>
    act(
      item,
      Math.max(0, qtyOf(item) - 1),
      async () => {
        const res = await consumeItemOne(item.id);
        setOverrides((o) => ({ ...o, [item.id]: res.quantity }));
      },
      `Used 1 ${item.name}.`
    );

  const doFinish = (item) => act(item, 0, () => finishItem(item.id), `Finished ${item.name}.`);

  const anyInStock = items.some((i) => (overrides[i.id] ?? i.quantity ?? 0) > 0);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 1 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search what you used…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ mb: 2 }}
      />

      {inStock.length === 0 ? (
        <Typography sx={{ mt: 3, color: "text.secondary", textAlign: "center" }}>
          {anyInStock ? "No in-stock items match." : "Nothing in stock to use right now."}
        </Typography>
      ) : (
        <List disablePadding>
          {inStock.map((item) => (
            <ListItem
              key={item.id}
              disableGutters
              sx={{ borderTop: "1px solid", borderColor: "divider", py: 1 }}
              secondaryAction={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={busyId === item.id}
                    onClick={() => doUse(item)}
                  >
                    Use 1
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    disabled={busyId === item.id}
                    onClick={() => doFinish(item)}
                  >
                    Finish
                  </Button>
                </Box>
              }
            >
              <ListItemText primary={item.name} secondary={`${qtyOf(item)} in stock`} />
            </ListItem>
          ))}
        </List>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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
    </Box>
  );
};

export default QuickUse;
