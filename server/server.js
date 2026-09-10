/**
 * Live Doubt-Solving Platform — Signaling Server
 * ------------------------------------------------
 * Handles:
 *  - Student queue (join / leave / position updates)
 *  - Teacher pulling a student out of the queue into a 1-on-1 session
 *  - Group session mode (teacher opens a room, many students join)
 *  - WebRTC signaling relay (offer / answer / ICE candidates)
 *  - Text chat relay
 *
 * Security note: signaling is protected by an optional teacher token. Set
 * TEACHER_SOCKET_TOKEN before exposing this server beyond local development.
 */

const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean)
]);
const teacherToken = process.env.TEACHER_SOCKET_TOKEN || "";

app.disable("x-powered-by");
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed"));
  },
  methods: ["GET"]
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests. Try again later." }
}));
app.use(express.json({ limit: "32kb" }));

const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 32 * 1024,
});

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "..", "public")));

function cleanText(value, fallback = "", maxLength = 120) {
  if (typeof value !== "string") return fallback;
  return value.replace(/[<>]/g, "").trim().slice(0, maxLength) || fallback;
}

function isValidSocketId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{10,80}$/.test(value);
}

function teacherAuthorized(socket, token) {
  if (!teacherToken) return false;
  return typeof token === "string" && token.length === teacherToken.length && token === teacherToken;
}

// ---- In-memory state (fine for a single teacher / small scale MVP) ----
// For Phase 2+, move this into Redis so it survives restarts / scales out.

/** @type {Array<{socketId: string, name: string, class: string, joinedAt: number}>} */
let queue = [];

/** socketId (teacher) -> true, so we know who is allowed to manage the queue */
const teacherSockets = new Set();

/** studentSocketId -> teacherSocketId, active 1-on-1 sessions */
const activeSessions = new Map();

/** Group session state: null when closed, else { teacherId, members: Set<studentSocketId> } */
let groupSession = null;

function broadcastQueue() {
  const publicQueue = queue.map((q, i) => ({
    position: i + 1,
    name: q.name,
    class: q.class,
    socketId: q.socketId,
  }));
  teacherSockets.forEach((id) => io.to(id).emit("queue-updated", publicQueue));
  queue.forEach((q, i) => {
    io.to(q.socketId).emit("queue-position", { position: i + 1, total: queue.length });
  });
}

io.on("connection", (socket) => {
  // --- Identify role ---
  socket.on("register-teacher", ({ token } = {}) => {
    if (!teacherAuthorized(socket, token)) {
      socket.emit("authorization-failed");
      return;
    }
    teacherSockets.add(socket.id);
    socket.emit("queue-updated", queue.map((q, i) => ({
      position: i + 1,
      name: q.name,
      class: q.class,
      socketId: q.socketId,
    })));
    if (groupSession) {
      socket.emit("group-session-state", { open: true, count: groupSession.members.size });
    }
  });

  // --- Student joins the waiting queue ---
  socket.on("join-queue", ({ name, class: studentClass } = {}) => {
    if (queue.some((q) => q.socketId === socket.id)) return; // already queued
    queue.push({ socketId: socket.id, name: cleanText(name, "Student", 80), class: cleanText(studentClass, "-", 80), joinedAt: Date.now() });
    socket.data.name = cleanText(name, "Student", 80);
    socket.data.class = cleanText(studentClass, "-", 80);
    broadcastQueue();
  });

  socket.on("leave-queue", () => {
    queue = queue.filter((q) => q.socketId !== socket.id);
    broadcastQueue();
  });

  // --- Teacher pulls a specific student out of the queue for a 1-on-1 call ---
  socket.on("call-student", ({ studentId } = {}) => {
    if (!teacherSockets.has(socket.id)) return;
    if (!isValidSocketId(studentId)) return;
    const entry = queue.find((q) => q.socketId === studentId);
    if (!entry) return;
    queue = queue.filter((q) => q.socketId !== studentId);
    activeSessions.set(studentId, socket.id);
    io.to(studentId).emit("session-started", { teacherId: socket.id });
    socket.emit("session-started", { studentId, name: entry.name, class: entry.class });
    broadcastQueue();
  });

  socket.on("end-session", ({ peerId } = {}) => {
    if (!isValidSocketId(peerId)) return;
    activeSessions.delete(peerId);
    activeSessions.delete(socket.id);
    io.to(peerId).emit("session-ended");
  });

  // --- Group session mode: teacher opens a room, any student can join directly ---
  socket.on("open-group-session", () => {
    if (!teacherSockets.has(socket.id)) return;
    groupSession = { teacherId: socket.id, members: new Set() };
    io.emit("group-session-state", { open: true, count: 0 });
  });

  socket.on("close-group-session", () => {
    if (!teacherSockets.has(socket.id) || !groupSession) return;
    groupSession.members.forEach((id) => io.to(id).emit("group-session-ended"));
    groupSession = null;
    io.emit("group-session-state", { open: false, count: 0 });
  });

  socket.on("join-group-session", ({ name, class: studentClass } = {}) => {
    if (!groupSession) {
      socket.emit("group-session-ended");
      return;
    }
    groupSession.members.add(socket.id);
    socket.data.name = cleanText(name, "Student", 80);
    socket.data.class = cleanText(studentClass, "-", 80);
    io.to(groupSession.teacherId).emit("group-member-joined", { studentId: socket.id, name: socket.data.name, class: socket.data.class });
    io.emit("group-session-state", { open: true, count: groupSession.members.size });
  });

  socket.on("leave-group-session", () => {
    if (groupSession && groupSession.members.has(socket.id)) {
      groupSession.members.delete(socket.id);
      io.to(groupSession.teacherId).emit("group-member-left", { studentId: socket.id });
      io.emit("group-session-state", { open: true, count: groupSession.members.size });
    }
  });

  // --- WebRTC signaling relay (works for both 1-on-1 and group, peer-to-peer per pair) ---
  socket.on("webrtc-offer", ({ to, sdp } = {}) => {
    if (isValidSocketId(to) && sdp && typeof sdp === "object") io.to(to).emit("webrtc-offer", { from: socket.id, sdp });
  });
  socket.on("webrtc-answer", ({ to, sdp } = {}) => {
    if (isValidSocketId(to) && sdp && typeof sdp === "object") io.to(to).emit("webrtc-answer", { from: socket.id, sdp });
  });
  socket.on("webrtc-ice-candidate", ({ to, candidate } = {}) => {
    if (isValidSocketId(to) && candidate && typeof candidate === "object") io.to(to).emit("webrtc-ice-candidate", { from: socket.id, candidate });
  });

  // --- Chat relay ---
  socket.on("chat-message", ({ to, message } = {}) => {
    const safeMessage = cleanText(message, "", 1000);
    if (!isValidSocketId(to) || !safeMessage) return;
    io.to(to).emit("chat-message", { from: socket.id, name: socket.data.name || "Teacher", message: safeMessage });
  });

  // --- Cleanup on disconnect ---
  socket.on("disconnect", () => {
    teacherSockets.delete(socket.id);

    const wasQueued = queue.some((q) => q.socketId === socket.id);
    if (wasQueued) {
      queue = queue.filter((q) => q.socketId !== socket.id);
      broadcastQueue();
    }

    if (activeSessions.has(socket.id)) {
      const peer = activeSessions.get(socket.id);
      io.to(peer).emit("session-ended");
      activeSessions.delete(socket.id);
    }
    for (const [studentId, teacherId] of activeSessions.entries()) {
      if (teacherId === socket.id) {
        io.to(studentId).emit("session-ended");
        activeSessions.delete(studentId);
      }
    }

    if (groupSession) {
      if (groupSession.teacherId === socket.id) {
        groupSession.members.forEach((id) => io.to(id).emit("group-session-ended"));
        groupSession = null;
        io.emit("group-session-state", { open: false, count: 0 });
      } else if (groupSession.members.has(socket.id)) {
        groupSession.members.delete(socket.id);
        io.to(groupSession.teacherId).emit("group-member-left", { studentId: socket.id });
        io.emit("group-session-state", { open: true, count: groupSession.members.size });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Live doubt-solving server running at http://localhost:${PORT}`);
});
