const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")) ||
  "http://localhost:5000";

const isJsonLikeBody = (body) =>
  body !== null &&
  body !== undefined &&
  !(body instanceof FormData) &&
  !(body instanceof Blob) &&
  !(body instanceof ArrayBuffer) &&
  !ArrayBuffer.isView(body) &&
  typeof body !== "string";

const buildUrl = (path) => { // checks if the request URL is correct
  if (/^https?:\/\//i.test(path)) return path; //case 1: alr a full url -> return unchanged
  if (!path.startsWith("/")) return `${API_BASE_URL}/${path}`; // case 2: add slash before url + add base url if it doesnt have them
  return `${API_BASE_URL}${path}`; //case 3: starts with / but isnt a full URL, just attach api base URL in front
};

async function request(path, options = {}) {
  const {
    method = "GET", //default HTTP method is Get
    body, 
    headers,
    credentials = "include", //include cookies, for auth
    ...rest //any other thing, add it into a new object called rest
  } = options;

  const finalHeaders = new Headers(headers || {}); // if user game custom headers, use. if not, use empty {}, turn them into Header object that fetch understands 
  let preparedBody = body; //decides how to send the data

  if (body !== undefined && body !== null) {
    if (isJsonLikeBody(body)) { //if its an object IE. not file, formdata, or string
      preparedBody = JSON.stringify(body); //convert into JSON string
      if (!finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "application/json"); //tells backend that its sending json
      }
    } else if (typeof body === "string") {
      preparedBody = body; //keep as is
      if (!finalHeaders.has("Content-Type")) {
        finalHeaders.set("Content-Type", "text/plain"); //sets correct header for plain
      }
    } else {
      preparedBody = body; // ie let browser handle it, dont set it manually 
    }
  }

  if (!finalHeaders.has("Accept")) {
    finalHeaders.set("Accept", "application/json"); 
  }

  const response = await fetch(buildUrl(path), { //use the final url
    method, //use correct method
    body: preparedBody, //use the prepared body
    headers: finalHeaders, // use the prepared headers
    credentials, //send the cookies
    ...rest, //add any leftover fetch options
  });

  let data = null; 
  const text = await response.text(); //read it first as plain text
  if (text) {
    try {
      data = JSON.parse(text); //try to parse it into JSON
    } catch {
      data = text; // if it fails, keep the text 
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed with status ${response.status}`
    );
    error.response = { //attach backend info to the error
      status: response.status,
      data,
    };
    throw error;
  }

  return { data, status: response.status }; //if no error
}
 
const apiClient = { //shortcut helpers
  request,
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body, options = {}) =>
    request(path, { ...options, method: "POST", body }),
  patch: (path, body, options = {}) =>
    request(path, { ...options, method: "PATCH", body }),
  delete: (path, options = {}) =>
    request(path, { ...options, method: "DELETE" }),
};

export { API_BASE_URL };
export default apiClient;
