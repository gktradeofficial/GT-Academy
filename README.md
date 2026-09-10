# GT Academy — Live Student-Teacher Connect (Academy MVP)

Ek private web app jisme students queue mein wait karte hain aur teacher unhe
one-by-one live call (video + audio + chat) pe le sakta hai. Ek "group session"
mode bhi hai jisme teacher ek room khol de aur multiple students ek saath
join ho jayein (Phase 1 mein ye sirf shared text chat + announcement room hai —
har student ka apna live video Phase 2 mein add hoga, neeche "Roadmap" dekhein).

## Kya-kya bana hai

- Marketplace home: browse teachers by subject, rating, availability, and price
- Student booking intent: choose a time, describe the doubt, and confirm a payment hold state
- Teacher dashboard: live queue, profile, ratings, session count, and earnings summary
- Teacher studio: save explained topics, attach PDF resource metadata, and publish mock tests
- Student space: browse the saved content and start topics, PDF resources, and mock tests

- Student side: naam/class daal ke queue join karo, live position dikhta hai
- Teacher side: queue dikhta hai, kisi bhi student ko "Call" karke turant
  1-on-1 video+audio+chat session shuru ho jata hai
- WebRTC se peer-to-peer video/audio (koi central video server nahi chahiye
  chhoti scale ke liye)
- Real-time text chat dono taraf
- Group session toggle (basic version — chat/announcement based)

The payment and payout UI is currently a local prototype. Connect a payment provider
such as Razorpay or Stripe before accepting real money.

The GT Academy library is also a browser-local MVP using `localStorage`. The selected
PDF is represented in the library by its title and file metadata; upload the file to
server or cloud storage when you add authentication and a database.

## Setup (local machine pe chalane ke liye)

```bash
cd server
npm install
npm start
```

Server `http://localhost:3000` pe chalega.

- Teacher: `http://localhost:3000/teacher.html`
- Student: `http://localhost:3000/student.html`

Test karne ke liye do alag browser tabs (ya ek normal + ek incognito) khol
kar dono roles try karein.

## Same WiFi/network pe doosre devices se test karna

1. Apne computer ka local IP pata karein (jaise `192.168.1.5`)
2. Firewall mein port 3000 allow karein
3. Doosre device (phone/laptop) se `http://192.168.1.5:3000` kholen
4. **Camera/mic sirf `localhost` ya HTTPS pe kaam karega** — doosre device se
   agar camera permission na mile, to aapko HTTPS setup karna hoga (neeche
   dekhein) ya ek reverse proxy jaise ngrok use karein for testing:
   ```bash
   npx ngrok http 3000
   ```

## Real users ke liye deploy karna (production)

Ye MVP hai — real students/live class ke liye use karne se pehle ye zaroor karein:

1. **HTTPS** — camera/mic browsers mein sirf secure origin (https://) pe
   kaam karte hain. Deploy karte waqt Render, Railway, ya Vercel+separate
   Node host jaisi service use karein jo free HTTPS de.
2. **Authentication** — abhi koi login nahi hai, koi bhi link khol ke
   "student" ya "teacher" ban sakta hai. Add karein: student login
   (roll number/OTP) aur teacher ke liye password-protected `teacher.html`.
3. **TURN server** — STUN (jo abhi use ho raha hai — Google ka public STUN)
   zyada tar connections ke liye kaam karega, lekin kuch restrictive
   networks (school WiFi, corporate NAT) mein call connect nahi hoga bina
   TURN server ke. Free/cheap options: Twilio TURN, Xirsys, ya khud
   coturn install karein.
4. **Rate limiting / abuse protection** — chat aur queue join pe basic
   rate limiting add karein.
5. **Persistence** — abhi queue state sirf server memory mein hai; server
   restart hone pe queue khali ho jayegi. Production mein Redis use karein.

## Roadmap (agle phases)

- **Phase 2 — Whiteboard:** tldraw ya Excalidraw jaisa shared canvas embed
  karke, taaki teacher aur student dono ek saath likh/draw kar sakein
  doubt solve karte waqt.
- **Phase 3 — Full group video:** abhi group session sirf chat-based hai.
  Multiple live video streams ke liye WebRTC mesh (2-4 students tak) ya
  managed SFU service (LiveKit, Agora, 100ms) use karna hoga — ye scale
  aur reliability dono behtar denge.
- **Phase 4 — Mobile app:** React Native mein wahi backend reuse karke
  Android/iOS app banayenge.
- **Auth & class management:** login system, class-wise student list,
  session history/recordings.

## File structure

```
live-doubt-app/
├── server/
│   ├── server.js       # Express + Socket.io: queue, signaling, chat
│   └── package.json
└── public/
   ├── index.html       # teacher marketplace and product home
    ├── teacher.html      # teacher console
    ├── student.html      # student entry + waiting + call screen
    ├── css/style.css
    └── js/
      ├── teacher.js
      ├── student.js
      └── booking.js
```
