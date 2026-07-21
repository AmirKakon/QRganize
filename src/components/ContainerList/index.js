import React, { useMemo, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  useMediaQuery,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getImageSrc, PLACEHOLDER_IMAGE } from "../../utilities/helpers";

const ContainerList = ({ containers, isSmallScreen, items = [], areas = [] }) => {
  const navigate = useNavigate();
  const isMediumScreen = useMediaQuery("(max-width: 950px)");
  const isLargeScreen = useMediaQuery("(max-width: 1300px)");
  const [searchQuery, setSearchQuery] = useState("");

  const areaName = (id) => areas.find((a) => a.id === id)?.name;

  // How many distinct items live in each container (via their lots).
  const itemCountByContainer = useMemo(() => {
    const counts = {};
    for (const item of items) {
      const here = new Set();
      for (const lot of item.lots || []) {
        if (lot.containerId) here.add(lot.containerId);
      }
      here.forEach((cid) => {
        counts[cid] = (counts[cid] || 0) + 1;
      });
    }
    return counts;
  }, [items]);

  const handleItemClick = (container) => {
    navigate(`/container/${container.id}`);
  };

  const filteredContainers = containers.filter((container) =>
    container.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const emptyState = (
    <Typography sx={{ mt: 4, color: "text.secondary", textAlign: "center" }}>
      {containers.length === 0
        ? "No containers yet — add one from the menu to get started."
        : "No containers match your search."}
    </Typography>
  );

  const subtitleFor = (container) => {
    const count = itemCountByContainer[container.id] || 0;
    const area = areaName(container.areaId);
    const items$ = `${count} item${count === 1 ? "" : "s"}`;
    return area ? `${area} · ${items$}` : items$;
  };

  const cardOf = (container) => (
    <ImageListItem
      key={container.id}
      onClick={() => handleItemClick(container)}
      sx={{ cursor: "pointer" }}
    >
      <img
        src={getImageSrc(container.image)}
        alt={container.name}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER_IMAGE;
        }}
        style={{ objectFit: "cover" }}
      />
      <ImageListItemBar title={container.name} subtitle={subtitleFor(container)} />
    </ImageListItem>
  );

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
        <TextField
          type="text"
          placeholder="Search for container..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          style={{ width: "100%", maxWidth: "400px" }}
        />
      </Box>

      {!isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            height: isMediumScreen ? "40vh" : isLargeScreen ? "60vh" : "78vh",
            padding: 2,
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          {filteredContainers.length === 0 ? emptyState : (
            <ImageList
              cols={isMediumScreen ? 2 : isLargeScreen ? 3 : 4}
              gap={16}
              sx={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}
            >
              {filteredContainers.map(cardOf)}
            </ImageList>
          )}
        </Box>
      )}

      {isSmallScreen && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            height: "90vh",
            boxSizing: "border-box",
            overflowY: "auto",
          }}
        >
          {filteredContainers.length === 0 ? emptyState : (
            <ImageList cols={2} gap={5} sx={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
              {filteredContainers.map(cardOf)}
            </ImageList>
          )}
        </Box>
      )}
    </>
  );
};

export default ContainerList;
