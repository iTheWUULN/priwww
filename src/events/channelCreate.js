const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'channelCreate',
    async execute(client, channel) {
        // Audit logları al
        const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate });
        const log = auditLogs.entries.first();
        if (!log) return;  // Eğer audit log bulunamazsa, işlemi durdur.

        const executor = log.executor;
        
        // config.json dosyasını oku
        fs.readFile(configPath, 'utf8', async (err, data) => {
            if (err) {
                console.error('Config dosyası okunamadı:', err);
                return;
            }

            const config = JSON.parse(data); // config.json'u parse et
            const logChannel = channel.guild.channels.cache.get(config.logChannelId);

            // Eğer executor safeUsers listesinde değilse
            if (!config.safeUsers.includes(executor.id)) {
                // Kanali sil
                await channel.delete('İzinsiz kanal oluşturma.');

                // Kullanıcıyı banla
                await channel.guild.members.ban(executor.id, { reason: 'İzinsiz kanal oluşturma.' });

                if (logChannel) {
                    // Embed oluştur
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000') // Kırmızı renk
                        .setTitle('Kanal Silindi ve Kullanıcı Banlandı')
                        .setDescription(`🔨 **${executor.tag}** izinsiz kanal oluşturduğu için banlandı ve kanal silindi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [embed] });
                }
            } else {
                if (logChannel) {
                    // Güvenli kullanıcı için embed oluştur
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Kanal Oluşturma İzni Verildi')
                        .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için kanal oluşturma işlemine izin verildi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [embed] });
                }
            }
        });
    }
};