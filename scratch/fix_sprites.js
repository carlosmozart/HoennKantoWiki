const fs = require('fs');

const gymsPath = 'js/gyms.js';
let content = fs.readFileSync(gymsPath, 'utf8');

const spriteMap = {
    "img/trainers/Brendan.png": "https://play.pokemonshowdown.com/sprites/trainers/brendan-gen3.png",
    "img/trainers/May.png": "https://play.pokemonshowdown.com/sprites/trainers/may-gen3.png",
    "img/trainers/Wally.png": "https://play.pokemonshowdown.com/sprites/trainers/wally-gen3.png",
    "img/trainers/Maxie.png": "https://play.pokemonshowdown.com/sprites/trainers/maxie-gen3.png",
    "img/trainers/Archie.png": "https://play.pokemonshowdown.com/sprites/trainers/archie-gen3.png",
    "img/trainers/Blue.png": "https://play.pokemonshowdown.com/sprites/trainers/blue-gen3champion.png",
    "img/trainers/Giovanni.png": "https://play.pokemonshowdown.com/sprites/trainers/giovanni-gen3.png"
};

for (const [localUrl, extUrl] of Object.entries(spriteMap)) {
    content = content.replaceAll(localUrl, extUrl);
}

fs.writeFileSync(gymsPath, content);
console.log("Sprites atualizados.");
