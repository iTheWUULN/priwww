const { AuditLogEvent, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'channelDelete',
    async execute(client, channel) {
        const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete });
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
            const logChannel = channel.guild.channels.cache.get(config.logChannelId);

            if (!config.safeUsers.includes(executor.id)) {
                // Silinen kanalın bilgilerini kaydet
                const channelData = {
                    name: channel.name || 'Yeni Kanal',  // Kanal adı eksikse varsayılan bir ad kullan
                    type: channel.type,  // Bu değer 'text' veya 'voice' olabilir
                    topic: channel.topic || '',
                    position: channel.position || 0,
                    parent: channel.parent ? channel.parent.id : null
                };

                // Kanal türünü belirleyin
                const channelType = channelData.type === ChannelType.GuildText ? ChannelType.GuildText : ChannelType.GuildVoice;

                // Yeni bir kanal oluştur
                let newChannel;
                try {
                    newChannel = await channel.guild.channels.create({
                        name: channelData.name,
                        type: channelType,
                        topic: channelData.topic,
                        position: channelData.position,
                        parent: channelData.parent ? channel.guild.channels.cache.get(channelData.parent) : null
                    });

                    if (logChannel) {
                        // Embed oluştur
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Kanal Silindi ve Kullanıcı Banlandı')
                            .setDescription(`🔨 **${executor.tag}** izinsiz kanal sildiği için banlandı ve kanal yeniden oluşturuldu.`)
                            .addFields(
                                { name: 'Kanal Adı', value: channelData.name, inline: true },
                                { name: 'Kanal Türü', value: channelType === ChannelType.GuildText ? 'Yazı' : 'Ses', inline: true }
                            )
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }
                } catch (error) {
                    if (logChannel) {
                        const embed = new EmbedBuilder()
                            .setColor('#ff0000') // Kırmızı renk
                            .setTitle('Kanal Yeniden Oluşturulamadı')
                            .setDescription(`❌ Kanal yeniden oluşturulamadı. Hata: **${error.message}**`)
                            .setTimestamp()
                            .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                        logChannel.send({ embeds: [embed] });
                    }
                }

                await channel.guild.members.ban(executor.id, { reason: 'İzinsiz kanal silme.' });
            } else {
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Kanal Silme İzni Verildi')
                        .setDescription(`✅ **${executor.tag}** güvenli listede olduğu için kanal silme işlemine izin verildi.`)
                        .setTimestamp()
                        .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                    logChannel.send({ embeds: [embed] });
                }
            }
        });
    }
};