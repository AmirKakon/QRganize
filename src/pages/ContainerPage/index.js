import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { getContainer } from "../../utilities/api";
import {
  queryKeys,
  useItems,
  useLotsByContainer,
  useRefreshInventory,
} from "../../utilities/queries";
import Loading from "../../components/Loading";
import ContainerDetails from "../../components/ContainerDetails";

const ContainerPage = ({ isSmallScreen }) => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [container, setContainer] = useState({});
  const { data: lots } = useLotsByContainer(id);
  const { data: allItems } = useItems();
  const refreshInventory = useRefreshInventory();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    // Show the cached copy right away; the fetch below only replaces it if
    // the form hasn't been touched in the meantime.
    const cached = queryClient
      .getQueryData(queryKeys.containers)
      ?.find((c) => String(c.id) === String(id));
    if (cached) {
      setContainer(cached);
      setLoading(false);
    }

    getContainer(id)
      // getContainer resolves with a blank container on failure, so only
      // let a real (named) result replace the cached copy.
      .then((res) =>
        setContainer((prev) => {
          if (!cached) return res;
          return prev === cached && res?.name ? res : prev;
        })
      )
      .catch((error) => {
        console.error("Error fetching data:", error);
        if (!cached) setContainer({ id: id });
      })
      .finally(() => setLoading(false));
  }, [id, queryClient]);

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
        onLotsChanged={refreshInventory}
        isSmallScreen={isSmallScreen}
      />
    </Box>
  );
};

export default ContainerPage;
