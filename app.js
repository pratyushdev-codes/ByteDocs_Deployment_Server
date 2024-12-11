const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require('cors'); // Make sure to install cors package

const app = express();
const server = http.createServer(app);

// Configure CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Correct frontend origin
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});


// Mongoose connection
mongoose.connect("mongodb://localhost/google-docs-clone", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// CORS middleware for express
app.use(cors({
  origin: 'http://localhost:3000', // Allow frontend origin
  credentials: true
}));


// Socket.IO connection handling
io.on("connection", socket => {
  console.log("New client connected");

  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit("load-document", document.data)

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta)
    })

    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: "" })
}

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});