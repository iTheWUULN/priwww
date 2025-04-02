const { AuditLogEvent, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'channelUpdate',
    async execute(client, oldChannel, newChannel) {
        // Audit log'ları al
        const auditLogs = await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate });
        const log = auditLogs.entries.first();

        // Log bulunamazsa, işlemi durdur
        if (!log) {
            console.log('Audit log bulunamadı.');
            return;
        }

        const executor = log.executor;

        // config.json dosyasını oku
        fs.readFile(configPath, 'utf8', async (err, data) => {
            if (err) {
                console.error('Config dosyası okunamadı:', err);
                return;
            }

            const config = JSON.parse(data);
            const logChannel = newChannel.guild.channels.cache.get(config.logChannelId);

            console.log(`Kanal Güncelleme Logu: ${executor.tag} (${executor.id})`);
            console.log(`Güvenli Kullanıcı Listesi: ${config.safeUsers}`);

            // Güvenli kullanıcı kontrolü
            if (!config.safeUsers.includes(executor.id)) {
                try {
                    // Kanalı eski haliyle geri al
                    await newChannel.edit({
                        name: oldChannel.name || newChannel.name,  // Eski isim veya mevcut isim
                        topic: oldChannel.topic || newChannel.topic,  // Eski konu veya mevcut konu
                        position: oldChannel.position || newChannel.position,  // Eski konum veya mevcut konum
                        parent: oldChannel.parent ? oldChannel.parent.id : null  // Eski kategori veya mevcut kategori
                    }, 'İzinsiz kanal güncelleme.');

                    // Log kanalına mesaj gönder
                    if (logChannel) {
                        // Embed oluştur
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Kanal Güncellemesi İptal Edildi')
                            .setDescription(`🔨 **${executor.tag}** izinsiz kanal güncellediği için banlandı ve değişiklik geri alındı.`)
                            .addFields(
                                { name: 'Eski Kanal Adı', value: oldChannel.name || 'Yok', inline: true },
                                { name: 'Yeni Kanal Adı', value: newChannel.name || 'Yok', inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }
                    
                    // Kullanıcıyı banla
                    await newChannel.guild.members.ban(executor.id, { reason: 'İzinsiz kanal güncelleme.' });
                } catch (error) {
                    // Hata durumunda log kanalına mesaj gönder
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Kanal Güncellenirken Hata')
                            .setDescription(`❌ Değişiklik geri alınamadı. Hata: **${error.message}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }
                    console.error('Kanal güncellenirken hata oluştu:', error);
                }
            } else {
                // Güvenli listede ise log kanalına bilgi gönder
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Kanal Güncelleme İzni Verildi')
                        .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için kanal güncelleme işlemine izin verildi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [embed] });
                }
            }
        });
    }
};