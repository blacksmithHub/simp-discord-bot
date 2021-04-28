const Discord = require("discord.js");
const axios = require("axios");
const randomstring = require("randomstring");
const { config } = require("dotenv");

config({ path: __dirname + "/.env" });

const formatBytes = (bytes, decimals) => {
  if (typeof bytes === "string") bytes = parseInt(bytes);
  if (isNaN(parseInt(bytes))) return bytes;
  if (bytes === 0) return "0 Bytes";
  const k = 1000;
  const dm = decimals + 1 || 3;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return {
    value: parseFloat((bytes / k ** i).toFixed(dm)),
    unit: sizes[i],
    toString: function () {
      return `${this.value} ${this.unit}`;
    },
  };
};

const client = new Discord.Client();

const prefix = "!";
const commands = ["help", "gen", "usage"];

const commandList = new Discord.MessageEmbed()
  .setColor("#f7b586")
  .setTitle("Simp Bot Help Commands:")
  .addFields(
    {
      name: "Command list",
      value: "`!help` \nTo show all available commands",
      inline: true,
    },
    {
      name: "Generate",
      value:
        "`!gen {proxyUsername} {proxyPassword} {planId} {quantity} {country}` \nTo generate your Residential SIMProxies",
      inline: true,
    },
    {
      name: "Usage",
      value:
        "`!usage {userId} {planId}` \nTo show your current usage in your Residential Plan",
      inline: true,
    }
  );

client.once("ready", () => {
  console.log("Simp Bot is now online!");
});

client.on("message", async (message) => {
  try {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (!commands.includes(command)) {
      message.author.send(commandList);
      return;
    }

    switch (command) {
      case "help":
        message.author.send(commandList);
        break;
      case "gen": {
        let [proxyUsername, proxyPassword, planId, quantity, country] = args;
        if (!proxyUsername)
          return message.author.send("Missing proxy username");
        if (!proxyPassword)
          return message.author.send("Missing proxy password");
        if (!planId) return message.author.send("Missing plan ID");
        if (!quantity) return message.author.send("Missing quantity");
        if (quantity < 1) return message.author.send("Quantity must be > 0");
        if (!country) return message.author.send("Missing country");

        country = country.toLowerCase();
        const proxyList = [...Array(quantity)]
          .map(
            () =>
              `residential.hypebit.io:19198:username-${proxyUsername}-plan-${planId}-country-${country}-session-${randomstring.generate(
                6
              )}:${proxyPassword}`
          )
          .join("\n");

        return message.author.send(proxyList);
      }
      case "usage": {
        let [subuserId, planId] = args;
        if (!subuserId) return message.author.send("Missing user ID");
        if (!planId) return message.author.send("Missing plan ID");

        const response = await axios({
          url: `${process.env.API}/v1/subusers/${subuserId}/residential/${planId}`,
          method: "get",
          headers: {
            Authorization: "Bearer 7BuSdF2pEX",
          },
        });

        return message.author.send(
          `You have used ${formatBytes(
            response.data.data.usage,
            2
          )} out of ${formatBytes(response.data.data.data, 2)}.`
        );
      }
    }
  } catch (error) {
    console.error(error);
  }
});
client.login(process.env.DISCORD_TOKEN);