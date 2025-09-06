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
let player_drawn_tile = document.getElementById('playerDrawnTile');
let enemy_hand = document.getElementById('enemyHand');
let enemy_discards = document.getElementById('enemyDiscards');
let enemy_called_tiles_pile = document.getElementById('enemyCalledTiles');

let player_tiles = [];
let player_called_tiles = [];
let player_called_quads = 0;

let enemy_tiles = [];
let enemy_called_tiles = [];
let enemy_called_quads = 0;
let enemy_triplets_tiles = [];
let enemy_triplets_dict = {};
let enemy_pairs_tiles = [];
let enemy_pairs_dict = {};
let enemy_incomplete_sequences_tiles = [];
let enemy_incomplete_sequences_dict = {};

let first_turn; 
let curr_turn;
let tiles_remaining;
let to_insert;
let player_recently_discarded;
let enemy_recently_discarded;

let categorized_useful;
let useful;
let not_useful;

const tile_data = await d3.csv('tiles.csv', (row) => ({
      tile: String(row.tile),
      desc: String(row.desc),
      img_path: String(row.img_path),
      tile_id: Number(row.tile_id),
      category: String(row.category),
}));

let tile_counts = await d3.csv('tiles_count.csv', (row) => ({
    player_unknown: Number(row.player_unknown),
    enemy_unknown: Number(row.enemy_unknown)
})) 

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

function sort_by_unknown(array) {
    array.sort(function(a, b){return tile_counts[tile_data[a].tile_id].enemy_unknown -  tile_counts[tile_data[b].tile_id].enemy_unknown})
}

function player_check_hand(hand) {
    let triplets = [];
    let pairs = [];
    let sequence_tiles = [];
    let incomplete_sequences = [];

    for (let i = 2; i < hand.length; i++) {
        if (tile_data[hand[i-2]].tile_id === tile_data[hand[i-1]].tile_id && tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id) {
            triplets.push(hand[i-2]);
            triplets.push(hand[i-1]);
            triplets.push(hand[i]);
        } else if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id) {
            pairs.push(hand[i-1]);
            pairs.push(hand[i]);
        }
    }

    for (let i = 2; i < hand.length; i++) {

        // THIS CURRENT PART OF THE CODE DOES NOT REGISTER [b1,b1,b2,b2,b3,b3] AS A COMPLETE SEQUENCE CURRENTLY

        if (tile_data[hand[i-2]].tile_id === tile_data[hand[i-1]].tile_id - 1 && tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 1 && tile_data[hand[i-2]].category === tile_data[hand[i-1]].category && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]])) {
            sequence_tiles.push(hand[i-2]);
            sequence_tiles.push(hand[i-1]);
            sequence_tiles.push(hand[i]);
        } else if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 1 && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]].category)) {
            incomplete_sequences.push(hand[i-1]);
            incomplete_sequences.push(hand[i]);

            // NEED TO SOMEHOW SAVE THE TILE THAT WOULD BE NEEDED TO COMPLETE THE SEQUENCE SO THE ENEMY CAN CALL ON SEQUENCES

        } else if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 2 && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]].category)) {
            incomplete_sequences.push(hand[i-1]);
            incomplete_sequences.push(hand[i]);
        }
    }

    triplets = triplets.filter((value, index, self) => self.indexOf(value) === index);
    sequence_tiles = sequence_tiles.filter((value, index, self) => self.indexOf(value) === index);
    pairs = pairs.filter((value, index, self) => self.indexOf(value) === index);
    incomplete_sequences = incomplete_sequences.filter((value, index, self) => self.indexOf(value) === index);

    return [triplets, sequence_tiles, pairs, incomplete_sequences];
}

function enemy_check_hand(hand) {
    let triplets = [];
    let pairs = [];
    let sequence_tiles = [];
    let incomplete_sequences = [];

    enemy_pairs_dict = {};
    enemy_pairs_tiles = [];
    enemy_incomplete_sequences_dict = {};
    enemy_incomplete_sequences_tiles = [];
    enemy_triplets_dict = {};
    enemy_triplets_tiles = [];

    for (let i = 1; i < hand.length; i++) {
        if (i >= 2) {
            if (tile_data[hand[i-2]].tile_id === tile_data[hand[i-1]].tile_id && tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id) {
                triplets.push(hand[i-2]);
                triplets.push(hand[i-1]);
                triplets.push(hand[i]);
                enemy_triplets_tiles.push(tile_data[hand[i]].tile_id);
                enemy_triplets_dict[tile_data[hand[i]].tile_id] = [hand[i-2], hand[i-1], hand[i]];
                continue;
            } 
        }
        
        if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id) {
            pairs.push(hand[i-1]);
            pairs.push(hand[i]);
            enemy_pairs_tiles.push(tile_data[hand[i]].tile_id);
            enemy_pairs_dict[tile_data[hand[i]].tile_id] = [hand[i-1], hand[i]];
        }
    }

    for (let i = 1; i < hand.length; i++) {

        // THIS CURRENT PART OF THE CODE DOES NOT REGISTER [b1,b1,b2,b2,b3,b3] AS A COMPLETE SEQUENCE CURRENTLY

        // GET UNIQUE TILES ONLY TO FIX THIS !!!!!!!!!!!!!!!!!!!!!!!!!!!

        if (i >= 2) {
            if (tile_data[hand[i-2]].tile_id === tile_data[hand[i-1]].tile_id - 1 && tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 1 && tile_data[hand[i-2]].category === tile_data[hand[i-1]].category && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]])) {
                sequence_tiles.push(hand[i-2]);
                sequence_tiles.push(hand[i-1]);
                sequence_tiles.push(hand[i]);
                continue;
            }
        }
        
        if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 1 && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]].category)) {
            incomplete_sequences.push(hand[i-1]);
            incomplete_sequences.push(hand[i]);
            enemy_incomplete_sequences_tiles.push(tile_data[hand[i]].tile_id - 2);
            enemy_incomplete_sequences_tiles.push(tile_data[hand[i]].tile_id + 1);
            enemy_incomplete_sequences_dict[tile_data[hand[i]].tile_id - 2] = [hand[i-1], hand[i]];
            enemy_incomplete_sequences_dict[tile_data[hand[i]].tile_id + 1] = [hand[i-1], hand[i]];

        } else if (tile_data[hand[i-1]].tile_id === tile_data[hand[i]].tile_id - 2 && tile_data[hand[i-1]].category === tile_data[hand[i]].category && !['dragon', 'wind'].includes(tile_data[hand[i]].category)) {
            incomplete_sequences.push(hand[i-1]);
            incomplete_sequences.push(hand[i]);
            enemy_incomplete_sequences_tiles.push(tile_data[hand[i]].tile_id - 1);
            enemy_incomplete_sequences_dict[tile_data[hand[i]].tile_id - 1] = [hand[i-1], hand[i]];
        }
    }

    triplets = triplets.filter((value, index, self) => self.indexOf(value) === index);
    sequence_tiles = sequence_tiles.filter((value, index, self) => self.indexOf(value) === index);
    pairs = pairs.filter((value, index, self) => self.indexOf(value) === index);
    incomplete_sequences = incomplete_sequences.filter((value, index, self) => self.indexOf(value) === index);

    console.log(1,enemy_triplets_dict);
    console.log(11,enemy_triplets_tiles);
    console.log(2,enemy_pairs_dict);
    console.log(22, enemy_pairs_tiles);
    console.log(3,enemy_incomplete_sequences_dict);
    console.log(33,enemy_incomplete_sequences_tiles);

    return [triplets, sequence_tiles, pairs, incomplete_sequences];
}

function pick_discard_tile(hand) {
    categorized_useful = enemy_check_hand(hand);
    let triplets = categorized_useful[0];
    let sequences = categorized_useful[1];
    let pairs = categorized_useful[2];
    let incomplete_sequences = categorized_useful[3];

    useful = [...triplets, ...sequences, ...pairs, ...incomplete_sequences];

    console.log('hand: ', hand);
    console.log('useful tiles: ', useful)

    not_useful = []

    for (let i = 0; i < hand.length; i++) {
        if (!useful.includes(hand[i])) {
            not_useful.push(hand[i])
        }
    }

    console.log('not useful: ', not_useful)

    if (not_useful.length === 1) {
        return not_useful[0]
    } else if (not_useful.length > 1) {
        sort_by_unknown(not_useful)
        return not_useful[0]
        // eventually, should discard the one that has been played the most already ie the least risky tile but idk maybe some 
        // if not_useful is empty, should discard from sequence that is a single possibility (1, 3) 
        // PRIORITIZE GETTING RID OF 1 OR 9 FOR THESE CASES otherwise, check for least risky/least likely tile
    } else if (not_useful.length === 0) {
        sort_by_unknown(categorized_useful[0]);
        sort_by_unknown(categorized_useful[1]);
        sort_by_unknown(categorized_useful[2]);
        sort_by_unknown(categorized_useful[3]);

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
        player_hand.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[hand[i]].img_path}" id=${hand[i]} height="80px" border="1px"></img>`)
        document.getElementById(hand[i]).addEventListener('click', function () {
            console.log(`CLICKED ON ${this.id}`);
            if (this.classList.length === 0) {
                this.classList.add('selected');
                this.style.height = "100px";
            } else {
                this.classList.remove('selected');
                this.style.height = "80px"
            }
        })
        document.getElementById(hand[i]).addEventListener('mouseover', function () {
            if (this.classList.length === 0) {
                this.style.height = "100px";
            }
        })
        document.getElementById(hand[i]).addEventListener('mouseleave', function () {
            if (this.classList.length === 0) {
                this.style.height = "80px";
            }
        })
    }
}

function form_enemy_hand(hand) {
    enemy_hand.innerHTML = '';

    for (let i = 0; i < hand.length; i++) {
        enemy_hand.insertAdjacentHTML('beforeend', `<img src="tile_imgs/Back.png" id=${hand[i]} height="80px"></img>`)
    }
}

document.getElementById('playerDrawTileBtn').addEventListener('click', function() {
    if (player_tiles.length + player_called_tiles.length - player_called_quads <= 13) {
        player_draw(player_tiles);
    } else {
        alert('DISCARD A TILE')
    }
})

document.getElementById('playerDiscardTileBtn').addEventListener('click', function() {
    if (player_tiles.length + player_called_tiles.length - player_called_quads > 13) {
        player_discard();
    } else {
        alert('DRAW A TILE')
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
            tile_counts[tile_data[to_insert].tile_id].player_unknown--;
        }

        sort(player_tiles);
        form_player_hand(player_tiles);

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            enemy_tiles.push(to_insert);
            tile_data[to_insert].count--;
            tile_counts[tile_data[to_insert].tile_id].enemy_unknown--;
        }

        sort(enemy_tiles);
        form_enemy_hand(enemy_tiles);
        tiles_remaining = tiles_remaining - 26;

    } else {
        for (let i = 1; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            enemy_tiles.push(to_insert);
            tile_data[to_insert].count--;
            tile_counts[tile_data[to_insert].tile_id].enemy_unknown--;
        }

        sort(enemy_tiles);
        form_enemy_hand(enemy_tiles);

        for (let i = 2; i < 27; i+=2) {
            to_insert = wall[tiles_remaining-i];
            player_tiles.push(to_insert);
            tile_data[to_insert].count--;
            tile_counts[tile_data[to_insert].tile_id].player_unknown--;
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
    tile_counts[tile_data[drawn_tile].tile_id].player_unknown--;
    hand.push(drawn_tile);
    sort(hand);

    player_drawn_tile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[drawn_tile].img_path}" id=${drawn_tile} height="80px" border="1px"></img>`)
    document.getElementById(drawn_tile).addEventListener('click', function () {
        console.log(`CLICKED ON ${this.id}`);
        if (this.classList.length === 0) {
            this.classList.add('selected');
            this.style.height = "100px";
        } else {
            this.classList.remove('selected');
            this.style.height = "80px"
        }
    })
    document.getElementById(drawn_tile).addEventListener('mouseover', function () {
        if (this.classList.length === 0) {
                this.style.height = "100px";
        }
    })
    document.getElementById(drawn_tile).addEventListener('mouseleave', function () {
        if (this.classList.length === 0) {
                this.style.height = "80px";
        }
    })
}

function enemy_draw(hand) {
    if (tiles_remaining === 0) {
        end_game();
        return;
    }

    let drawn_tile = wall.pop();
    tiles_remaining--;
    tile_counts[tile_data[drawn_tile].tile_id].enemy_unknown--;
    hand.push(drawn_tile);
    sort(hand);
    form_enemy_hand(enemy_tiles);
    return;
}

function player_discard() {
    console.log('hiiii: ', player_drawn_tile.innerHTML);

    let to_discard = document.getElementsByClassName('selected');
    if (to_discard.length === 1) {
        let discard_data = to_discard[0];
        player_recently_discarded = Number(discard_data.id);
        tile_counts[tile_data[player_recently_discarded].tile_id].enemy_unknown--;
        document.getElementById(discard_data.id).remove();
        player_discards.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[discard_data.id].img_path}" id=${discard_data.id} height="80px" border="1px"></img>`);
        player_tiles.splice(player_tiles.indexOf(Number(discard_data.id)), 1);
        if (enemy_check_ron()) {
            return;
        } else if (enemy_call_quad()) {
            return;
        } else if (enemy_call_triplet()) {
            return;
        } else if (enemy_call_sequence()) {
            return;
        } else {
            enemy_draw(enemy_tiles);
            enemy_check_tsumo();
            enemy_discard();
        };
    } else {
        alert('INVALID AMOUNT OF TILES SELECTED');
    }
    if (player_drawn_tile.innerHTML) {
        player_drawn_tile.innerHTML = '';
        form_player_hand(player_tiles);
        return;
    }
    return;
}

function enemy_discard() {
    let to_discard = pick_discard_tile(enemy_tiles);
    tile_counts[tile_data[to_discard].tile_id].player_unknown--;
    console.log('enemy discarded: ', to_discard);
    console.log(document.getElementById(to_discard));
    console.log(document.getElementById('enemyHand'));
    let discard_index = enemy_tiles.indexOf(to_discard);
    console.log(discard_index);
    enemy_recently_discarded = Number(to_discard);
    document.getElementById(to_discard).remove();
    enemy_discards.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[to_discard].img_path}" id=${to_discard} height="80px" border="1px"></img>`)
    enemy_tiles.splice(discard_index, 1);
    console.log(enemy_tiles);
    return;
}

document.getElementById('playerPonBtn').addEventListener('click', function() {
    player_call_triplet();
})


function player_call_triplet() {
    let enemy_discarded = enemy_recently_discarded;

    let pair = document.getElementsByClassName('selected');
    let ids = [pair[0].id, pair[1].id, enemy_discarded];
    if (pair.length === 2) {
        if (tile_data[ids[0]].tile_id === tile_data[ids[1]].tile_id && tile_data[ids[1]].tile_id === tile_data[ids[2]].tile_id) {
            player_called_tiles = [...player_called_tiles, ...ids, String(enemy_discarded)];
            console.log(player_called_tiles);
            player_tiles.splice(player_tiles.indexOf(Number(pair[0].id)), 1);
            player_tiles.splice(player_tiles.indexOf(Number(pair[1].id)), 1);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[0]].img_path}" height="80px" border="1px"></img>`);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[1]].img_path}" height="80px" border="1px"></img>`);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[2]].img_path}" height="80px" border="1px"></img>`);
            document.getElementById(ids[0]).remove();
            document.getElementById(ids[1]).remove();
            document.getElementById(ids[2]).remove();
        } else {
            alert('ur dumb 2')
        }
    } else {
        alert('ur dumb');
    }
}

document.getElementById('playerChiBtn').addEventListener('click', function() {
    player_call_sequence();
})

function player_call_sequence() {
    let enemy_discarded = enemy_recently_discarded;

    let incomplete_sequence = document.getElementsByClassName('selected');
    if (incomplete_sequence.length === 2) {
        let ids = [incomplete_sequence[0].id, incomplete_sequence[1].id, String(enemy_discarded)];
        sort(ids);

        if (tile_data[ids[0]].tile_id === tile_data[ids[1]].tile_id - 1 && tile_data[ids[1]].tile_id === tile_data[ids[2]].tile_id - 1 && tile_data[ids[0]].category === tile_data[ids[1]].category && tile_data[ids[0]].category === tile_data[ids[2]].category) {
            player_called_tiles = [...player_called_tiles, ...ids];
            player_tiles.splice(player_tiles.indexOf(Number(ids[0])), 1);
            player_tiles.splice(player_tiles.indexOf(Number(ids[1])), 1);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[0]].img_path}" height="80px" border="1px"></img>`);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[1]].img_path}" height="80px" border="1px"></img>`);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[2]].img_path}" height="80px" border="1px"></img>`);
            document.getElementById(ids[0]).remove();
            document.getElementById(ids[1]).remove();
            document.getElementById(ids[2]).remove();
        } else {
            alert('ur dumb 2');
        }
    } else {
        alert('ur dumb');
    }
}

document.getElementById('playerKanBtn').addEventListener('click', function() {
    player_call_quad();
})

function player_call_quad() {
    let enemy_discarded = enemy_recently_discarded;

    let triplet = document.getElementsByClassName('selected');
    if (triplet.length === 3) {
        let ids = [triplet[0].id, triplet[1].id, triplet[2].id, enemy_discarded]
        if (tile_data[ids[0]].tile_id === tile_data[ids[1]].tile_id && tile_data[ids[1]].tile_id === tile_data[ids[2]].tile_id && tile_data[ids[2]].tile_id === tile_data[ids[3]].tile_id) {
            player_called_tiles = [...player_called_tiles, ...ids];
            player_tiles.splice(player_tiles.indexOf(Number(ids[0])), 1);
            player_tiles.splice(player_tiles.indexOf(Number(ids[1])), 1);
            player_tiles.splice(player_tiles.indexOf(Number(ids[2])), 1);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[0]].img_path}" height="80px" border="1px"></img>`);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[1]].img_path}" height="80px" border="1px"></img>`);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[2]].img_path}" height="80px" border="1px"></img>`);
            player_called_tiles_pile.insertAdjacentHTML('beforeend', `<img src="tile_imgs/${tile_data[ids[3]].img_path}" height="80px" border="1px"></img>`);
            document.getElementById(ids[0]).remove();
            document.getElementById(ids[1]).remove();
            document.getElementById(ids[2]).remove();
            document.getElementById(ids[3]).remove();
            player_called_quads++;
        } else {
            alert('ur dumb 2')
        }
    } else {
        alert('ur dumb');
    }   
}

function enemy_call_triplet() {
    let player_discarded = player_recently_discarded;
    console.log("tpd", player_discarded);

    console.log(enemy_pairs_dict[player_discarded]);
    console.log(enemy_pairs_dict);

    if (!enemy_pairs_tiles.includes(tile_data[player_discarded].tile_id) || enemy_triplets_tiles.includes(tile_data[player_discarded].tile_id)) {
        console.log('no pair');
        return false;
    }
    
    let pair = enemy_pairs_dict[tile_data[player_discarded].tile_id];
    console.log("pa", pair)

    if (pair.length === 2) {
        if (tile_data[player_discarded].tile_id === tile_data[pair[0]].tile_id && tile_data[pair[0]].tile_id === tile_data[pair[1]].tile_id) {
            enemy_called_tiles = [...enemy_called_tiles, ...pair, String(player_discarded)];
            enemy_tiles.splice(enemy_tiles.indexOf(Number(pair[0].id)), 1);
            enemy_tiles.splice(enemy_tiles.indexOf(Number(pair[1].id)), 1);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[Number(player_discarded)].img_path}" height="80px" border="1px"></img>`);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[pair[0]].img_path}" height="80px" border="1px"></img>`);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[pair[1]].img_path}" height="80px" border="1px"></img>`);
            document.getElementById(player_discarded).remove();
            document.getElementById(pair[0]).remove();
            document.getElementById(pair[1]).remove();
            enemy_discard();
            return true;
        }
    }
    return false;
}

function enemy_call_sequence() {
    let player_discarded = player_recently_discarded;
    console.log("ispd", player_discarded);

    if (!enemy_incomplete_sequences_tiles.includes(tile_data[player_discarded].tile_id)) {
        console.log('no seq');
        return false;
    }

    let incomplete_sequence = enemy_incomplete_sequences_dict[tile_data[player_discarded].tile_id];
    console.log("is", incomplete_sequence);

    if (incomplete_sequence.length === 2) {
        let ids = [incomplete_sequence[0], incomplete_sequence[1], player_discarded];
        sort(ids);

        if (tile_data[ids[0]].tile_id === tile_data[ids[1]].tile_id - 1 && tile_data[ids[1]].tile_id === tile_data[ids[2]].tile_id - 1 && tile_data[ids[0]].category === tile_data[ids[1]].category && tile_data[ids[0]].category === tile_data[ids[2]].category) {
            enemy_called_tiles = [...enemy_called_tiles, ...ids];
            enemy_tiles.splice(enemy_tiles.indexOf(Number(ids[0])), 1);
            enemy_tiles.splice(enemy_tiles.indexOf(Number(ids[1])), 1);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[ids[0]].img_path}" height="80px" border="1px"></img>`);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[ids[1]].img_path}" height="80px" border="1px"></img>`);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[ids[2]].img_path}" height="80px" border="1px"></img>`);
            document.getElementById(ids[0]).remove();
            document.getElementById(ids[1]).remove();
            document.getElementById(ids[2]).remove();
            enemy_discard();
            return true;
        }
    }
    return;
}

function enemy_call_quad() {
    let player_discarded = player_recently_discarded;
    console.log("qpd", player_discarded);
    console.log(enemy_triplets_dict[tile_data[player_discarded].tile_id]);

    if (!enemy_triplets_tiles.includes(tile_data[player_discarded].tile_id)) {
        console.log('no trip')
        return false;
    }

    let triplet = enemy_triplets_dict[tile_data[player_discarded].tile_id];
    console.log('tri', triplet);

    if (triplet.length === 3) {
        if (tile_data[triplet[0]].tile_id === tile_data[triplet[1]].tile_id && tile_data[triplet[1]].tile_id === tile_data[triplet[2]].tile_id && tile_data[triplet[2]].tile_id === tile_data[player_discarded].tile_id) {
            enemy_called_tiles = [...enemy_called_tiles, ...triplet];
            enemy_tiles.splice(enemy_tiles.indexOf(Number(triplet[0])), 1);
            enemy_tiles.splice(enemy_tiles.indexOf(Number(triplet[1])), 1);
            enemy_tiles.splice(enemy_tiles.indexOf(Number(triplet[2])), 1);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[triplet[0]].img_path}" height="80px" border="1px"></img>`);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[triplet[1]].img_path}" height="80px" border="1px"></img>`);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[triplet[2]].img_path}" height="80px" border="1px"></img>`);
            enemy_called_tiles_pile.insertAdjacentHTML('afterbegin', `<img src="tile_imgs/${tile_data[player_discarded].img_path}" height="80px" border="1px"></img>`);
            document.getElementById(triplet[0]).remove();
            document.getElementById(triplet[1]).remove();
            document.getElementById(triplet[2]).remove();
            document.getElementById(player_discarded).remove();
            enemy_called_quads++;
            enemy_draw();
            enemy_check_tsumo(enemy_tiles);
            enemy_discard();
            return true;
        }
    }
    return false;
}

// NEED TO ACCOUNT FOR CALLED TILES EVENTUALLY

function player_check_tsumo(hand=player_tiles) {
    // after drawing a tile, hand should have 14 tiles
    sort(hand);

    let checked = player_check_hand(hand);

    console.log(checked);
    
    if (hand.length + (player_called_tiles.length - player_called_quads) != 14) {
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 + (player_called_tiles.length - player_called_quads)/3 === 4 && checked[2].length/2 === 1) {
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
    hand.push(tile);

    sort(hand);

    let tile_id = hand.indexOf(tile);

    let checked = check_hand(hand);

    if (hand.length + (player_called_tiles.length - player_called_quads) != 14) {
        hand.splice(tile_id, 1);
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 + (player_called_tiles.length - player_called_quads)/3 === 4 && checked[2].length/2 === 1) {
        alert('yay u win');
        hand.splice(tile_id, 1);
        return true;
    } else if (checked[2].length === 7) {
        alert('yay u win');
        hand.splice(tile_id, 1);
        return true;
    } else {
        hand.splice(tile_id, 1);
        return false;
    }

    // need a if statement for 13 orphans!!!!
}

// NEED TO ACCOUNT FOR CALLED TILES EVENTUALLY

function enemy_check_tsumo(hand=enemy_tiles) {
    // after drawing a tile, hand should have 14 tiles
    sort(hand);

    let checked = enemy_check_hand(hand);

    console.log('tsumo_hand', hand);
    console.log('cats', checked);
    
    if (hand.length != 14) {
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 + (player_called_tiles.length - player_called_quads)/3 === 4 && checked[2].length/2 === 1) {
        alert('yay u lose');
        return true;
    } else if (checked[2]. length === 7) {
        alert('yay u lose');
        return true;
    } else {
        return false;
    }

    // need a if statement for 13 orphans!!!! [0,8,9,17,18,26,27,28,29,30,31,32,33] plus a pair
}

// NEED TO ACCOUNT FOR CALLED TILES EVENTUALLY

function enemy_check_ron(tile=player_recently_discarded, hand=enemy_tiles) {
    hand.push(tile);

    sort(hand);

    let tile_id = hand.indexOf(tile);

    let checked = player_check_hand(hand);

    if (hand.length != 14) {
        hand.splice(tile_id, 1);
        console.log(hand);
        return false;
    } else if (checked[0].length/3 + checked[1].length/3 === 4 && checked[2].length/2 === 1) {
        alert('yay u lose');
        hand.splice(tile_id, 1);
        console.log(hand);
        return true;
    } else if (checked[2].length === 7) {
        alert('yay u lose');
        hand.splice(tile_id, 1);
        console.log(hand);
        return true;
    } else {
        hand.splice(tile_id, 1);
        console.log(hand);
        return false;
    }

    // need a if statement for 13 orphans!!!!
}

function end_game() {
    alert('GAME OVER');
    return;
}

setup();
console.log('counts', tile_counts);
sort_by_unknown(enemy_tiles);
console.log('unknown', enemy_tiles);

// enemy_tiles = [0,1,3,7,17,18,22,26,31,36,44,50,80];
// form_enemy_hand(enemy_tiles);
// player_tiles = [2,8,61,62,63,64,65,66,67,68,69,70,71];
// form_player_hand(player_tiles);

enemy_check_hand(enemy_tiles);
console.log(1,enemy_triplets_dict);
console.log(11,enemy_triplets_tiles)
console.log(2,enemy_pairs_dict);
console.log(22, enemy_pairs_tiles)
console.log(3,enemy_incomplete_sequences_dict);
console.log(33,enemy_incomplete_sequences_tiles)

// let dict = {'yo': ['1', '2']};
// dict['yoo'] = 21;
// console.log('dict', dict)

// player_tiles = [1,4,8,16,17,18,20,21,22,24,25,26,28];
// wall.push(29);
// form_player_hand(player_tiles);
