const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL &&
    import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")) ||
  (import.meta.env.VITE_API_URL &&
    import.meta.env.VITE_API_URL.replace(/\/+$/, "")) ||
  "http://localhost:5000";

let requestCounter = 0;
const nowIso = () => new Date().toISOString();
const requestTimer = () => performance?.now?.() ?? Date.now();

const LOG_ENABLED = false;

const summarizeBody = (body) => {
  if (body === null || body === undefined) return null;
  if (body instanceof FormData) {
    return {
      kind: "FormData",
      keys: Array.from(body.keys()),
    };
  }
  if (body instanceof Blob) return { kind: "Blob", size: body.size, type: body.type };
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
    return { kind: "ArrayBuffer", byteLength: body.byteLength };
  if (typeof body === "string")
    return { kind: "string", length: body.length, preview: body.slice(0, 120) };
  if (typeof body === "object") {
    try {
      return {
        kind: "json",
        keys: Object.keys(body),
        preview: JSON.stringify(body).slice(0, 200),
      };
    } catch {
      return { kind: "json", preview: "unserializable" };
    }
  }
  return { kind: typeof body };
};

const logRequest = (phase, payload) => {
  if (!LOG_ENABLED) return;
  const base = `[apiClient][${nowIso()}] ${phase}`;
  console.info(base, payload);
};

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
    method = "GET", // default HTTP method
    body,
    headers,
    credentials = "include", // include cookies for auth
    params, // optional query parameters (plain object)
    ...rest
  } = options;

  // Minimal query serialization (only if params is a plain object with keys)
  if (params && typeof params === "object" && !Array.isArray(params)) {
    const entries = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== "");
    if (entries.length) {
      const qs = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      if (qs) {
        path += path.includes("?") ? `&${qs}` : `?${qs}`;
      }
    }
  }

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

  const requestId = ++requestCounter;
  const started = requestTimer();
  const url = buildUrl(path);

  logRequest("request:start", {
    requestId,
    method,
    url,
    credentials,
    headers: Object.fromEntries(finalHeaders.entries()),
    body: summarizeBody(preparedBody),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  let response;
  try {
    response = await fetch(url, { //use the final url
      method, //use correct method
      body: preparedBody, //use the prepared body
      headers: finalHeaders, // use the prepared headers
      credentials, //send the cookies
      signal: controller.signal,
      ...rest, //add any leftover fetch options
    });
    clearTimeout(timeoutId);
  } catch (error) {
    if (error.name === 'AbortError') {
      logRequest("request:timeout", { requestId, durationMs: 10000 });
      throw new Error("Request timed out");
    }
    throw error;
  }

  let data = null;
  const text = await response.text(); //read it first as plain text
  if (text) {
    try {
      data = JSON.parse(text); //try to parse it into JSON
    } catch {
      data = text; // if it fails, keep the text 
    }
  }

  const durationMs = Number((requestTimer() - started).toFixed(1));

  if (!response.ok) {
    const error = new Error(
      data?.message || `Request failed with status ${response.status}`
    );
    error.response = { //attach backend info to the error
      status: response.status,
      data,
    };
    logRequest("request:error", {
      requestId,
      method,
      url,
      status: response.status,
      durationMs,
      error: error.message,
      responsePreview: typeof data === "string" ? data.slice(0, 200) : data,
    });
    throw error;
  }

  logRequest("request:success", {
    requestId,
    method,
    url,
    status: response.status,
    durationMs,
    responsePreview: typeof data === "string" ? data.slice(0, 200) : data,
  });

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
