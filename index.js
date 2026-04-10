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
const WARNS_FILE = path.join(__dirname, 'warns.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
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

function loadWarnsData() {
  try {
    if (!fs.existsSync(WARNS_FILE)) {
      fs.writeFileSync(WARNS_FILE, JSON.stringify({}, null, 2));
    }

    const raw = fs.readFileSync(WARNS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur chargement warns.json :', error);
    return {};
  }
}

function saveWarnsData(warnsData) {
  try {
    fs.writeFileSync(WARNS_FILE, JSON.stringify(warnsData, null, 2));
  } catch (error) {
    console.error('Erreur sauvegarde warns.json :', error);
  }
}

function loadConfigData() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
    }

    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur chargement config.json :', error);
    return {};
  }
}

function saveConfigData(configData) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
  } catch (error) {
    console.error('Erreur sauvegarde config.json :', error);
  }
}

const configData = loadConfigData();

if (configData.antiMassMention === undefined) {
  configData.antiMassMention = false;
}


const warnsData = loadWarnsData();

const loopbanList = loadLoopbanData();

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  try {

    if (loopbanList.has(member.id)) {
      await member.ban({ reason: 'Loopban actif' });
      console.log(`Ban automatique de ${member.user.tag}`);
      return;
    }


    if (configData.serverLocked) {
      await member.kick('Serveur temporairement lock');
      console.log(`${member.user.tag} kick car serveur lock`);
      return;
    }

  } catch (error) {
    console.error(`Erreur guildMemberAdd :`, error);
  }
});

client.on('messageCreate', async (message) => {
  try {
    if (message.author.bot) return;
    if (configData.antiMassMention) {
      const mentionCount =
        message.mentions.users.size +
        message.mentions.roles.size;

      if (
        message.mentions.everyone ||
        mentionCount >= 5
      ) {
        try {
          await message.delete().catch(() => null);

          return message.channel.send(
            `🚫 ${message.author}, les mentions massives sont interdites.`
          );
        } catch (error) {
          console.error("Erreur anti-mass mention :", error);
        }
      }
    }
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



    if (command === '!ban') {
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


    if (command === '!warn') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!warn @utilisateur raison`");
      }

      const reason = args.slice(2).join(' ') || 'Aucune raison';

      if (!warnsData[member.id]) {
        warnsData[member.id] = [];
      }

      warnsData[member.id].push({
        reason,
        moderator: message.author.tag,
        timestamp: new Date().toISOString()
      });

      saveWarnsData(warnsData);

      return message.reply(`✅ ${member.user.tag} a été warn. Total : ${warnsData[member.id].length}`);
    }



    if (command === '!warnings') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!warnings @utilisateur`");
      }

      const userWarns = warnsData[member.id] || [];

      if (userWarns.length === 0) {
        return message.reply(`ℹ️ ${member.user.tag} n'a aucun warn.`);
      }

      const text = userWarns
        .map((warn, index) => `${index + 1}. ${warn.reason} | par ${warn.moderator}`)
        .join('\n');

      return message.reply(`Warns de ${member.user.tag} :\n${text}`);
    }


    if (command === '!unwarn') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!unwarn @utilisateur numéro`");
      }

      const warnIndex = parseInt(args[2], 10);
      if (isNaN(warnIndex) || warnIndex < 1) {
        return message.reply("❌ Donne un numéro de warn valide.");
      }

      const userWarns = warnsData[member.id] || [];
      if (warnIndex > userWarns.length) {
        return message.reply("❌ Ce warn n'existe pas.");
      }

      userWarns.splice(warnIndex - 1, 1);
      warnsData[member.id] = userWarns;
      saveWarnsData(warnsData);

      return message.reply(`✅ Warn ${warnIndex} supprimé pour ${member.user.tag}.`);
    }


    if (command === '!clearwarns') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!clearwarns @utilisateur`");
      }

      warnsData[member.id] = [];
      saveWarnsData(warnsData);

      return message.reply(`✅ Tous les warns de ${member.user.tag} ont été supprimés.`);
    }



    if (command === '!setmuterole') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return message.reply("⛔ Pas la permission.");
      }

      const role = message.mentions.roles.first();
      if (!role) {
        return message.reply("Utilise : `!setmuterole @role`");
      }

      configData.muteRoleId = role.id;
      saveConfigData(configData);

      return message.reply(`✅ Rôle mute défini sur ${role.name}`);
    }



    if (command === '!mute') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!mute @utilisateur`");
      }

      const muteRoleId = configData.muteRoleId;
      if (!muteRoleId) {
        return message.reply("❌ Aucun rôle mute défini. Utilise `!setmuterole @role`");
      }

      const muteRole = message.guild.roles.cache.get(muteRoleId);
      if (!muteRole) {
        return message.reply("❌ Le rôle mute configuré n'existe plus.");
      }

      if (member.roles.cache.has(muteRole.id)) {
        return message.reply("ℹ️ Cet utilisateur est déjà mute.");
      }

      try {
        await member.roles.add(muteRole, `Mute par ${message.author.tag}`);
        return message.reply(`✅ ${member.user.tag} a été mute.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le mute.");
      }
    }


    if (command === '!unmute') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!unmute @utilisateur`");
      }

      const muteRoleId = configData.muteRoleId;
      if (!muteRoleId) {
        return message.reply("❌ Aucun rôle mute défini.");
      }

      const muteRole = message.guild.roles.cache.get(muteRoleId);
      if (!muteRole) {
        return message.reply("❌ Le rôle mute configuré n'existe plus.");
      }

      if (!member.roles.cache.has(muteRole.id)) {
        return message.reply("ℹ️ Cet utilisateur n'est pas mute.");
      }

      try {
        await member.roles.remove(muteRole, `Unmute par ${message.author.tag}`);
        return message.reply(`✅ ${member.user.tag} a été unmute.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le unmute.");
      }
    }



    if (command === '!tempmute') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("⛔ Pas la permission.");
      }

      const member = message.mentions.members.first();
      if (!member) {
        return message.reply("Utilise : `!tempmute @utilisateur duréeEnMinutes`");
      }

      const minutes = parseInt(args[2], 10);
      if (isNaN(minutes) || minutes <= 0) {
        return message.reply("❌ Donne une durée valide en minutes.");
      }

      const muteRoleId = configData.muteRoleId;
      if (!muteRoleId) {
        return message.reply("❌ Aucun rôle mute défini. Utilise `!setmuterole @role`");
      }

      const muteRole = message.guild.roles.cache.get(muteRoleId);
      if (!muteRole) {
        return message.reply("❌ Le rôle mute configuré n'existe plus.");
      }

      if (member.roles.cache.has(muteRole.id)) {
        return message.reply("ℹ️ Cet utilisateur est déjà mute.");
      }

      try {
        await member.roles.add(muteRole, `Tempmute par ${message.author.tag} pour ${minutes} min`);
        message.reply(`✅ ${member.user.tag} a été mute pour ${minutes} minute(s).`);

        setTimeout(async () => {
          try {
            const target = await message.guild.members.fetch(member.id).catch(() => null);
            if (target && target.roles.cache.has(muteRole.id)) {
              await target.roles.remove(muteRole, 'Fin du tempmute');
            }
          } catch (error) {
            console.error('Erreur fin tempmute :', error);
          }
        }, minutes * 60 * 1000);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le tempmute.");
      }
    }



    if (command === '!clear') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return message.reply("⛔ Pas la permission.");
      }

      const amount = parseInt(args[1], 10);

      if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.reply("Utilise : `!clear nombre` avec un nombre entre 1 et 100.");
      }

      try {
        await message.channel.bulkDelete(amount, true);
        const confirm = await message.channel.send(`✅ ${amount} message(s) supprimé(s).`);
        setTimeout(() => confirm.delete().catch(() => {}), 3000);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le clear.");
      }
    }


    if (command === '!purge') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return message.reply("⛔ Pas la permission.");
      }

      try {
        let deleted = 0;

        while (true) {
          const fetched = await message.channel.messages.fetch({ limit: 100 });
          if (fetched.size === 0) break;

          const toDelete = fetched.filter(msg => (Date.now() - msg.createdTimestamp) < 14 * 24 * 60 * 60 * 1000);
          if (toDelete.size === 0) break;

          await message.channel.bulkDelete(toDelete, true);
          deleted += toDelete.size;

          if (toDelete.size < 2) break;
        }

        const confirm = await message.channel.send(`✅ Purge terminée. ${deleted} message(s) supprimé(s).`);
        setTimeout(() => confirm.delete().catch(() => {}), 4000);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant la purge.");
      }
    }


    if (command === '!lock') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return message.reply("⛔ Pas la permission.");
      }

      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SendMessages: false
        });

        return message.reply(`🔒 Salon verrouillé.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le lock.");
      }
    }


    if (command === '!unlock') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return message.reply("⛔ Pas la permission.");
      }

      try {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
          SendMessages: true
        });

        return message.reply(`🔓 Salon déverrouillé.`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le unlock.");
      }
    }


    if (command === '!lockall') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return message.reply("⛔ Pas la permission.");
      }

      try {
        let count = 0;

        for (const [, channel] of message.guild.channels.cache) {
          if (!channel.isTextBased()) continue;
          if (!channel.permissionOverwrites) continue;

          await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false
          }).catch(() => null);

          count++;
        }

        return message.reply(`🔒 Serveur verrouillé sur ${count} salon(s).`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le lockall.");
      }
    }



    if (command === '!unlockall') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return message.reply("⛔ Pas la permission.");
      }

      try {
        let count = 0;

        for (const [, channel] of message.guild.channels.cache) {
          if (!channel.isTextBased()) continue;
          if (!channel.permissionOverwrites) continue;

          await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: true
          }).catch(() => null);

          count++;
        }

        return message.reply(`🔓 Serveur déverrouillé sur ${count} salon(s).`);
      } catch (error) {
        console.error(error);
        return message.reply("❌ Erreur pendant le unlockall.");
      }
    }



    if (command === '!userinfo') {
      const member = message.mentions.members.first() || message.member;

      const roles = member.roles.cache
        .filter(role => role.id !== message.guild.id)
        .map(role => role.name)
        .join(', ') || 'Aucun';

      return message.reply(
        `Infos de ${member.user.tag}\n` +
        `ID : ${member.id}\n` +
        `Compte créé : <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n` +
        `A rejoint le serveur : <t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n` +
        `Rôles : ${roles}`
      );
    }



    if (command === '!serverinfo') {
      return message.reply(
        `Infos serveur\n` +
        `Nom : ${message.guild.name}\n` +
        `ID : ${message.guild.id}\n` +
        `Owner ID : ${message.guild.ownerId}\n` +
        `Membres : ${message.guild.memberCount}\n` +
        `Salons : ${message.guild.channels.cache.size}\n` +
        `Rôles : ${message.guild.roles.cache.size}\n` +
        `Créé le : <t:${Math.floor(message.guild.createdTimestamp / 1000)}:F>`
      );
    }


    if (command === '!lockserver') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.reply("⛔ Pas la permission.");
      }

      configData.serverLocked = true;
      saveConfigData(configData);

      return message.reply("🔒 Serveur verrouillé : les nouveaux membres seront automatiquement kick.");
    }


    if (command === '!unlockserver') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.reply("⛔ Pas la permission.");
      }

      configData.serverLocked = false;
      saveConfigData(configData);

      return message.reply("🔓 Serveur déverrouillé : les membres peuvent rejoindre normalement.");

    }


    if (command === '!antimassmention') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.reply("⛔ Pas la permission.");
      }

      configData.antiMassMention = true;
      saveConfigData(configData);

      return message.reply("✅ Anti-mass mention ACTIVÉ.");
    }


    if (command === '!noantimassmention') {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return message.reply("⛔ Pas la permission.");
      }

      configData.antiMassMention = false;
      saveConfigData(configData);

      return message.reply("❌ Anti-mass mention DÉSACTIVÉ.");
    }


    if (command === '!help') {
      return message.reply(
        `Commandes disponibles :\n\n` +
        `Modération :\n` +
        `!ban @user\n` +
        `!unban ID\n` +
        `!kick @user\n` +
        `!softban @user\n` +
        `!warn @user raison\n` +
        `!warnings @user\n` +
        `!unwarn @user numéro\n` +
        `!clearwarns @user\n` +
        `!mute @user\n` +
        `!unmute @user\n` +
        `!tempmute @user minutes\n\n` +
        `Salon / serveur :\n` +
        `!clear nombre\n` +
        `!purge\n` +
        `!lock\n` +
        `!unlock\n` +
        `!lockall\n` +
        `!unlockall\n` +
        `!lockserver\n` +
        `!unlockserver\n\n` +
        `Protection :\n` +
        `!antimassmention\n` +
        `!noantimassmention\n\n` +
        `Config :\n` +
        `!setmuterole @role\n\n` +
        `Infos :\n` +
        `!userinfo @user\n` +
        `!serverinfo\n\n`
      );
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