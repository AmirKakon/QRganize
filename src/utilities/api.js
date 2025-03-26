const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export const searchForBarcode = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/items/find/${id}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.data;
};

export const updateItemDetails = async (item) => {
  const response = await fetch(`${apiBaseUrl}/api/items/create`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success";
}

export const getAllItems = async () => {
  const response = await fetch(`${apiBaseUrl}/api/items/getAll`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.data.items;
}
