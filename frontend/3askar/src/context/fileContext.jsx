import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import apiClient, { API_BASE_URL } from "../services/apiClient";
import { useAuth } from "./AuthContext";


const FileContext = createContext();

const DEFAULT_FILE_ICON =
  "https://www.gstatic.com/images/icons/material/system/2x/insert_drive_file_black_24dp.png";

const iconMap = [
  {
    matcher: (ext, mime) => mime?.includes("pdf") || ext === "pdf",
    icon: "https://www.gstatic.com/images/icons/material/system/2x/picture_as_pdf_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.startsWith("image/") ||
      ["png", "jpg", "jpeg", "gif", "bmp"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/image_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.includes("presentation") || ["ppt", "pptx"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/slideshow_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.includes("spreadsheet") || ["xls", "xlsx", "csv"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/grid_on_black_24dp.png",
  },
  {
    matcher: (ext, mime) =>
      mime?.includes("wordprocessingml") || ["doc", "docx"].includes(ext),
    icon: "https://www.gstatic.com/images/icons/material/system/2x/description_black_24dp.png",
  },
];

const resolveIcon = (filename = "", mime = "") => {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const match = iconMap.find(({ matcher }) => matcher(ext, mime));
  return match?.icon ?? DEFAULT_FILE_ICON;
};

const LOG_ENABLED = false;
const nowIso = () => new Date().toISOString();
const timer = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());
const logEvent = (label, detail = {}) => {
  if (!LOG_ENABLED) return;
  console.info(`[FileContext][${nowIso()}] ${label}`, detail);
};
const startSpan = (label, detail = {}) => {
  if (!LOG_ENABLED) return () => { };
  const started = timer();
  logEvent(`${label}:start`, detail);
  return (extra = {}) =>
    logEvent(`${label}:end`, {
      durationMs: Number((timer() - started).toFixed(1)),
      ...detail,
      ...extra,
    });
};

const USE_MOCK_DATA = false; //flip to false 

const MOCK_FILES = [
  {
    id: "mock-1",
    name: "AI Ethics Assignment.pdf",
    owner: "professor@aub.edu.lb",
    location: "My Drive",
    uploadedAt: "2025-11-05T00:00:00Z",
    lastAccessedAt: "2025-11-10T00:00:00Z",
    isStarred: true,
    isDeleted: false,
    icon: iconMap[0].icon,
  },
  {
    id: "mock-2",
    name: "Group Project Slides.pptx",
    owner: "teamleader@gmail.com",
    location: "Shared with me",
    uploadedAt: "2025-01-24T00:00:00Z",
    lastAccessedAt: "2025-11-08T00:00:00Z",
    isStarred: false,
    isDeleted: false,
    icon: iconMap[2].icon,
  },
  {
    id: "mock-3",
    name: "Research Data Sheet.xlsx",
    owner: "labassistant@aub.edu.lb",
    location: "My Drive",
    uploadedAt: "2025-10-05T00:00:00Z",
    lastAccessedAt: "2025-11-11T00:00:00Z",
    isStarred: true,
    isDeleted: false,
    icon: iconMap[3].icon,
  },
  {
    id: "mock-4",
    name: "Old Notes.txt",
    owner: "me",
    location: "My Drive",
    uploadedAt: "2022-05-15T00:00:00Z",
    lastAccessedAt: "2022-05-15T00:00:00Z",
    isStarred: false,
    isDeleted: true,
    icon: DEFAULT_FILE_ICON,
  },
  {
    id: "mock-5",
    name: "Shared Budget.xlsx",
    owner: "finance@aub.edu.lb",
    location: "Shared with me",
    uploadedAt: "2025-09-05T00:00:00Z",
    lastAccessedAt: "2025-11-02T00:00:00Z",
    isStarred: false,
    isDeleted: false,
    icon: iconMap[3].icon,
  },
];

const normalizeFile = (file) => {
  if (!file) return null;

  const ownerObject =
    typeof file.owner === "object" && file.owner !== null ? file.owner : null;

  return {
    id: file._id?.toString() ?? file.id,
    gridFsId: file.gridFsId,
    name: file.filename || file.originalName || "Untitled",
    owner: ownerObject?.name || ownerObject?.email || "Me",
    ownerId: ownerObject?._id ?? file.owner ?? null,
    ownerEmail: ownerObject?.email,
    location: file.location || "My Drive",
    uploadedAt: file.uploadDate,
    lastAccessedAt: file.lastAccessed || file.lastAccessedAt,
    isStarred: Boolean(file.isStarred),
    isDeleted: Boolean(file.isDeleted),
    sharedWith: Array.isArray(file.sharedWith)
      ? file.sharedWith.map(entry => ({
        userId: entry.user?._id || entry.user,
        name: entry.user?.name || null,
        email: entry.user?.email || null,
        picture: entry.user?.picture || null,
        permission: entry.permission,
      }))
      : [],
    size: file.size,
    type: file.type,
    description: file.description || "",
    path: Array.isArray(file.path) ? file.path : [],
    folderId: file.folderId ? file.folderId.toString() : null,
    icon: resolveIcon(file.filename || file.originalName, file.type),
  };

};

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [trashFiles, setTrashFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);



  const filesRef = useRef([]);
  // FC-2: uploading state previously referenced but not defined
  const [uploading, setUploading] = useState(false);
  // FC-3: selection state (files / folders as Sets for O(1) membership)
  const [selectedFiles, setSelectedFiles] = useState(() => new Set());
  const [selectedFolders, setSelectedFolders] = useState(() => new Set());
  const trashRef = useRef([]);
  const sharedRef = useRef([]);

  const { user, loading: authLoading } = useAuth() || {};
  const currentUserId = user?._id ? user._id.toString() : null;
  const currentUserEmail =
    typeof user?.email === "string" ? user.email.toLowerCase() : null;

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    trashRef.current = trashFiles;
  }, [trashFiles]);

  useEffect(() => {
    sharedRef.current = sharedFiles;
  }, [sharedFiles]);

  const fetchCollections = useCallback(async () => {
    if (authLoading) {
      logEvent("fetchCollections:skip-auth-loading");
      return;
    }

    if (!currentUserId && !currentUserEmail) {
      logEvent("fetchCollections:skip-no-user");
      setLoading(false);
      return;
    }

    const finish = startSpan("fetchCollections", {
      currentUserId,
      currentUserEmail,
    });
    setLoading(true);

    if (USE_MOCK_DATA) {
      const normalized = MOCK_FILES.map((file) => ({
        ...file,
        icon: file.icon || resolveIcon(file.name),
      }));

      const live = normalized.filter((file) => !file.isDeleted);
      const trashed = normalized.filter((file) => file.isDeleted);
      const sharedList = normalized.filter(
        (file) =>
          file.location?.toLowerCase() === "shared with me" ||
          (file.sharedWith?.length ?? 0) > 0
      );

      setFiles(live);
      setTrashFiles(trashed);
      setSharedFiles(sharedList);

      const validIds = new Set([
        ...live.map((f) => f.id),
        ...trashed.map((f) => f.id),
        ...sharedList.map((f) => f.id),
      ]);
      setSelectedFiles((prev) => {
        const next = new Set();
        prev.forEach((id) => {
          if (validIds.has(id)) next.add(id);
        });
        return next;
      });
      setSelectedFolders(new Set());

      setError(null);
      setLoading(false);
      finish({
        mode: "mock",
        counts: {
          files: live.length,
          trash: trashed.length,
          shared: sharedList.length || 0,
        },
      });
      return;
    }

    try {
      logEvent("fetchCollections:requesting", {
        endpoints: ["/files", "/files/list/trash", "/files/shared"],
      });
      const [owned, trash, shared] = await Promise.all([
        apiClient.get("/files"),
        apiClient.get("/files/list/trash"),
        apiClient.get("/files/shared"),
      ]);

      const ownedNormalized = (owned.data || []).map(normalizeFile).filter(Boolean);
      const trashNormalized = (trash.data || []).map(normalizeFile).filter(Boolean);
      const sharedNormalized = (shared.data || []).map(normalizeFile).filter(Boolean);

      setFiles(ownedNormalized);
      setTrashFiles(trashNormalized);
      setSharedFiles(sharedNormalized);

      const validIds = new Set([
        ...ownedNormalized.map((f) => f.id),
        ...trashNormalized.map((f) => f.id),
        ...sharedNormalized.map((f) => f.id),
      ]);
      setSelectedFiles((prev) => {
        const next = new Set();
        prev.forEach((id) => {
          if (validIds.has(id)) next.add(id);
        });
        return next;
      });
      setSelectedFolders(new Set());
      finish({
        mode: "api",
        counts: {
          files: owned.data?.length ?? 0,
          trash: trash.data?.length ?? 0,
          shared: shared.data?.length ?? 0,
        },
      });
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load files at the moment."
      );
      logEvent("fetchCollections:error", {
        message: err.message,
        response: err.response,
      });
      finish({ mode: "api", error: err.message });
    } finally {
      setLoading(false);
    }
  }, [authLoading, currentUserEmail, currentUserId]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const toggleStar = useCallback(
    async (id) => {
      setError(null);
      const existing =
        filesRef.current.find((file) => file.id === id) ||
        sharedRef.current.find((file) => file.id === id);
      if (!existing) return;
  // If a refresh was requested while no user was present, replay it once auth is ready
  useEffect(() => {
    if (authLoading) return;
    if (pendingRefresh.current && (currentUserId || currentUserEmail)) {
      logEvent("fetchCollections:pending-refresh");
      pendingRefresh.current = false;
      fetchCollections();
    }
  }, [authLoading, currentUserEmail, currentUserId, fetchCollections]);

  const toggleStar = useCallback(async (id) => {
    const finish = startSpan("toggleStar", { id });
    const existing = filesRef.current.find((file) => file.id === id);
    if (!existing) {
      finish({ status: "skip-missing-file" });
      return;
    }

      const nextState = !existing.isStarred;
      const applyStarState = (collection, value) =>
        collection.map((file) =>
          file.id === id ? { ...file, isStarred: value } : file
        );

      setFiles((prev) => applyStarState(prev, nextState));
      setSharedFiles((prev) => applyStarState(prev, nextState));

    const toggleStar = useCallback(
    async (id) => {
      setError(null);
      const existing =
        filesRef.current.find((file) => file.id === id) ||
        sharedRef.current.find((file) => file.id === id);
      if (!existing) return;

      const nextState = !existing.isStarred;
      
      // Helper for updating state
      const applyStarState = (collection, value) =>
        collection.map((file) =>
          file.id === id ? { ...file, isStarred: value } : file
        );

      // 1. Optimistic Update
      setFiles((prev) => applyStarState(prev, nextState));
      setSharedFiles((prev) => applyStarState(prev, nextState));

      if (USE_MOCK_DATA) return;

      try {
        // 2. API Call
        await apiClient.patch(`/files/${id}/star`, { isStarred: nextState });
      } catch (err) {
        // 3. Revert on Error
        setFiles((prev) => applyStarState(prev, existing.isStarred));
        setSharedFiles((prev) => applyStarState(prev, existing.isStarred));
        setError("Unable to update star. Try again.");
      }
    },
    [currentUserId]
  );

  const moveToTrash = useCallback(async (id) => {
    const finish = startSpan("moveToTrash", { id });
    const existing = filesRef.current.find((file) => file.id === id);
    if (!existing) {
      finish({ status: "skip-missing-file" });
      return;
    }

    setFiles((prev) => prev.filter((file) => file.id !== id));
    setTrashFiles((prev) => [{ ...existing, isDeleted: true }, ...prev]);

    if (USE_MOCK_DATA) {
      finish({ status: "mock" });
      return;
    }

    try {
      await apiClient.patch(`/files/${id}/trash`, { isDeleted: true });
      finish({ status: "ok" });
    } catch {
      setFiles((prev) => [existing, ...prev]);
      setTrashFiles((prev) => prev.filter((file) => file.id !== id));
      setError("Unable to move file to bin.");
      logEvent("moveToTrash:error", { id });
      finish({ status: "error" });
    }
  }, []);

  const restoreFromBin = useCallback(async (id) => {
    const finish = startSpan("restoreFromBin", { id });
    const existing = trashRef.current.find((file) => file.id === id);
    if (!existing) {
      finish({ status: "skip-missing-file" });
      return;
    }

    setTrashFiles((prev) => prev.filter((file) => file.id !== id));
    setFiles((prev) => [{ ...existing, isDeleted: false }, ...prev]);

    if (USE_MOCK_DATA) {
      finish({ status: "mock" });
      return;
    }

    try {
      await apiClient.patch(`/files/${id}/trash`, { isDeleted: false });
      finish({ status: "ok" });
    } catch {
      setTrashFiles((prev) => [existing, ...prev]);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      setError("Unable to restore file.");
      logEvent("restoreFromBin:error", { id });
      finish({ status: "error" });
    }
  }, []);

  const deleteForever = useCallback(async (id) => {
    const finish = startSpan("deleteForever", { id });
    const existing = trashRef.current.find((file) => file.id === id);
    if (!existing) {
      finish({ status: "skip-missing-file" });
      return;
    }

    setTrashFiles((prev) => prev.filter((file) => file.id !== id));

    if (USE_MOCK_DATA) {
      finish({ status: "mock" });
      return;
    }

    try {
      await apiClient.delete(`/files/${id}/permanent`);
      finish({ status: "ok" });
    } catch {
      setTrashFiles((prev) => [existing, ...prev]);
      setError("Unable to delete file permanently.");
      logEvent("deleteForever:error", { id });
      finish({ status: "error" });
    }
  }, []);

  const renameFile = useCallback(
    async (id, newName) => {
      const finish = startSpan("renameFile", { id, newName });
      const trimmed = newName?.trim();
      if (!trimmed) {
        finish({ status: "skip-empty-name" });
        return;
      }

      const allFiles = [
        ...filesRef.current,
        ...trashRef.current,
        ...sharedFiles,
      ];
      const existing = allFiles.find((file) => file.id === id);
      if (!existing) {
        finish({ status: "skip-missing-file" });
        return;
      }

      const applyRename = (collection, name) =>
        collection.map((file) => (file.id === id ? { ...file, name } : file));

      setFiles((prev) => applyRename(prev, trimmed));
      setSharedFiles((prev) => applyRename(prev, trimmed));
      setTrashFiles((prev) => applyRename(prev, trimmed));

      if (USE_MOCK_DATA) return;

      try {
        await apiClient.patch(`/files/${id}/rename`, { newName });
        await apiClient.patch(`/files/${id}/rename`, { newName: trimmed });
        finish({ status: "ok" });
      } catch {
        setFiles((prev) => applyRename(prev, existing.name));
        setSharedFiles((prev) => applyRename(prev, existing.name));
        setTrashFiles((prev) => applyRename(prev, existing.name));
        setError("Unable to rename file.");
        logEvent("renameFile:error", { id, attempted: trimmed });
        finish({ status: "error" });
      }
    },
    [sharedFiles]
  );

  const downloadFile = useCallback((file) => {
    const finish = startSpan("downloadFile", { id: file?.id, name: file?.name });
    if (!file?.gridFsId) {
      finish({ status: "skip-no-gridfs" });
      return;
    }

    if (USE_MOCK_DATA) {
      window.alert("Downloads are unavailable in mock mode.");
      finish({ status: "mock" });
      return;
    }

    const url = `${API_BASE_URL}/files/${file.gridFsId}/download`;
    window.open(url, "_blank", "noopener,noreferrer");
    finish({ status: "window-opened", url });
  }, []);

  const copyFile = useCallback(
    async (target) => {
      const finish = startSpan("copyFile", { target });
      if (!target) {
        finish({ status: "skip-no-target" });
        return null;
      }

      const file =
        typeof target === "string"
          ? filesRef.current.find((item) => item.id === target) ||
          trashRef.current.find((item) => item.id === target) ||
          sharedFiles.find((item) => item.id === target)
          : target;

      if (!file?.id) {
        finish({ status: "skip-missing-file" });
        return null;
      }

      const timestamp = new Date().toISOString();
      const defaultName = `Copy of ${file.name || "Untitled"}`;

      if (USE_MOCK_DATA) {
        const mockCopy = {
          ...file,
          id: `mock-copy-${Date.now()}-${file.id}`,
          name: defaultName,
          isStarred: false,
          isDeleted: false,
          uploadedAt: timestamp,
          lastAccessedAt: timestamp,
        };

        setFiles((prev) => [mockCopy, ...prev]);
        finish({ status: "mock", id: mockCopy.id });
        return mockCopy;
      }

      try {
        const { data } = await apiClient.post(`/files/${file.id}/copy`, {
          newName: defaultName,
        });

        const normalized = normalizeFile(data.file);
        if (normalized) {
          setFiles((prev) => [normalized, ...prev]);
          finish({ status: "ok", id: normalized.id });
          return normalized;
        }

        await fetchCollections();
        finish({ status: "fallback-refresh" });
        return null;
      } catch (err) {
        setError("Unable to copy file.");
        logEvent("copyFile:error", {
          id: file.id,
          message: err.message,
          response: err.response,
        });
        finish({ status: "error", error: err.message });
        throw err;
      }
    },
    [fetchCollections, sharedFiles]
  );

  const batchTrash = useCallback(async (fileIds = [], folderIds = [], isDeleted) => {
    const finish = startSpan("batchTrash", { fileIds, folderIds, isDeleted });
    if ((!fileIds || fileIds.length === 0) && (!folderIds || folderIds.length === 0)) {
      finish({ status: "skip-empty" });
      return;
    }
    try {
      await apiClient.post("/batch/trash", { fileIds, folderIds, isDeleted });
      // Optimistic update or refresh
      // For simplicity, we'll refresh to ensure consistency, especially for folders
      await fetchCollections();
      finish({ status: "ok" });
    } catch (err) {
      setError("Unable to update items.");
      logEvent("batchTrash:error", { message: err.message });
      finish({ status: "error", error: err.message });
      throw err;
    }
  }, [fetchCollections]);

  const batchDelete = useCallback(async (fileIds = [], folderIds = []) => {
    const finish = startSpan("batchDelete", { fileIds, folderIds });
    if ((!fileIds || fileIds.length === 0) && (!folderIds || folderIds.length === 0)) {
      finish({ status: "skip-empty" });
      return;
    }
    try {
      await apiClient.post("/batch/delete", { fileIds, folderIds });
      await fetchCollections();
      finish({ status: "ok" });
    } catch (err) {
      setError("Unable to delete items permanently.");
      logEvent("batchDelete:error", { message: err.message });
      finish({ status: "error", error: err.message });
      throw err;
    }
  }, [fetchCollections]);

  const batchMove = useCallback(async (fileIds = [], folderIds = [], destinationFolderId) => {
    const finish = startSpan("batchMove", { fileIds, folderIds, destinationFolderId });
    if ((!fileIds || fileIds.length === 0) && (!folderIds || folderIds.length === 0)) {
      finish({ status: "skip-empty" });
      return;
    }
    try {
      await apiClient.post("/batch/move", { fileIds, folderIds, destinationFolderId });
      await fetchCollections();
      finish({ status: "ok" });
    } catch (err) {
      setError("Unable to move items.");
      logEvent("batchMove:error", { message: err.message });
      finish({ status: "error", error: err.message });
      throw err;
    }
  }, [fetchCollections]);

  const batchDownload = useCallback(async (fileIds = [], folderIds = []) => {
    const finish = startSpan("batchDownload", { fileIds, folderIds });
    try {
      if (USE_MOCK_DATA) {
        window.alert("Batch download unavailable in mock mode.");
        finish({ status: "mock" });
        return;
      }
      if ((!fileIds || fileIds.length === 0) && (!folderIds || folderIds.length === 0)) {
        setError("Select files or folders to download.");
        finish({ status: "skip-empty" });
        return;
      }

      const res = await fetch(`${API_BASE_URL}/batch/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/zip, application/json;q=0.9, */*;q=0.8",
        },
        credentials: "include",
        body: JSON.stringify({ fileIds, folderIds }),
      });

      const ct = res.headers.get("Content-Type") || "";
      if (!res.ok || !ct.includes("application/zip")) {
        let message = `Download failed (${res.status}).`;
        try {
          const maybeJson = await res.clone().json();
          if (maybeJson?.message) message = maybeJson.message;
        } catch {
          try {
            const txt = await res.clone().text();
            if (txt) message = txt.slice(0, 200);
          } catch {}
        }
        setError(message);
        finish({ status: "error", error: message, httpStatus: res.status });
        return;
      }

      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        setError("Empty archive received.");
        finish({ status: "error", error: "empty-blob" });
        return;
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "batch-download.zip");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      finish({ status: "ok" });
    } catch (err) {
      setError("Unable to download items.");
      logEvent("batchDownload:error", { message: err.message });
      finish({ status: "error", error: err.message });
    }
  }, []);

  const batchShare = useCallback(async (fileIds, folderIds, userId, permission) => {
    const finish = startSpan("batchShare", { fileIds, folderIds, userId, permission });
    if ((!fileIds || fileIds.length === 0) && (!folderIds || folderIds.length === 0)) {
      finish({ status: "skip-empty" });
      return false;
    }
    try {
      await apiClient.post("/batch/share", {
        fileIds,
        folderIds,
        userId,
        permission
      });
      finish({ status: "ok" });
      return true;
    } catch (err) {
      console.error("Batch share error:", err);
      setError("Failed to share items");
      logEvent("batchShare:error", { message: err.message });
      finish({ status: "error", error: err.message });
      return false;
    }
  }, []);

  const batchCopy = useCallback(async (fileIds = [], folderIds = []) => {
    const finish = startSpan("batchCopy", { fileIds, folderIds });
    if ((!fileIds || fileIds.length === 0) && (!folderIds || folderIds.length === 0)) {
      finish({ status: "skip-empty" });
      return;
    }
    try {
      await apiClient.post("/batch/copy", { fileIds, folderIds });
      await fetchCollections();
      finish({ status: "ok" });
    } catch (err) {
      setError("Unable to copy items.");
      logEvent("batchCopy:error", { message: err.message });
      finish({ status: "error", error: err.message });
      throw err;
    }
  }, [fetchCollections]);

  const batchStar = useCallback(async (fileIds = [], folderIds = [], isStarred) => {
    const finish = startSpan("batchStar", { fileIds, folderIds, isStarred });
    if ((!fileIds || fileIds.length === 0) && (!folderIds || folderIds.length === 0)) {
      finish({ status: "skip-empty" });
      return;
    }
    try {
      await apiClient.post("/batch/star", { fileIds, folderIds, isStarred });
      await fetchCollections();
      finish({ status: "ok" });
    } catch (err) {
      setError("Unable to update star status.");
      logEvent("batchStar:error", { message: err.message });
      finish({ status: "error", error: err.message });
      throw err;
    }
  }, [fetchCollections]);

  const uploadFiles = useCallback(
    async (selectedFiles, options = {}) => {
      if (!selectedFiles?.length) return [];
      const finish = startSpan("uploadFiles", {
        count: selectedFiles.length,
        options,
      });
      setUploading(true);

      const uploaded = [];

      try {
        for (const file of selectedFiles) {
          const fileSpan = startSpan("uploadFiles:item", {
            name: file.name,
            size: file.size,
            type: file.type,
          });
          if (USE_MOCK_DATA) {
            const mockFile = {
              id: `mock-upload-${Date.now()}-${file.name}`,
              name: file.name,
              owner: "me",
              location: options.location || "My Drive",
              uploadedAt: new Date().toISOString(),
              lastAccessedAt: new Date().toISOString(),
              isStarred: false,
              isDeleted: false,
              icon: resolveIcon(file.name, file.type),
            };

            uploaded.push(mockFile);
            setFiles((prev) => [mockFile, ...prev]);
            fileSpan({ status: "mock" });
            continue;
          }

          const formData = new FormData();
          formData.append("file", file);

          const { data: uploadData } = await apiClient.post(
            "/files/upload",
            formData
          );

          const metadataPayload = {
            gridFsId: uploadData.fileId,
            originalName: file.name,
            filename: uploadData.filename || file.name,
            size: uploadData.length ?? file.size,
            type: uploadData.contentType || file.type,
            folderId: options.folderId || null,
            location: options.location || "My Drive",
            path: options.path || [],
            description: options.description || "",
          };

          const { data: metadata } = await apiClient.post(
            "/files/saveMetadata",
            metadataPayload
          );

          const normalized = normalizeFile(metadata.file);
          if (normalized) {
            uploaded.push(normalized);
            setFiles((prev) => [normalized, ...prev]);
            fileSpan({ status: "ok", id: normalized.id });
          } else {
            fileSpan({ status: "fallback-refresh" });
            await fetchCollections();
          }
        }
      } catch (err) {
        console.error("Upload failed:", err);
        setError("Upload failed.");
        logEvent("uploadFiles:error", {
          message: err.message,
          response: err.response,
        });
        throw err;
      } finally {
        setUploading(false);
        finish({ uploaded: uploaded.length });
      }

      return uploaded;
    },
    [fetchCollections]
  );

  const runFileSearch = useCallback(
    async (params = {}) => {
      const finish = startSpan("runFileSearch", params);
      // Basic guard: if everything is empty, clear search
      const {
        q,
        type,
        owner,
        location,
        starred,
        inBin,
        dateModified,
        afterDate,
        beforeDate,
        includesWords,
        itemName,
      } = params;

      const hasSomething =
        (q && q.trim()) ||
        (itemName && itemName.trim()) ||
        (includesWords && includesWords.trim()) ||
        (type && type !== "any") ||
        (owner && owner !== "anyone") ||
        (location && location !== "anywhere") ||
        starred === true ||
        inBin === true ||
        (dateModified && dateModified !== "anytime");

      if (!hasSomething) {
        setSearchResults(null);
        finish({ status: "reset" });
        return;
      }

      setSearching(true);

      try {
        const queryParams = {
          // simple text query
          q: q || "",
          type: type || "any",
          owner: owner || "anyone",
          location: location || "anywhere",
          dateModified: dateModified || "anytime",
          includesWords: includesWords || "",
          itemName: itemName || "",
        };

        if (starred === true) queryParams.starred = "true";
        if (inBin === true) queryParams.inBin = "true";
        if (afterDate) queryParams.afterDate = afterDate;
        if (beforeDate) queryParams.beforeDate = beforeDate;

        const { data } = await apiClient.get("/files/search", {
          params: queryParams,
        });

        const normalized = (data || []).map(normalizeFile).filter(Boolean);
        setSearchResults(normalized);
        finish({ status: "ok", results: normalized.length });
        setError(null);
      } catch (err) {
        console.error("runFileSearch error:", err);
        setError(
          err.response?.data?.message ||
          err.message ||
          "Unable to search files right now."
        );
        logEvent("runFileSearch:error", {
          message: err.message,
          response: err.response,
        });
        finish({ status: "error", error: err.message });
      } finally {
        setSearching(false);
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    logEvent("search:cleared");
  }, []);


  const refreshFiles = useCallback(() => {
    logEvent("refreshFiles:requested");
    if (!currentUserId && !currentUserEmail) {
      pendingRefresh.current = true;
      logEvent("refreshFiles:queued-no-user");
      return;
    }
    fetchCollections();
  }, [currentUserEmail, currentUserId, fetchCollections]);

  const matchesCurrentUser = useCallback(
    (file) => {
      if (!file) return false; //if file is unidentified

      const ownerId = file.ownerId ? file.ownerId.toString() : null; //extract ownerId from file, if it exists -> convert to string, if not, set to null
      if (ownerId && currentUserId && ownerId === currentUserId) { //if file has an ownerId, user has id, they match = file belongs to curr user
        return true;
      }

      const ownerEmail =
        typeof file.ownerEmail === "string"
          ? file.ownerEmail.toLowerCase()
          : null;
      if (ownerEmail && currentUserEmail && ownerEmail === currentUserEmail) {
        return true;
      }

      if (!currentUserId && !currentUserEmail) {
        return (file.owner || "").toLowerCase() === "me";
      }

      return false;
    },
    [currentUserEmail, currentUserId]
  );

  const matchTypeFilter = useCallback((file, typeLabel) => {
    if (!typeLabel) return true;

    const filename = file.name?.toLowerCase() || "";
    const mime = file.type?.toLowerCase() || "";

    const hasExtension = (exts = []) =>
      exts.some((ext) => filename.endsWith(ext));

    switch (typeLabel) {
      case "PDFs":
        return mime.includes("pdf") || filename.endsWith(".pdf");

      case "Images":
        return (
          mime.startsWith("image/") ||
          hasExtension([".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp"])
        );

      case "Videos":
        return (
          mime.startsWith("video/") ||
          hasExtension([".mp4", ".mov", ".avi", ".mkv", ".webm"])
        );

      case "Audio":
        return (
          mime.startsWith("audio/") ||
          hasExtension([".mp3", ".wav", ".aac", ".flac", ".ogg"])
        );

      case "Documents":
        return (
          hasExtension([".doc", ".docx", ".txt", ".rtf"]) ||
          mime.includes("wordprocessing")
        );

      case "Spreadsheets":
        return (
          hasExtension([".xls", ".xlsx", ".csv"]) || mime.includes("spreadsheet")
        );

      case "Presentations":
        return (
          hasExtension([".ppt", ".pptx", ".key"]) ||
          mime.includes("presentation")
        );

      case "Folders":
        return (file.type || "").toLowerCase() === "folder";

      default:
        return true;
    }
  }, []);

  const canRename = useCallback(
    (file) => {
      if (!file) return false;
      // 1. Owner can always rename
      if (matchesCurrentUser(file)) return true;

      // 2. If shared, check for "write" permission
      if (file.sharedWith && Array.isArray(file.sharedWith)) {
        const me = file.sharedWith.find((entry) => {
          const entryId = entry.userId?.toString() || entry.user?.toString();
          const entryEmail = entry.email?.toLowerCase() || entry.user?.email?.toLowerCase();

          if (entryId && currentUserId && entryId === currentUserId) return true;
          if (entryEmail && currentUserEmail && entryEmail === currentUserEmail) return true;
          return false;
        });

        if (me && me.permission === "write") return true;
      }

      return false;
    },
    [matchesCurrentUser, currentUserId, currentUserEmail]
  );

  const [filterMode, setFilterMode] = useState("files");
  const [typeFilter, setTypeFilter] = useState(null);
  const [peopleFilter, setPeopleFilter] = useState(null);
  const [modifiedFilter, setModifiedFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);
  const pendingRefresh = useRef(false);

  const filterByModified = useCallback(
    (list) => {
      if (!modifiedFilter) return list;

      const today = new Date();

      return list.filter((file) => {
        const date = new Date(
          file.lastAccessedAt || file.uploadedAt || file.dateUploaded
        );
        if (!date) return false;

        switch (modifiedFilter) {
          case "today":
            return date.toDateString() === today.toDateString();

          case "week":
            return today - date <= 7 * 24 * 60 * 60 * 1000;

          case "month":
            return (
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear()
            );

          default:
            return true;
        }
      });
    },
    [modifiedFilter]
  );

  const matchesSource = useCallback((file, source) => {
    switch (source) {
      case "anywhere":
        return !file.isDeleted;

      case "myDrive":
        return (
          !file.isDeleted &&
          ((file.location || "").toLowerCase() === "my drive" ||
            !file.location)
        );

      case "shared":
        return (
          !file.isDeleted &&
          ((file.location || "").toLowerCase().includes("shared") ||
            (file.sharedWith?.length ?? 0) > 0)
        );

      case "starred":
        return file.isStarred && !file.isDeleted;

      case "trash":
        return !!file.isDeleted;

      default:
        return !file.isDeleted;
    }
  }, []);

  const combinedFiles = useMemo(() => {
    const map = new Map();
    files.forEach((file) => map.set(file.id, file));
    sharedFiles.forEach((file) => {
      if (!map.has(file.id)) {
        map.set(file.id, file);
      }
    });
    return Array.from(map.values());
  }, [files, sharedFiles]);

  const pickSourceList = useCallback(
    (sourceValue) => {
      switch (sourceValue) {
        case "shared":
          return sharedFiles;
        case "starred":
          return combinedFiles;
        case "anywhere":
          return combinedFiles;
        default:
          return files;
      }
    },
    [files, sharedFiles, combinedFiles]
  );

  const filteredFiles = useMemo(() => {
    const activeSource = sourceFilter || "myDrive";
    let list = [...pickSourceList(activeSource)];

    list = list.filter((file) => matchesSource(file, activeSource));

    if (filterMode === "files") {
      list = list.filter(
        (file) => (file.type || "").toLowerCase() !== "folder"
      );
    } else if (filterMode === "folders") {
      list = list.filter(
        (file) => (file.type || "").toLowerCase() === "folder"
      );
    }

    if (typeFilter) {
      list = list.filter((file) => matchTypeFilter(file, typeFilter));
    }

    if (peopleFilter === "owned") {
      list = list.filter((file) => matchesCurrentUser(file));
    } else if (peopleFilter === "sharedWithMe") {
      list = list.filter((file) =>
        (file.location || "").toLowerCase().includes("shared")
      );
    } else if (peopleFilter === "sharedByMe") {
      list = list.filter(
        (file) =>
          matchesCurrentUser(file) && (file.sharedWith?.length ?? 0) > 0
      );
    } else if (
      peopleFilter &&
      typeof peopleFilter === "object" &&
      peopleFilter.kind === "person"
    ) {
      list = list.filter((file) => {
        const ownerId = file.ownerId ? file.ownerId.toString() : null;
        const ownerEmail =
          typeof file.ownerEmail === "string"
            ? file.ownerEmail.toLowerCase()
            : null;
        const ownerName =
          typeof file.owner === "string"
            ? file.owner.trim().toLowerCase()
            : null;

        if (peopleFilter.ownerId && ownerId) {
          if (peopleFilter.ownerId === ownerId) return true;
        }
        if (peopleFilter.ownerEmail && ownerEmail) {
          if (peopleFilter.ownerEmail === ownerEmail) return true;
        }
        if (peopleFilter.ownerName && ownerName) {
          if (peopleFilter.ownerName === ownerName) return true;
        }
        return false;
      });
    }

    list = filterByModified(list);
    return list;
  }, [
    pickSourceList,
    matchesSource,
    sourceFilter,
    filterMode,
    typeFilter,
    peopleFilter,
    matchTypeFilter,
    filterByModified,
    matchesCurrentUser,
  ]);



  const filterBySource = useCallback(
    (list, overrideSource) => {
      const active = overrideSource ?? sourceFilter ?? "anywhere";
      const baseList = list ?? pickSourceList(active);
      return baseList.filter((file) => matchesSource(file, active));
    },
    [sourceFilter, pickSourceList, matchesSource]
  );

  // Selection handlers (FC-4 .. FC-8) placed outside filteredFiles useMemo
  const toggleFileSelection = useCallback((id) => {
    if (!id) return;
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleFolderSelection = useCallback((id) => {
    if (!id) return;
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setSelectedFolders(new Set());
  }, []);

  useEffect(() => {
    clearSelection();
  }, [sourceFilter, clearSelection]);

  const selectAll = useCallback((items = []) => {
    if (!Array.isArray(items) || items.length === 0) {
      clearSelection();
      return;
    }
    const fileIds = [];
    const folderIds = [];
    items.forEach(item => {
      if (!item || !item.id) return;
      const itemIsFolder = (item.type || "").toLowerCase() === "folder";
      if (itemIsFolder) folderIds.push(item.id); else fileIds.push(item.id);
    });
    setSelectedFiles(new Set(fileIds));
    setSelectedFolders(new Set(folderIds));
  }, [clearSelection]);

  const isBatchMode = selectedFiles.size + selectedFolders.size > 0;
  const selectedFilesSafe = useMemo(() => new Set(selectedFiles), [selectedFiles]);
  const selectedFoldersSafe = useMemo(() => new Set(selectedFolders), [selectedFolders]);

  return (
    <FileContext.Provider
      value={{
        files,
        trashFiles,
        sharedFiles,
        loading,
        error,
        uploading,
        //searchResults,
        //searching,
        toggleStar,
        moveToTrash,
        restoreFromBin,
        deleteForever,
        renameFile,
        downloadFile,
        copyFile,
        uploadFiles,
        runFileSearch,
        clearSearch,
        refreshFiles,
        filterMode,
        setFilterMode,
        typeFilter,
        setTypeFilter,
        peopleFilter,
        setPeopleFilter,
        modifiedFilter,
        setModifiedFilter,
        sourceFilter,
        setSourceFilter,
        filteredFiles,
        filterBySource,
        canRename,

        selectedFiles: selectedFilesSafe,
        selectedFolders: selectedFoldersSafe,
        toggleFileSelection,
        toggleFolderSelection,
        clearSelection,
        selectAll,
        isBatchMode,
        batchTrash,
        batchDelete,
        batchMove,
        batchStar,
        batchDownload,
        batchShare,
        batchCopy,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => useContext(FileContext);
