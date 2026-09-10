const socket = io();

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

// --- DOM refs ---
const statusPill = document.getElementById("status-pill");
const entryScreen = document.getElementById("entry-screen");
const waitingScreen = document.getElementById("waiting-screen");
const callShell = document.getElementById("call-shell");

const nameInput = document.getElementById("name-input");
const classInput = document.getElementById("class-input");
const joinQueueBtn = document.getElementById("join-queue-btn");
const joinGroupBtn = document.getElementById("join-group-btn");
const leaveQueueBtn = document.getElementById("leave-queue-btn");

const queuePositionEl = document.getElementById("queue-position");
const queueTotalEl = document.getElementById("queue-total");

const remoteVideo = document.getElementById("remote-video");
const localVideo = document.getElementById("local-video");
const muteBtn = document.getElementById("mute-btn");
const cameraBtn = document.getElementById("camera-btn");
const endCallBtn = document.getElementById("end-call-btn");
const chatLog = document.getElementById("chat-log");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");

let localStream = null;
let pc = null;
let teacherId = null;
let micOn = true;
let camOn = true;
let inGroupSession = false;

socket.on("connect", () => { statusPill.textContent = "Connected"; });
socket.on("disconnect", () => { statusPill.textContent = "Disconnected"; });

socket.on("group-session-state", ({ open }) => {
  joinGroupBtn.style.display = open && entryScreen.style.display !== "none" ? "block" : "none";
});

// --- Entry ---
joinQueueBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const studentClass = classInput.value.trim();
  if (!name) { nameInput.focus(); return; }
  socket.emit("join-queue", { name, class: studentClass });
  entryScreen.style.display = "none";
  waitingScreen.style.display = "block";
});

joinGroupBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const studentClass = classInput.value.trim();
  if (!name) { nameInput.focus(); return; }
  inGroupSession = true;
  socket.emit("join-group-session", { name, class: studentClass });
  entryScreen.style.display = "none";
  waitingScreen.style.display = "none";
  callShell.style.display = "flex";
  chatLog.innerHTML = "";
  addChatSystemLine("You joined the group session. Chat is shared with the teacher and class.");
});

leaveQueueBtn.addEventListener("click", () => {
  socket.emit("leave-queue");
  waitingScreen.style.display = "none";
  entryScreen.style.display = "block";
});

// --- Queue position updates ---
socket.on("queue-position", ({ position, total }) => {
  queuePositionEl.textContent = position;
  queueTotalEl.textContent = `out of ${total} waiting`;
});

// --- 1-on-1 session start (teacher called this student) ---
socket.on("session-started", async ({ teacherId: tId }) => {
  teacherId = tId;
  waitingScreen.style.display = "none";
  entryScreen.style.display = "none";
  callShell.style.display = "flex";
  chatLog.innerHTML = "";
  await prepareLocalMedia();
  // Student is the callee; waits for offer from teacher.
});

socket.on("session-ended", () => { cleanupCall(); backToEntry(); });
socket.on("group-session-ended", () => { cleanupCall(); backToEntry(); });

endCallBtn.addEventListener("click", () => {
  if (inGroupSession) {
    socket.emit("leave-group-session");
  } else if (teacherId) {
    socket.emit("end-session", { peerId: teacherId });
  }
  cleanupCall();
  backToEntry();
});

function backToEntry() {
  callShell.style.display = "none";
  entryScreen.style.display = "block";
  teacherId = null;
  inGroupSession = false;
}

function cleanupCall() {
  if (pc) { pc.close(); pc = null; }
  if (localStream) { localStream.getTracks().forEach((t) => t.stop()); localStream = null; }
}

// --- WebRTC ---
async function prepareLocalMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;

  pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => { remoteVideo.srcObject = event.streams[0]; };

  pc.onicecandidate = (event) => {
    if (event.candidate && teacherId) {
      socket.emit("webrtc-ice-candidate", { to: teacherId, candidate: event.candidate });
    }
  };
}

socket.on("webrtc-offer", async ({ from, sdp }) => {
  teacherId = from;
  if (!pc) await prepareLocalMedia();
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
  if (!message || !teacherId) return;
  socket.emit("chat-message", { to: teacherId, message });
  addChatLine("You", message);
  chatInput.value = "";
}

socket.on("chat-message", ({ name, message }) => {
  addChatLine(name || "Teacher", message);
});

function addChatLine(author, message) {
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
