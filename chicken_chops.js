/**
 * Prepare dependencies
 */
const Discord = require("discord.js");
const axios = require("axios");
const randomstring = require("randomstring");
const { config } = require("dotenv");
const client = new Discord.Client();
const _ = require('lodash')

// allow access to .env file
config({ path: __dirname + "/.env" });

const headers = {
  Authorization: `Bearer ${process.env.API_TOKEN}`
}

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

// command prefix
const prefix = "!";
// available commands
const commands = ["help", "genresis", "usage", "genisps"];

// prepare embed message
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
      name: "Generate Residentials",
      value:
        "`!genresis {proxyUsername} {proxyPassword} {planId} {quantity} {country}` \nTo generate your Residential SIMProxies",
      inline: true,
    },
    {
      name: "Generate ISPs",
      value:
        "`!genisps {usesrID} {planId}` \nTo generate your ISP SIMProxies",
      inline: true,
    },
    {
      name: "Usage",
      value:
        "`!usage {userId} {planId}` \nTo show your current usage in your Residential Plan",
      inline: true,
    }
  );

/**
 * Trigger once ready.
 */
client.once("ready", () => {
  console.log("Simp Bot is now online!");
});

/**
 * Watch message event.
 */
client.on("message", async (message) => {
  try {
    /**
     * allow messages from DMs only.
     * allow messages with prefix only.
     * don't allow messages from bots.
     */
    if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type !== 'dm') return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    // send command list if command doesn't exists
    if (!commands.includes(command)) {
      message.author.send(commandList);
      return;
    }

    switch (command) {
      // trigger !help command
      case "help":
        message.author.send(commandList);
        break;

      // trigger !genresis command
      case "genresis": {
        let [proxyUsername, proxyPassword, planId, quantity, country] = args;

        if (!proxyUsername) return message.author.send("Missing proxy username");

        if (!proxyPassword) return message.author.send("Missing proxy password");

        if (!planId) return message.author.send("Missing plan ID");

        if (!quantity) return message.author.send("Missing quantity");

        if (parseInt(quantity) && quantity < 1) return message.author.send("Quantity must be > 0");

        if (!country) return message.author.send("Missing country");

        country = country.toLowerCase();

        const list = []

        for (let index = 0; index < quantity; index++) {
          const rnd = randomstring.generate(6)
          list.push(`residential.hypebit.io:19198:username-${proxyUsername}-plan-${planId}-country-${country}-session-${rnd}:${proxyPassword}`)
        }
        
        message.author.send(list);

        break
      }

      // trigger !usage command
      case "usage": {
        let [subuserId, planId] = args;
        if (!subuserId) return message.author.send("Missing user ID");
        if (!planId) return message.author.send("Missing plan ID");

        const response = await axios({
          url: `${process.env.API_URL}/v1/subusers/${subuserId}/residential/${planId}`,
          method: "get",
          headers: headers,
        });

        message.author.send(
          `You have used ${formatBytes(
            response.data.data.usage,
            2
          )} out of ${formatBytes(response.data.data.data, 2)}.`
        );

        break
      }

       // trigger !genisps command
      case "genisps": {
        let [subuserId, planId] = args;
        if (!subuserId) return message.author.send("Missing user ID");
        if (!planId) return message.author.send("Missing plan ID");

        const responseisp = await axios({
          url: `${process.env.API_URL}/v1/subusers/${subuserId}/isp/${planId}`,
          method: "get",
          headers: headers,
        })
        .then(({data}) => data)
        .catch(({response}) => response);

        if(responseisp && !responseisp.statusCode && responseisp.data.success) {
          // chunk the response to 10 items
          const chunked = _.chunk(responseisp.data.ips, 10);

          // send them by chunk
          for (let index = 0; index < chunked.length; index++) {
            message.author.send(chunked[index]);
          }

          message.author.send('To use your IPs, Add :19198:{username}:{password}\nExample: 192.1.1.1:19198:user:pass')
        } else if (responseisp && !responseisp.statusCode && !responseisp.data.success) {
          message.author.send(responseisp.data.message)
        } else {
          console.log(responseisp);
        }

        break
      }
    }
  } catch (error) {
    console.error(error);
  }
});

client.login(process.env.DISCORD_TOKEN);