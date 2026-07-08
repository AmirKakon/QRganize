import React, { useCallback, useEffect, useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { searchForBarcode, getContainersOfItem, getAllContainers } from "../../utilities/api";
import Loading from "../../components/Loading";
import ItemDetails from "../../components/ItemDetails";

const ItemPage = ({ isSmallScreen }) => {
  const [searchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get("id")); // Get 'id' from query parameters
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [itemContainers, setItemContainers] = useState([]); // Containers this item is in

  // Resolve which containers hold this item (by barcode id), with their names
  const loadItemContainers = useCallback(async () => {
    if (!id) {
      setItemContainers([]);
      return;
    }
    try {
      const [containerIds, allContainers] = await Promise.all([
        getContainersOfItem(id),
        getAllContainers(),
      ]);
      const nameById = new Map((allContainers || []).map((c) => [c.id, c.name]));
      setItemContainers(
        (containerIds || []).map((cid) => ({ id: cid, name: nameById.get(cid) || cid }))
      );
    } catch (error) {
      console.error("Error fetching item containers:", error);
      setItemContainers([]);
    }
  }, [id]);

  useEffect(() => {
    loadItemContainers();
  }, [loadItemContainers]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    console.log("triggeredBarcode", id); // Log the barcode id
    setLoading(true);
    setNotFound(false);
    if (!id) {
      setLoading(false); // Stop loading if no id is provided
      return;
    }

    searchForBarcode(id)
      .then((res) => {
        if (res) {
          setItem(res);
        } else {
          // Barcode scanned but no matching item — start a new one
          setItem({ id: id });
          setNotFound(true);
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setItem({ id: id });
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return loading ? (
    <Loading />
  ) : (
    <Box
      flex={1}
      spacing={1}
      sx={{
        backgroundColor: "background.default",
        padding: 2,
      }}
    >
      <h2 style={{ textAlign: "center" }}>Item Details</h2>

      <ItemDetails
        item={item}
        setItem={setItem}
        setBarcode={setId}
        itemContainers={itemContainers}
        onContainersChanged={loadItemContainers}
      />

      <Snackbar
        open={notFound}
        autoHideDuration={6000}
        onClose={() => setNotFound(false)}
        anchorOrigin={{ vertical: isSmallScreen ? "bottom" : "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotFound(false)}
          severity="info"
          variant="filled"
          sx={{ width: "100%" }}
        >
          New barcode — let&apos;s create this item.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ItemPage;
