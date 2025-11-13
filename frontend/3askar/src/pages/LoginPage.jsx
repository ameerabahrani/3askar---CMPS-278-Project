import React, {useState} from "react";
import { Box, Paper, Typography, TextField, Link, Button, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleNext = ()=> {
    alert(`Next clicked with email: ${email || "(empty)"} - UI only`);
  };
  const [mode, setMode] = useState("login"); //login or create pages
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay,   setDobDay]   = useState("");
  const [dobYear,  setDobYear]  = useState("");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days   = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years  = Array.from({ length: 120 }, (_, i) => String(new Date().getFullYear() - i));
  months.freeze();
  days.freeze();
  years.freeze();
  //const [gender, setGender] = useState("");


  const fieldSx={
          mt: 2,
          backgroundColor: "#fff",
          input: { color: "#000" },
        
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#f6fafe" },
            "&:hover fieldset": { borderColor: "#dadce0" },
            "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
          },
        
          /*  autofill styling (browser override) */   
          "& input:-webkit-autofill": {
            WebkitBoxShadow: "0 0 0 1000px #e8f0fe inset",
            WebkitTextFillColor: "#000",
            caretColor: "#000",
            transition: "background-color 5000s ease-in-out 0s",
          },
        };
  const selectSx = {
          mt: 2,
          backgroundColor: "#fff",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "#f6fafe" },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#dadce0" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#1a73e8" },
        };


  return (
    <Box 
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        bgcolor: "#f5f5f5",
        p: 2,
      }}
    >
      {/* White card*/}
      <Paper
        elevation={3}
        sx={{
          width: "10.6cm" ,
          maxWidth: "92vw",
          p: 4,
          borderRadius: 2,
        }}

      >
        {/* Header Section */}
        

        <Box sx={{ display: "grid", justifyItems: "center", mb: 2 }}>
          {/* Google wordMark build with colored spans*/}
          <Typography
            sx={{
              fontSize: 28,
              letterSpacing: 0.2,
              mb: 1,
              userSelect: "none",
            }}
          >
            <Box component="span" sx={{ color: "#1a73e8", fontWeight: 549}}>G</Box>
            <Box component="span" sx={{ color: "#ea4335", fontWeight: 549}}>o</Box>
            <Box component="span" sx={{ color: "#fbbc05", fontWeight: 549}}>o</Box>
            <Box component="span" sx={{ color: "#1a73e8", fontWeight: 549}}>g</Box>
            <Box component="span" sx={{ color: "#34a853", fontWeight: 549}}>l</Box>
            <Box component="span" sx={{ color: "#ea4335", fontWeight: 549}}>e</Box>
          </Typography>

          {/*Main heading*/}
          <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
            {mode === "login" ? "Sign in" : "Create a Google Account"}
          </Typography>

          {/* subtitle */}
          <Typography variant="body2" color="blackSecondary" sx={{ mb: 1 }}>
            to continue to Google Drive
          </Typography>

        </Box>
        
        {/* Input fields section */}
        {mode === "login" && (
        <>
            <TextField
              label="Email or phone"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />  



          <TextField
            label="Enter your password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            sx={fieldSx}
          />

          <Link
          href="#"
          underline="none"               
          onClick={(e) => e.preventDefault()}
          sx={{
            mt: 1.5,
            display: "inline-block",
            color: "#1a73e8",            
            fontWeight: 400,
            "&:hover": {
              color: "#1a73e8",          
              textDecoration: "none",    
              backgroundColor: "transparent",
              cursor: "pointer",         
            },
          }}
        >
          Forgot Password?
        </Link>


        {/* Bottom row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
          <Link
            href="#"
            underline="hover"
            onClick={(e) => {e.preventDefault(); setMode("create");}}
            sx={{
              px: -2,
              py: 1,                        
              borderRadius: 1,              
              "&:hover": {
                backgroundColor: "#f6fafe", 
                textDecoration: "none",     
              },
            }}
          >
            Create account
          </Link>

          <Button
            variant="contained"
            onClick={handleNext}
            sx={{
              textTransform: "none",
              px: 3,
              bgcolor: "#1a73e8",
              "&:hover": { bgcolor: "#185abc" },
            }}
          >
            Next
          </Button>
        </Box>


        </>

        )}

        {/* Create account mode input fields */}
        {mode === "create" && (
          <>
            {/*First / Last name feilds*/}
            <Box sx={{  mt: 1 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <TextField
                  label = "First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  InputLabelProps={{ shrink: true}}
                  variant="outlined"
                  sx={fieldSx}
                />
                <TextField
                  label = "Last name (optional)"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  InputLabelProps={{ shrink: true}}
                  variant="outlined"
                  sx={fieldSx}
                />

              </Box>
              {/* DOB fields */}
              <Box
                sx={{ 
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                  gap: 2,
                  mt: 2, 
                }}
              >
                {/* Month */}
                <FormControl>
                  <InputLabel shrink>Month</InputLabel>
                  <Select
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    displayEmpty
                    sx={selectSx}
                  >
                    {months.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Day */}
                <FormControl>
                  <InputLabel shrink>Day</InputLabel>
                  <Select
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    sx={selectSx}
                  >
                    {days.map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Year */}
                <FormControl>
                  <InputLabel shrink>Year</InputLabel>
                  <Select
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    sx={selectSx}
                  >
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

              </Box>
              
              {/* Gender field */}
              {/* <FormControl sx={{ mt: 2, minWidth: 150 }}>
                <InputLabel shrink>Gender</InputLabel>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  sx={selectSx}
                >
                  {["Female", "Male", "Prefer not to say", "Custom"].map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>  */}
              

              {/*input field email and pass*/}

              <TextField
              label="Email or phone"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
            />  



          <TextField
            label="Enter your password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            sx={fieldSx}
          />

              <Box 
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 3,
                }}
              >
                <Link
                  href="#"
                  underline="hover"
                  onClick={(e) => {e.preventDefault(); setMode("login");}}
                  sx={{
                    px: 1.5,
                    py: 0.8,
                    borderRadius: 1,
                    "&:hover": { backgroundColor: "#f6fafe",},
                  }}
                >
                  Sign in
                </Link>

                <Button
                  variant="contained"
                  sx={{
                    textTransform: "none",
                    px: 3,
                    bgcolor: "#1a73e8",
                    "&:hover": { bgcolor: "#1765cc" },
                  }}
                  onClick={() => alert("Create account (UI only)")}
                >
                  Next
                </Button>
                                    
              </Box>     

            </Box>

            
           </>  // react fragments tags
        )}
        
        



        

      </Paper>

      
    </Box>
  );
}
/*END */