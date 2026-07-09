const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export const searchForBarcode = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/items/find/${id}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.data;
};

export const createItem = async (item) => {
  const response = await fetch(`${apiBaseUrl}/api/items/create`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  // On success, return the item id (falls back to true) so callers that need
  // to reference the new item — e.g. adding it to a container — can.
  return res.status === "Success" ? (res.item?.itemId ?? true) : false;
}

export const parseReceipt = async (image) => {
  const response = await fetch(`${apiBaseUrl}/api/ai/parseReceipt`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image }),
  });
  if (!response.ok) {
    let message = `Error: ${response.status}`;
    try {
      const body = await response.json();
      if (body?.msg) message = body.msg;
    } catch (e) {
      // response had no JSON body; keep the status-based message
    }
    throw new Error(message);
  }
  const res = await response.json();
  return res.data?.items ?? [];
}

export const setItemShoppingList = async (id, shoppingList) => {
  const response = await fetch(`${apiBaseUrl}/api/items/shoppingList/${id}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shoppingList }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success";
};

export const getAllItems = async () => {
  const response = await fetch(`${apiBaseUrl}/api/items/getAll`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.data;
}

export const deleteItem = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/items/delete/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success"; 
}

export const createContainer = async (container) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/create`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(container),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success";
}

export const deleteContainer = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/delete/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success"; 
}

export const getAllContainers = async () => {
  const response = await fetch(`${apiBaseUrl}/api/containers/getAll`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.data.containers;
}

export const getContainer = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/get/${id}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
    },
  });
  if (!response.ok) {
    return {id: id, name: "", image: null, items: []};
  }
  const res = await response.json();
  return res.data;
}

export const addItemToContainer = async (containerId, item) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/addItems/${containerId}`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
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

export const getContainerItems = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/getItems/${id}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
    },
  });
  if (!response.ok) {
    return [];
  }
  const res = await response.json();
  return res.data;
}

export const deleteContainerItem = async (containerId, itemId) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/removeItems/${containerId}/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success"; 
}

export const updateContainerItemsQuantity = async (containerId, items) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/updateItemQuantitiesBatch/${containerId}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({items: items}),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success";
}

export const getContainersOfItem = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/containers/getContainers/${id}`, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
    },
  });
  if (!response.ok) {
    return [];
  }
  const res = await response.json();
  return res.data;
}