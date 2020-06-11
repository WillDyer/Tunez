/**
 * Module Imports
 */
const { Client, Collection } = require("discord.js");
const { readdirSync } = require("fs");
const { join } = require("path");
const { TOKEN, PREFIX } = require("./config.json");
const { cpuUsage } = require("process");

const client = new Client({ disableEveryone: true, disabledEvents: ["TYPING_START"] });

client.login(TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();

/**
 * Client Events
 */
client.on("ready", () => {
  console.log(`${client.user.username} ready!`);
  client.user.setActivity(`Music | ${PREFIX}`);
});
client.on("warn", (info) => console.log(info));
client.on("error", console.error);

/**
 * Import all commands
*/
const commandFiles = readdirSync(join(__dirname, "commands")).filter((file) => file.endsWith(".js"));
console.log('Command: Load Status')
for (const file of commandFiles) {
  const command = require(join(__dirname, "commands", `${file}`));
  if (command) {
    client.commands.set(command.name, command);
    console.log('✅', file)
  } else {
    console.log('❌', file)
    continue;
  }
}

client.on("message", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  if (message.content.startsWith(PREFIX)) {
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command =
      client.commands.get(commandName) ||
      client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
      command.execute(message, args);
    } catch (error) {
      console.error(error);
      message.reply("There was an error executing that command.").catch(console.error);
    }
  }
});
