import React, { memo, useCallback, useMemo, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  useMediaQuery,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import { getImageSrc, itemMatches, tagCounts, PLACEHOLDER_IMAGE } from "../../utilities/helpers";
import { setItemShoppingList } from "../../utilities/api";
import useScrollMemory from "../../utilities/useScrollMemory";
import useOpenItem from "../../utilities/useOpenItem";

const NO_CONTAINER = "__no_container__";
const UNASSIGNED_AREA = "__unassigned_area__";

const daysTo = (d) => dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");

const tileSx = { cursor: "pointer", position: "relative" };
// Square tiles keep the grid's height fixed while lazy photos load, so a
// restored scroll position stays put.
const imageStyle = { objectFit: "cover", aspectRatio: "1 / 1" };
const cartButtonSx = (inCart) => ({
  position: "absolute",
  top: 6,
  right: 6,
  bgcolor: "rgba(0,0,0,0.55)",
  color: inCart ? "primary.light" : "common.white",
  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
});

const showPlaceholder = (e) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = PLACEHOLDER_IMAGE;
};

// Memoized: the grid can hold hundreds of tiles, and typing in the search box
// or toggling one cart shouldn't re-render all of them. A native title stands
// in for MUI's Tooltip, which is costly to mount per tile.
const ItemTile = memo(({ item, inCart, onOpen, onToggleCart }) => {
  const cartLabel = inCart ? "On shopping list — tap to remove" : "Add to shopping list";
  return (
    <ImageListItem onClick={() => onOpen(item.id)} sx={tileSx}>
      <img
        src={getImageSrc(item.image)}
        alt={item.name}
        loading="lazy"
        onError={showPlaceholder}
        style={imageStyle}
      />
      <IconButton
        size="small"
        title={cartLabel}
        aria-label={cartLabel}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCart(item, !inCart);
        }}
        sx={cartButtonSx(inCart)}
      >
        {inCart ? <ShoppingCartIcon fontSize="small" /> : <AddShoppingCartIcon fontSize="small" />}
      </IconButton>
      <ImageListItemBar
        title={item.name}
        subtitle={`Price: ${item.price} · ${item.quantity ?? 0} in stock`}
      />
    </ImageListItem>
  );
});

const ItemList = ({ items, isSmallScreen, containers = [], areas = [], onItemsChanged }) => {
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  // Filters live in the URL so Back from an item restores them. Defaults are
  // left out of the URL to keep it short.
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "all"; // all | instock | outofstock | expiring
  const areaId = searchParams.get("area") ?? "";
  const containerId = searchParams.get("container") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const sortBy = searchParams.get("sort") ?? "name"; // name | price | qty | expiry

  const setFilters = (changes) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key)
        );
        return next;
      },
      { replace: true }
    );
  const setSearchQuery = (value) => setFilters({ q: value });
  const setStatus = (value) => setFilters({ status: value === "all" ? "" : value });
  const setContainerId = (value) => setFilters({ container: value });
  const setTag = (value) => setFilters({ tag: value });
  const tagOptions = useMemo(() => tagCounts(items), [items]);
  const setSortBy = (value) => setFilters({ sort: value === "name" ? "" : value });
  // Optimistic shopping-list state for instant cart feedback on the grid.
  const [cartOverrides, setCartOverrides] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const isInCart = (item) => cartOverrides[item.id] ?? item.shoppingList ?? false;

  const toggleCart = useCallback(async (item, next) => {
    setCartOverrides((prev) => ({ ...prev, [item.id]: next }));
    try {
      await setItemShoppingList(item.id, next);
      setSnackbar({
        open: true,
        message: next ? `Added "${item.name}" to shopping list.` : `Removed "${item.name}" from shopping list.`,
        severity: "success",
      });
      onItemsChanged?.();
    } catch (error) {
      console.error("Error toggling shopping list:", error);
      setCartOverrides((prev) => ({ ...prev, [item.id]: !next })); // revert
      setSnackbar({ open: true, message: "Couldn't update the shopping list.", severity: "error" });
    }
  }, [onItemsChanged]);

  const areaOfContainer = (cid) =>
    containers.find((c) => c.id === cid)?.areaId ?? null;

  // When an area is picked, only offer its containers in the container filter.
  const containerOptions = useMemo(() => {
    if (!areaId) return containers;
    if (areaId === UNASSIGNED_AREA) {
      return containers.filter((c) => !c.areaId);
    }
    return containers.filter((c) => c.areaId === areaId);
  }, [containers, areaId]);

  const filteredItems = useMemo(() => {
    let list = items.filter((item) => itemMatches(item, searchQuery));

    if (status === "instock") list = list.filter((i) => (i.quantity || 0) > 0);
    else if (status === "outofstock") list = list.filter((i) => (i.quantity || 0) === 0);
    else if (status === "expiring") {
      list = list.filter((i) => i.expirationDate && daysTo(i.expirationDate) <= 30);
    }

    if (areaId) {
      list = list.filter((i) =>
        (i.lots || []).some((l) => {
          if (!l.containerId) return false;
          const a = areaOfContainer(l.containerId);
          return areaId === UNASSIGNED_AREA ? a === null : a === areaId;
        })
      );
    }

    if (tag) {
      list = list.filter((i) => (i.tags || []).includes(tag));
    }

    if (containerId) {
      list = list.filter((i) =>
        (i.lots || []).some((l) =>
          containerId === NO_CONTAINER ? !l.containerId : l.containerId === containerId
        )
      );
    }

    const sorted = [...list];
    if (sortBy === "name") {
      sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortBy === "price") {
      sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === "qty") {
      sorted.sort((a, b) => (b.quantity || 0) - (a.quantity || 0));
    } else if (sortBy === "expiry") {
      sorted.sort((a, b) => {
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return dayjs(a.expirationDate).valueOf() - dayjs(b.expirationDate).valueOf();
      });
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, containers, searchQuery, status, areaId, containerId, tag, sortBy]);

  const openItem = useOpenItem();

  const filtersActive =
    searchQuery || status !== "all" || areaId || containerId || tag || sortBy !== "name";

  const clearFilters = () =>
    setFilters({ q: "", status: "", area: "", container: "", tag: "", sort: "" });

  const scrollRef = useScrollMemory("items-list", filteredItems.length > 0, isSmallScreen);

  let emptyMessage = "No items match your filters.";
  if (items.length === 0) {
    emptyMessage = "No items yet — scan a barcode to add your first one.";
  }
  const emptyState = (
    <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
      {emptyMessage}
    </Typography>
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          marginBottom: 2,
        }}
      >
        <TextField
          type="text"
          placeholder="Search for item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          style={{ width: "100%", maxWidth: "500px" }}
        />

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
            width: "100%",
            maxWidth: 700,
          }}
        >
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="instock">In stock</MenuItem>
              <MenuItem value="outofstock">Out of stock</MenuItem>
              <MenuItem value="expiring">Expiring ≤30d</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Area</InputLabel>
            <Select
              value={areaId}
              label="Area"
              onChange={(e) =>
                // reset container when area changes
                setFilters({ area: e.target.value, container: "" })
              }
            >
              <MenuItem value="">All areas</MenuItem>
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name}
                </MenuItem>
              ))}
              <MenuItem value={UNASSIGNED_AREA}>
                <em>No area</em>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Container</InputLabel>
            <Select
              value={containerId}
              label="Container"
              onChange={(e) => setContainerId(e.target.value)}
            >
              <MenuItem value="">All containers</MenuItem>
              {containerOptions.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
              <MenuItem value={NO_CONTAINER}>
                <em>Unassigned stock</em>
              </MenuItem>
            </Select>
          </FormControl>

          {tagOptions.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Tag</InputLabel>
              <Select value={tag} label="Tag" onChange={(e) => setTag(e.target.value)}>
                <MenuItem value="">All tags</MenuItem>
                {tagOptions.map((t) => (
                  <MenuItem key={t.tag} value={t.tag}>
                    {t.tag} ({t.count})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Sort by</InputLabel>
            <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
              <MenuItem value="name">Name (A–Z)</MenuItem>
              <MenuItem value="price">Price (low→high)</MenuItem>
              <MenuItem value="qty">Quantity (high→low)</MenuItem>
              <MenuItem value="expiry">Expiry (soonest)</MenuItem>
            </Select>
          </FormControl>

          {filtersActive && (
            <Button size="small" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </Box>

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {filteredItems.length} of {items.length} items
        </Typography>
      </Box>

      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "55vh" : "72vh",
            padding: 2,
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          {filteredItems.length === 0 ? emptyState : (
            // ImageList (not the outer box) is the element that scrolls.
            <ImageList
              ref={scrollRef}
              cols={isMediumScreen ? 2 : isLargeScreen ? 3 : 4}
              gap={16}
              sx={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
            >
              {filteredItems.map((item) => (
                <ItemTile
                  key={item.id}
                  item={item}
                  inCart={isInCart(item)}
                  onOpen={openItem}
                  onToggleCart={toggleCart}
                />
              ))}
            </ImageList>
          )}
        </Box>
      )}

      {isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            height: "80vh",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          {filteredItems.length === 0 ? emptyState : (
            <ImageList ref={scrollRef} cols={2} gap={5} sx={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
              {filteredItems.map((item) => (
                <ItemTile
                  key={item.id}
                  item={item}
                  inCart={isInCart(item)}
                  onOpen={openItem}
                  onToggleCart={toggleCart}
                />
              ))}
            </ImageList>
          )}
        </Box>
      )}

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
    </>
  );
};

export default ItemList;
