import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useNavigate } from "react-router-dom";
import {
  getAllAreas,
  getAllContainers,
  createArea,
  updateArea,
  deleteArea,
} from "../../utilities/api";
import Loading from "../../components/Loading";

const AreasPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState([]);
  const [containers, setContainers] = useState([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(null); // { id, name }
  const [confirmDelete, setConfirmDelete] = useState(null); // area
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const load = useCallback(async () => {
    try {
      const [areaList, containerList] = await Promise.all([
        getAllAreas(),
        getAllContainers(),
      ]);
      setAreas(areaList || []);
      setContainers(containerList || []);
    } catch (error) {
      console.error("Error loading areas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    load();
  }, [load]);

  const containersFor = (areaId) =>
    containers.filter((c) => (c.areaId || null) === areaId);

  const areaIds = new Set(areas.map((a) => a.id));
  const unassigned = containers.filter((c) => !c.areaId || !areaIds.has(c.areaId));

  const run = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      if (message) notify(message);
      await load();
    } catch (error) {
      console.error(error);
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      await createArea({ name });
      setNewName("");
    }, `Area "${name}" created.`);
  };

  const handleRename = () =>
    run(async () => {
      await updateArea(renaming.id, renaming.name.trim());
      setRenaming(null);
    }, "Area renamed.");

  const handleDelete = () => {
    const area = confirmDelete;
    setConfirmDelete(null);
    run(
      () => deleteArea(area.id),
      `Area "${area.name}" deleted; its containers are now unassigned.`
    );
  };

  const renderContainers = (list) =>
    list.length > 0 ? (
      <List dense disablePadding>
        {list.map((c) => (
          <ListItem key={c.id} disablePadding>
            <ListItemButton onClick={() => navigate(`/container/${c.id}`)}>
              <ListItemText primary={c.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    ) : (
      <Typography variant="body2" sx={{ color: "text.secondary", pl: 1 }}>
        No containers here yet.
      </Typography>
    );

  if (loading) return <Loading />;

  return (
    <Box flex={1} sx={{ backgroundColor: "background.default", padding: 2 }}>
      <h2 style={{ textAlign: "center" }}>Areas</h2>

      <Box sx={{ maxWidth: 700, mx: "auto" }}>
        <Paper elevation={2} sx={{ p: 2, mb: 2, display: "flex", gap: 1 }}>
          <TextField
            label="New area name"
            size="small"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            disabled={busy || !newName.trim()}
          >
            Add
          </Button>
        </Paper>

        {areas.map((area) => {
          const list = containersFor(area.id);
          return (
            <Paper key={area.id} elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>
                  {area.name}{" "}
                  <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
                    ({list.length})
                  </Typography>
                </Typography>
                <IconButton size="small" onClick={() => setRenaming({ id: area.id, name: area.name })}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => setConfirmDelete(area)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
              {renderContainers(list)}
            </Paper>
          );
        })}

        {unassigned.length > 0 && (
          <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Unassigned{" "}
              <Typography component="span" variant="body2" sx={{ color: "text.secondary" }}>
                ({unassigned.length})
              </Typography>
            </Typography>
            {renderContainers(unassigned)}
          </Paper>
        )}

        {areas.length === 0 && (
          <Typography sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}>
            No areas yet — add one above (e.g. Kitchen, Pantry, Garage).
          </Typography>
        )}
      </Box>

      <Dialog open={Boolean(renaming)} onClose={() => setRenaming(null)}>
        <DialogTitle>Rename area</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={renaming?.name || ""}
            onChange={(e) => setRenaming((p) => ({ ...p, name: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenaming(null)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleRename} variant="contained" disabled={busy || !renaming?.name?.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete this area?</DialogTitle>
        <DialogContent>
          Delete <strong>{confirmDelete?.name}</strong>? Its containers won&apos;t be deleted —
          they&apos;ll just become unassigned.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
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
    </Box>
  );
};

export default AreasPage;
