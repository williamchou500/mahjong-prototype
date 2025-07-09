import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let possible_tiles = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
    11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20,
    21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30,
    31, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33, 33
];

let wall;

let player_hand = document.getElementById('playerHand');
let player_discards = document.getElementById('playerDiscards');
let player_called_tiles_pile = document.getElementById('playerCalledTiles');
let enemy_hand = document.getElementById('enemyHand');
let enemy_discards = document.getElementById('enemyDiscards');
let enemy_called_tiles_pile = document.getElementById('playerCalledTiles');

let player_tiles = [];
let player_called_tiles = [];
let player_called_quads = 0;

let enemy_tiles = [];
let enemy_called_tiles = [];
let enemy_called_quads = 0;

let first_turn; 
let curr_turn;
let tiles_remaining;
let to_insert;

const tile_data = await d3.csv('tiles.csv', (row) => ({
      tile: String(row.tile),
      desc: String(row.desc),
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

    for (let i = 2; i < hand.length; i++) {
        if (hand[i-2] === hand[i-1] && hand[i-1] === hand[i]) {
            triplets.push(hand[i]);
        }
    }

    return triplets.filter((value, index, self) => self.indexOf(value) === index);
}

function check_sequence(hand) {
    let sequence_tiles = [];

    for (let i = 2; i < hand.length; i++) {
        if (hand[i-2] === (hand[i-1] - 1) && hand[i-1] === (hand[i] - 1)) {
            sequence_tiles.push(hand[i-2]);
            sequence_tiles.push(hand[i-1]);
            sequence_tiles.push(hand[i]);
        }
    }

    return sequence_tiles.filter((value, index, self) => self.indexOf(value) === index);
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

function check_incomplete_sequence(hand) {
    let incomplete_sequences = [];

    for (let i = 1; i < hand.length; i++) {
        if (hand[i-1] === (hand[i] - 1) || hand[i-1] === (hand[i] - 2)) {
            incomplete_sequences.push(hand[i-1]);
            incomplete_sequences.push(hand[i]);
        }
    }

    return incomplete_sequences.filter((value, index, self) => self.indexOf(value) === index);
}

function check_hand(hand) {
    let triplets = check_triplets(hand);
    let sequences = check_sequence(hand);
    let pairs = check_pairs(hand).filter((value, index, self) => !triplets.includes(value));
    let incomplete_sequences = check_incomplete_sequence(hand).filter((value, index, self) => !sequences.includes(value));

    return [triplets, sequences, pairs, incomplete_sequences];
}

function pick_discard_tile(hand) {
    let categorized_useful = check_hand(hand);
    let useful = [...categorized_useful[0], ...categorized_useful[1], ...categorized_useful[2], ...categorized_useful[3]]; 

    console.log('hand: ', hand);
    console.log('useful tiles: ', useful)

    let not_useful = []

    for (let i = 0; i < hand.length; i++) {
        if (!useful.includes(hand[i])) {
            not_useful.push(hand[i])
        }
    }

    console.log('not useful: ', not_useful)

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

function form_player_hand(hand) {
    player_hand.innerHTML = '';
    let tile_id;
    for (let i = 0; i < hand.length; i++) {
        tile_id= String(hand[i]) + 'player' + tile_data[hand[i]].tile + String(tile_data[hand[i]].count)
        player_hand.insertAdjacentHTML('beforeend', `<p tile_id=${hand[i]} tile=${tile_data[hand[i]].tile} id=${tile_id}>${tile_data[hand[i]].tile}</p>`)
        document.getElementById(tile_id).addEventListener('click', function () {
            console.log(`CLICKED ON ${this.id}`);
            if (this.classList.length === 0) {
                this.classList.add('selected');
                this.style.fontSize = "200%";
            } else {
                this.classList.remove('selected');
                this.style.fontSize = "100%";
            }
        })
        document.getElementById(tile_id).addEventListener('mouseover', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "200%";
            }
        })
        document.getElementById(tile_id).addEventListener('mouseleave', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "100%";
            }
        })
    }
}

// need to revamp how to differentiate each tile because form_enemy_hand recreates all the tiles but the count used in the id remains the same and duplicates get fucked

function form_enemy_hand(hand) {
    enemy_hand.innerHTML = '';
    let tile_id;

    for (let i = 0; i < hand.length; i++) {
        tile_id= 'enemy' + tile_data[hand[i]].tile + String(tile_data[hand[i]].count)
        enemy_hand.insertAdjacentHTML('beforeend', `<p id=${tile_id}>${tile_data[hand[i]].tile}</p>`)
        document.getElementById(tile_id).addEventListener('click', function () {
            console.log(`CLICKED ON ${this.id}`);
        })
        document.getElementById(tile_id).addEventListener('mouseover', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "200%";
            }
        })
        document.getElementById(tile_id).addEventListener('mouseleave', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "100%";
            }
        })
    }
}

document.getElementById('drawTileBtn').addEventListener('click', function() {
    if (player_tiles.length + player_called_tiles - player_called_quads <= 13) {
        player_draw(player_tiles);
        form_player_hand(player_tiles);
    } else {
        console.log('DISCARD A TILE')
    }
})

document.getElementById('discardTileBtn').addEventListener('click', function() {
    player_discard();
})

function setup() {
    wall = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
        11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20,
        21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30,
        31, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33, 33
    ];

    shuffle(wall);

    console.log('All Possible Tiles: ', possible_tiles);
    console.log('Wall: ', wall);


    let turns = ['player', 'enemy'];
    shuffle(turns);

    first_turn = turns[0]; 
    curr_turn = turns[0];

    tiles_remaining = wall.length

    if (first_turn === 'player') {
        for (let i = 1; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            player_tiles.push(to_insert);
            tile_data[to_insert].count--;
            tiles_remaining--;
        }

        form_player_hand(player_tiles);

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            enemy_tiles.push(to_insert);
            tile_data[to_insert].count--;
            tiles_remaining--;
        }

        form_enemy_hand(enemy_tiles);

    } else {
        for (let i = 1; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            enemy_tiles.push(to_insert);
            tile_data[to_insert].count--;
            tiles_remaining--;
        }

        form_enemy_hand(enemy_tiles);

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            player_tiles.push(to_insert);
            tile_data[to_insert].count--;
            tiles_remaining--;
        }

        form_player_hand(player_tiles);

    };

    wall = wall.slice(0, tiles_remaining)
    console.log('wall after hand formation', wall)

    sort(player_tiles);
    sort(enemy_tiles);

    console.log('player hand', player_tiles);
    console.log('enemy hand', enemy_tiles);
}

function player_draw(hand) {
    if (tiles_remaining === 0) {
        end_game();
        return;
    }

    let drawn_tile = wall[tiles_remaining-1];
    wall = wall.slice(0, tiles_remaining-1);
    tiles_remaining--;
    hand.push(drawn_tile);
    sort(hand);
}

function enemy_draw(tile, hand) {
    return;
}

function player_discard() {
    let to_discard = document.getElementsByClassName('selected');
    console.log(to_discard[0]);

    if (to_discard.length === 1) {
        let discard_data = to_discard[0];
        player_discards.insertAdjacentHTML('beforeend', `<p>${discard_data.tile}</p>`)
        document.getElementById(discard_data.id).remove();
        player_tiles.splice(player_tiles.indexOf(discard_data.tile_id), 1);
    }
    return;
}

function enemy_discard(tile, hand) {
    return;
}

function call_triplet(tile, hand) {
    return;
}

function call_sequence(tile, hand) {
    return;
}

function call_quad(tile, hand) {
    return;
}

function check_tsumo(hand) {
    // after drawing a tile, hand should have 14 tiles
    sort(hand);

    let checked = check_hand(hand);
    
    if (checked[0].length + (checked[1].length/3) === 4 && checked[2].length === 1) {
        return true;
    } else if (checked[2]. length === 7) {
        return true;
    } else {
        return false;
    }

    // need a if statement for 13 orphans!!!! [0,8,9,17,18,26,27,28,29,30,31,32,33] plus a pair
}

function check_ron(tile, hand) {
    let to_check = hand;
    // needs to be a deep copy eventually

    to_check.push(tile);

    sort(to_check);

    let checked = check_hand(to_check);

    if (checked[0].length + (checked[1].length/3) === 4 && checked[2].length === 1) {
        return true;
    } else if (checked[2]. length === 7) {
        return true;
    } else {
        return false;
    }

    // need a if statement for 13 orphans!!!!
}

function end_game() {
    console.log('GAME OVER');
    return;
}

setup();

console.log(check_hand([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));

console.log(pick_discard_tile([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));

console.log('ron check 1: ', check_ron(5, [1,2,3,5,5,7,8,9,19,19,19,25,25]));

console.log('ron check 2: ', check_ron(5, [2,2,3,5,5,7,8,9,19,19,19,25,25]));

console.log('ron check 2: ', check_ron(5, [1,1,2,2,3,3,4,4,5,6,6,7,7]));

console.log('tsumo check 1: ', check_tsumo([1,1,2,2,3,3,4,4,5,5,6,6,7,7]));

console.log('tsumo check 2: ', check_tsumo([1,2,3,5,5,5,7,8,9,19,19,19,25,25]));

console.log('tsumo check 3: ', check_tsumo([2,2,3,5,5,5,7,8,9,19,19,19,25,25]));
