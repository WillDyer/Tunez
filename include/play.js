const ytdlDiscord = require("ytdl-core-discord");
const { MessageEmbed } = require("discord.js");

module.exports = {
  async play(song, message) {
    const { PRUNING } = require("../config.json");
    const queue = message.client.queue.get(message.guild.id);

    if (!song) {
      queue.channel.leave();
      message.client.queue.delete(message.guild.id);
      return queue.textChannel.send("🚫 Music queue ended.").catch(console.error);
    }

    try {
      var stream = await ytdlDiscord(song.url, { highWaterMark: 1 << 25 });
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      }

      if (error.message.includes("copyright")) {
        return message.channel
          .send("⛔ A video could not be played due to copyright protection ⛔")
          .catch(console.error);
      } else {
        console.error(error);
      }
    }

    queue.connection.on("disconnect", () => message.client.queue.delete(message.guild.id));

    const dispatcher = queue.connection
      .play(stream, { type: "opus" })
      .on("finish", () => {
        if (collector && !collector.ended) collector.stop();

        if (PRUNING && playingMessage && !playingMessage.deleted)
          playingMessage.delete().catch(console.error);

        if (queue.loop) {
          // if loop is on, push the song back at the end of the queue
          // so it can repeat endlessly
          let lastSong = queue.songs.shift();
          queue.songs.push(lastSong);
          module.exports.play(queue.songs[0], message);
        } else {
          // Recursively play the next song
          queue.songs.shift();
          module.exports.play(queue.songs[0], message);
        }
      })
      .on("error", (err) => {
        console.error(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });
    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    try {
      let colour = message.member.displayHexColor;
      if (colour == '#000000') color = message.memberhoistRole.hexColor;
      let embed = new MessageEmbed()
      .setTitle(song.title)
      .setDescription(`${song.url}`)
      .setColor(colour)
      .setAuthor("🎶 Started Playing 🎶");
      var playingMessage = await queue.textChannel.send(embed);
      await playingMessage.react("⏭");
      await playingMessage.react("⏸");
      await playingMessage.react("🔁");
      await playingMessage.react("⏹");
    } catch (error) {
      console.error(error);
    }

    const filter = (reaction, user) => user.id !== message.client.user.id;
    var collector = playingMessage.createReactionCollector(filter, {
      time: song.duration > 0 ? song.duration * 1000 : 600000
    });

    collector.on("collect", (reaction, user) => {
      // Stop if there is no queue on the server
      if (!queue) return;

      const { channel } = message.member.voice;
      if (!channel) return message.reply("You  need to be in the voice channel first!").catch(console.error);
      
      switch (reaction.emoji.name) {
        case "⏩":
          queue.connection.dispatcher.end();
          queue.textChannel.send(`${user} ⏩ skipped the song`).catch(console.error);
          collector.stop();
          break;

        case "⏸":
          if (queue.playing) {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.pause();
            queue.textChannel.send(`${user} ⏸ paused the music.`).catch(console.error);
          } else {
            queue.playing = !queue.playing;
            queue.connection.dispatcher.resume();
            queue.textChannel.send(`${user} ▶ resumed the music!`).catch(console.error);
          }
          reaction.users.remove(user);
          break;

        case "🔁":
          queue.loop = !queue.loop;
          queue.textChannel.send(`Loop is now ${queue.loop ? "**on**" : "**off**"}`).catch(console.error);
          reaction.users.remove(user);
          break;

        case "⏹":
            queue.songs = [];
            queue.textChannel.send(`${user} ⏹ stopped the music!`).catch(console.error);
            try {
              queue.connection.dispatcher.end();
            } catch (error) {
              console.error(error);
              queue.connection.disconnect();
            }
            collector.stop();
            break;

        default:
          reaction.users.remove(user);
          break;
        
      }
  });

    collector.on("end", () => {
      playingMessage.reactions.removeAll();
    });
  }
};
