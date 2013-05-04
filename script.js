var canvas = document.getElementById("canvas");
var raf = requestAnimationFrame;
var ael = window.addEventListener;

/*
Potential optimizations:
- Uplift color names
*/

(function(ctx, width, height) {
ctx.font = "9pt Courier";

var fr = function(){ctx.fillRect.apply(ctx, arguments);};
var fill = function(){fr(0, 0, width, height)};
function color(c) {ctx.fillStyle = c;}
function push(scale, tx, ty) {
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(percentx(tx), percenty(ty));
}
function pop() {ctx.restore();}
function text(t, x, y) {ctx.fillText(t, x || 0, y || 0);}
function percentx(x) {return x / 320 * width;}
function percenty(x) {return x / 192 * height;}
function random() {return Math.random();}
function noop() {};

// To encode: btoa(String.fromCharCode.apply(String, [...]))
function decode(spr) {return atob(spr).split('').map(function(x) {return x.charCodeAt(0);});}
function sprite(scale, fill) {
    return function(spf) {
        return function(x, y) {
            color(fill);
            ctx.save();
            ctx.translate(percentx(x), percenty(y));
            ctx.scale(scale, scale);
            spf();
            ctx.restore();
        };
    };
}
function mcSprite(raw) {
    var sheet = decode(raw)
    return function() {
        for (var i = 0; i < sheet.length; i += 4) {
            fr(percentx(sheet[i]), percenty(sheet[i + 1]), percentx(sheet[i + 2]), percenty(sheet[i + 3]));
        }
    };
}

var drawET = sprite(2, '#D5F2D7')(mcSprite("AAACBQIACQEEAQcBAgIBAwMCCwILBAMICAYDBgwMAgMKDgQBCAwCAQYHAgUECAIHAAgEAQAJAgECDQICAQ4BAQ=="));
var drawMoose = sprite(5, 'green')(mcSprite("AQQBAQEFAgQDBQQCBQcCAgUEBAEGAQEDBwABAwgBAQEEAgIBBAABAgMBAQE="));
var bearSprites = [
    mcSprite("AQUFAgAGAQMGBAICAgcEAQMBAwEEAAEBBQgBAQ=="),
    mcSprite("BwMBAQQCAQE="),
    mcSprite("BAYBAQMHAQI="),
];
var drawBear = sprite(3.5, 'brown')(function() {
    bearSprites[0]();
    color('#fff');
    bearSprites[1]();
    color('red');
    fr(3, 3, 2, 3);
    color('#000');
    bearSprites[2]();
});

function clear() {ctx.clearRect(0, 0, width, height);}

// State Vars
var mticks = 0;
var message;
// 1
var x, y, vy;
var moose_x, moose_speed;
var rocks;
var holes;
var beerpos;
var difficulty = 0;
var stage;
// 2
// 3
// 4
// 5
var death_count;
//////////////////


var keys = {};

var state = 0;
var states = [
    // 0 - Start screen
    function() {
        color('blue');
        fr(0, 0, width, height);
        color('#fff');
        push(4, 10, 25);
        text('BEARICORN');
        pop();
        text('PRESS ARROW KEY TO START', percentx(80), percenty(130));
    },
    // 1 - Level 1
    function(ratio) {
        clear();
        // Rendering
        color('black');
        fill();
        color('gray');
        for (var i = 0, r; r = rocks[i++];) {
            function rock_reset() {
                r[0] = random() * 6 * 40 + 40;
                r[1] = 0;
            }
            fr(percentx(r[0]), percenty(r[1]), 10, 10);
            r[1] += ratio * difficulty * 0.3;
            if (r[1] > height) {
                rock_reset();
            }
            // Some game logic (shhh)
            if (Math.abs(r[1] - y - 155) < 15 &&
                Math.abs(r[0] - x) < 15) {
                if (vy < 0) {
                    vy = Math.min(vy + 12, 7);
                    rock_reset();
                } else {
                    return setups[state = 5]();
                }
            }
        }
        drawBear(x, y + 145);
        if (moose_x < 100)
            drawMoose(240 + (moose_x += moose_speed += 0.25), 132);
        color('brown');
        fr(0, percenty(177), percentx(40), percenty(192));
        fr(percentx(280), percenty(177), percentx(320), percenty(192));

        for(var i = 0; i < 6; i++)
            if(!holes[i])
                fr(percentx((i+1) * 40), percenty(177), percentx(40), percenty(40));

        var bp = beerpos + 1;
        if (bp) {
            color('blue');
            var bx = bp * 40 + 15;
            fr(percentx(bx), percenty(162), percentx(10), percenty(15));
            if (Math.abs(x + 5 - bx) < 10 && y > -10) {
                difficulty /= 2;
                beerpos = -1;
                mticks = 100;
                message = 'MOLSON!';
            }
        }

        // Game logic
        function get_floor(new_x) {
            return (new_x > 30 && new_x < 270 && holes[(new_x - 30) / 40 | 0]) ? 100 : 0;
        }
        var floor = get_floor(x);
        if (keys.jump) {
            vy += ratio * (y === floor ? 6 : 0.1);
        }
        if (y < floor || vy) {
            y -= vy -= ratio * 0.35;
        }
        if (y >= floor) {
            y = floor;
            vy = 0;
        }
        
        if (y > 50) {
            return setups[state = (random() * 10 | 0) == 0 ? 7 : 5]();
        }

        var xtemp = x;
        keys.left ? xtemp -= ratio * 2.5 : keys.right ? xtemp += ratio * 2.5 : 0;
        if (y <= get_floor(xtemp) && xtemp > -10) {
            x = xtemp;
        }
        if (x > 290) {  // Made it to the end of the stage
            setups[1](1);  // Do a soft reset.
        }

        if (mticks > 0) {
            color('#fff');
            push(4, percentx(20), percenty(20 - Math.abs(Math.sin((mticks -= ratio) / 10)) * 5));
            text(message);
            pop();
        }
    },
    // 2 - Level 2
    noop,
    // 3 - Level 3
    noop,
    // 4 - Won
    noop,
    // 5 - Losing
    function(ratio) {
        death_count += ratio * 0.5;
        color((death_count / 12 | 0) % 2 ? 'red' : '#fff');
        fill();
        color('#000');
        drawBear(x, y + 145);
        
        if(death_count >= 60) {
            setups[state = 6]();
        }
    },
    // 6 - Lost
    function(ratio) {
        death_count += ratio;
        if(death_count >= 100) {
            state = 0;
        }
    },
    // 7 - ET
    function() {
        color('brown');
        fill();
        color('#000');
        fr(percentx(100), 0, percentx(110), percenty(160));
        drawBear(110, 130);
        drawET(165, 130);
    }
];
var setups = [
    // 0 - Start screen
    noop,
    // 1 - Level 1
    function(soft) {
        mticks = 0;
        if (!soft) {
            difficulty = 0;
            beerpos = -1;
            rocks = [];
            stage = 0;
        } else {
            difficulty++;
            if (rocks.length < difficulty / 2 | 0) {
                rocks.push([]);
            }
            // Put the beer on a random pillar.
            beerpos = (random() * 3 | 0) == 0 ? random() * 4 | 0 : -1;
            stage++;
        }
        // Set up the moose
        moose_x = 0;
        moose_speed = 0.5;
        
        // Set up holes
        holes = [0, 0, 0, 0, 0, 0];
        for (var i = 0; i < Math.min(4, difficulty * 0.15 + 1); i++) {
            var hole;
            holes[hole = random() * 6 | 0] = 1;
            if (hole == beerpos) {beerpos = -1;}
        }
        // Set up the rocks
        for (var i = 0, r; r = rocks[i++];) {
            r[0] = random() * 6 * 40 + 10;
            r[1] = random() * 150 - 75;
        }
        // Reset the state vars
        x = y = vy = since_jump = 0;
    },
    // 2 - Level 2
    noop,
    // 3 - Level 3
    noop,
    // 4 - Won
    noop,
    // 5 - Losing
    function() {
        death_count = 0;
    },
    // 6 - Lost
    function() {
        death_count = 0;
        color('#000');
        fill();
        color('#fff');
        push(4, 10, 25);
        text("GAME OVER");
        pop();
    },
    // 7 - ET
    noop
];

var lastTime = (new Date()).getTime();
function loop() {
    var now = (new Date()).getTime();
    var delta = now - lastTime;
    lastTime = now;
    var ratio = (1000 / 60) / delta;
    
    states[state](ratio);

    // text(delta.toString(), 50, 70);
    // text(ratio.toString(), 50, 50);

    raf(loop);
}
raf(loop);

ael('keydown', key);
ael('keyup', key);
function key(e, enable) {
    //log("Key: " + e.keyCode + " " + enable);
    var kc = e.keyCode;
    var enable = e.type == 'keydown';
    if(state == 0) {
        // If an arrow key was pressed on the start screen, run the setup for state 1.
        return (kc > 39 || kc < 37) ? 0 : setups[state = 1]();
    }
    switch(kc) {
        case 38: return keys.jump = enable;
        case 37: return keys.left = enable;
        case 39: return keys.right = enable;
    }
};

})(canvas.getContext('2d'), canvas.width, canvas.height);
