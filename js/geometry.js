var Line = function(p1, p2) {
    // Line from 2 points
    //
    // m = (y2 - y1) / (x2 - x1)
    // y - y1 = m(x - x1)
    // y - y1 = m*x - m*x1
    // y - m*x + m*x1 - y1 = 0
    // a = -m
    // b = 1
    // c = m*x1 - y1

    var m, a, b, c;
    if (p1 !== undefined && p2 !== undefined) {
        m = (p2.y - p1.y) / (p2.x - p1.x);
        a = -m;
        b = 1;
        c = m * p1.x - p1.y;
    }

    return {
        m: m,
        a: a,
        b: b,
        c: c,

        getY(x) {
            // a*x + b*y + c = 0
            // b*y = -a*x - c

            if (this.a !== Infinity && this.a !== -Infinity) {
                return -(this.a * x + this.c);
            } else {
                // y = infinity  (x = x0)
                return null;
            }
        },

        getX(y) {
            // a*x + b*y + c = 0
            // a*x = -(b*y + c)
            // x = -(b*y + c) / a
            if (this.a !== Infinity && this.a !== -Infinity) {
                return -(this.b*y + this.c) / this.a;
            } else {
                // x = x0
                return p1.x;
            }
        },

        getPerpendicularAt(p) {
            // m = -1 / m'
            // y - y0 = m(x - x1)
            // y - m*x + m*x1 - y0 = 0
            // a = -m
            // b = 1
            // c = m*x1 - y0

            var l = Line(p);
            l.m = -1/this.m;
            l.a = -l.m;
            l.b = 1;
            l.c = l.m * p.x - p.y;

            return l;
        },

        intersect(line) {
            // y = -a*x - c
            // y' = -a1*x - c1

            // m = -a
            // n = -c

            var x = (-line.c + this.c) / (-this.a + line.a);
            var y = this.getY(x);
            return {x: x, y: y};
        },

        getPointsByDistance(p, r) {
            // Line and Circumference intersection
            //
            // Circumference of center (x0, y0) and radium r:
            // (x - x0)**2 + (y - y0)**2 = r**2
            // x**2 - 2*x0*x + x0**2 + y**2 - 2*y0*y + y0**2 - r**2 = 0
            // x**2 + y**2 - 2*x0*x - 2*y0*y + x0**2 + y0**2 + r**2 = 0
            // a = -2*x0
            // b = -2*y0
            // c = x0**2 + y0**2 - r**2
            // x**2 + y**2 + ax + by + c = 0
            //
            // Intersection:
            // y = mx + n
            // (1 + m**2)*x**2 + (2mn + a + bm)*x + n**2 + b*n + c = 0
            // A = 1 + m**2
            // B = 2mn + a + bm
            // C = n**2 + bn + c
            // A*x**2 + B*x + C = 0
            // This equation should have 2 solutions because the circumference
            // of center on a (x0, y0) belonging to line.
            //
            // D = sqrt(b**2 - 4*A*C)
            // x0 = (-b + D) / 2*a
            // y0 = m*x0 + n
            // x1 = (-b - D) / 2*a
            // y0 = m*x1 + n

            // ax + by + c = 0
            // by = -(ax + c)
            // y = -(ax + c) / b
            var m = -this.a / this.b;
            var n = -this.c / this.b;

            if (m == Infinity || m == -Infinity || n == Infinity || n == -Infinity) {
                return [
                    { x: p.x, y: p.y - r },
                    { x: p.x, y: p.y + r },
                ];
            } else {
                // x**2 + y**2 + ax + by + c = 0
                var a = -2 * p.x;
                var b = -2 * p.y;
                var c = Math.pow(p.x, 2) + Math.pow(p.y, 2) - Math.pow(r, 2);

                // Ax**2 + Bx + C = 0
                var A = 1 + Math.pow(m, 2);
                var B = 2 * m * n + a + b * m;
                var C = Math.pow(n, 2) + b * n + c;
                var D = Math.sqrt(Math.pow(B, 2) - 4 * A * C);

                var x, y, p1, p2;
                x = (-B - D) / (2*A);
                y = m*x + n;
                p1 = { x: x, y: y };

                x = (-B + D) / (2*A);
                y = m*x + n;
                p2 = { x: x, y: y };

                return [p1, p2];
            }
        }
    }
}