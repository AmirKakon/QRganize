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
  return res.status === "Success";
}

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