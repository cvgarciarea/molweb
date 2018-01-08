var canvas = document.getElementById("pad");
var ctx = canvas.getContext("2d");

var hoveredAtom = null;
var draggingAtom = null;
var bondAtom = null;

var relativeDragPos = { x: 0, y: 0 };
var mpos = { x: null, y: null };
var hover_radius = 25;
var r2 = Math.pow(hover_radius, 2);


var Tool = {
    MOVE: 0,
    RECTANGULAR_SELECTION: 1,
    FREE_SELECTION: 2,
}

var BondType = {
    SIMPLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
}

function getMousePos(event) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    }
}

function setHoveredAtom(atom) {
    if (getSelectedTool() == null) {
        hoveredAtom = atom;

        if (atom !== null) {
            $("#pad").css("cursor", "pointer");
        } else {
            $("#pad").css("cursor", "default");
        }
    }
}

var Bond = function() {
    return {
        start: null,
        end: null,
        type: 0,

        its_me: function(atom1, atom2) {  // Mario!
            return (this.start == atom1 && this.end == atom2) ||
                   (this.start == atom2 && this.end == atom1);
        }
    }
}

var Atom = function({name="", color="#000", x=0, y=0} = {}) {
    /*var name = "";
    var color = "#000";
    var x = 0;
    var y = 0;*/

    return {
        name: name,
        color: color,
        x: x,
        y: y,
        respX: null,
        respY: null,
        bonds: [],
        selected: false,
    }
}

var Pad = function() {
    return {
        loaded: false,
        atoms: [],

        addAtom: function(atom) {
            this.atoms.push(atom);

            if (this.loaded) {
                this.drawHoverCircle();
                this.drawAtom(atom);
            }
        },

        drawAtom: function(atom) {
            if (!this.loaded) {
                return;
            }

            ctx.font = "bold 35px Papyrus, sans-Serif";
            ctx.fillStyle = atom.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(atom.name, atom.x, atom.y);
        },

        drawAtoms: function() {
            for (var i=0; i<this.atoms.length; i++) {
                this.drawAtom(this.atoms[i]);
            }
        },

        getHoveredAtom: function() {
            for (var i=this.atoms.length - 1; i>=0; i--) {
                var atom = this.atoms[i];

                // (x - x0)**2 + (y - y0)**2 <= r**2
                if (Math.pow(atom.x - mpos.x, 2) + Math.pow(atom.y - mpos.y, 2) <= r2) {
                    return atom;
                }
            }

            return null;
        },

        drawHoverCircle: function() {
            if (hoveredAtom !== null) {
                ctx.fillStyle = "#0f0";

                ctx.beginPath();
                ctx.arc(hoveredAtom.x, hoveredAtom.y, hover_radius, 0, 2 * Math.PI);
                ctx.fill();

                return;
            }
        },

        drawBond: function(bond) {
            ctx.strokeStyle = "#f00";
            ctx.lineWidth = "5";

            var simpleBond = function() {
                ctx.beginPath();
                ctx.moveTo(bond.start.x, bond.start.y);
                ctx.lineTo(bond.end.x, bond.end.y);
                ctx.stroke();
            }

            var doubleBond = function(sep) {
                if (sep === undefined) {
                    sep = 5;
                }

                // The line that contains both atoms:
                var line1 = Line(
                    { x: bond.start.x, y: bond.start.y },
                    { x: bond.end.x, y: bond.end.y }
                );

                // Perpendicular to line1 from the second atom:
                var line2 = line1.getPerpendicularAt({x: bond.start.x, y: bond.start.y});

                // Perpendicular to line1 from the second atom:
                var line3 = line1.getPerpendicularAt({x: bond.end.x, y: bond.end.y});

                var ps1 = line2.getPointsByDistance({x: bond.start.x, y: bond.start.y}, sep);
                var ps2 = line3.getPointsByDistance({x: bond.end.x, y: bond.end.y}, sep);

                ctx.beginPath();
                ctx.moveTo(ps1[0].x, ps1[0].y);
                ctx.lineTo(ps2[0].x, ps2[0].y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(ps1[1].x, ps1[1].y);
                ctx.lineTo(ps2[1].x, ps2[1].y);
                ctx.stroke();
            }

            if (bond.type === BondType.SIMPLE) {
                simpleBond();
            } else if (bond.type === BondType.DOUBLE) {
                doubleBond();
            } else if (bond.type == BondType.TRIPLE) {
                simpleBond();
                doubleBond(10);
            }
        },

        drawBonds: function() {
            if (bondAtom !== null) {
                var _bond = {
                    start: { x: bondAtom.x, y: bondAtom.y },
                    end: { x: mpos.x, y: mpos.y },
                    type: getSelectedBond(),  // FIXME
                }

                this.drawBond(_bond);
            }

            var bonds = [];
            var bond = null;
            for (var i=0; i < this.atoms.length; i++) {
                for (var j=0; j < this.atoms[i].bonds.length; j++) {
                    bond = this.atoms[i].bonds[j];
                    if (bonds.indexOf(bond) === -1) {
                        this.drawBond(bond);

                        bonds.push(bond);
                    }
                }
            }
        },

        updateCtx: function() {
            if (!this.loaded) {
                return;
            }

            var rect = canvas.parentNode.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            this.drawHoverCircle();
            this.drawAtoms();
            this.drawBonds();
        }
    }
}


var pad = Pad();

var resize = function() {
    var rect = document.getElementById("view-wrapper").getBoundingClientRect();   // actual size of canvas el. itself
    canvas.width = rect.width - 40;
    canvas.height = rect.height;

    pad.updateCtx();
}

window.onload = function() {
    pad.loaded = true;
    resize();

    var test = true;
    if (test) {
        testMoleculeCaffeine();
    }
}

canvas.onmousedown = function(event) {
    if (getSelectedTool() != null) {
        if (getSelectedTool() == Tool.MOVE) {
            // Relative to (0; 0)
            relativeDragPos = { x: mpos.x, y: mpos.y };

            for (var i=0; i<pad.atoms.length; i++) {
                pad.atoms[i].respX = pad.atoms[i].x;
                pad.atoms[i].respY = pad.atoms[i].y;
            }
        }
    } else if (hoveredAtom !== null) {
        if (getSelectedBond() === null) {
            mpos = getMousePos(event);

            // Relative to atom coords
            relativeDragPos = { x: mpos.x - hoveredAtom.x, y: mpos.y - hoveredAtom.y };
            hoveredAtom.selected = true;
            draggingAtom = hoveredAtom;
        } else {
            bondAtom = hoveredAtom;
        }
    }
}

canvas.onmouseup = function(event) {
    relativeDragPos = { x: null, y: null };

    if (getSelectedTool() == Tool.MOVE) {
        for (var i=0; i<pad.atoms.length; i++) {
            pad.atoms[i].respX = null;
            pad.atoms[i].respY = null;
        }
    }

    if (bondAtom !== null) {
        if (hoveredAtom !== null) {
            var createBond = true;
            var type = getSelectedBond();  // FIXME

            for (var i=0; i < bondAtom.bonds.length; i++) {
                var _bond = bondAtom.bonds[i];
                if (_bond.its_me(bondAtom, hoveredAtom)) {  // Mario!
                    createBond = false;
                    _bond.type = type;

                    break;
                }
            }

            if (createBond) {
                var bond = Bond();
                bond.start = bondAtom;
                bond.end = hoveredAtom;
                bond.type = type;

                bondAtom.bonds.push(bond);
                hoveredAtom.bonds.push(bond);
            }
        }

        bondAtom = null;
        pad.updateCtx();
        return;
    } else if (draggingAtom !== null) {
        draggingAtom = null;
        return;
    } else if (getSelectedElement() === null) {
        return;
    } else if (hoveredAtom !== null) {
        return;
    }

    for (var i=0; i<pad.atoms.length; i++) {
        pad.atoms[i].selected = false;
    }

    var pos = getMousePos(event);

    var rect = canvas.getBoundingClientRect();
    var atom = Atom({
        name: getSelectedElement(),
        x: pos.x,
        y: pos.y
    });

    setHoveredAtom(atom);
    pad.addAtom(atom);
}

canvas.onmousemove = function(event) {
    mpos = getMousePos(event);
    if (draggingAtom !== null) {
        draggingAtom.x = mpos.x - relativeDragPos.x;
        draggingAtom.y = mpos.y - relativeDragPos.y;

        pad.updateCtx();
    } else if (getSelectedTool() == Tool.MOVE && relativeDragPos.x !== null) {
        for (var i=0; i<pad.atoms.length; i++) {
            pad.atoms[i].x = (mpos.x - relativeDragPos.x) + pad.atoms[i].respX;
            pad.atoms[i].y = (mpos.y - relativeDragPos.y) + pad.atoms[i].respY;
        }
        pad.updateCtx();
    } else {
        var atom = pad.getHoveredAtom();

        if (atom !== hoveredAtom) {
            setHoveredAtom(atom);
            pad.updateCtx();
        } else if (bondAtom !== null) {
            pad.updateCtx();
        }
    }
}

$(window).on("resize", resize);
