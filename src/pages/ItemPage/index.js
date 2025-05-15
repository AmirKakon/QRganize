import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { searchForBarcode } from "../../utilities/api";
import Loading from "../../components/Loading";
import ItemDetails from "../../components/ItemDetails";

const ItemPage = ({ isSmallScreen }) => {
  const [searchParams] = useSearchParams();
  const [id, setId] = useState(searchParams.get("id")); // Get 'id' from query parameters
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    console.log("triggeredBarcode", id); // Log the barcode id
    setLoading(true);
    if (!id) {
      setLoading(false); // Stop loading if no id is provided
      return;
    }

    searchForBarcode(id)
      .then((res) => setItem(res))
      .catch((error) => {
        console.error("Error fetching data:", error);
        setItem({ id: id });
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
        backgroundColor: "#e2e2e2",
        padding: 2,
      }}
    >
      <h2 style={{ textAlign: "center" }}>Item Details</h2>

      <ItemDetails item={item} setItem={setItem} setBarcode={setId} />
    </Box>
  );
};

export default ItemPage;
