import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let possible_tiles = [  0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,
        13,  14,  15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25,
        26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,
        39,  40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51,
        52,  53,  54,  55,  56,  57,  58,  59,  60,  61,  62,  63,  64,
        65,  66,  67,  68,  69,  70,  71,  72,  73,  74,  75,  76,  77,
        78,  79,  80,  81,  82,  83,  84,  85,  86,  87,  88,  89,  90,
        91,  92,  93,  94,  95,  96,  97,  98,  99, 100, 101, 102, 103,
       104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
       117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129,
       130, 131, 132, 133, 134, 135];

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
let player_recently_discarded;
let enemy_recently_discarded;

const tile_data = await d3.csv('tiles.csv', (row) => ({
      tile: String(row.tile),
      desc: String(row.desc),
      img_path: String(row.img_path),
      tile_id: Number(row.tile_id),
      category: String(row.category)
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
        if (tile_data[hand[i-2]].tile_id === tile_data[hand[i-1]].tile_id && tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id) {
            triplets.push(hand[i-2])
            triplets.push(hand[i-1])
            triplets.push(hand[i])
        }
    }

    return triplets.filter((value, index, self) => self.indexOf(value) === index);
}

function check_sequence(hand) {
    let sequence_tiles = [];

    for (let i = 2; i < hand.length; i++) {

        // THIS CURRENT PART OF THE CODE DOES NOT REGISTER [b1,b1,b2,b2,b3,b3] AS A COMPLETE SEQUENCE CURRENTLY

        if (tile_data[hand[i-2]].tile_id === tile_data[hand[i-1]].tile_id - 1 && tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 1 && tile_data[hand[i-2]].category === tile_data[hand[i-1]].category && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]])) {
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
        if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id) {
            pairs.push(hand[i-1])
            pairs.push(hand[i])
        }
    }

    return pairs.filter((value, index, self) => self.indexOf(value) === index);
}

function check_incomplete_sequence(hand) {
    let incomplete_sequences = [];
    let needed_tile;

    for (let i = 1; i < hand.length; i++) {
        if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 1 && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]].category)) {
            incomplete_sequences.push(hand[i-1]);
            incomplete_sequences.push(hand[i]);
            needed_tile = [tile_data[hand[i]].tile_id - 2, tile_data[hand[i]].tile_id + 1]

            // NEED TO SOMEHOW SAVE THE TILE THAT WOULD BE NEEDED TO COMPLETE THE SEQUENCE SO THE ENEMY CAN CALL ON SEQUENCES

        } else if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 2 && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]].category)) {
            incomplete_sequences.push(hand[i-1]);
            incomplete_sequences.push(hand[i]);
            needed_tile = [tile_data[hand[i]].tile_id - 1]
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
    } else if (not_useful.length > 1) {
        shuffle(not_useful)
        return not_useful[0]
        // eventually, should discard the one that has been played the most already ie the least risky tile but idk maybe some 
        // if not_useful is empty, should discard from sequence that is a single possibility (1, 3) 
        // PRIORITIZE GETTING RID OF 1 OR 9 FOR THESE CASES otherwise, check for least risky/least likely tile
    } else if (not_useful.length === 0) {
        shuffle(categorized_useful[0]);
        shuffle(categorized_useful[1]);
        shuffle(categorized_useful[2]);
        shuffle(categorized_useful[3]);

        for (let i = 3; i > -1; i--) {
            if (categorized_useful[i].length != 0) {
                return categorized_useful[i][0];
            }
        }
    }
}

function form_player_hand(hand) {
    player_hand.innerHTML = '';
    for (let i = 0; i < hand.length; i++) {
        player_hand.insertAdjacentHTML('beforeend', `<p id=${hand[i]}>${tile_data[hand[i]].tile}</p>`)
        document.getElementById(hand[i]).addEventListener('click', function () {
            console.log(`CLICKED ON ${this.id}`);
            if (this.classList.length === 0) {
                this.classList.add('selected');
                this.style.fontSize = "200%";
            } else {
                this.classList.remove('selected');
                this.style.fontSize = "100%";
            }
        })
        document.getElementById(hand[i]).addEventListener('mouseover', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "200%";
            }
        })
        document.getElementById(hand[i]).addEventListener('mouseleave', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "100%";
            }
        })
    }
}

// need to revamp how to differentiate each tile because form_enemy_hand recreates all the tiles but the count used in the id remains the same and duplicates get fucked

function form_enemy_hand(hand) {
    enemy_hand.innerHTML = '';

    for (let i = 0; i < hand.length; i++) {
        enemy_hand.insertAdjacentHTML('beforeend', `<p id=${hand[i]}>${tile_data[hand[i]].tile}</p>`)
        document.getElementById(hand[i]).addEventListener('click', function () {
            console.log(`CLICKED ON ${this.id}`);
        })
        document.getElementById(hand[i]).addEventListener('mouseover', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "200%";
            }
        })
        document.getElementById(hand[i]).addEventListener('mouseleave', function () {
            if (this.classList.length === 0) {
                this.style.fontSize = "100%";
            }
        })
    }
}

document.getElementById('playerDrawTileBtn').addEventListener('click', function() {
    if (player_tiles.length + player_called_tiles - player_called_quads <= 13) {
        player_draw(player_tiles);
        form_player_hand(player_tiles);
    } else {
        console.log('DISCARD A TILE')
    }
})

document.getElementById('playerDiscardTileBtn').addEventListener('click', function() {
    if (player_tiles.length + player_called_tiles - player_called_quads > 13) {
        player_discard();
    } else {
        console.log('DRAW A TILE')
    }
})

document.getElementById('playerTsumoBtn').addEventListener('click', function () {
    let result = player_check_tsumo(player_tiles);

    if (result === true) {
        console.log('PLAYER WINS');
    } else {
        console.log('PLAYER FALSE ALARM');
    }
})

document.getElementById('playerRonBtn').addEventListener('click', function () {
    let result = player_check_ron(enemy_recently_discarded, player_called_tiles);

    if (result === true) {
        console.log('PLAYER WINS');
    } else {
        console.log('PLAYER FALSE ALARM');
    }
})

document.getElementById('enemyDrawTileBtn').addEventListener('click', function() {
    if (enemy_tiles.length + enemy_called_tiles - enemy_called_quads <= 13) {
        enemy_draw(enemy_tiles);
        form_enemy_hand(enemy_tiles);
    } else {
        console.log('DISCARD A TILE')
    }
})

document.getElementById('enemyDiscardTileBtn').addEventListener('click', function() {
    if (enemy_tiles.length + enemy_called_tiles - enemy_called_quads > 13) {
        enemy_discard();
    } else {
        console.log('DRAW A TILE')
    }
})

document.getElementById('enemyTsumoBtn').addEventListener('click', function () {
    let result = enemy_check_tsumo(enemy_tiles);

    if (result === true) {
        console.log('ENEMY WINS');
    } else {
        console.log('ENEMY FALSE ALARM');
    }
})

document.getElementById('enemyRonBtn').addEventListener('click', function () {
    let result = enemy_check_ron(player_recently_discarded, enemy_tiles);

    if (result === true) {
        console.log('ENEMY WINS');
    } else {
        console.log('ENEMY FALSE ALARM');
    }
})

function setup() {
    wall = [  0,   1,   2,   3,   4,   5,   6,   7,   8,   9,  10,  11,  12,
        13,  14,  15,  16,  17,  18,  19,  20,  21,  22,  23,  24,  25,
        26,  27,  28,  29,  30,  31,  32,  33,  34,  35,  36,  37,  38,
        39,  40,  41,  42,  43,  44,  45,  46,  47,  48,  49,  50,  51,
        52,  53,  54,  55,  56,  57,  58,  59,  60,  61,  62,  63,  64,
        65,  66,  67,  68,  69,  70,  71,  72,  73,  74,  75,  76,  77,
        78,  79,  80,  81,  82,  83,  84,  85,  86,  87,  88,  89,  90,
        91,  92,  93,  94,  95,  96,  97,  98,  99, 100, 101, 102, 103,
       104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
       117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129,
       130, 131, 132, 133, 134, 135];

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
        }

        sort(player_tiles);
        form_player_hand(player_tiles);

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            enemy_tiles.push(to_insert);
            tile_data[to_insert].count--;
        }

        sort(enemy_tiles);
        form_enemy_hand(enemy_tiles);
        tiles_remaining = tiles_remaining - 26;

    } else {
        for (let i = 1; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            enemy_tiles.push(to_insert);
            tile_data[to_insert].count--;
        }

        sort(enemy_tiles);
        form_enemy_hand(enemy_tiles);

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            player_tiles.push(to_insert);
            tile_data[to_insert].count--;
        }

        sort(player_tiles);
        form_player_hand(player_tiles);
        tiles_remaining = tiles_remaining - 26;
    };

    wall = wall.slice(0, tiles_remaining)
    console.log('wall after hand formation', wall)

    sort(player_tiles);
    sort(enemy_tiles);

    console.log('player hand', player_tiles);
    console.log('enemy hand', enemy_tiles);
}

function player_reset_hand() {
    player_tiles = wall.splice(-13);
    tiles_remaining = tiles_remaining-13;
    sort(player_tiles);
    form_player_hand(player_tiles);
}

function enemy_reset_hand() {
    enemy_tiles = wall.splice(-13);
    tiles_remaining = tiles_remaining-13;
    sort(enemy_tiles);
    form_enemy_hand(enemy_tiles);
}

function player_draw(hand) {
    if (tiles_remaining === 0) {
        end_game();
        return;
    }

    let drawn_tile = wall.pop()
    tiles_remaining--;
    hand.push(drawn_tile);
    sort(hand);
}

function enemy_draw(hand) {
    if (tiles_remaining === 0) {
        end_game();
        return;
    }

    let drawn_tile = wall.pop();
    tiles_remaining--;
    hand.push(drawn_tile);
    sort(hand);
    return;
}

function player_discard() {
    let to_discard = document.getElementsByClassName('selected');
    if (to_discard.length === 1) {
        let discard_data = to_discard[0];
        player_recently_discarded = discard_data.id;
        document.getElementById(discard_data.id).remove();
        player_discards.insertAdjacentHTML('beforeend', `<p id=${String(discard_data.id)}>${tile_data[discard_data.id].tile}</p>`);
        player_tiles.splice(player_tiles.indexOf(Number(discard_data.id)), 1);
        enemy_check_ron();
        enemy_draw(enemy_tiles);
        enemy_check_tsumo();
        enemy_discard();
    } else {
        console.log('INVALID AMOUNT OF TILES SELECTED');
    }
    return;
}

function enemy_discard() {
    let to_discard = pick_discard_tile(enemy_tiles);
    let discard_index = enemy_tiles.indexOf(to_discard);
    enemy_recently_discarded = to_discard;
    document.getElementById(to_discard).remove();
    enemy_discards.insertAdjacentHTML('beforeend', `<p id=${to_discard}>${tile_data[to_discard].tile}</p>`)
    enemy_tiles.splice(discard_index, 1);
    console.log(enemy_tiles);
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

// NEED TO ACCOUNT FOR CALLED TILES EVENTUALLY

function player_check_tsumo(hand=player_tiles) {
    // after drawing a tile, hand should have 14 tiles
    sort(hand);

    let checked = check_hand(hand);
    
    if (hand.length != 14) {
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 === 4 && checked[2].length/2 === 1) {
        alert('yay u win');
        return true;
    } else if (checked[2]. length === 7) {
        alert('yay u win');
        return true;
    } else {
        return false;
    }

    // need a if statement for 13 orphans!!!! [0,8,9,17,18,26,27,28,29,30,31,32,33] plus a pair
}

// NEED TO ACCOUNT FOR CALLED TILES EVENTUALLY

function player_check_ron(tile=enemy_recently_discarded, hand=player_tiles) {
    let to_check = hand;
    // needs to be a deep copy eventually

    to_check.push(tile);

    sort(to_check);

    let checked = check_hand(to_check);

    if (checked.length != 14) {
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 === 4 && checked[2].length/2 === 1) {
        alert('yay u lose');
        return true;
    } else if (checked[2].length === 7) {
        alert('yay u lose');
        return true;
    } else {
        return false;
    }

    // need a if statement for 13 orphans!!!!
}

// NEED TO ACCOUNT FOR CALLED TILES EVENTUALLY

function enemy_check_tsumo(hand=enemy_tiles) {
    // after drawing a tile, hand should have 14 tiles
    sort(hand);

    let checked = check_hand(hand);
    
    if (hand.length != 14) {
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 === 4 && checked[2].length === 1) {
        return true;
    } else if (checked[2]. length === 7) {
        return true;
    } else {
        return false;
    }

    // need a if statement for 13 orphans!!!! [0,8,9,17,18,26,27,28,29,30,31,32,33] plus a pair
}

// NEED TO ACCOUNT FOR CALLED TILES EVENTUALLY

function enemy_check_ron(tile=player_recently_discarded, hand=enemy_tiles) {
    let to_check = hand;
    // needs to be a deep copy eventually

    to_check.push(tile);

    sort(to_check);

    let checked = check_hand(to_check);

    if (checked.length != 14) {
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 === 4 && checked[2].length === 1) {
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

console.log(check_sequence([2,4,8]));

// console.log(player_check_tsumo([0,4,8,20,21,22,37,38,39,65,66,128,129,130]));