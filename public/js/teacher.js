const socket = io();

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

// --- DOM refs ---
const statusPill = document.getElementById("status-pill");
const queueList = document.getElementById("queue-list");
const queueEmpty = document.getElementById("queue-empty");
const groupToggleBtn = document.getElementById("group-toggle-btn");
const groupStatus = document.getElementById("group-status");

const sessionIdle = document.getElementById("session-idle");
const callShell = document.getElementById("call-shell");
const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");
const peerNameEl = document.getElementById("peer-name");
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const endCallBtn = document.getElementById("end-call-btn");
const chatLog = document.getElementById("chat-log");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");

let localStream = null;
let pc = null;
let currentPeerId = null;
let groupOpen = false;
let micOn = true;
let camOn = true;

socket.on("connect", () => {
  socket.emit("register-teacher");
  statusPill.textContent = "Connected";
});

socket.on("disconnect", () => {
  statusPill.textContent = "Disconnected";
});

// --- Queue rendering ---
socket.on("queue-updated", (queue) => {
  queueList.innerHTML = "";
  queueEmpty.style.display = queue.length ? "none" : "block";
  queue.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "queue-item";
    li.innerHTML = `
      <div class="queue-item__number">${entry.position}</div>
      <div class="queue-item__info">
        <div class="queue-item__name">${escapeHtml(entry.name)}</div>
        <div class="queue-item__class">${escapeHtml(entry.class)}</div>
      </div>
      <button class="btn btn--primary" data-id="${entry.socketId}">Call</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      socket.emit("call-student", { studentId: entry.socketId });
    });
    queueList.appendChild(li);
  });
});

// --- Group session ---
groupToggleBtn.addEventListener("click", () => {
  if (groupOpen) socket.emit("close-group-session");
  else socket.emit("open-group-session");
});

socket.on("group-session-state", ({ open, count }) => {
  groupOpen = open;
  groupToggleBtn.textContent = open ? "Close group session" : "Open group session";
  groupStatus.textContent = open ? `${count} student(s) connected` : "";
});

socket.on("group-member-joined", ({ studentId, name, class: cls }) => {
  addChatSystemLine(`${name || "A student"} (${cls || "-"}) joined the group session.`);
  // In a full group implementation you would create a peer connection per member.
  // For the MVP, group session is a shared text/announcement room; upgrade to
  // per-member video via an SFU (see README) when you need many live video feeds.
});

socket.on("group-member-left", ({ studentId }) => {
  addChatSystemLine(`A student left the group session.`);
});

// --- 1-on-1 session lifecycle ---
socket.on("session-started", async ({ studentId, name, class: cls }) => {
  currentPeerId = studentId;
  peerNameEl.textContent = `${name || "Student"} — ${cls || ""}`;
  chatLog.innerHTML = "";
  sessionIdle.style.display = "none";
  callShell.style.display = "grid";
  await startCall(true);
});

socket.on("session-ended", () => {
  endCallCleanup();
});

endCallBtn.addEventListener("click", () => {
  if (currentPeerId) socket.emit("end-session", { peerId: currentPeerId });
  endCallCleanup();
});

function endCallCleanup() {
  if (pc) { pc.close(); pc = null; }
  if (localStream) { localStream.getTracks().forEach((t) => t.stop()); localStream = null; }
  callShell.style.display = "none";
  sessionIdle.style.display = "block";
  currentPeerId = null;
}

// --- WebRTC ---
async function startCall(isCaller) {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate && currentPeerId) {
      socket.emit("webrtc-ice-candidate", { to: currentPeerId, candidate: event.candidate });
    }
  };

  if (isCaller) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("webrtc-offer", { to: currentPeerId, sdp: offer });
  }
}

socket.on("webrtc-offer", async ({ from, sdp }) => {
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit("webrtc-answer", { to: from, sdp: answer });
});

socket.on("webrtc-answer", async ({ sdp }) => {
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
});

socket.on("webrtc-ice-candidate", async ({ candidate }) => {
  if (!pc || !candidate) return;
  try { await pc.addIceCandidate(candidate); } catch (e) { console.warn("ICE add failed", e); }
});

// --- Mute / camera toggles ---
muteBtn.addEventListener("click", () => {
  if (!localStream) return;
  micOn = !micOn;
  localStream.getAudioTracks().forEach((t) => (t.enabled = micOn));
  muteBtn.textContent = micOn ? "Mute" : "Unmute";
});

cameraBtn.addEventListener("click", () => {
  if (!localStream) return;
  camOn = !camOn;
  localStream.getVideoTracks().forEach((t) => (t.enabled = camOn));
  cameraBtn.textContent = camOn ? "Camera off" : "Camera on";
});

// --- Chat ---
chatSend.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });

function sendChat() {
  const message = chatInput.value.trim();
  if (!message || !currentPeerId) return;
  socket.emit("chat-message", { to: currentPeerId, message });
  addChatLine("You", message, true);
  chatInput.value = "";
}

socket.on("chat-message", ({ name, message }) => {
  addChatLine(name || "Student", message, false);
});

function addChatLine(author, message, self) {
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.innerHTML = `<span class="chat-msg__author">${escapeHtml(author)}:</span>${escapeHtml(message)}`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addChatSystemLine(text) {
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.style.color = "var(--ink-soft)";
  div.style.fontStyle = "italic";
  div.textContent = text;
  chatLog.appendChild(div);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
