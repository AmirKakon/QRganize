import { jwtDecode } from "jwt-decode";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;

export const tryGetTokenOrLogin = async (user) => {
  try {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!accessToken || !refreshToken) {
      // Either token is unavailable, perform login
      return await loginUser(user);
    }

    const accessTokenExpiration = getTokenExpiration("accessToken");
    const refreshTokenExpiration = getTokenExpiration("refreshToken");

    if (!accessTokenExpiration || !refreshTokenExpiration) {
      // Either token is invalid, perform login
      return await loginUser(user);
    }

    if (
      accessToken &&
      accessTokenExpiration.diff(dayjs(), "minute") < 2 &&
      refreshToken &&
      refreshTokenExpiration.diff(dayjs(), "day") > 1
    ) {
      // Refresh access token
      return await refreshAccessToken(refreshToken);
    }

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("tryGetTokenOrLogin failed:", error);
    return await loginUser(user);
  }
};

export const loginUser = async ({ username, id }) => {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, id }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response}`);
  }
  const res = await response.json();
  // Store tokens securely
  localStorage.setItem("accessToken", res.accessToken);
  localStorage.setItem("refreshToken", res.refreshToken);
  return res;
};

export const logoutUser = async (id) => {
  const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response}`);
  }
  const res = await response.json();
  // Remove tokens from storage
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  return res;
};

export const refreshAccessToken = async (refreshToken) => {
  const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: refreshToken }),
  });
  if (!response.ok) {
    throw new Error(`Error: ${response}`);
  }
  const res = await response.json();
  // Store tokens securely
  localStorage.setItem("accessToken", res.accessToken);
  return res;
};

export const getTokenExpiration = (type) => {
  try {
    const token =
      type === "accessToken"
        ? localStorage.getItem("accessToken")
        : type === "refreshToken"
        ? localStorage.getItem("refreshToken")
        : null;
    const decodedToken = token ? jwtDecode(token) : null;
    const tokenExpiration = decodedToken ? dayjs.unix(decodedToken.exp) : null;
    return tokenExpiration;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

export const getUuid = () => {
  let uuid = localStorage.getItem("uuid");
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem("uuid", uuid);
  }
  return uuid;
};
