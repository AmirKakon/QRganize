const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export const searchForBarcode = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/items/searchBarcode/${id}`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.data.data;
};