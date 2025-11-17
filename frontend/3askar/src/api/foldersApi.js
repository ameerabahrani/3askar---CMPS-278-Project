const API_BASE_URL = "http://localhost:5000";


async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = "Request failed";
    try {
      const data = await response.json();
      if (data?.message) errorMessage = data.message; // if data object exists and has message property set value of error Message
    } catch (e) {
      // Ignore JSON parse errors, keep generic message
    }
    throw new Error(errorMessage);
  }

  // If OK, return parsed JSON
  return response.json();
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

 