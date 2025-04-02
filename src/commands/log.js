const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionsBitField } = require('@discordjs/builders');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'logkur',
    description: 'Log kategorisi ve kanalı oluşturur ve logChannelId\'yi config.json\'a kaydeder',
    async execute(message, args) {
        // Sadece sunucu sahiplerinin kullanabilmesi için kontrol
        const authorId = message.author.id;

        // config.json dosyasını oku
        fs.readFile(configPath, 'utf8', async (err, data) => {
            if (err) {
                console.error(err);
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) // Kırmızı renk
                    .setDescription('Bir hata oluştu. Lütfen tekrar deneyin.');
                return message.reply({ embeds: [embed] });
            }

            const config = JSON.parse(data);

            if (!config.ownerId.includes(authorId)) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) // Kırmızı renk
                    .setDescription('Bu komutu kullanma izniniz yok.');
                return message.reply({ embeds: [embed] });
            }

            // Eğer kategori zaten varsa uyarı mesajı gönder
            const existingCategory = message.guild.channels.cache.find(
                channel => channel.name === "Wasetrox Log" && channel.type === 4 // Kategori tipinde
            );

            if (existingCategory) {
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) // Kırmızı renk
                    .setDescription('Log kategorisi zaten mevcut.');
                return message.reply({ embeds: [embed] });
            }

            try {
                // Yeni kategori oluştur
                const category = await message.guild.channels.create({
                    name: "Wasetrox Log",
                    type: 4, // Kategori tipi
                    /*permissionOverwrites: [
                        {
                            id: message.guild.id, // @everyone rolü
                            deny: [PermissionsBitField.Flags.ViewChannel], // Görüntüleme kapalı
                        },
                    ],*/
                });

                // Kategori içinde yeni kanal oluştur
                const logChannel = await message.guild.channels.create({
                    name: 'guard-log',
                    type: 0, // Metin kanalı
                    parent: category.id, // Kategoriye ekle
                    /*permissionOverwrites: [
                        {
                            id: message.guild.id, // @everyone rolü
                            deny: [PermissionsBitField.Flags.ViewChannel], // Görüntüleme kapalı
                        },
                    ],*/
                });

                // Kanal ID'sini config.json'a kaydet
                config.logChannelId = logChannel.id;

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
                        .setDescription(`Guard-log kanalı oluşturuldu ve logChannelId config.json'a kaydedildi: ${logChannel.id}`);
                    message.reply({ embeds: [embed] });
                });

            } catch (error) {
                console.error(error);
                const embed = new EmbedBuilder()
                    .setColor(0xff0000) // Kırmızı renk
                    .setDescription('Bir hata oluştu. Lütfen tekrar deneyin.');
                return message.reply({ embeds: [embed] });
            }
        });
    },
};