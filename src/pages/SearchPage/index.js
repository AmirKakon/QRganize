import React, { useMemo } from "react";
import {
  Box,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useItems, useContainers } from "../../utilities/queries";
import Loading from "../../components/Loading";
import useOpenItem from "../../utilities/useOpenItem";

// One search box across items (name / barcode) and containers (name).
const SearchPage = () => {
  const navigate = useNavigate();
  const openItem = useOpenItem();
  // The query lives in the URL so Back from a result keeps the search.
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const setQ = (value) => setSearchParams(value ? { q: value } : {}, { replace: true });
  const { data: items, isLoading: itemsLoading } = useItems();
  const { data: containers, isLoading: containersLoading } = useContainers();
  const loading = itemsLoading || containersLoading;

  const term = q.trim().toLowerCase();

  const matchedItems = useMemo(() => {
    if (!term) return [];
    return items
      .filter(
        (i) =>
          (i.name || "").toLowerCase().includes(term) ||
          String(i.id).includes(term) ||
          (i.barcodes || []).some((b) => String(b).includes(term))
      )
      .slice(0, 50);
  }, [items, term]);

  const matchedContainers = useMemo(() => {
    if (!term) return [];
    return containers
      .filter((c) => (c.name || "").toLowerCase().includes(term))
      .slice(0, 50);
  }, [containers, term]);

  if (loading) return <Loading />;

  return (
    <Box flex={1} sx={{ backgroundColor: "background.default", padding: 2 }}>
      <h2 style={{ textAlign: "center" }}>Search</h2>

      <Box sx={{ maxWidth: 600, mx: "auto" }}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search items and containers..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {!term ? (
          <Typography sx={{ mt: 3, color: "text.secondary", textAlign: "center" }}>
            Type to search across your items (by name or barcode) and containers.
          </Typography>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ mt: 3, mb: 0.5, color: "text.secondary" }}>
              Items ({matchedItems.length})
            </Typography>
            {matchedItems.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No matching items.
              </Typography>
            ) : (
              <List dense disablePadding>
                {matchedItems.map((i) => (
                  <ListItem
                    key={i.id}
                    disablePadding
                    secondaryAction={
                      <Chip size="small" variant="outlined" label={`${i.quantity ?? 0} in stock`} />
                    }
                  >
                    <ListItemButton onClick={() => openItem(i.id)}>
                      <ListItemText primary={i.name} secondary={`Price: ${i.price}`} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 0.5, color: "text.secondary" }}>
              Containers ({matchedContainers.length})
            </Typography>
            {matchedContainers.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                No matching containers.
              </Typography>
            ) : (
              <List dense disablePadding>
                {matchedContainers.map((c) => (
                  <ListItem key={c.id} disablePadding>
                    <ListItemButton onClick={() => navigate(`/container/${c.id}`)}>
                      <ListItemText primary={c.name} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default SearchPage;
