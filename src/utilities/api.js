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

// Attach a barcode alias to an item so another package's barcode resolves to it.
export const addItemBarcode = async (itemId, barcode) => {
  const response = await fetch(`${apiBaseUrl}/api/items/addBarcode/${itemId}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ barcode }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success";
}

// Use one unit of an item (FEFO); returns the new quantity.
export const consumeItemOne = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/items/use/${id}`, {
    method: "POST",
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

// Finish an item: clear all its stock (keeps the item record).
export const finishItem = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/items/finish/${id}`, {
    method: "POST",
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

// Merge the source item into the target (moves its stock, deletes the source).
export const mergeItems = async (sourceId, targetId) => {
  const response = await fetch(`${apiBaseUrl}/api/items/merge`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sourceId, targetId }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  const res = await response.json();
  return res.status === "Success";
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

// ---- Areas (groups of containers) ----

export const getAllAreas = async () => {
  const response = await fetch(`${apiBaseUrl}/api/areas/getAll`, {
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
  return res.data?.areas ?? [];
};

export const createArea = async (area) => {
  const response = await fetch(`${apiBaseUrl}/api/areas/create`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(area),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  return (await response.json()).status === "Success";
};

export const updateArea = async (id, name) => {
  const response = await fetch(`${apiBaseUrl}/api/areas/update/${id}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  return (await response.json()).status === "Success";
};

export const deleteArea = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/areas/delete/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
    },
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  return (await response.json()).status === "Success";
};

// ---- Lots (stock batches) ----

export const getLotsByItem = async (itemId) => {
  const response = await fetch(`${apiBaseUrl}/api/lots/byItem/${itemId}`, {
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
  return res.data ?? [];
};

export const getLotsByContainer = async (containerId) => {
  const response = await fetch(`${apiBaseUrl}/api/lots/byContainer/${containerId}`, {
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
  return res.data ?? [];
};

export const addLot = async (lot) => {
  const response = await fetch(`${apiBaseUrl}/api/lots/add`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lot),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  return (await response.json()).data;
};

export const updateLot = async (id, fields) => {
  const response = await fetch(`${apiBaseUrl}/api/lots/update/${id}`, {
    method: "PUT",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  return (await response.json()).data;
};

export const consumeLot = async (id, amount = 1) => {
  const response = await fetch(`${apiBaseUrl}/api/lots/use/${id}`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + localStorage.getItem("accessToken"),
      uuid: localStorage.getItem("uuid"),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  return (await response.json()).data;
};

export const deleteLot = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/lots/delete/${id}`, {
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

