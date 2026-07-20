import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import { getAllItems, mergeItems } from "../../utilities/api";
import Loading from "../../components/Loading";

// --- fuzzy-duplicate detection (client-side) ---

// Lowercase, strip punctuation, collapse whitespace. Keeps letters of any
// language (Hebrew included) so cross-spelling dupes still line up.
const normalize = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()[\]"'?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Classic Levenshtein edit distance.
const editDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
};

// 1.0 = identical, 0 = nothing in common.
const similarity = (a, b) => {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  return max === 0 ? 0 : 1 - editDistance(a, b) / max;
};

// Two names are candidate duplicates if they normalize equal, are very close
// by edit distance, or one name is *most of* the other. The containment ratio
// guard stops loose matches like "onion" ⊂ "sour cream and onion chips" and
// distinct variants ("...barista coffee" vs "...original coffee") from grouping.
const looksLikeDuplicate = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  if (similarity(a, b) >= 0.82) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return long.includes(short) && short.length / long.length >= 0.7;
};

// Union-find grouping of items whose names look like duplicates.
const findDuplicateGroups = (items) => {
  const norms = items.map((it) => normalize(it.name));
  const parent = items.map((_, i) => i);
  const find = (i) => {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const union = (i, j) => {
    parent[find(i)] = find(j);
  };

  for (let i = 0; i < items.length; i += 1) {
    if (!norms[i]) continue;
    for (let j = i + 1; j < items.length; j += 1) {
      if (norms[j] && looksLikeDuplicate(norms[i], norms[j])) {
        union(i, j);
      }
    }
  }

  const groups = {};
  items.forEach((it, i) => {
    const root = find(i);
    (groups[root] = groups[root] || []).push(it);
  });

  return Object.values(groups)
    .filter((g) => g.length > 1)
    .sort((a, b) => b.length - a.length);
};

// Stable signature so a dismissed group stays hidden after a reload.
const groupKey = (group) =>
  group
    .map((it) => it.id)
    .sort()
    .join("|");

const DuplicatesPage = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [keepers, setKeepers] = useState({}); // groupKey -> itemId
  const [dismissed, setDismissed] = useState(() => new Set());
  const [confirm, setConfirm] = useState(null); // { group, keeper, others }
  const [merging, setMerging] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const load = useCallback(async () => {
    try {
      const list = await getAllItems();
      setItems(list || []);
    } catch (error) {
      console.error("Error loading items:", error);
      notify("Failed to load items.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(
    () => findDuplicateGroups(items).filter((g) => !dismissed.has(groupKey(g))),
    [items, dismissed]
  );

  // Default keeper for a group: the entry with the most stock (ties -> first).
  const keeperFor = (group) => {
    const key = groupKey(group);
    if (keepers[key]) return keepers[key];
    return [...group].sort((a, b) => (b.quantity || 0) - (a.quantity || 0))[0].id;
  };

  const runMerge = async () => {
    if (!confirm) return;
    setMerging(true);
    let moved = 0;
    try {
      for (const other of confirm.others) {
        // eslint-disable-next-line no-await-in-loop
        await mergeItems(other.id, confirm.keeper.id);
        moved += 1;
      }
      notify(
        `Merged ${moved} item${moved === 1 ? "" : "s"} into "${confirm.keeper.name}".`
      );
      setConfirm(null);
      setLoading(true);
      await load();
    } catch (error) {
      console.error("Error merging items:", error);
      notify("Failed to merge. Some items may not have been merged.", "error");
    } finally {
      setMerging(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <Box flex={1} sx={{ backgroundColor: "background.default", padding: 2 }}>
      <h2 style={{ textAlign: "center" }}>Find Duplicate Items</h2>

      <Box sx={{ maxWidth: 700, mx: "auto" }}>
        <Typography sx={{ color: "text.secondary", mb: 2, textAlign: "center" }}>
          {groups.length === 0
            ? "No likely duplicates found. Your inventory looks clean. 🎉"
            : `${groups.length} possible duplicate group${
                groups.length === 1 ? "" : "s"
              }. Pick the one to keep — its stock absorbs the others.`}
        </Typography>

        {groups.map((group) => {
          const keeperId = keeperFor(group);
          const key = groupKey(group);
          return (
            <Paper key={key} elevation={2} sx={{ p: 2, mb: 2 }}>
              <RadioGroup
                value={keeperId}
                onChange={(e) =>
                  setKeepers((prev) => ({ ...prev, [key]: e.target.value }))
                }
              >
                <List dense disablePadding>
                  {group.map((item) => (
                    <ListItem key={item.id} disableGutters>
                      <FormControlLabel
                        value={item.id}
                        control={<Radio size="small" />}
                        label={
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <Typography>{item.name}</Typography>
                            <Chip
                              size="small"
                              label={`${item.quantity ?? 0} in stock`}
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "text.secondary" }}
                            >
                              id {item.id}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </RadioGroup>

              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<MergeTypeIcon />}
                  onClick={() => {
                    const keeper = group.find((i) => i.id === keeperId);
                    const others = group.filter((i) => i.id !== keeperId);
                    setConfirm({ group, keeper, others });
                  }}
                >
                  Merge {group.length - 1} into selected
                </Button>
                <Button
                  size="small"
                  color="inherit"
                  onClick={() =>
                    setDismissed((prev) => new Set(prev).add(key))
                  }
                >
                  Not duplicates
                </Button>
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Dialog open={!!confirm} onClose={() => !merging && setConfirm(null)}>
        <DialogTitle>Merge items?</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            {confirm && (
              <>
                Everything will be moved into{" "}
                <strong>{confirm.keeper.name}</strong>, and these will be{" "}
                <strong>deleted</strong>:
                <ul>
                  {confirm.others.map((o) => (
                    <li key={o.id}>
                      {o.name} ({o.quantity ?? 0} in stock)
                    </li>
                  ))}
                </ul>
                Stock and expiry dates are preserved on the kept item. This
                cannot be undone.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={merging}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={runMerge}
            disabled={merging}
            startIcon={
              merging ? <CircularProgress size={18} color="inherit" /> : null
            }
          >
            Merge
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DuplicatesPage;
