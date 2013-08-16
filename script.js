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
function text(t, x, y) {ctx.fillText(t, x || 0, y || 0);}
function percentx(x) {return x / 320 * width;}
function percenty(x) {return x / 192 * height;}
var pop = function() {ctx.restore();};
var random = Math.random;
var abs = Math.abs;
var min = Math.min;
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
    mcSprite("BAYBAQMHAQI=")
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

// State Vars
var mticks = 0;
var message;
// 1
var x, y = 0, vy = 0;
var moose_x, moose_speed;
var rocks;
var holes;
var beerpos;
var difficulty = 0;
var stage;
var ground_top = height * 0.92;
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
        push(4, width / 8 - 32, height / 4 * 0.5);
        text('BEARICORN');
        pop();
        text('PRESS ARROW KEY TO START', width / 2 - 80, height * 0.6);
    },
    // 1 - Level 1
    function(ratio) {
        // Rendering
        color('black');
        fill();
        color('gray');
        for (var i = 0, r; r = rocks[i++];) {
            function rock_reset() {
                r[0] = (random() * 0.8 + 0.2) * width;
                r[1] = 0;
            }
            fr(r[0], r[1], 10, 10);
            r[1] += ratio * difficulty * 0.3;
            if (r[1] > height) {
                rock_reset();
            }
            // Some game logic (shhh)
            if (abs(r[1] - y - 155) < 15 &&
                abs(r[0] - x) < 15) {
                if (vy < 0) {
                    vy = min(vy + 12, 7);
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
        fr(0, ground_top, width * 0.1 + 1, height);
        fr(width * 0.9, ground_top, width * 0.1, height);

        for(var i = 0; i < 6; i++) {
            if(!holes[i])
                fr(width * (i * 0.133 + 0.1) + 1, ground_top, width * 0.133 + 1, height);
        }

        if (beerpos + 1) {
            color('blue');
            var bx = (beerpos * 0.133 + 0.15) * width;
            fr(bx, ground_top - 20, width * 0.03, 20);
            if (abs(x + 5 - bx) < 10 && y > -10) {
                difficulty /= 2;
                beerpos = -1;
                mticks = 100;
                message = 'MOLSON!';
            }
        }

        // Game logic
        function get_floor(new_x) {
            // TODO: This can be heavily optimized.
            var px = new_x / width;
            if (px > 0.1 && px < 0.8) {
                px -= 0.1;
                return min(holes[px / 0.133 | 0],
                           holes[(px + 0.08) / 0.133 | 0]) ? 100 : 0;
            } else {
                return 0;
            }
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
            return setups[state = random() * 10 | 0 ? 5 : 7]();
            // return setups[state = 7]();
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
            push(4, percentx(20), percenty(20 - abs(Math.sin((mticks -= ratio) / 10)) * 5));
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
    noop
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
            if (rocks.length * 2 < difficulty) {
                rocks.push([]);
            }
            // Put the beer on a random pillar.
            beerpos = random() * 3 | 0 ? -1 : random() * 6 | 0;
            stage++;
        }
        // Set up the moose
        moose_x = 0;
        moose_speed = 0.5;
        
        // Set up holes
        holes = Array(6);
        for (var i = 0; i < min(4, difficulty * 0.15 + 1); i++) {
            var hole;
            holes[hole = random() * 6 | 0] = 1;
            if (hole == beerpos) {beerpos = -1;}
        }
        // Set up the rocks
        for (var i = 0, r; r = rocks[i++];) {
            r[0] = (random() * 0.85 + 0.1) * width;
            r[1] = (random() - 0.3) * height;
        }
        // Reset the state vars
        x = since_jump = 0;
    },
    // 2 - Level 2
    noop,
    // 3 - Level 3
    noop,
    // 4 - Won
    noop,
    // 5 - Losing
    function() {
        vy = 0;
        death_count = 0;
    },
    // 6 - Lost
    function() {
        y = 0;
        death_count = 0;
        color('#000');
        fill();
        color('#fff');
        push(4, 10, 25);
        text("GAME OVER");
        pop();
    },
    // 7 - ET
    function() {
        color('brown');
        fill();
        color('#000');
        fr(width / 3, 0, width / 3, ground_top);
        drawBear(110, 145);
        if (random() * 200 | 0) {
        // if (0) {
            drawET(165, 145);
        } else {
            ctx.scale(-1, 1);
            drawMoose(-210, 132);
        }
    }
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
var keybindings = {38: 'jump', 37: 'left', 39: 'right'}
function key(e, enable) {
    var enable = e.type == 'keydown';
    var kc = e.keyCode;
    if(!state) {
        // If an arrow key was pressed on the start screen, run the setup for state 1.
        return (kc > 39 || kc < 37) ? 0 : setups[state = 1]();
    }
    keys[keybindings[kc]] = enable;
};

})(canvas.getContext('2d'), canvas.width, canvas.height);
