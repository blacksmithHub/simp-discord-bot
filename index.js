const Discord = require('discord.js')
const axios = require('axios')
const { config } = require('dotenv')

config({ path: __dirname + "/.env" })

const client = new Discord.Client()

const prefix = '!'
const commands = ['help']

const commandList = new Discord.MessageEmbed()
    .setColor('#f7b586')
    .setTitle('Simp Bot Help Commands:')
	.addFields(
		{ name: 'Command list', value: "`!help` \nTo show all available commands", inline: true },
	)

client.once('ready', () => {
    console.log('Simp Bot is now online!');
})

client.on('message', async message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return

    const args = message.content.slice(prefix.length).split(/ +/)
    const command = args.shift().toLowerCase()

    if(!commands.includes(command)) {
        message.author.send(commandList)
        return
    }

    switch (command) {
        case 'help':
            message.author.send(commandList)
            break
    }
})

client.login(process.env.DISCORD_TOKEN)