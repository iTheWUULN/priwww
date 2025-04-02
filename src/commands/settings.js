const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const configPath = path.join(__dirname, '../../config.json'); // config.json yolunu belirt

module.exports = {
    name: 'guard',
    description: 'Guard komutu: CapsLock ve spam engelleyiciyi açıp kapatır.',
    execute(message, args) {
        // config.json dosyasını oku
        fs.readFile(configPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Config dosyası okunamadı:', err);
                const embed = new EmbedBuilder()
                    .setColor('#ff0000') // Kırmızı renk
                    .setTitle('Hata')
                    .setDescription('Bir hata oluştu, lütfen tekrar deneyin.')
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

            const config = JSON.parse(data);

            // Kullanıcının ID'sini safeUsers listesinde kontrol et
            if (!config.safeUsers.includes(message.author.id)) {
                const embed = new EmbedBuilder()
                    .setColor('#ff0000') // Kırmızı renk
                    .setTitle('Yetki Hatası')
                    .setDescription('Bu komutu kullanmak için yetkin yok! Sadece belirlenen kullanıcılar bu komutu kullanabilir.')
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

            // Argüman kontrolü
            if (!args[0]) {
                const embed = new EmbedBuilder()
                    .setColor('#ffcc00') // Sarı renk
                    .setTitle('Yanlış Kullanım')
                    .setDescription('Kullanım: `!guard [capslock/spam] [aç/kapat]`')
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

            // capslock engelleme ayarını değiştirme
            if (args[0].toLowerCase() === 'capslock') {
                if (args[1] === 'aç') {
                    config.capsLockEnabled = true;
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('CapsLock Engeli')
                        .setDescription('CapsLock engelleme **açıldı**.')
                        .setTimestamp();
                    
                    message.channel.send({ embeds: [embed] });
                } else if (args[1] === 'kapat') {
                    config.capsLockEnabled = false;
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('CapsLock Engeli')
                        .setDescription('CapsLock engelleme **kapatıldı**.')
                        .setTimestamp();
                    
                    message.channel.send({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('#ffcc00') // Sarı renk
                        .setTitle('Yanlış Kullanım')
                        .setDescription('Yanlış kullanım. `!guard capslock [aç/kapat]`')
                        .setTimestamp();

                    return message.channel.send({ embeds: [embed] });
                }
            }

            // spam engelleme ayarını değiştirme
            else if (args[0].toLowerCase() === 'spam') {
                if (args[1] === 'aç') {
                    config.spamEnabled = true;
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Spam Engeli')
                        .setDescription('Spam engelleme **açıldı**.')
                        .setTimestamp();
                    
                    message.channel.send({ embeds: [embed] });
                } else if (args[1] === 'kapat') {
                    config.spamEnabled = false;
                    const embed = new EmbedBuilder()
                        .setColor('#00ff00') // Yeşil renk
                        .setTitle('Spam Engeli')
                        .setDescription('Spam engelleme **kapatıldı**.')
                        .setTimestamp();
                    
                    message.channel.send({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('#ffcc00') // Sarı renk
                        .setTitle('Yanlış Kullanım')
                        .setDescription('Yanlış kullanım. `!guard spam [aç/kapat]`')
                        .setTimestamp();

                    return message.channel.send({ embeds: [embed] });
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#ffcc00') // Sarı renk
                    .setTitle('Yanlış Kullanım')
                    .setDescription('Yanlış kullanım. `!guard [capslock/spam] [aç/kapat]`')
                    .setTimestamp();

                return message.channel.send({ embeds: [embed] });
            }

            // Yeni ayarları config.json'a yaz
            fs.writeFile(configPath, JSON.stringify(config, null, 2), (err) => {
                if (err) {
                    console.error('Config dosyası yazılamadı:', err);
                    const embed = new EmbedBuilder()
                        .setColor('#ff0000') // Kırmızı renk
                        .setTitle('Hata')
                        .setDescription('Ayarlar kaydedilemedi.')
                        .setTimestamp();

                    return message.channel.send({ embeds: [embed] });
                }
                const embed = new EmbedBuilder()
                    .setColor('#00ff00') // Yeşil renk
                    .setTitle('Başarılı')
                    .setDescription('Ayarlar başarıyla güncellendi.')
                    .setTimestamp();

                message.channel.send({ embeds: [embed] });
            });
        });
    }
};