import React, { useEffect, useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { searchForBarcode } from "../../utilities/api";
import {
  queryKeys,
  useContainers,
  useLotsByItem,
  useRefreshInventory,
} from "../../utilities/queries";
import Loading from "../../components/Loading";
import ItemDetails from "../../components/ItemDetails";

// The id may be the item's own barcode or one of its barcode aliases.
const findCachedItem = (items, code) =>
  items?.find(
    (i) => String(i.id) === String(code) || (i.barcodes || []).includes(String(code))
  );

const ItemPage = ({ isSmallScreen, inOverlay = false }) => {
  const [searchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get("id")); // barcode from query params
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState({});
  const [notFound, setNotFound] = useState(false);
  const { data: containers } = useContainers();
  // Keyed on the current item id so it loads once a brand-new item is saved.
  const { data: lots } = useLotsByItem(item.id);
  const refreshInventory = useRefreshInventory();

  useEffect(() => {
    // As an overlay, the window belongs to the page underneath; leave it be.
    if (!inOverlay) window.scrollTo({ top: 0, behavior: "auto" });
    setNotFound(false);
    if (!id) {
      setLoading(false);
      return;
    }

    // Show the cached copy right away; the fetch below only replaces it if
    // the form hasn't been touched in the meantime.
    const cached = findCachedItem(queryClient.getQueryData(queryKeys.items), id);
    if (cached) {
      setItem(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    const showNotFound = () => {
      if (cached) return;
      setItem({ id: id });
      setNotFound(true);
    };

    searchForBarcode(id)
      .then((res) => {
        if (res) {
          setItem((prev) => (!cached || prev === cached ? res : prev));
        } else {
          showNotFound();
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        showNotFound();
      })
      .finally(() => setLoading(false));
  }, [id, queryClient, inOverlay]);

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
      {!inOverlay && <h2 style={{ textAlign: "center" }}>Item Details</h2>}

      <ItemDetails
        item={item}
        setItem={setItem}
        setBarcode={setId}
        lots={lots}
        containers={containers}
        onLotsChanged={refreshInventory}
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
