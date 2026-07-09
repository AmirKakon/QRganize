import React, { useCallback, useEffect, useState } from "react";
import { Box, Snackbar, Alert } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { searchForBarcode, getLotsByItem, getAllContainers } from "../../utilities/api";
import Loading from "../../components/Loading";
import ItemDetails from "../../components/ItemDetails";

const ItemPage = ({ isSmallScreen }) => {
  const [searchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get("id")); // barcode from query params
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState({});
  const [notFound, setNotFound] = useState(false);
  const [lots, setLots] = useState([]);
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    getAllContainers()
      .then((res) => setContainers(res || []))
      .catch((error) => console.error("Error fetching containers:", error));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setLoading(true);
    setNotFound(false);
    if (!id) {
      setLoading(false);
      return;
    }
    searchForBarcode(id)
      .then((res) => {
        if (res) {
          setItem(res);
        } else {
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

  // Load the item's stock (lots), keyed on the current item id so it refreshes
  // after a brand-new item is saved and gets an id.
  const loadLots = useCallback(() => {
    if (!item.id) {
      setLots([]);
      return Promise.resolve();
    }
    return getLotsByItem(item.id)
      .then((res) => setLots(res || []))
      .catch((error) => console.error("Error fetching lots:", error));
  }, [item.id]);

  useEffect(() => {
    loadLots();
  }, [loadLots]);

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
        lots={lots}
        containers={containers}
        onLotsChanged={loadLots}
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
