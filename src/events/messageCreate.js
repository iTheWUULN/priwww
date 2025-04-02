const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        if (message.author.bot) return; // Bot mesajlarını görmezden gel

        const guild = message.guild;
        const member = message.member;
        const content = message.content.trim();

        // Sistem ve capslock özelliği açık mı diye kontrol et
        if (!config.systemEnabled || !config.capsLockEnabled) {
            console.log('Sistem veya Capslock özelliği kapalı, işlem yapılmadı.');
            return;
        }

        // Safe kullanıcılar kontrolü
        const safeUsers = config.safeUsers || []; // Safe kullanıcılar listesi
        if (safeUsers.includes(message.author.id)) {
            console.log(`Kullanıcı ${message.author.tag} güvenli kullanıcı olarak listelendi, işlem yapılmadı.`);
            return; // Safe kullanıcılar etkilenmeyecek
        }

        // Mesaj boş değilse devam et
        if (content.length === 0) {
            console.log('Mesaj boş, işlem yapılmadı.');
            return;
        }

        // --- Capslock Kontrolü ---
        const capsLimit = 70; // Capslock sınırı
        const capsCount = content.replace(/[^A-Z]/g, '').length;
        const capsPercentage = (capsCount / content.length) * 100;

        // Capslock oranı limitin üzerinde ise
        if (capsPercentage > capsLimit) {
            try {
                // Mesajı sil
                await message.delete();
                console.log(`Mesaj silindi (Capslock): ${message.id}`);
            } catch (err) {
                console.error(`Mesaj silinemedi (Capslock): ${err.message}`);
                console.error(err.stack);
            }

            // Kullanıcıya 5 dakika zaman aşımı (timeout)
            try {
                const timeoutDuration = 5 * 60 * 1000; // 5 dakika
                await member.timeout(timeoutDuration, 'Aşırı büyük harf kullanımı');
                console.log(`Kullanıcıya zaman aşımı atıldı: ${member.user.tag}`);
            } catch (err) {
                console.error(`Kullanıcıya zaman aşımı atılamadı: ${err.message}`);
                console.error(err.stack);
            }

            // Log kanalına bilgilendirme gönderme
            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000') // Kırmızı renk
                    .setTitle('Kullanıcı Zaman Aşımına Alındı ve Mesajı Silindi')
                    .setDescription(`🔨 **${member.user.tag}** aşırı büyük harf kullandığı için mesajı silindi ve 5 dakika süreyle zaman aşımına alındı.`)
                    .setTimestamp()
                    .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                logChannel.send({ embeds: [embed] }).catch(err => {
                    console.error(`Log mesajı gönderilemedi: ${err.message}`);
                });
            } else {
                console.error(`Log kanalı bulunamadı: ${config.logChannelId}`);
            }

            return; // Eğer capslock sınırı aşılmışsa, işlem sonlandırılır
        }

        // --- Spam Engelleme ---
        const spamLimit = 3; // Aynı anda en fazla 3 mesaj
        const spamTimeframe = 5000; // 5 saniye içinde 3 mesaj
        if (!client.messageHistory) {
            client.messageHistory = new Map();
        }

        const userMessages = client.messageHistory.get(message.author.id) || [];

        // Mesajları zamanla kaydet
        const now = Date.now();
        userMessages.push(now);

        // 5 saniye içinde 3 mesajdan fazla gönderildiyse
        const recentMessages = userMessages.filter(time => now - time < spamTimeframe);
        if (recentMessages.length > spamLimit) {
            try {
                // Mesajı sil
                await message.delete();
                console.log(`Mesaj silindi (Spam): ${message.id}`);
            } catch (err) {
                console.error(`Mesaj silinemedi (Spam): ${err.message}`);
                console.error(err.stack);
            }

            // Kullanıcıya spam uyarısı gönder
            try {
                await message.channel.send(`${member.user.tag}, lütfen fazla mesaj göndermeyin, spam yapmaktan kaçının!`);
                console.log(`Kullanıcıya spam uyarısı gönderildi: ${member.user.tag}`);
            } catch (err) {
                console.error(`Uyarı mesajı gönderilemedi: ${err.message}`);
                console.error(err.stack);
            }

            // Kullanıcıya 10 dakika zaman aşımı (timeout) uygulama
            try {
                const timeoutDuration = 10 * 60 * 1000; // 10 dakika
                await member.timeout(timeoutDuration, 'Spam yapmayı devam ettiriyor');
                console.log(`Kullanıcıya zaman aşımı atıldı (Spam): ${member.user.tag}`);
            } catch (err) {
                console.error(`Kullanıcıya zaman aşımı atılamadı (Spam): ${err.message}`);
                console.error(err.stack);
            }

            // Log kanalına bilgilendirme gönderme
            const logChannel = guild.channels.cache.get(config.logChannelId);
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000') // Kırmızı renk
                    .setTitle('Spam Engellendi ve Zaman Aşımı Atıldı')
                    .setDescription(`⚠️ **${member.user.tag}** fazla mesaj gönderdiği için mesajı silindi, uyarıldı ve 10 dakika süreyle zaman aşımına alındı.`)
                    .setTimestamp()
                    .setFooter({ text: 'Güvenlik Sistemi', iconURL: client.user.displayAvatarURL() });

                logChannel.send({ embeds: [embed] }).catch(err => {
                    console.error(`Log mesajı gönderilemedi: ${err.message}`);
                });
            } else {
                console.error(`Log kanalı bulunamadı: ${config.logChannelId}`);
            }

            return; // Spam yapmaya devam ediliyorsa işlem sonlandırılır
        }

        // 5 saniye içinde 3 mesajdan fazla gönderilmediği takdirde, mesaj geçmişini güncelle
        client.messageHistory.set(message.author.id, recentMessages);
    }
};
