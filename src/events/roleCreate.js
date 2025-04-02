const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'roleCreate',
    async execute(client, role) {
        const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate });
        const log = auditLogs.entries.first();
        if (!log) return;  // Eğer audit log bulunamazsa, işlemi durdur.

        const executor = log.executor;

        // config.json dosyasını oku
        fs.readFile(configPath, 'utf8', async (err, data) => {
            if (err) {
                console.error('Config dosyası okunamadı:', err);
                return;
            }

            const config = JSON.parse(data);
            const logChannel = role.guild.channels.cache.get(config.logChannelId);

            if (!config.safeUsers.includes(executor.id)) {
                try {
                    // Rolü sil
                    await role.delete('İzinsiz rol oluşturma.');

                    // Kullanıcıyı banla
                    await role.guild.members.ban(executor.id, { reason: 'İzinsiz rol oluşturma.' });

                    if (logChannel) {
                        // Embed oluştur
                        const embed = new EmbedBuilder()
                        .setColor('#ff0000') // Kırmızı renk
                        .setTitle('İzinsiz Rol Oluşturma')
                        .setDescription(`🔨 **${executor.tag}** izinsiz rol oluşturduğu için banlandı ve rol silindi.`)
                        .addFields({ name: 'Rol Adı', value: role.name, inline: true }) // Hata burada düzeltiliyor
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });                    

                        logChannel.send({ embeds: [embed] });
                    }
                } catch (error) {
                    console.error('Rol silinirken hata oluştu:', error);
                    if (logChannel) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Hata Oluştu')
                            .setDescription(`❌ Rol silinemedi. Hata: **${error.message}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [errorEmbed] });
                    }
                }
            } else {
                if (logChannel) {
                    const allowedEmbed = new EmbedBuilder()
                    .setColor('#00ff00') // Yeşil renk
                    .setTitle('Rol Oluşumuna İzin Verildi')
                    .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için rol oluşturma işlemine izin verildi.`)
                    .addFields({ name: 'Rol Adı', value: role.name, inline: true }) // Hata burada düzeltiliyor
                    .setTimestamp()
                    .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });                

                    logChannel.send({ embeds: [allowedEmbed] });
                }
            }
        });
    }
};