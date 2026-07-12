import React, { useCallback, useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { getContainer, getLotsByContainer, getAllItems } from "../../utilities/api";
import Loading from "../../components/Loading";
import ContainerDetails from "../../components/ContainerDetails";

const ContainerPage = ({ isSmallScreen }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [container, setContainer] = useState({});
  const [lots, setLots] = useState([]);
  const [allItems, setAllItems] = useState([]);

  useEffect(() => {
    getAllItems()
      .then((res) => setAllItems(res || []))
      .catch((error) => console.error("Error fetching items:", error));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    getContainer(id)
      .then((res) => setContainer(res))
      .catch((error) => {
        console.error("Error fetching data:", error);
        setContainer({ id: id });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const loadLots = useCallback(() => {
    return getLotsByContainer(id)
      .then((res) => setLots(res || []))
      .catch((error) => console.error("Error fetching lots:", error));
  }, [id]);

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
      <h2 style={{ textAlign: "center" }}>Container Details</h2>

      <ContainerDetails
        container={container}
        setContainer={setContainer}
        lots={lots}
        allItems={allItems}
        onLotsChanged={loadLots}
        isSmallScreen={isSmallScreen}
      />
    </Box>
  );
};

export default ContainerPage;
