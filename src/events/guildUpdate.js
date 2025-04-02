const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'guildUpdate',
    async execute(client, oldGuild, newGuild) {
        const auditLogs = await newGuild.fetchAuditLogs({ type: AuditLogEvent.GuildUpdate });
        const log = auditLogs.entries.first();
        if (!log) return; // Eğer audit log bulunamazsa, işlemi durdur.

        const executor = log.executor;

        // config.json dosyasını oku
        fs.readFile(configPath, 'utf8', async (err, data) => {
            if (err) {
                console.error('Config dosyası okunamadı:', err);
                return;
            }

            const config = JSON.parse(data);
            const logChannel = newGuild.channels.cache.get(config.logChannelId);

            if (!config.safeUsers.includes(executor.id)) {
                try {
                    // Sunucu adını geri al
                    if (config.oldGuildName && newGuild.name !== config.oldGuildName) {
                        await newGuild.setName(config.oldGuildName);
                    }

                    /*Özel davet bağlantısını geri al
                    const invites = await newGuild.invites.fetch();
                    const inviteExists = invites.some(invite => invite.code === config.oldGuildInvite);
                    
                    if (!inviteExists && config.oldGuildInvite) {
                        // Geçerli bir metin kanalı al
                        const textChannel = "1276195494472847514" //newGuild.channels.cache.find(channel => channel.type === 'GUILD_TEXT' && channel.permissionsFor(newGuild.me).has(['SEND_MESSAGES', 'CREATE_INSTANT_INVITE']));

                        if (textChannel) {
                            const invite = await textChannel.createInvite({
                                maxUses: 0,  // Sınırsız kullanım
                                unique: false,  // Aynı davet kodunu kullan
                            });

                            // Eski davet kodunu geri ayarla
                            config.oldGuildInvite = invite.code; // İsteğe bağlı olarak eski kodu güncelleyin
                        } else {
                            console.error('Geçerli bir metin kanalı bulunamadı.');
                        }
                    }*/

                    // Profil resmini geri al
                    if (config.oldGuildIconURL && newGuild.iconURL() !== config.oldGuildIconURL) {
                        // Profil resmini ayarla
                        await newGuild.setIcon(config.oldGuildIconURL);
                    }

                    if (logChannel) {
                        // Embed oluştur
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Sunucu Ayarları Geri Alındı')
                            .setDescription(`🔨 **${executor.tag}** izinsiz sunucu ayarlarını değiştirdiği için banlandı ve değişiklik geri alındı.`)
                            .addFields(
                                { name: 'Eski Sunucu Adı', value: config.oldGuildName || 'Yok', inline: true },
                                { name: 'Eski Davet Kodu', value: config.oldGuildInvite || 'Yok', inline: true },
                                { name: 'Eski Profil Resmi', value: config.oldGuildIconURL ? '[Görüntüle](link)' : 'Yok', inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }

                    // Kullanıcıyı banla
                    await newGuild.members.ban(executor.id, { reason: 'İzinsiz sunucu ayarlarını değiştirme.' });
                } catch (error) {
                    // Hata durumunda log kanalına mesaj gönder
                    if (logChannel) {
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Hata Oluştu')
                            .setDescription(`❌ Değişiklik geri alınamadı. Hata: **${error.message}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [errorEmbed] });
                    }
                    console.error('Sunucu güncellenirken hata oluştu:', error);
                }
            } else {
                if (logChannel) {
                    const allowedEmbed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Sunucu Ayarları Güncellemesine İzin Verildi')
                        .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için sunucu ayarlarını değiştirmesine izin verildi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [allowedEmbed] });
                }
            }
        });
    }
};