import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let possible_tiles = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
    11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20,
    21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30,
    31, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33, 33
];

const tile_data = await d3.csv('tiles.csv', (row) => ({
      id: Number(row.id), // or just +row.line
      tile: String(row.tile),
      desc: String(row.tile),
      img_path: String(row.img_path)
}));

console.log('Tile Data: ', tile_data);

function setup() {
    let wall = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
        11, 11, 11, 11, 12, 12, 12, 12, 13, 13, 13, 13, 14, 14, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20,
        21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24, 24, 24, 24, 25, 25, 25, 25, 26, 26, 26, 26, 27, 27, 27, 27, 28, 28, 28, 28, 29, 29, 29, 29, 30, 30, 30, 30,
        31, 31, 31, 31, 32, 32, 32, 32, 33, 33, 33, 33
    ];

    shuffle(wall);

    console.log('All Possible Tiles: ', possible_tiles);
    console.log('Wall: ', wall);

    let player_hand = [];
    let player_called_tiles = [];
    let enemy_hand = [];
    let enemy_called_tiles = [];
    
}

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
    return array.sort(function(a, b){return a - b})
}

function check_triplets(array) {
    let triplets = [];

    for (let i = 2; i < array.length; i++) {
        if (array[i-2] === array[i-1] && array[i-1] === array[i]) {
            triplets.push(array[i]);
        }
    }

    return triplets.filter((value, index, self) => self.indexOf(value) === index);
}

function check_sequence(array) {
    let grouped_sequences = [];
    let sequence_tiles = [];

    for (let i = 2; i < array.length; i++) {
        if (array[i-2] === (array[i-1] - 1) && array[i-1] === (array[i] - 1)) {
            grouped_sequences.push([array[i-2], array[i-1], array[i]]);
            sequence_tiles.push(array[i-2]);
            sequence_tiles.push(array[i-1]);
            sequence_tiles.push(array[i]);
        }
    }

    return [grouped_sequences, sequence_tiles.filter((value, index, self) => self.indexOf(value) === index)];
}

function check_pairs(array) {
    let pairs = [];

    for (let i = 1; i < array.length; i++) {
        if (array[i-1] === array[i]) {
            pairs.push(array[i])
        }
    }

    return pairs.filter((value, index, self) => self.indexOf(value) === index);;
}

function check_incomplete_sequence(array) {
    let grouped_incomplete_sequences = [];
    let incomplete_sequence_tiles = [];

    for (let i = 1; i < array.length; i++) {
        if (array[i-1] === (array[i] - 1) || array[i-1] === (array[i] - 2)) {
            grouped_incomplete_sequences.push([array[i-1], array[i]]);
            incomplete_sequence_tiles.push(array[i-1]);
            incomplete_sequence_tiles.push(array[i]);
        }
    }

    return [grouped_incomplete_sequences, incomplete_sequence_tiles.filter((value, index, self) => self.indexOf(value) === index)];
}

function pick_discard_tile(array) {
    let triplets = check_triplets(array);
    let sequences = check_sequence(array)[1];
    let pairs = check_pairs(array);
    let incomplete_sequences = check_incomplete_sequence(array)[1]

    let useful = triplets.concat(sequences, pairs, incomplete_sequences).filter((value, index, self) => self.indexOf(value) === index);

    let not_useful = []

    for (let i = 0; i < array.length; i++) {
        if (!useful.includes(array[i])) {
            not_useful.push(array[i])
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

setup();
console.log(check_triplets([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(check_sequence([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(check_pairs([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(check_incomplete_sequence([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));
console.log(pick_discard_tile([1, 2, 3, 8, 9, 30, 50, 52, 90, 90, 100, 100, 100]));