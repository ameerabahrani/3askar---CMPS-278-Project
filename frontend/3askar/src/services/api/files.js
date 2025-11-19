import apiClient from "../apiClient";

const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;

    // Keep booleans as strings since backend expects query params
    query.append(key, value);
  });

  const qs = query.toString();
  return qs ? `/files/search?${qs}` : "/files/search";
};

const searchFiles = (params = {}) => {
  const path = buildQueryString(params);
  return apiClient.get(path);
};

export { buildQueryString, searchFiles };
