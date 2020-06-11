const { MessageEmbed } = require("discord.js");

module.exports = {
  name: "help",
  aliases: ["h"],
  description: "Display all commands and descriptions",
  execute(message) {
    let commands = message.client.commands.array();

    let colour = message.member.displayHexColor;
    if (colour == '#000000') color = message.memberhoistRole.hexColor;
    let helpEmbed = new MessageEmbed()
      .setTitle("Tunez Help")
      .setDescription("List of all commands")
      .setColor(colour);

    commands.forEach((cmd) => {
      helpEmbed.addField(
        `**${message.client.prefix}${cmd.name} ${cmd.aliases ? `(${cmd.aliases})` : ""}**`,
        `${cmd.description}`,
        true
      );
    });

    helpEmbed.setTimestamp();

    return message.channel.send(helpEmbed);
  }
};
