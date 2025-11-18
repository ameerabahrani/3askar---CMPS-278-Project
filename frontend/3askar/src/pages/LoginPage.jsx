import React, { useEffect, useState } from "react";
import { Box, Paper, Typography, TextField, Link, Button, FormControl, InputLabel, Select, MenuItem, Alert, FormHelperText, Checkbox, FormControlLabel } from "@mui/material";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

const isValueEmpty = (value) => {
  if (typeof value === "string") {
    return value.trim() === "";
  }
  return !value;
};

const isValidEmail = (value) => {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const strongPasswordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/; //taken from https://uibakery.io/regex-library/password

const isStrongPassword = (value) => {
  if (typeof value !== "string") {
    return false;
  }
  return strongPasswordRegex.test(value);
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [createAlert, setCreateAlert] = useState(null);
  const [showCreateErrors, setShowCreateErrors] = useState(false);
  const [loginAlert, setLoginAlert] = useState(null);
  const [showLoginErrors, setShowLoginErrors] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  const [mode, setMode] = useState("login"); //login or create pages
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay,   setDobDay]   = useState("");
  const [dobYear,  setDobYear]  = useState("");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const days   = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const years  = Array.from({ length: 120 }, (_, i) => String(new Date().getFullYear() - i));
  Object.freeze(months);
  Object.freeze(days);
  Object.freeze(years);

  //login button handles logging in the user
  const handleLogin = async ()=> {
    setShowLoginErrors(true);
    const loginRequired = [
      { value: email, label: "Email" },
      { value: password, label: "Password" },
    ];

    const missingFieldsList = loginRequired
      .filter(({ value }) => isValueEmpty(value))
      .map(({ label }) => label);

    if (missingFieldsList.length) {
      setLoginAlert({
        severity: "warning",
        message: "Please fill in the required fields before signing in.",
        details: missingFieldsList,
      });
      return;
    }

    if (!isValidEmail(email)) {
      setLoginAlert({
        severity: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setShowLoginErrors(false);
    setLoginAlert(null);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"}, // read in json basically
      credentials: "include", //this is to prvoide cookies fo the session
      body: JSON.stringify({
        email,
        password,
        rememberMe
      })
    })

    if (!res.ok){
      const errorMessage = await res.text();
      console.log(errorMessage);
    } else{
      const message = await res.text();
      console.log(message);
    }
  };

  //creat account button handles signing up the new user
  const handleCreateAccount = async ()=> {
    setShowCreateErrors(true);
    const requiredFields = [
      { value: firstName, label: "First name" },
      { value: lastName, label: "Last name" },
      { value: dobMonth, label: "Birth month" },
      { value: dobDay, label: "Birth day" },
      { value: dobYear, label: "Birth year" },
      { value: email, label: "Email" },
      { value: password, label: "Password" },
    ];

    const missingFieldsList = requiredFields
      .filter(({ value }) => isValueEmpty(value))
      .map(({ label }) => label);

    if (missingFieldsList.length) {
      setCreateAlert({
        severity: "warning",
        message: "Please fill in the required fields before creating an account.",
        details: missingFieldsList,
      });
      return;
    }

    if (!isStrongPassword(password)) {
      setCreateAlert({
        severity: "error",
        message: "Password must include upper/lower case letters, a number, a symbol, and be at least 8 characters.",
      });
      return;
    }

    if (!isValidEmail(email)) {
      setCreateAlert({
        severity: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setShowCreateErrors(false);
    setCreateAlert(null);

    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      credentials: "include",
      body: JSON.stringify({
        firstName, 
        lastName,
        dobMonth,
        dobDay,
        dobYear,
        email,
        password
      }),
    })

    if (!res.ok){
      const errorMessage = await res.text();
      console.log(errorMessage);
    } else {
      const message = await res.text();
      console.log(message);
    }
  }

  const fieldSx={
          mt: 2,
          backgroundColor: "#fff",
          input: { color: "#000" },
        
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "#f6fafe" },
            "&:hover fieldset": { borderColor: "#dadce0" },
            "&.Mui-focused fieldset": { borderColor: "#1a73e8" },
            "&.Mui-error fieldset": { borderColor: "#d32f2f" },
            "&.Mui-error:hover fieldset": { borderColor: "#d32f2f" },
            "&.Mui-error.Mui-focused fieldset": { borderColor: "#d32f2f" },
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
          "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "#d32f2f" },
          "&.Mui-error:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#d32f2f" },
          "&.Mui-error.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#d32f2f" },
        };

  const getEmailErrorMessage = (shouldShowErrors) => {
    if (!shouldShowErrors) {
      return "";
    }
    if (isValueEmpty(email)) {
      return "Required";
    }
    if (!isValidEmail(email)) {
      return "Enter a valid email address";
    }
    return "";
  };

  const loginEmailErrorMessage = getEmailErrorMessage(showLoginErrors);
  const createEmailErrorMessage = getEmailErrorMessage(showCreateErrors);

  const getCreatePasswordErrorMessage = () => {
    if (!showCreateErrors) {
      return "";
    }
    if (isValueEmpty(password)) {
      return "Required";
    }
    if (!isStrongPassword(password)) {
      return "Use 8+ characters with upper, lower, number, and symbol.";
    }
    return "";
  };

  const createPasswordErrorMessage = getCreatePasswordErrorMessage();

  const createFieldErrors = {
    firstName: showCreateErrors && isValueEmpty(firstName),
    lastName: showCreateErrors && isValueEmpty(lastName),
    dobMonth: showCreateErrors && isValueEmpty(dobMonth),
    dobDay: showCreateErrors && isValueEmpty(dobDay),
    dobYear: showCreateErrors && isValueEmpty(dobYear),
    email: Boolean(createEmailErrorMessage),
    password: Boolean(createPasswordErrorMessage),
  };

  const loginFieldErrors = {
    email: Boolean(loginEmailErrorMessage),
    password: showLoginErrors && isValueEmpty(password),
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
            <Box component="span" sx={{ color: "#1a73e8", fontWeight: 549}}>3</Box>
            <Box component="span" sx={{ color: "#ea4335", fontWeight: 549}}>a</Box>
            <Box component="span" sx={{ color: "#fbbc05", fontWeight: 549}}>s</Box>
            <Box component="span" sx={{ color: "#1a73e8", fontWeight: 549}}>k</Box>
            <Box component="span" sx={{ color: "#34a853", fontWeight: 549}}>a</Box>
            <Box component="span" sx={{ color: "#ea4335", fontWeight: 549}}>r</Box>
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
            {loginAlert && (
              <Alert
                severity={loginAlert.severity}
                sx={{ mt: 1 }}
                onClose={() => setLoginAlert(null)}
              >
                <Typography variant="body2">
                  {loginAlert.message}
                </Typography>
                {loginAlert.details?.length > 0 && (
                  <Typography variant="body2" component="p" sx={{ mt: 1 }}>
                    Missing: {loginAlert.details.join(", ")}
                  </Typography>
                )}
              </Alert>
            )}
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
              error={loginFieldErrors.email}
              helperText={loginEmailErrorMessage || " "}
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
            error={loginFieldErrors.password}
            helperText={loginFieldErrors.password ? "Required" : " "}
          />

          

          

          {/* Remember me + Forgot password row */}
          <Box
            sx={{
              mt: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: 14 }}>
                  Remember me
                </Typography>
              }
              sx={{ m: 0 }}   // no extra margins
            />

            <Link
              href="#"
              underline="none"
              onClick={(e) => {
                e.preventDefault();
                navigate("/forgot-password");
              }}
              sx={{
                color: "#1a73e8",
                fontSize: 14,
                "&:hover": {
                  textDecoration: "underline",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                },
              }}
            >
              Forgot Password?
            </Link>
          </Box>



        {/* Bottom row */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
          <Link
            href="#"
            underline="hover"
            onClick={(e) => {
              e.preventDefault();
              setMode("create");
              setShowCreateErrors(false);
              setCreateAlert(null);
              setShowLoginErrors(false);
              setLoginAlert(null);
            }}
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
            onClick={handleLogin}
            sx={{
              textTransform: "none",
              px: 3,
              bgcolor: "#1a73e8",
              "&:hover": { bgcolor: "#185abc" },
            }}
          >
            Sign in
          </Button>
        </Box>


        </>

        )}

        {/* Create account mode input fields */}
        {mode === "create" && (
          <>
            {createAlert && (
              <Alert
                severity={createAlert.severity}
                sx={{ mt: 2 }}
                onClose={() => setCreateAlert(null)}
              >
                <Typography variant="body2">
                  {createAlert.message}
                </Typography>
                {createAlert.details?.length > 0 && (
                  <Typography variant="body2" component="p" sx={{ mt: 1 }}>
                    Missing: {createAlert.details.join(", ")}
                  </Typography>
                )}
              </Alert>
            )}
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
                  error={createFieldErrors.firstName}
                  helperText={createFieldErrors.firstName ? "Required" : " "}
                />
                <TextField
                  label = "Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  InputLabelProps={{ shrink: true}}
                  variant="outlined"
                  sx={fieldSx}
                  error={createFieldErrors.lastName}
                  helperText={createFieldErrors.lastName ? "Required" : " "}
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
                <FormControl error={createFieldErrors.dobMonth}>
                  <InputLabel shrink>Month</InputLabel>
                  <Select
                    value={dobMonth}
                    onChange={(e) => setDobMonth(e.target.value)}
                    displayEmpty
                    sx={selectSx}
                    error={createFieldErrors.dobMonth}
                  >
                    {months.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                  {createFieldErrors.dobMonth && <FormHelperText>Required</FormHelperText>}
                </FormControl>

                {/* Day */}
                <FormControl error={createFieldErrors.dobDay}>
                  <InputLabel shrink>Day</InputLabel>
                  <Select
                    value={dobDay}
                    onChange={(e) => setDobDay(e.target.value)}
                    sx={selectSx}
                    error={createFieldErrors.dobDay}
                  >
                    {days.map((d) => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                  {createFieldErrors.dobDay && <FormHelperText>Required</FormHelperText>}
                </FormControl>

                {/* Year */}
                <FormControl error={createFieldErrors.dobYear}>
                  <InputLabel shrink>Year</InputLabel>
                  <Select
                    value={dobYear}
                    onChange={(e) => setDobYear(e.target.value)}
                    sx={selectSx}
                    error={createFieldErrors.dobYear}
                  >
                    {years.map((y) => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </Select>
                  {createFieldErrors.dobYear && <FormHelperText>Required</FormHelperText>}
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
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={fieldSx}
              error={createFieldErrors.email}
              helperText={createEmailErrorMessage || " "}
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
            error={createFieldErrors.password}
            helperText={createPasswordErrorMessage || " "}
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
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("login");
                    setShowCreateErrors(false);
                    setCreateAlert(null);
                    setShowLoginErrors(false);
                    setLoginAlert(null);
                  }}
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
                  onClick={handleCreateAccount}
                >
                  Create Account
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