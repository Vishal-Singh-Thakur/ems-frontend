import { AuthRefreshAPI } from "../components/Constant/Api/Api";

// Access tokens are short-lived, so a 401 on a normal request usually means
// "expired", not "signed out". This retries once behind a silent refresh, and
// only sends the user to the login screen when the refresh itself fails.

let refreshing = null; // shared across concurrent callers

// Several requests can hit a 401 at the same moment. They must not each fire a
// refresh: refresh tokens rotate, so the second one would present a token the
// first had already spent, and the server would read that as a replay and end
// the whole session. One in-flight promise, everyone waits on it.
const refreshSession = () => {
  if (!refreshing) {
    refreshing = fetch(AuthRefreshAPI, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        // Cleared on the next tick so callers that arrived during the request
        // still read this attempt's result rather than starting another.
        setTimeout(() => { refreshing = null; }, 0);
      });
  }
  return refreshing;
};

const signOut = () => {
  localStorage.removeItem("user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const send = (url, method, body, headers) => {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  return fetch(url, {
    cache: "no-store",
    method,
    credentials: "include",
    headers: {
      // Do NOT set Content-Type for FormData — the browser sets it (with boundary)
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body != null && { body: isFormData ? body : JSON.stringify(body) }),
  });
};

const ApiHit = async (url, method = "GET", body = null, headers = {}) => {
  try {
    let res = await send(url, method, body, headers);

    if (res.status === 401) {
      // The refresh call itself returning 401 means the session is genuinely
      // over; retrying it would loop.
      if (url === AuthRefreshAPI) {
        signOut();
        return;
      }

      const renewed = await refreshSession();
      if (!renewed) {
        signOut();
        return;
      }

      // A FormData body is a stream and cannot be replayed, but the same object
      // can be handed to fetch again, which is what happens here.
      res = await send(url, method, body, headers);
      if (res.status === 401) {
        signOut();
        return;
      }
    }

    return await res.json();
  } catch (error) {
    console.error("API ERROR →", error);
    throw error;
  }
};

export default ApiHit;
