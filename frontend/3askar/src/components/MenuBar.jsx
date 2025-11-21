// ...existing code...
import React from "react";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import MovieIcon from "@mui/icons-material/Movie";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import DescriptionIcon from "@mui/icons-material/Description";
import TableChartIcon from "@mui/icons-material/TableChart";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import { useFiles } from "../context/fileContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const TYPE_ICON_COMPONENTS = {
  PDFs: PictureAsPdfIcon,
  Images: ImageIcon,
  Videos: MovieIcon,
  Audio: AudiotrackIcon,
  Documents: DescriptionIcon,
  Spreadsheets: TableChartIcon,
  Presentations: SlideshowIcon,
  Folders: FolderOutlinedIcon,
};

const renderTypeIcon = (label) => {
  const IconComponent = TYPE_ICON_COMPONENTS[label] || InsertDriveFileOutlinedIcon;
  return (
    <IconComponent sx={{ fontSize: 18, mr: 1, color: "#5f6368" }} />
  );
};

function MenuBar({ visibleFiles } = {}) {
  const {
    filteredFiles,
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
  } = useFiles();
  const { user } = useAuth() || {};
  const currentUserId = user?._id ? user._id.toString() : null;
  const currentUserEmail =
    typeof user?.email === "string" ? user.email.toLowerCase() : null;
  const currentUserName = React.useMemo(() => {
    const value =
      typeof user?.name === "string"
        ? user.name
        : typeof user?.fullName === "string"
        ? user.fullName
        : null;
    return value ? value.trim().toLowerCase() : null;
  }, [user]);

  // Use the full list (remove arbitrary 20-slice) so menus include folders/people beyond first 20
  const scopedFiles = React.useMemo(() => {
    const list = Array.isArray(visibleFiles) ? visibleFiles : filteredFiles;
    return Array.isArray(list) ? list : [];
  }, [visibleFiles, filteredFiles]);

  const normalizeName = React.useCallback((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed.toLowerCase() : null;
  }, []);

  const extractIdString = React.useCallback((value) => {
    if (!value) return null;
    if (typeof value === "string") return value;

    if (typeof value === "object") {
      const id =
        value._id ?? value.id ?? (typeof value.toString === "function" ? value.toString() : null);

      if (!id || id === "[object Object]") {
        return null;
      }

      return id.toString();
    }

    return null;
  }, []);

  const isCurrentUserReference = React.useCallback(
    (id, email, name) => {
      if (id && currentUserId && id === currentUserId) return true;
      if (email && currentUserEmail && email === currentUserEmail) return true;

      const nameMatch = normalizeName(name);
      if (currentUserName && nameMatch) {
        return currentUserName === nameMatch;
      }

      if (!currentUserId && !currentUserEmail && nameMatch) {
        return nameMatch === "me";
      }

      return false;
    },
    [currentUserEmail, currentUserId, currentUserName, normalizeName]
  );

  const dynamicTypes = React.useMemo(() => {
    const set = new Set();

    scopedFiles.forEach((file) => {
      const name =
        (file.name || file.filename || file.originalName || "")
          .toLowerCase()
          .trim();

      if (name.endsWith(".pdf")) set.add("PDFs");
      if (/\.(png|jpg|jpeg|gif|bmp|webp)$/i.test(name)) set.add("Images");
      if (/\.(mp4|mov|mkv|avi|webm)$/i.test(name)) set.add("Videos");
      if (/\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) set.add("Audio");
      if (/\.(doc|docx|txt|rtf)$/i.test(name)) set.add("Documents");
      if (/\.(xls|xlsx|csv)$/i.test(name)) set.add("Spreadsheets");
      if (/\.(ppt|pptx|key)$/i.test(name)) set.add("Presentations");

      // Broaden folder detection to handle different backends
      const ft = (file.type || "").toString().toLowerCase();
      const isFolder =
        ft === "folder" || ft === "dir" || ft === "directory" || file.isFolder === true;
      if (isFolder) set.add("Folders");

      const mime = (file.type || "").toLowerCase();
      if (mime.includes("pdf")) set.add("PDFs");
      if (mime.startsWith("image/")) set.add("Images");
      if (mime.startsWith("video/")) set.add("Videos");
      if (mime.startsWith("audio/")) set.add("Audio");
      if (mime.includes("spreadsheet")) set.add("Spreadsheets");
      if (mime.includes("presentation")) set.add("Presentations");
    });

    return Array.from(set);
  }, [scopedFiles]);

  const peopleOptions = React.useMemo(() => {
    const map = new Map();

    const addEntry = ({
      key,
      label,
      ownerId,
      ownerEmail,
      ownerName,
    }) => {
      if (!key || map.has(key)) return;
      const fallbackLabel = label || ownerEmail || "Unknown user";
      map.set(key, {
        key,
        label: fallbackLabel,
        ownerId: ownerId || null,
        ownerEmail: ownerEmail || null,
        ownerName: ownerName || null,
      });
    };

    scopedFiles.forEach((file) => {
      if (!file) return;

      // Robust owner extraction: owner may be string, object, or id field
      const ownerId =
        extractIdString(file.ownerId) ||
        extractIdString(file.owner) ||
        extractIdString(file.owner?._id) ||
        null;

      const ownerEmail =
        (typeof file.ownerEmail === "string" && file.ownerEmail.toLowerCase()) ||
        (file.owner && typeof file.owner.email === "string" && file.owner.email.toLowerCase()) ||
        null;

      const ownerNameRaw =
        (typeof file.owner === "string" && file.owner.trim()) ||
        (file.owner && typeof file.owner.name === "string" && file.owner.name.trim()) ||
        (file.owner && typeof file.owner.fullName === "string" && file.owner.fullName.trim()) ||
        "";
      const ownerName = normalizeName(ownerNameRaw);

      if (!isCurrentUserReference(ownerId, ownerEmail, ownerNameRaw)) {
        const ownerKey =
          ownerId ||
          ownerEmail ||
          ownerName ||
          extractIdString(file.id) ||
          extractIdString(file._id) ||
          null;
        const ownerDisplay = ownerNameRaw || ownerEmail || "Unknown owner";

        addEntry({
          key: `owner:${ownerKey}`,
          label: `${ownerDisplay} • Shared by`,
          ownerId,
          ownerEmail,
          ownerName,
        });
      }

      const sharedList = Array.isArray(file.sharedWith)
        ? file.sharedWith
        : [];

      sharedList.forEach((entry, index) => {
        const participant = entry?.user || entry?.userDetails || entry;
        const participantId = extractIdString(participant);

        const participantEmailRaw =
          (typeof participant === "object" &&
            typeof participant.email === "string" &&
            participant.email) ||
          (typeof entry?.email === "string" ? entry.email : null);

        const participantEmail = participantEmailRaw
          ? participantEmailRaw.toLowerCase()
          : null;

        const participantNameRaw =
          (typeof participant === "object" &&
            typeof participant.name === "string" &&
            participant.name) ||
          (typeof participant === "object" &&
            typeof participant.fullName === "string" &&
            participant.fullName) ||
          (typeof entry?.name === "string" ? entry.name : null) ||
          (typeof entry?.label === "string" ? entry.label : null) ||
          participantEmailRaw ||
          "";

        if (
          isCurrentUserReference(
            participantId,
            participantEmail,
            participantNameRaw
          )
        ) {
          return;
        }

        const participantName = normalizeName(participantNameRaw);
        const dedupeKey =
          participantId ||
          participantEmail ||
          participantName ||
          `${file.id}-${index}`;

        const participantDisplay =
          participantNameRaw || participantEmailRaw || "Unknown user";

        addEntry({
          key: `shared:${dedupeKey}`,
          label: `${participantDisplay} • Shared to`,
          ownerId: participantId,
          ownerEmail: participantEmail,
          ownerName: participantName,
        });
      });
    });

    return Array.from(map.values()).sort((a, b) =>
      a.label.toLowerCase().localeCompare(b.label.toLowerCase())
    );
  }, [scopedFiles, isCurrentUserReference, normalizeName, extractIdString]);

  const [typeSnapshot, setTypeSnapshot] = React.useState([]);

  React.useEffect(() => {
    if (!typeFilter) {
      setTypeSnapshot(dynamicTypes);
    }
  }, [dynamicTypes, typeFilter]);

  const renderedTypes = React.useMemo(() => {
    if (typeFilter && typeSnapshot.length) {
      return typeSnapshot;
    }
    return dynamicTypes;
  }, [dynamicTypes, typeFilter, typeSnapshot]);

  const doesFilterMatchPerson = React.useCallback((filter, person) => {
    if (
      !filter ||
      typeof filter !== "object" ||
      filter.kind !== "person" ||
      !person
    ) {
      return false;
    }

    if (filter.ownerId && person.ownerId) {
      if (filter.ownerId === person.ownerId) return true;
    }

    if (filter.ownerEmail && person.ownerEmail) {
      if (filter.ownerEmail === person.ownerEmail) return true;
    }

    if (filter.ownerName && person.ownerName) {
      if (filter.ownerName === person.ownerName) return true;
    }

    return false;
  }, []);

  const isPersonSelected = React.useCallback(
    (person) => doesFilterMatchPerson(peopleFilter, person),
    [peopleFilter, doesFilterMatchPerson]
  );

  const handleChange = (_event, newView) => {
    if (newView !== null) setFilterMode(newView);
  };

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [activeFilter, setActiveFilter] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event, filter) => {
    setAnchorEl(event.currentTarget);
    setActiveFilter(filter);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setActiveFilter(null);
  };

  return (
    <Box sx={{ backgroundColor: "#ffffff", px: 2, py: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>

        {/* Files / Folders toggle */}
        <ToggleButtonGroup
          value={filterMode}
          exclusive
          onChange={handleChange}
          sx={{
            borderRadius: "9999px",
            overflow: "hidden",
            border: "1px solid #dadce0",
            height: 36,
          }}
        >
          <ToggleButton
            value="files"
            sx={{
              textTransform: "none",
              fontSize: 14,
              fontWeight: 500,
              px: 2,
              color: "#202124",
              "&.Mui-selected": {
                backgroundColor: "#e8f0fe",
                color: "#1a73e8",
              },
            }}
          >
            {filterMode === "files" ? (
              <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
            ) : (
              <InsertDriveFileOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
            )}
            Files
          </ToggleButton>

          <ToggleButton
            value="folders"
            sx={{
              textTransform: "none",
              fontSize: 14,
              fontWeight: 500,
              px: 2,
              color: "#202124",
              "&.Mui-selected": {
                backgroundColor: "#e8f0fe",
                color: "#1a73e8",
              },
            }}
          >
            {filterMode === "folders" ? (
              <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
            ) : (
              <FolderOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
            )}
            Folders
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

        {/* Filter buttons */}
        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "type")}
          sx={btnStyle}
        >
          Type
        </Button>

        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "people")}
          sx={btnStyle}
        >
          People
        </Button>

        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "modified")}
          sx={btnStyle}
        >
          Modified
        </Button>

        <Button
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => handleOpen(e, "source")}
          sx={btnStyle}
        >
          Location
        </Button>

        {/* Menu */}
        <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
          {/* TYPE FILTER */}
          {activeFilter === "type" &&
            renderedTypes.map((t) => (
              <MenuItem
                key={t}
                selected={typeFilter === t}
                onClick={() => {
                  setTypeFilter(t);
                  handleClose();
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {renderTypeIcon(t)}
                  {t}
                </Box>
              </MenuItem>
            ))}

          {activeFilter === "type" && renderedTypes.length > 0 && (
            <MenuItem
              onClick={() => {
                setTypeFilter(null);
                handleClose();
              }}
            >
              Show all
            </MenuItem>
          )}

          {activeFilter === "type" && renderedTypes.length === 0 && (
            <MenuItem disabled>No types available</MenuItem>
          )}

          {/* PEOPLE FILTER */}
          {activeFilter === "people" && (
            <>
              <MenuItem
                key="owned"
                selected={peopleFilter === "owned"}
                onClick={() => {
                  setPeopleFilter("owned");
                  handleClose();
                }}
              >
                Owned by me
              </MenuItem>
              <MenuItem
                key="sharedWithMe"
                selected={peopleFilter === "sharedWithMe"}
                onClick={() => {
                  setPeopleFilter("sharedWithMe");
                  handleClose();
                }}
              >
                Shared with me
              </MenuItem>
              <MenuItem
                key="sharedByMe"
                selected={peopleFilter === "sharedByMe"}
                onClick={() => {
                  setPeopleFilter("sharedByMe");
                  handleClose();
                }}
              >
                Shared by me
              </MenuItem>

              <Divider sx={{ my: 0.5 }} />

              {peopleOptions.length > 0 ? (
                peopleOptions.map((person) => (
                  <MenuItem
                    key={person.key}
                    selected={isPersonSelected(person)}
                    onClick={() => {
                      setPeopleFilter({
                        kind: "person",
                        ownerId: person.ownerId,
                        ownerEmail: person.ownerEmail,
                        ownerName: person.ownerName,
                        label: person.label,
                      });
                      handleClose();
                    }}
                  >
                    {person.label}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No people available</MenuItem>
              )}

              <Divider sx={{ my: 0.5 }} />

              <MenuItem
                key="people-all"
                onClick={() => {
                  setPeopleFilter(null);
                  handleClose();
                }}
              >
                Show all
              </MenuItem>
            </>
          )}

          {/* MODIFIED */}
          {activeFilter === "modified" && [
            <MenuItem
              key="today"
              selected={modifiedFilter === "today"}
              onClick={() => {
                setModifiedFilter("today");
                handleClose();
              }}
            >
              Today
            </MenuItem>,
            <MenuItem
              key="week"
              selected={modifiedFilter === "week"}
              onClick={() => {
                setModifiedFilter("week");
                handleClose();
              }}
            >
              This week
            </MenuItem>,
            <MenuItem
              key="month"
              selected={modifiedFilter === "month"}
              onClick={() => {
                setModifiedFilter("month");
                handleClose();
              }}
            >
              This month
            </MenuItem>,
            <MenuItem
              key="modified-all"
              onClick={() => {
                setModifiedFilter(null);
                handleClose();
              }}
            >
              Show all
            </MenuItem>,
          ]}

          {/* SOURCE */}
          {activeFilter === "source" && [
            <MenuItem
              key="anywhere"
              onClick={() => {
                setSourceFilter("anywhere");
                handleClose();
              }}
            >
              Anywhere in Drive
            </MenuItem>,
            <MenuItem
              key="mydrive"
              onClick={() => {
                setSourceFilter("myDrive");
                handleClose();
              }}
            >
              My Drive
            </MenuItem>,
            <MenuItem
              key="shared"
              onClick={() => {
                setSourceFilter("shared");
                handleClose();
              }}
            >
              Shared with me
            </MenuItem>,
          ]}
        </Menu>

      </Box>
    </Box>
  );
}

const btnStyle = {
  textTransform: "none",
  fontSize: 14,
  fontWeight: 500,
  color: "#202124",
  border: "1px solid #dadce0",
  borderRadius: "10px",
  px: 2,
  py: 0.5,
  backgroundColor: "#fff",
  "&:hover": {
    backgroundColor: "#f8f9fa",
  },
};

export default MenuBar;
// ...existing code...