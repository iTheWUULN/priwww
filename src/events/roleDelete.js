const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'roleDelete',
    async execute(client, role) {
        const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete });
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
                    // Silinen rolü geri oluştur
                    const newRole = await role.guild.roles.create({
                        name: role.name,
                        color: role.color,
                        hoist: role.hoist,
                        position: role.position,
                        permissions: role.permissions,
                        mentionable: role.mentionable,
                        reason: 'İzinsiz rol silme işleminden sonra rolü geri oluşturma.',
                    });

                    if (logChannel) {
                        // Embed oluştur
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('İzinsiz Rol Silme')
                            .setDescription(`🔨 **${executor.tag}** izinsiz rol sildiği için rol geri oluşturuldu: **${newRole.name}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }

                    // Kullanıcıyı banla
                    await role.guild.members.ban(executor.id, { reason: 'İzinsiz rol silme.' });

                    if (logChannel) {
                        const banEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Kullanıcı Banlandı')
                            .setDescription(`🔨 **${executor.tag}** izinsiz rol sildiği için banlandı.`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [banEmbed] });
                    }
                } catch (error) {
                    console.error('Rol geri oluşturulurken hata oluştu:', error);
                    if (logChannel) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Hata Oluştu')
                            .setDescription(`❌ **${executor.tag}** izinsiz rol sildi, ancak rol geri oluşturulamadı. Hata: **${error.message}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [errorEmbed] });
                    }
                }
            } else {
                if (logChannel) {
                    const allowedEmbed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Rol Silme İşlemine İzin Verildi')
                        .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için rol silme işlemine izin verildi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [allowedEmbed] });
                }
            }
        });
    }
};