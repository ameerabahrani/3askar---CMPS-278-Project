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
  const trashRef = useRef([]);
  const sharedRef = useRef([]);

  const { user } = useAuth() || {};
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
    setLoading(true);

    if (USE_MOCK_DATA) {
      const normalized = MOCK_FILES.map((file) => ({
        ...file,
        icon: file.icon || resolveIcon(file.name),
      }));

      setFiles(normalized.filter((file) => !file.isDeleted));
      setTrashFiles(normalized.filter((file) => file.isDeleted));
      setSharedFiles(
        normalized.filter(
          (file) =>
            file.location?.toLowerCase() === "shared with me" ||
            (file.sharedWith?.length ?? 0) > 0
        )
      );

      setError(null);
      setLoading(false);
      return;
    }

    try {
      const [owned, trash, shared] = await Promise.all([
        apiClient.get("/files"),
        apiClient.get("/files/list/trash"),
        apiClient.get("/files/shared"),
      ]);

      setFiles((owned.data || []).map(normalizeFile).filter(Boolean));
      setTrashFiles((trash.data || []).map(normalizeFile).filter(Boolean));
      setSharedFiles((shared.data || []).map(normalizeFile).filter(Boolean));
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load files at the moment."
      );
    } finally {
      setLoading(false);
    }
  }, []);

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

      const nextState = !existing.isStarred;
      const applyStarState = (collection, value) =>
        collection.map((file) =>
          file.id === id ? { ...file, isStarred: value } : file
        );

      setFiles((prev) => applyStarState(prev, nextState));
      setSharedFiles((prev) => applyStarState(prev, nextState));

      const ownerId =
        existing.ownerId?.toString() ??
        (existing.owner ? existing.owner.toString() : null);
      if (!ownerId || ownerId !== currentUserId) return;

      if (USE_MOCK_DATA) return;

      try {
        await apiClient.patch(`/files/${id}/star`, { isStarred: nextState });
      } catch (err) {
        setFiles((prev) => applyStarState(prev, existing.isStarred));
        setSharedFiles((prev) => applyStarState(prev, existing.isStarred));

        setError("Unable to update star. Try again.");
      }
    },
    [currentUserId]
  );

  const moveToTrash = useCallback(async (id) => {
    const existing = filesRef.current.find((file) => file.id === id);
    if (!existing) return;

    setFiles((prev) => prev.filter((file) => file.id !== id));
    setTrashFiles((prev) => [{ ...existing, isDeleted: true }, ...prev]);

    if (USE_MOCK_DATA) return;

    try {
      await apiClient.patch(`/files/${id}/trash`, { isDeleted: true });
    } catch {
      setFiles((prev) => [existing, ...prev]);
      setTrashFiles((prev) => prev.filter((file) => file.id !== id));
      setError("Unable to move file to bin.");
    }
  }, []);

  const restoreFromBin = useCallback(async (id) => {
    const existing = trashRef.current.find((file) => file.id === id);
    if (!existing) return;

    setTrashFiles((prev) => prev.filter((file) => file.id !== id));
    setFiles((prev) => [{ ...existing, isDeleted: false }, ...prev]);

    if (USE_MOCK_DATA) return;

    try {
      await apiClient.patch(`/files/${id}/trash`, { isDeleted: false });
    } catch {
      setTrashFiles((prev) => [existing, ...prev]);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      setError("Unable to restore file.");
    }
  }, []);

  const deleteForever = useCallback(async (id) => {
    const existing = trashRef.current.find((file) => file.id === id);
    if (!existing) return;

    setTrashFiles((prev) => prev.filter((file) => file.id !== id));

    if (USE_MOCK_DATA) return;

    try {
      await apiClient.delete(`/files/${id}/permanent`);
    } catch {
      setTrashFiles((prev) => [existing, ...prev]);
      setError("Unable to delete file permanently.");
    }
  }, []);

  const renameFile = useCallback(
    async (id, newName) => {
      const trimmed = newName?.trim();
      if (!trimmed) return;

      const allFiles = [
        ...filesRef.current,
        ...trashRef.current,
        ...sharedFiles,
      ];
      const existing = allFiles.find((file) => file.id === id);
      if (!existing) return;

      const applyRename = (collection, name) =>
        collection.map((file) => (file.id === id ? { ...file, name } : file));

      setFiles((prev) => applyRename(prev, trimmed));
      setSharedFiles((prev) => applyRename(prev, trimmed));
      setTrashFiles((prev) => applyRename(prev, trimmed));

      if (USE_MOCK_DATA) return;

      try {
        await apiClient.patch(`/files/${id}/rename`, { newName });
      } catch {
        setFiles((prev) => applyRename(prev, existing.name));
        setSharedFiles((prev) => applyRename(prev, existing.name));
        setTrashFiles((prev) => applyRename(prev, existing.name));
        setError("Unable to rename file.");
      }
    },
    [sharedFiles]
  );

  const downloadFile = useCallback((file) => {
    if (!file?.gridFsId) return;

    if (USE_MOCK_DATA) {
      window.alert("Downloads are unavailable in mock mode.");
      return;
    }

    const url = `${API_BASE_URL}/files/${file.gridFsId}/download`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const copyFile = useCallback(
    async (target) => {
      if (!target) return null;

      const file =
        typeof target === "string"
          ? filesRef.current.find((item) => item.id === target) ||
            trashRef.current.find((item) => item.id === target) ||
            sharedFiles.find((item) => item.id === target)
          : target;

      if (!file?.id) return null;

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
        return mockCopy;
      }

      try {
        const { data } = await apiClient.post(`/files/${file.id}/copy`, {
          newName: defaultName,
        });

        const normalized = normalizeFile(data.file);
        if (normalized) {
          setFiles((prev) => [normalized, ...prev]);
          return normalized;
        }

        await fetchCollections();
        return null;
      } catch (err) {
        setError("Unable to copy file.");
        throw err;
      }
    },
    [fetchCollections, sharedFiles]
  );

  const uploadFiles = useCallback(
    async (selectedFiles, options = {}) => {
      if (!selectedFiles?.length) return [];
      setUploading(true);

      const uploaded = [];

      try {
        for (const file of selectedFiles) {
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
          } else {
            await fetchCollections();
          }
        }
      } catch {
        setError("Upload failed.");
        throw err;
      } finally {
        setUploading(false);
      }

      return uploaded;
    },
    [fetchCollections]
  );

    const runFileSearch = useCallback(
    async (params = {}) => {
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
        setError(null);
      } catch (err) {
        console.error("runFileSearch error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to search files right now."
        );
      } finally {
        setSearching(false);
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setSearchResults(null);
  }, []);


  const refreshFiles = useCallback(() => {
    fetchCollections();
  }, [fetchCollections]);

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

  const [filterMode, setFilterMode] = useState("files");
  const [typeFilter, setTypeFilter] = useState(null);
  const [peopleFilter, setPeopleFilter] = useState(null);
  const [modifiedFilter, setModifiedFilter] = useState(null);
  const [sourceFilter, setSourceFilter] = useState(null);

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
          matchesCurrentUser(file) &&
          (file.sharedWith?.length ?? 0) > 0
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
    (list, fallback = "anywhere") => {
      const active = sourceFilter || fallback;
      const baseList = list ?? pickSourceList(active);
      return baseList.filter((file) => matchesSource(file, active));
    },
    [sourceFilter, pickSourceList, matchesSource]
  );

  return (
    <FileContext.Provider
      value={{
        files,
        trashFiles,
        sharedFiles,
        filteredFiles,
        loading,
        uploading,
        error,
        searching,
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
        filterBySource,
        toggleStar,
        moveToTrash,
        restoreFromBin,
        deleteForever,
        renameFile,
        copyFile,
        downloadFile,
        uploadFiles,
        refreshFiles,
        runFileSearch,
        clearSearch,

      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => useContext(FileContext);
