// async function getMe() {
//   const res = await fetch('/api/me');
//   const data = await res.json();
//   return data.user;
// }

async function getMe() {
  const res = await fetch("/api/me", { credentials: "include" });
  const data = await res.json();
  return data.user;
}

// async function logout() {
//   await fetch("/api/logout", { method: "POST" });
//   window.location.href = "/login.html";
// }

async function logout() {
  await fetch("/api/logout", {
    method: "POST",
    credentials: "include",
  });
  window.location.href = "/index.html";
}
