import cors from "cors";
import express from "express";
import { Server, Socket } from "socket.io";
import { PollState } from "./types";

interface ClientToServerEvents {
  vote: (voteId: number, optionId: number) => void;
  askForStateUpdate: () => void;
  enableVote: (voteId: number) => void;
  completeVote: (voteId: number) => void;
  resultsVote: (voteId: number) => void;
  initialVotes: (state: PollState[]) => void;
}
interface ServerToClientEvents {
  updateState: (state: PollState[]) => void;
}
interface InterServerEvents {}
interface SocketData {
  user: string;
}

const app = express();
app.use(cors({ origin: "*" })); // this is the default port that Vite runs your React app on
const server = require("http").createServer(app);
// passing these generic type parameters to the `Server` class
// ensures data flowing through the server are correctly typed.
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// this is middleware that Socket.IO uses on initiliazation to add
// the authenticated user to the socket instance. Note: we are not
// actually adding real auth as this is beyond the scope of the tutorial
io.use(addUserToSocketDataIfAuthenticated);

async function addUserToSocketDataIfAuthenticated(
  socket: Socket,
  next: (err?: Error) => void
) {
  const user = socket.handshake.auth.token;
  if (user) {
    try {
      socket.data = { ...socket.data, user: user };
    } catch (err) {}
  }
  next();
}

let questions: PollState[] = [
  {
    id: 1,
    enabled: false,
    completed: false,
    results: false,
    options: [
      {
        id: 1,
        text: "Утопать в рутине",
        votes: 0,
      },
      {
        id: 2,
        text: "Вырваться на свободу",
        votes: 0,
      },
    ],
  },
  {
    id: 2,
    enabled: false,
    completed: false,
    results: false,
    options: [
      {
        id: 1,
        text: "Поверить в себя",
        votes: 0,
      },
      {
        id: 2,
        text: "Прислушаться к чужому мнению",
        votes: 0,
      },
    ],
  },
  {
    id: 3,
    enabled: false,
    completed: false,
    results: false,
    options: [
      {
        id: 1,
        text: 'Сказать "Прости"',
        votes: 0,
      },
      {
        id: 2,
        text: 'Сказать "Прощай"',
        votes: 0,
      },
    ],
  },
  {
    id: 4,
    enabled: false,
    completed: false,
    results: false,
    options: [
      {
        id: 1,
        text: "Переступить черту",
        votes: 0,
      },
      {
        id: 2,
        text: "Преодолеть свою слабость",
        votes: 0,
      },
    ],
  },
];

io.on("connection", (socket) => {
  console.log("a user connected", socket.data.user);

  // the client will send an 'askForStateUpdate' request on mount
  // to get the initial state of the questions
  socket.on("askForStateUpdate", () => {
    console.log("client asked For State Update");
    socket.emit("updateState", questions);
  });

  socket.on("vote", (voteId: number, optionId: number) => {
    let question = questions.find((qstn) => qstn.id === voteId);
    if (!question) return;

    let option = question.options.find((opt) => opt.id === optionId);
    if (!option) return;
    option.votes++;

    // Send the updated PollState back to all clients
    // io.emit("updateState", questions);
  });

  // set completed vote
  socket.on("enableVote", (voteId: number) => {
    questions = questions.map((el) => {
      el.enabled = false;
      return el;
    });
    let question = questions.find((qstn) => qstn.id === voteId);
    if (!question) return;

    question.enabled = true;
    question.results = false;
    question.completed = false;
    // Send the updated PollState back to all clients
    io.emit("updateState", questions);
  });

  // set completed vote
  socket.on("completeVote", (voteId: number) => {
    let question = questions.find((qstn) => qstn.id === voteId);
    if (!question) return;

    question.enabled = false;
    question.results = false;
    question.completed = true;
    // Send the updated PollState back to all clients
    io.emit("updateState", questions);
  });

  // set results vote
  socket.on("resultsVote", (voteId: number) => {
    questions = questions.map((el) => {
      el.results = false;
      return el;
    });
    let question = questions.find((qstn) => qstn.id === voteId);
    if (!question) return;

    question.enabled = false;
    question.results = true;
    question.completed = false;
    // Send the updated PollState back to all clients
    io.emit("updateState", questions);
  });

  // set initial votes
  socket.on("initialVotes", (votes: PollState[]) => {
    questions = votes;
    // Send the updated PollState back to all clients
    io.emit("updateState", questions);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(8000, () => {
  console.log("listening on *:8000");
});
