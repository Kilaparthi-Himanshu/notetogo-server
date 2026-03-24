import { Server } from "@hocuspocus/server";

const server = new Server({
    port: 1234,
});

server.listen();

console.log("Hocuspocus server running on ws://localhost:1234");

    // const server = new Server({
    //   port: 1234,

    //   onAuthenticate(data) {
    //     // auth logic (JWT, cookies etc.)
    //   },

    //   onConnect(data) {
    //     console.log("Client connected")
    //   },

    //   onDisconnect(data) {
    //     console.log("Client disconnected")
    //   },
    // })
