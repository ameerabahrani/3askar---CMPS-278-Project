import { createContext, useContext, useState, useEffect } from "react";

export const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load mock files ONCE
    useEffect(() => {
        const mockFiles = [
        {
            id: 1,
            name: "AI Ethics Assignment.pdf",
            owner: "professor@aub.edu.lb",
            location: "My Drive",
            dateUploaded: "2025-11-05T00:00:00Z",
            lastAccessedAt: "2025-11-10T00:00:00Z",
            isStarred: true,
            isDeleted: false,
            icon: "https://www.gstatic.com/images/icons/material/system/2x/picture_as_pdf_black_24dp.png",
        },
        {
            id: 2,
            name: "Group Project Slides.pptx",
            owner: "teamleader@gmail.com",
            location: "Shared with me",
            dateUploaded: "2023-01-24T00:00:00Z",
            lastAccessedAt: "2025-11-08T00:00:00Z",
            isStarred: false,
            isDeleted: false,
            icon: "https://www.gstatic.com/images/icons/material/system/2x/slideshow_black_24dp.png",
        },
        {
            id: 3,
            name: "Research Data Sheet.xlsx",
            owner: "labassistant@aub.edu.lb",
            location: "My Drive",
            dateUploaded: "2025-10-05T00:00:00Z",
            lastAccessedAt: "2025-11-11T00:00:00Z",
            isStarred: true,
            isDeleted: false,
            icon: "https://www.gstatic.com/images/icons/material/system/2x/grid_on_black_24dp.png",
        },
        {
            id: 4,
            name: "Old Notes.txt",
            owner: "me",
            location: "My Drive",
            dateUploaded: "2022-05-15T00:00:00Z",
            lastAccessedAt: "2022-05-15T00:00:00Z",
            isStarred: false,
            isDeleted: true,
            icon: "https://www.gstatic.com/images/icons/material/system/2x/description_black_24dp.png",
        }
    ];

    setFiles(mockFiles);
    setLoading(false);
  }, []);

  // ⭐ ACTION HELPERS YOU CAN CALL FROM ANY PAGE
  const toggleStar = (id) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? { ...file, isStarred: !file.isStarred }
          : file
      )
    );
  };

  const softDelete = (id) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, isDeleted: true } : file
      )
    );
  };

  const restore = (id) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id ? { ...file, isDeleted: false } : file
      )
    );
  };

  const deleteForever = (id) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const updateLastAccessed = (id) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === id
          ? { ...file, lastAccessedAt: new Date().toISOString() }
          : file
      )
    );
  };

  return (
    <FileContext.Provider
      value={{
        files,
        setFiles,
        loading,

        // Actions available to MyDrive, Bin, Starred, Homepage
        toggleStar,
        softDelete,
        restore,
        deleteForever,
        updateLastAccessed,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFiles = () => useContext(FileContext);
