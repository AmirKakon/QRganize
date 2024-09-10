const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export const getProjectCards = async () => {
  const response = await fetch(`${apiBaseUrl}/api/projects/card/getAll`, {
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

export const getProjectOverview = async (projectId) => {
  const response = await fetch(`${apiBaseUrl}/api/projects/overview/get/${projectId}`, {
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

export const getTimeline = async () => {
  const response = await fetch(`${apiBaseUrl}/api/timeline/getAll`, {
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

export const getCertificates = async () => {
  const response = await fetch(`${apiBaseUrl}/api/certificates/getAll`, {
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