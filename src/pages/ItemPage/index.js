import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { searchForBarcode } from "../../utilities/api";
import Loading from "../../components/Loading";
import SaveItem from "../../components/SaveItem";

const ItemPage = ({ isSmallScreen }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true)
  const [item, setItem] = useState({});

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    searchForBarcode(id)
      .then((res) => setItem(res))
      .catch((error) => console.error("Error fetching data:", error))
      .finally(() => setLoading(false));
  }, [id]);

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{ backgroundColor: "#e2e2e2", padding: 2 }}>
      <h3>Item Details</h3>

        <SaveItem item={item} setItem={setItem} />
    </Box>
  );
};

export default ItemPage;
