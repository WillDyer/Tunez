module.exports = {
    name: "ping",
    category: "info",
    description: "Returns latency and API ping",
    run: async (client, message, args) => {
        const msg = await message.channel.send(`:ping_pong: Pinging...`);

        msg.edit(`:ping_pong: Pong!\nLatency is ${Math.floor(msg.createdAt - message.createdAt)}ms\nAPI Latency Latency ${Math.round(client.ws.ping)}ms`);
    }
};