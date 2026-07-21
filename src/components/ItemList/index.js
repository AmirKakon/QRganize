import React, { useMemo, useState } from "react";
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
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { getImageSrc, PLACEHOLDER_IMAGE } from "../../utilities/helpers";

const NO_CONTAINER = "__no_container__";
const UNASSIGNED_AREA = "__unassigned_area__";

const daysTo = (d) => dayjs(d).startOf("day").diff(dayjs().startOf("day"), "day");

const ItemList = ({ items, isSmallScreen, containers = [], areas = [] }) => {
  const navigate = useNavigate();
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");

  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | instock | outofstock | expiring
  const [areaId, setAreaId] = useState("");
  const [containerId, setContainerId] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | price | qty | expiry

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
    const q = searchQuery.toLowerCase();
    let list = items.filter((item) => (item.name || "").toLowerCase().includes(q));

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
  }, [items, containers, searchQuery, status, areaId, containerId, sortBy]);

  const handleItemClick = (item) => navigate(`/item?id=${item.id}`);

  const filtersActive =
    searchQuery || status !== "all" || areaId || containerId || sortBy !== "name";

  const clearFilters = () => {
    setSearchQuery("");
    setStatus("all");
    setAreaId("");
    setContainerId("");
    setSortBy("name");
  };

  let emptyMessage = "No items match your filters.";
  if (items.length === 0) {
    emptyMessage = "No items yet — scan a barcode to add your first one.";
  }
  const emptyState = (
    <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
      {emptyMessage}
    </Typography>
  );

  const cardOf = (item) => (
    <ImageListItem
      key={item.id}
      onClick={() => handleItemClick(item)}
      sx={{ cursor: "pointer" }}
    >
      <img
        src={getImageSrc(item.image)}
        alt={item.name}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER_IMAGE;
        }}
        style={{ objectFit: "cover" }}
      />
      <ImageListItemBar
        title={item.name}
        subtitle={`Price: ${item.price} · ${item.quantity ?? 0} in stock`}
      />
    </ImageListItem>
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
              onChange={(e) => {
                setAreaId(e.target.value);
                setContainerId(""); // reset container when area changes
              }}
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
            <ImageList
              cols={isMediumScreen ? 2 : isLargeScreen ? 3 : 4}
              gap={16}
              sx={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
            >
              {filteredItems.map(cardOf)}
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
            <ImageList cols={2} gap={5} sx={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
              {filteredItems.map(cardOf)}
            </ImageList>
          )}
        </Box>
      )}
    </>
  );
};

export default ItemList;
