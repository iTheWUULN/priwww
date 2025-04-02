const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'guildMemberUpdate',
    async execute(client, oldMember, newMember) {
        // Eski ve yeni roller arasında fark olup olmadığını kontrol edin
        if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

        const auditLogs = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate });
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
            const logChannel = newMember.guild.channels.cache.get(config.logChannelId);

            if (!config.safeUsers.includes(executor.id)) {
                try {
                    // Eski rollerle geri yükle
                    await newMember.roles.set(oldMember.roles.cache, 'İzinsiz rol güncellemesi geri alındı.');

                    if (logChannel) {
                        // Embed oluştur
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Rol Güncellemesi İptal Edildi')
                            .setDescription(`🔨 **${executor.tag}** izinsiz rol güncellemesi yaptı, değişiklik geri alındı.`)
                            .addFields(
                                { name: 'Kullanıcı', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                                { name: 'İşlem Yapan', value: `${executor.tag} (${executor.id})`, inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }

                    // Kullanıcıyı banla
                    await newMember.guild.members.ban(executor.id, { reason: 'İzinsiz rol güncelleme.' });

                    if (logChannel) {
                        const banEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Kullanıcı Banlandı')
                            .setDescription(`🔨 **${executor.tag}** izinsiz rol güncellemesi yaptığı için banlandı.`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [banEmbed] });
                    }
                } catch (error) {
                    console.error('Rol güncellemesi geri alınırken hata oluştu:', error);
                    if (logChannel) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Hata Oluştu')
                            .setDescription(`❌ **${executor.tag}** izinsiz rol güncellemesi yaptı, ancak değişiklik geri alınamadı. Hata: **${error.message}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [errorEmbed] });
                    }
                }
            } else {
                if (logChannel) {
                    const allowedEmbed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Rol Güncelleme İzni Verildi')
                        .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için rol güncellemesi işlemine izin verildi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [allowedEmbed] });
                }
            }
        });
    }
};