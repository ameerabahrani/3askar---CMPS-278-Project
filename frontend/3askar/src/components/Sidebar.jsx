import React, {useState} from "react";

import {
    Box, 
    Button, 
    List, 
    ListItemButton,
    ListItemIcon, 
    ListItemText, 
    Typography,
    LinearProgress, 
    Divider,
    Collapse,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add"; 
import HomeFilledIcon from '@mui/icons-material/HomeFilled'; 
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined"; 
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined"; 
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import StarBorderOutlinedIcon from "@mui/icons-material/StarBorderOutlined"; 
import StarIcon from '@mui/icons-material/Star';
import DevicesIcon from '@mui/icons-material/Devices';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import ReportIcon from '@mui/icons-material/Report';
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined"; 
import DeleteIcon from '@mui/icons-material/Delete';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import WbCloudyIcon from '@mui/icons-material/WbCloudy';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';


const Sidebar = () => {
    const SIDEBAR_WIDTH = 240; 
    const [active, setActive] = useState("home"); 
    const [usedStorage, setUsedStorage] = useState(36);
    const [openDrive, setOpenDrive] = useState(false);
    const [openComputers, setOpenComputers] = useState(false);
    const [connectedDevices] = useState([]); //empty means no devices connected
    

    const sideItems = [
        {id:"home", label: "Home", icon: <HomeOutlinedIcon />, activeIcon: <HomeFilledIcon color="primary" />}, 
        {id:"drive", label: "My Drive", icon: <DriveFileMoveOutlinedIcon />, activeIcon: <DriveFileMoveOutlinedIcon color="primary" />}, 
        {id:"computers", label: "Computers", icon: <DevicesIcon />, activeIcon: <DevicesIcon color="primary" />}, 

        {id: "divider-1", type: "spacer"},

        {id:"shared", label: "Shared with me", icon: <PeopleAltOutlinedIcon />, activeIcon: <PeopleAltIcon color="primary" />}, 
        {id:"recent", label: "Recent", icon: <WatchLaterOutlinedIcon />, activeIcon: <WatchLaterIcon color="primary" />}, 
        {id:"starred", label: "Starred", icon: <StarBorderOutlinedIcon />, activeIcon: <StarIcon color="primary" />}, 

        {id: "divider-2", type: "spacer"},

        {id:"spam", label: "Spam", icon: <ReportGmailerrorredOutlinedIcon />, activeIcon: <ReportIcon color="primary" />}, 
        {id:"bin", label: "Trash", icon: <DeleteOutlinedIcon />, activeIcon: <DeleteIcon color="primary" />}, 
        {id:"storage", label: `Storage (${usedStorage}% full)`, icon: <CloudOutlinedIcon />, activeIcon: <WbCloudyIcon color="primary" />}, 

    ];


    return (


        <Box 
          sx = {{
            width: SIDEBAR_WIDTH, 
            height: "100vh", 
            bgcolor: "#f8fafd",
            borderRight: "1px solid #e0e0e0",
            display: "flex",
            flexDirection: "column",
            p: 1.8,
            boxSizing: "border-box",
        }}

        >
            <Button 
                variant="contained"
                startIcon={<AddIcon />}
                sx={{
                    backgroundColor: "#fff",
                    color: "#1c1d20ff",
                    borderRadius: "15px", 
                    justifyContent: "flex-start", 
                    textTransform: "none", 
                    fontWeight: 540, 
                    fontSize: 15, 
                    py: 2, 
                    px: 2.7, 
                    mb: 2.5, 
                    width: "fit-content",
                    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.25)",
                    "&:hover": {
                        backgroundColor: "#edf1fa",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    },
                }}
                
            >
                New
            </Button>

            <List>
                {sideItems.map((item) => {
                    if(item.type === "spacer"){
                        return <Box key={item.id} sx={{height:16}} />
                    }

                    return (
                         <Box key={item.id} sx={{
                        px: 0.8,
                    }}>
                       <ListItemButton
                        onClick={()=> setActive(item.id)}
                          sx={{

                            alignSelf: 'flex-start',
                            width: 'fit-content',
                            borderRadius: '999px', 
                            ml: 0.5,
                            mr: 1, 
                            px: 1.25,
                            fontSize: 14,
                            color: active === item.id ? '#0b57d0' : '#202124',
                            bgcolor: active === item.id ? '#c2e7ff' : 'transparent', 
                            pr: active === item.id ? 3 : 1.25,
                            "&:hover": {
                                bgcolor: active === item.id ? '#c2e7ff' : '#f1f3f4',
                            },
                        }}  
                        >
                        {/* Left arrow toggle for expandable items */}
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.id === 'drive') setOpenDrive((v) => !v);
                            if (item.id === 'computers') setOpenComputers((v) => !v);
                          }}
                          sx={{
                            display: (item.id === 'drive' || item.id === 'computers') ? 'flex' : 'none',
                            alignItems: 'center',
                            pr: 0.5,
                            color: active === item.id ? '#0b57d0' : '#5f63g8',
                            cursor: 'pointer',
                          }}
                        >
                          {(item.id === 'drive' && openDrive) || (item.id === 'computers' && openComputers)
                            ? <KeyboardArrowDownIcon fontSize="small" />
                            : <KeyboardArrowRightIcon fontSize="small" />}
                        </Box>

                        <ListItemIcon sx={{ minWidth: 36, 
                            color: active === item.id ? "#c2e7ff" : "#5f63g8",
                        }}
                        >
                            {active === item.id ? item.activeIcon : item.icon}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                                fontWeight: active === item.id ? 540: 400,
                            }} 
                        />
                    </ListItemButton>
                    {/* Collapsible submenu for Drive */}
                    {item.id === 'drive' && (
                      <Collapse in={openDrive} timeout="auto" unmountOnExit>
                        <List disablePadding>
                          <ListItemButton sx={{
                            alignSelf: 'flex-start',
                            width: 'fit-content',
                            borderRadius: '999px',
                            ml: 4.5,
                            mr: 1,
                            px: 1.25,
                            fontSize: 14,
                            color: '#202124',
                            bgcolor: 'transparent',
                            '&:hover': { bgcolor: '#f1f3f4' },
                          }}>
                            <ListItemText primary="My Files" primaryTypographyProps={{ fontWeight: 400 }} />
                          </ListItemButton>
                          <ListItemButton sx={{
                            alignSelf: 'flex-start',
                            width: 'fit-content',
                            borderRadius: '999px',
                            ml: 4.5,
                            mr: 1,
                            px: 1.25,
                            fontSize: 14,
                            color: '#202124',
                            bgcolor: 'transparent',
                            '&:hover': { bgcolor: '#f1f3f4' },
                          }}>
                            <ListItemText primary="Shared drives" primaryTypographyProps={{ fontWeight: 400 }} />
                          </ListItemButton>
                        </List>
                      </Collapse>
                    )}

                    {/* Collapsible submenu for Computers */}
                    {item.id === 'computers' && (
                      <Collapse in={openComputers} timeout="auto" unmountOnExit>
                        {connectedDevices.length > 0 && (
                          <List disablePadding>
                            {connectedDevices.map((dev) => (
                              <ListItemButton key={dev.id || dev.name} sx={{
                                alignSelf: 'flex-start',
                                width: 'fit-content',
                                borderRadius: '999px',
                                ml: 4.5,
                                mr: 1,
                                px: 1.25,
                                fontSize: 14,
                                color: '#202124',
                                bgcolor: 'transparent',
                                '&:hover': { bgcolor: '#f1f3f4' },
                              }}>
                                <ListItemText primary={dev.name} primaryTypographyProps={{ fontWeight: 400 }} />
                              </ListItemButton>
                            ))}
                          </List>
                        )}
                      </Collapse>
                    )}
                    
                </Box>  
            );
            })}
    
        </List>

        <Box sx={{ px: 0.8 }}>
          <Box sx={{ ml: 0.5, mr: 1, pl: 1.25 }}>
            <LinearProgress 
              variant="determinate"
              value={usedStorage}
              sx={{
                width: '100%',
                height: 6,
                borderRadius: 3, 
                mb: 0.5, 
                bgcolor: "#e0e0e0", 
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#ef9800"
                },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ px: 0.8 }}>
          <Box sx={{ ml: 0.5, mr: 1, pl: 1.25 }}>
            <Typography variant="caption" color="text.secondary">
              {usedStorage}% of 15 GB used
            </Typography>
          </Box>
        </Box>
    </Box>
    );


        
        
};


export default Sidebar;
