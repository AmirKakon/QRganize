import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Button,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import { getAllContainers, getAllItems } from "../../utilities/api";
import Label from "../../components/Label";

// Batch label printing: pick containers (QR) or items (barcode), then print a sheet.
const PrintLabelsPage = () => {
  const [mode, setMode] = useState("containers"); // "containers" | "items"
  const [containers, setContainers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    getAllContainers()
      .then((res) => setContainers(res || []))
      .catch((error) => console.error("Error fetching containers:", error));
    getAllItems()
      .then((res) => setItems(res || []))
      .catch((error) => console.error("Error fetching items:", error));
  }, []);

  // Reset selection + search when switching between containers and items
  const handleModeChange = (event, newMode) => {
    if (newMode) {
      setMode(newMode);
      setSelectedIds([]);
      setSearch("");
    }
  };

  const source = mode === "containers" ? containers : items;

  const filtered = useMemo(
    () =>
      source.filter((entry) =>
        (entry.name || "").toLowerCase().includes(search.toLowerCase())
      ),
    [source, search]
  );

  const toggleSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      filtered.forEach((entry) => merged.add(entry.id));
      return Array.from(merged);
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const selectedEntries = source.filter((entry) => selectedIds.includes(entry.id));
  const labelType = mode === "containers" ? "qr" : "barcode";

  return (
    <Box flex={1} sx={{ backgroundColor: "background.default", padding: 2 }}>
      <Paper elevation={2} sx={{ padding: 2, marginBottom: 2 }} className="no-print">
        <Typography variant="h5" sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}>
          Print Labels
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={handleModeChange}
            color="primary"
          >
            <ToggleButton value="containers">Containers (QR)</ToggleButton>
            <ToggleButton value="items">Items (Barcode)</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <TextField
          placeholder={`Search ${mode}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
          <Button variant="outlined" onClick={selectAllFiltered}>
            Select all{search ? " (matching)" : ""}
          </Button>
          <Button variant="outlined" color="secondary" onClick={clearSelection}>
            Clear
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            disabled={selectedEntries.length === 0}
          >
            Print {selectedEntries.length > 0 ? `(${selectedEntries.length})` : ""}
          </Button>
        </Box>

        <List dense sx={{ maxHeight: "35vh", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <Typography sx={{ p: 2, color: "text.secondary", textAlign: "center" }}>
              {source.length === 0 ? `No ${mode} found.` : "No matches for your search."}
            </Typography>
          ) : (
            filtered.map((entry) => (
              <ListItem key={entry.id} disablePadding>
                <ListItemButton onClick={() => toggleSelected(entry.id)}>
                  <Checkbox edge="start" checked={selectedIds.includes(entry.id)} tabIndex={-1} />
                  <ListItemText primary={entry.name || "(no name)"} secondary={entry.id} />
                </ListItemButton>
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      <Divider className="no-print" sx={{ mb: 2 }}>
        Preview
      </Divider>

      {selectedEntries.length === 0 ? (
        <Typography className="no-print" sx={{ color: "text.secondary", textAlign: "center" }}>
          Select {mode} above to preview and print their labels.
        </Typography>
      ) : (
        <Box
          className="label-sheet"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 2,
          }}
        >
          {selectedEntries.map((entry) => (
            <Label key={entry.id} type={labelType} id={entry.id} name={entry.name} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PrintLabelsPage;
