const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'roleUpdate',
    async execute(client, oldRole, newRole) {
        const auditLogs = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate });
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
            const logChannel = newRole.guild.channels.cache.get(config.logChannelId);

            if (!config.safeUsers.includes(executor.id)) {
                try {
                    // Rolü eski haline geri getir
                    await newRole.edit({
                        name: oldRole.name,
                        color: oldRole.color,
                        hoist: oldRole.hoist,
                        position: oldRole.position,
                        permissions: oldRole.permissions,
                        mentionable: oldRole.mentionable,
                    }, 'İzinsiz rol güncellemesi geri alındı.');

                    if (logChannel) {
                        // Embed oluştur
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('İzinsiz Rol Güncellemesi Geri Alındı')
                            .setDescription(`🔨 **${executor.tag}** izinsiz rol güncellediği için rol eski haline getirildi.`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }

                    // Kullanıcıyı banla
                    await newRole.guild.members.ban(executor.id, { reason: 'İzinsiz rol güncelleme.' });

                    if (logChannel) {
                        const banEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Kullanıcı Banlandı')
                            .setDescription(`🔨 **${executor.tag}** izinsiz rol güncellediği için banlandı.`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [banEmbed] });
                    }
                } catch (error) {
                    console.error('Rol geri yüklenirken hata oluştu:', error);
                    if (logChannel) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Hata Oluştu')
                            .setDescription(`❌ **${executor.tag}** izinsiz rol güncelledi, ancak rol eski haline getirilemedi. Hata: **${error.message}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [errorEmbed] });
                    }
                }
            } else {
                if (logChannel) {
                    const allowedEmbed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Rol Güncelleme İşlemine İzin Verildi')
                        .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için rol güncelleme işlemine izin verildi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [allowedEmbed] });
                }
            }
        });
    }
};