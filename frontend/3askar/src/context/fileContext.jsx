import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import apiClient, { API_BASE_URL } from "../services/apiClient";

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

const USE_MOCK_DATA = true; //flip to false 

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
    sharedWith: Array.isArray(file.sharedWith) ? file.sharedWith : [],
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

  const filesRef = useRef([]);
  const trashRef = useRef([]);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    trashRef.current = trashFiles;
  }, [trashFiles]);

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

  const toggleStar = useCallback(async (id) => {
    const existing = filesRef.current.find((file) => file.id === id);
    if (!existing) return;
    const nextState = !existing.isStarred;

    setFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, isStarred: nextState } : file
      )
    );

    if (USE_MOCK_DATA) return;

    try {
      await apiClient.patch(`/files/${id}/star`, { isStarred: nextState });
    } catch (err) {
      setFiles((prev) =>
        prev.map((file) =>
          file.id === id ? { ...file, isStarred: existing.isStarred } : file
        )
      );
      setError(
        err.response?.data?.message || "Unable to update star. Try again."
      );
    }
  }, []);

  const moveToTrash = useCallback(async (id) => {
    const existing = filesRef.current.find((file) => file.id === id);
    if (!existing) return;

    setFiles((prev) => prev.filter((file) => file.id !== id));
    setTrashFiles((prev) => [{ ...existing, isDeleted: true }, ...prev]);

    if (USE_MOCK_DATA) return;

    try {
      await apiClient.patch(`/files/${id}/trash`, { isDeleted: true });
    } catch (err) {
      setFiles((prev) => [existing, ...prev]);
      setTrashFiles((prev) => prev.filter((file) => file.id !== id));
      setError(err.response?.data?.message || "Unable to move file to bin.");
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
    } catch (err) {
      setTrashFiles((prev) => [existing, ...prev]);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      setError(err.response?.data?.message || "Unable to restore file.");
    }
  }, []);

  const deleteForever = useCallback(async (id) => {
    const existing = trashRef.current.find((file) => file.id === id);
    if (!existing) return;

    setTrashFiles((prev) => prev.filter((file) => file.id !== id));

    if (USE_MOCK_DATA) return;

    try {
      await apiClient.delete(`/files/${id}/permanent`);
    } catch (err) {
      setTrashFiles((prev) => [existing, ...prev]);
      setError(
        err.response?.data?.message || "Unable to delete file permanently."
      );
    }
  }, []);

  const renameFile = useCallback(async (id, newName) => {
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
      collection.map((file) =>
        file.id === id ? { ...file, name } : file
      );

    setFiles((prev) => applyRename(prev, trimmed));
    setSharedFiles((prev) => applyRename(prev, trimmed));
    setTrashFiles((prev) => applyRename(prev, trimmed));

    if (USE_MOCK_DATA) return;

    try {
      await apiClient.patch(`/files/${id}/rename`, { newName: trimmed });
    } catch (err) {
      setFiles((prev) => applyRename(prev, existing.name));
      setSharedFiles((prev) => applyRename(prev, existing.name));
      setTrashFiles((prev) => applyRename(prev, existing.name));
      setError(
        err.response?.data?.message || "Unable to rename file at the moment."
      );
    }
  }, [sharedFiles]);

  const downloadFile = useCallback(
    (file) => {
      if (!file?.id) return;

      if (USE_MOCK_DATA) {
        window.alert("Downloads are unavailable in mock mode.");
        return;
      }

      const url = `${API_BASE_URL}/files/${file.id}/download`;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    []
  );

  // copyFile: figures out which file to duplicate, builds a copy name, either mocks the copy or sends the real copy request to backend based on the boolean, inserts the copy into the local file list
  const copyFile = useCallback(async (target) => {
      if (!target) return null;

      const file = 
        typeof target === "string" // string => treat it as an id and look for the file in regular files, trash files, shared files
          ? filesRef.current.find((item) => item.id === target) ||
            trashRef.current.find((item) => item.id === target) ||
            sharedFiles.find((item) => item.id === target)
          : target; // !string => treat it as a file object 

      if (!file?.id) return null;  //no file with id is found 

      const timestamp = new Date().toISOString();
      const defaultName = `Copy of ${file.name || "Untitled"}`;

      if (USE_MOCK_DATA) { // when mockdata = false, doesnt apply, backend request happens
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
        const normalized = normalizeFile(data.file); //turn it into the format frontend expects
        if (normalized) { 
          setFiles((prev) => [normalized, ...prev]); //insert file at the top of the list
          return normalized;
        }
        await fetchCollections(); //if normalization failed reload everything
        return null;
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to copy file at the moment."
        );
        throw err;
      }
    },
    [fetchCollections, sharedFiles]
  );

  const uploadFiles = useCallback(async (selectedFiles, options = {}) => {
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
          type: uploadData.contentType || file.type || "application/octet-stream",
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
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please retry.");
      throw err;
    } finally {
      setUploading(false);
    }

    return uploaded;
  }, [fetchCollections]);

  const refreshFiles = useCallback(() => {
    fetchCollections();
  }, [fetchCollections]);

  return (
    <FileContext.Provider
      value={{
        files,
        trashFiles,
        sharedFiles,
        loading,
        uploading,
        error,
        refreshFiles,
        toggleStar,
        moveToTrash,
        restoreFromBin,
        deleteForever,
        renameFile,
        copyFile,
        downloadFile,
        uploadFiles,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => useContext(FileContext);
