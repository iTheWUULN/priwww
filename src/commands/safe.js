const fs = require('fs');
const path = require('path');
//const { EmbedBuilder } = require('discord.js'); // Discord.js kütüphanesinden MessageEmbed'i içe aktar
const { EmbedBuilder } = require('@discordjs/builders');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'safe',
    description: 'Bir kullanıcıyı safeUsers listesine ekler',
    execute(message, args) {
        // Kullanıcı ID'sini veya etiketlenen kullanıcıyı al
        let userId;

        // Eğer bir etiket varsa, etiketlenen kullanıcının ID'sini al
        if (message.mentions.users.size) {
            userId = message.mentions.users.first().id;
        } else {
            // Eğer etiket yoksa args[0]'dan kullanıcı ID'sini al
            userId = args[0];
        }

        // Eğer bir kullanıcı ID'si verilmediyse veya etiketlenmediyse hata mesajı gönder
        if (!userId) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000) // Kırmızı renk
                .setDescription('Lütfen eklemek istediğiniz kullanıcı ID\'sini veya kullanıcıyı etiketleyin.');
            return message.reply({ embeds: [embed] });
        }

        // config.json dosyasını oku
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) // Kırmızı renk
                    .setDescription('Bir hata oluştu. Lütfen tekrar deneyin.');
                return message.reply({ embeds: [embed] });
            }

            // Dosyadaki JSON verisini parse et
            const config = JSON.parse(data);

            // Komutu kullanan kullanıcının ID'sini al
            const authorId = message.author.id;

            // Kullanıcının ownerId listesinde olup olmadığını kontrol et
            if (!config.ownerId.includes(authorId)) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) // Kırmızı renk
                    .setDescription('Bu komutu kullanma izniniz yok.');
                return message.reply({ embeds: [embed] });
            }

            // Kullanıcı zaten listede mi kontrol et
            if (config.safeUsers.includes(userId)) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) // Kırmızı renk
                    .setDescription('Bu kullanıcı zaten safeUsers listesinde.');
                return message.reply({ embeds: [embed] });
            }

            // Kullanıcıyı safeUsers listesine ekle
            config.safeUsers.push(userId);

            // Güncellenmiş JSON'u tekrar dosyaya yaz
            fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error(err);
                    const embed = new EmbedBuilder()
                        .setColor(0xff0000) // Kırmızı renk
                        .setDescription('Bir hata oluştu. Lütfen tekrar deneyin.');
                    return message.reply({ embeds: [embed] });
                }

                const embed = new EmbedBuilder()
                    .setColor(0x00ff00) // Yeşil renk
                    .setDescription(`Kullanıcı başarıyla safeUsers listesine eklendi: <@${userId}>`);
                message.reply({ embeds: [embed] });
            });
        });
    },
};