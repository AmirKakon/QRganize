import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import Loading from "../../components/Loading";


const ItemPage = ({ isSmallScreen }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setLoading(false);
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{backgroundColor: "#e2e2e2"}}>
      <h3>Item Page</h3>
      <p>the id is: {id}</p>
    </Box>
  );
};

export default ItemPage;
