import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { getContainer, getContainerItems } from "../../utilities/api";
import Loading from "../../components/Loading";
import ContainerDetails from "../../components/ContainerDetails";
import ItemList from "../../components/ItemList";

const ContainerPage = ({ isSmallScreen }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [container, setContainer] = useState({});
  const [items, setItems] = useState([]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    getContainer(id)
      .then((res) => {
        setContainer(res);
        getContainerItems(id).then((itemRes) => {
          setItems(itemRes);
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setContainer({ id: id });
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
      <h2 style={{ textAlign: "center" }}>Container Details</h2>

      <ContainerDetails container={container} setContainer={setContainer} items={items} setItems={setItems}/>
    </Box>
  );
};

export default ContainerPage;
