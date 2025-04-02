const Rest = require("@discordjs/rest");
const config = require('../../config.json');
const DiscordApi = require("discord-api-types/v10");
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        const voiceChannelId = config.voiceChannelId; // Ses kanalı ID'si config dosyasından alınır
        const guildId = config.guildId; // Sunucu ID'si config dosyasından alınır

        // Bot hazır olduğunda guild bilgilerini almak için cache kontrolü yapın
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.log(`Sunucu bulunamadı! ID: ${guildId}`);
            return; // Sunucu bulunmazsa işlem sonlanır
        }

        const voiceChannel = guild.channels.cache.get(voiceChannelId);
        if (!voiceChannel) {
            console.log(`Ses kanalı bulunamadı! ID: ${voiceChannelId}`);
            return; // Ses kanalı bulunmazsa işlem sonlanır
        }

        // Ses kanalının geçerli olup olmadığını kontrol et
        if (voiceChannel.type === DiscordApi.ChannelType.GuildVoice) {
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
            });
            console.log(`Bot ${voiceChannel.name} adlı ses kanalına bağlandı.`);
        } else {
            console.log('Belirtilen ses kanalı geçerli bir ses kanalı değil.');
        }

        // Oynuyor durumunu 5 saniyede bir değiştirme
        const statuses = [
            { name: 'discord.gg/mctrp', type: DiscordApi.ActivityType.Playing },
        ];

        let currentStatus = 0;
        setInterval(() => {
            client.user.setActivity(statuses[currentStatus]);
            currentStatus = (currentStatus + 1) % statuses.length; // Status döngüsünü devam ettir
        }, 5000); // 5000 milisaniye = 5 saniye
    }
};
