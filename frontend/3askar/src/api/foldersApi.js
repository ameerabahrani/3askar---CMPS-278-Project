const API_BASE_URL = "http://localhost:5000";


async function handleResponse(response) {
  // Read response body as text first so we can produce a helpful error message
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text; // keep raw text if not JSON
    }
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === "object" && data.message) ||
      (typeof data === "string" && data) ||
      `Request failed with status ${response.status} ${response.statusText}`;

    const err = new Error(errorMessage);
    err.response = { status: response.status, data };
    throw err;
  }

  // Successful response: return parsed JSON (or raw text)
  return data;
}

export { API_BASE_URL, handleResponse};

//Folder API functions

//List folders fora  given parent Folder(null = root "My Drive")
export async function getFolders(parentFolderId = null) {
  const params = new URLSearchParams();

  // backend does:
  // const parentId = parentFolder && parentFolder !== "null" ? parentFolder : null;
  // so sending "null" string here triggers root view.
  if (parentFolderId === null) {
    params.set("parentFolder", "null");
  } else {
    params.set("parentFolder", parentFolderId);
  }

  const res = await fetch(`${API_BASE_URL}/folders?${params.toString()}`, {
    method: "GET",
    credentials: "include", // important for session cookie
  });

  return handleResponse(res);
}

// Create a new folder (root or nested)
export async function createFolder({ name, parentFolder = null }) {
  const body = {
    name,
    parentFolder, // can be null → backend treats as root
  };

  const res = await fetch(`${API_BASE_URL}/folders`, { // send http request to back end and then configure it using object 
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",                       // telling browser send cookies with this request
    body: JSON.stringify(body),
  });

  return handleResponse(res);
}

// Update a folder (rename, move, trash, restore, star, etc.)
export async function updateFolder(folderId, updates) {
  const res = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  return handleResponse(res);
}

// Get single folder info
export async function getFolder(folderId) {
  const res = await fetch(`${API_BASE_URL}/folders/${folderId}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}


// Get breadcrumb chain for a folder
export async function getBreadcrumb(folderId) {
  const res = await fetch(`${API_BASE_URL}/folders/${folderId}/breadcrumb`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}


// Starred view
export async function getStarredFolders() {
  const res = await fetch(`${API_BASE_URL}/folders/starred`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}


// Trash view
export async function getTrashFolders() {
  const res = await fetch(`${API_BASE_URL}/folders/trash`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}


// Recent view
export async function getRecentFolders(limit = 20) {
  const res = await fetch(`${API_BASE_URL}/folders/recent?limit=${limit}`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}


// Shared with me
export async function getSharedFolders() {
  const res = await fetch(`${API_BASE_URL}/folders/shared`, {
    method: "GET",
    credentials: "include",
  });

  return handleResponse(res);
}


// Search folders by name
export async function searchFolders(query) {
  const params = new URLSearchParams();
  params.set("q", query); // backend expects req.query.q

  const res = await fetch(
    `${API_BASE_URL}/folders/search?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return handleResponse(res);

}

export async function copyFolder(folderId, { name, parentFolder } = {}) {
  const body = {};
  if (typeof name === "string") body.name = name;
  if (typeof parentFolder !== "undefined") body.parentFolder = parentFolder;

  const res = await fetch(`${API_BASE_URL}/folders/${folderId}/copy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  return handleResponse(res);
}

export function downloadFolderZip(folderId) {
  const url = `${API_BASE_URL}/folders/${folderId}/download`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function shareFolder(folderId, { userId, permission }) {
  const res = await fetch(`${API_BASE_URL}/folders/${folderId}/share`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId, permission }),
  });
  return handleResponse(res);
}

export async function updateFolderPermission(folderId, { userId, permission }) {
  const res = await fetch(`${API_BASE_URL}/folders/${folderId}/permission`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId, permission }),
  });
  return handleResponse(res);
}

export async function unshareFolder(folderId, { userId }) {
  const res = await fetch(`${API_BASE_URL}/folders/${folderId}/unshare`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  return handleResponse(res);
}


