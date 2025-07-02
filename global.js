import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let possible_tiles = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
    11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20,
    21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30,
    31, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33, 33
];

let player_hand = document.getElementById('playerHand');
let enemy_hand = document.getElementById('enemyHand');

const tile_data = await d3.csv('tiles.csv', (row) => ({
      tile: String(row.tile),
      desc: String(row.tile),
      img_path: String(row.img_path),
      count: Number(row.count)
}));

console.log('Tile Data: ', tile_data);

function shuffle(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
};

function sort(array) {
    array.sort(function(a, b){return a - b});
}

function check_triplets(hand) {
    let triplets = [];

    for (let i = 2; i < array.length; i++) {
        if (hand[i-2] === hand[i-1] && hand[i-1] === hand[i]) {
            triplets.push(hand[i]);
        }
    }

    return triplets.filter((value, index, self) => self.indexOf(value) === index);
}

function check_sequence(hand) {
    let grouped_sequences = [];
    let sequence_tiles = [];

    for (let i = 2; i < hand.length; i++) {
        if (hand[i-2] === (hand[i-1] - 1) && hand[i-1] === (hand[i] - 1)) {
            grouped_sequences.push([hand[i-2], hand[i-1], hand[i]]);
            sequence_tiles.push(hand[i-2]);
            sequence_tiles.push(hand[i-1]);
            sequence_tiles.push(hand[i]);
        }
    }

    return [grouped_sequences, sequence_tiles.filter((value, index, self) => self.indexOf(value) === index)];
}

function check_pairs(hand) {
    let pairs = [];

    for (let i = 1; i < hand.length; i++) {
        if (hand[i-1] === hand[i]) {
            pairs.push(hand[i])
        }
    }

    return pairs.filter((value, index, self) => self.indexOf(value) === index);
}

// make sure the values in the array for checking pairs are not in a hidden triplet
// maybe combine all of them into one function so filter can be used with the necessary variables?

function check_incomplete_sequence(hand) {
    let grouped_incomplete_sequences = [];
    let incomplete_sequence_tiles = [];

    for (let i = 1; i < hand.length; i++) {
        if (hand[i-1] === (hand[i] - 1) || hand[i-1] === (hand[i] - 2)) {
            grouped_incomplete_sequences.push([hand[i-1], hand[i]]);
            incomplete_sequence_tiles.push(hand[i-1]);
            incomplete_sequence_tiles.push(hand[i]);
        }
    }

    return [grouped_incomplete_sequences, incomplete_sequence_tiles.filter((value, index, self) => self.indexOf(value) === index)];
}

// make sure the values in the array for checking pairs are not in a hidden sequence
// maybe combine all of them into one function so filter can be used with the necessary variables?

// function check_hand(hand) {
//     return;
// }

function pick_discard_tile(hand) {
    let triplets = check_triplets(hand);
    let sequences = check_sequence(hand)[1];
    let pairs = check_pairs(hand);
    let incomplete_sequences = check_incomplete_sequence(hand)[1]

    let useful = triplets.concat(sequences, pairs, incomplete_sequences).filter((value, index, self) => self.indexOf(value) === index);

    let not_useful = []

    for (let i = 0; i < hand.length; i++) {
        if (!useful.includes(hand[i])) {
            not_useful.push(hand[i])
        }
    }

    if (not_useful.length === 1) {
        return not_useful[0]
    } else {
        shuffle(not_useful)
        return not_useful[0]
        // eventually, should discard the one that has been played the most already ie the least risky tile but idk maybe some 
        // if not_useful is empty, should discard from sequence that is a single possibility (1, 3) 
        // PRIORITIZE GETTING RID OF 1 OR 9 FOR THESE CASES otherwise, check for least risky/least likely tile
    }
}

function setup() {
    let wall = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
        11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20,
        21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30,
        31, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33, 33
    ];

    shuffle(wall);

    console.log('All Possible Tiles: ', possible_tiles);
    console.log('Wall: ', wall);

    let player_tiles = [];
    let player_called_tiles = [];
    let enemy_tiles = [];
    let enemy_called_tiles = [];

    let turns = ['player', 'enemy'];
    shuffle(turns);

    let first_turn = turns[0]; 
    let curr_turn = turns[0];

    let tiles_remaining = wall.length

    let to_insert;
    let tile_id;

    if (first_turn === 'player') {
        for (let i = 1; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            tile_id = 'player' + tile_data[to_insert].tile + String(tile_data[to_insert].count)
            tile_data[to_insert].count--;
            player_tiles.push(to_insert);
            player_hand.insertAdjacentHTML('beforeend', `<p id=${tile_id}>${tile_data[to_insert].tile}</p>`)
            document.getElementById(tile_id).addEventListener('click', function () {
                console.log(`CLICKED ON ${this.id}`);
            })
            document.getElementById(tile_id).addEventListener('mouseover', function () {
                this.style.fontSize = "200%";
            })
            document.getElementById(tile_id).addEventListener('mouseleave', function () {
                this.style.fontSize = "100%";
            })
        }

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            tile_id = 'enemy' + tile_data[to_insert].tile + String(tile_data[to_insert].count)
            tile_data[to_insert].count--;
            enemy_tiles.push(to_insert);
            enemy_hand.insertAdjacentHTML('beforeend', `<p id=${tile_id}>${tile_data[to_insert].tile}</p>`)
            document.getElementById(tile_id).addEventListener('click', function () {
                console.log(`CLICKED ON ${this.id}`);
            })
            document.getElementById(tile_id).addEventListener('mouseover', function () {
                this.style.fontSize = "200%";
            })
            document.getElementById(tile_id).addEventListener('mouseleave', function () {
                this.style.fontSize = "100%";
            })
        }
    } else {
        for (let i = 1; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            tile_id = 'enemy' + tile_data[to_insert].tile + String(tile_data[to_insert].count)
            tile_data[to_insert].count--;
            enemy_tiles.push(to_insert);
            enemy_hand.insertAdjacentHTML('beforeend', `<p id=${tile_id}>${tile_data[to_insert].tile}</p>`)
            document.getElementById(tile_id).addEventListener('click', function () {
                console.log(`CLICKED ON ${this.id}`);
            })
            document.getElementById(tile_id).addEventListener('mouseover', function () {
                this.style.fontSize = "200%";
            })
            document.getElementById(tile_id).addEventListener('mouseleave', function () {
                this.style.fontSize = "100%";
            })
        }

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            tile_id = 'player' + tile_data[to_insert].tile + String(tile_data[to_insert].count);
            tile_data[to_insert].count--;
            player_tiles.push(to_insert);
            player_hand.insertAdjacentHTML('beforeend', `<p id=${tile_id}>${tile_data[to_insert].tile}</p>`);
            document.getElementById(tile_id).addEventListener('click', function () {
                console.log(`CLICKED ON ${this.id}`);
            });
            document.getElementById(tile_id).addEventListener('mouseover', function () {
                this.style.fontSize = "200%";
            })
            document.getElementById(tile_id).addEventListener('mouseleave', function () {
                this.style.fontSize = "100%";
            })
        }
    };

    wall = wall.slice(0, tiles_remaining-26)
    console.log('wall after hand formation', wall)

    sort(player_tiles);
    sort(enemy_tiles);

    console.log('player hand', player_tiles);
    console.log('enemy hand', enemy_tiles);
}

function draw(hand) {
    return;
}

function discard(tile) {
    return;
}

function check_triplet(tile) {
    return;
}

function check_sequence(tile) {
    return;
}

function check_quad(tile) {
    return;
}

function check_tsumo(hand) {
    return;
}

function check_ron(tile) {
    return;
}

setup();
console.log(check_triplets([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(check_sequence([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(check_pairs([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(check_incomplete_sequence([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(pick_discard_tile([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));