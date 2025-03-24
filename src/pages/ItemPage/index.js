import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useParams } from "react-router-dom";
import { searchForBarcode } from "../../utilities/api";
import Loading from "../../components/Loading";

const ItemPage = ({ isSmallScreen }) => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    searchForBarcode(id)
      .then((res) => {
        setItem(res[0]);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const getImageSrc = (image) => {
    if(image && image.startsWith("http")) {
      return image;
    }
    
    // Check if the image is a valid base64 string
    if (image && !image.startsWith("data:image")) {
      return `data:iamge/png;base64,${image}`;
    }
    return image;
  };

  return loading ? (
    <Loading />
  ) : (
    <Box flex={1} spacing={1} sx={{ backgroundColor: "#e2e2e2" }}>
      <h3>Item Page</h3>
      <p>The ID is: {id}</p>
      <p>The Item ID is: {item?.id}</p>
      <p>The Item Name is: {item?.name}</p>

      {item?.image && (
        <Box sx={{ marginTop: 2 }}>
          <img
            src={getImageSrc(item?.image)}
            alt={item?.name}
            style={{ width: "300px", borderRadius: "8px" }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ItemPage;
