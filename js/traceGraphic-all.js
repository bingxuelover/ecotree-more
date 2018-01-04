/*
 * Work Flow Library 1.0
 * Copyright(c) 2010-2020 Work Flow, Inc.
 */
ECOSupport = {
    Canvas: "Canvas",
    Svg: "Svg",
    Vml: "Vml",
    init: function() {
        var d = document,
            b = this.tests,
            c = b.length,
            a,
            e;
        for (a = 0; a < c; a++) {
            e = b[a];
            this[e.identity] = e.fn.call(this, d)
        }
    },
    tests: [
        {
            identity: "Svg",
            fn: function(a) {
                return !!a.createElementNS && !!a.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect
            }
        }, {
            identity: "Canvas",
            fn: function(a) {
                return !!a.createElement("canvas").getContext
            }
        }, {
            identity: "Vml",
            fn: function(a) {
                var b = a.createElement("div");
                b.innerHTML = "<!--[if vml]><br><br><![endif]-->";
                return (b.childNodes.length == 2)
            }
        }
    ]
};
ECOSupport.init();
ECOSupport.apply = function(d, e, b) {
    if (b) {
        ECOSupport.apply(d, b)
    }
    if (d && e && typeof e == "object") {
        for (var a in e) {
            d[a] = e[a]
        }
    }
    return d
};
ECOSupport.format = function(b) {
    var a = [];
    if (arguments.length > 1) {
        if (typeof arguments[1] == "object" && Object.prototype.toString.apply(arguments[1]) === "[object Array]") {
            a = arguments[1]
        } else {
            a = Array.prototype.slice.call(arguments, 1, arguments.length)
        }
    }
    return b.replace(/\{(\d+)\}/g, function(c, d) {
        return a[d]
    })
};
ECOSupport.mask = function(a, d) {
    if (!d) {
        d = document.body
    } else {
        d = typeof d == "string"
            ? document.getElementById(d)
            : d
    }
    var i = document.getElementById("maskId");
    if (!i) {
        i = document.createElement("div");
        i.id = "maskId";
        i.className = "trace-mapbg-mask";
        var g = document.createElement("div");
        g.className = "trace-mapbg-mask-msg trace-mapbg-mask-loading";
        i.appendChild(g);
        d.appendChild(i)
    }
    var f = document.body.clientWidth,
        e = document.body.clientHeight,
        c = $("div", i),
        h = e / 2 - c.outerHeight() / 2,
        b = f / 2 - c.outerWidth() / 2;
    c[0].style.top = h + "px";
    c[0].style.left = b + "px";
    i.style.display = "block"
},
ECOSupport.unmask = function(b) {
    var a = document.getElementById("maskId");
    if (a) {
        a.style.display = "none"
    }
};
ECONode = function(a) {
    ECOSupport.apply(this, a);
    this.siblingIndex = 0;
    this.dbIndex = 0;
    this.XPosition = 0;
    this.YPosition = 0;
    this.prelim = 0;
    this.modifier = 0;
    this.leftNeighbor = null;
    this.rightNeighbor = null;
    this.nodeParent = null;
    this.nodeChildren = [];
    this.canCollapse = false;
    this.isSelected = false
};
ECONode.prototype = {
    _getLevel: function() {
        if (this.nodeParent.id == -1) {
            return 0
        } else {
            return this.nodeParent._getLevel() + 1
        }
    },
    _isAncestorCollapsed: function() {
        if (this.nodeParent.collapsed) {
            return true
        } else {
            if (this.nodeParent.id == -1) {
                return false
            } else {
                return this.nodeParent._isAncestorCollapsed()
            }
        }
    },
    _setAncestorsExpanded: function() {
        if (this.nodeParent.id == -1) {
            return
        } else {
            this.nodeParent.collapsed = false;
            return this.nodeParent._setAncestorsExpanded()
        }
    },
    _getParentNode: function() {
        return this.nodeParent
    },
    _getChildrenCount: function() {
        if (this.collapsed) {
            return 0
        }
        if (this.nodeChildren == null) {
            return 0
        } else {
            return this.nodeChildren.length
        }
    },
    _getLeftSibling: function() {
        if (this.leftNeighbor != null && this.leftNeighbor.nodeParent == this.nodeParent) {
            return this.leftNeighbor
        }
        return null
    },
    _getRightSibling: function() {
        if (this.rightNeighbor != null && this.rightNeighbor.nodeParent == this.nodeParent) {
            return this.rightNeighbor
        }
        return null
    },
    _getChildAt: function(a) {
        return this.nodeChildren[a]
    },
    _getChildrenCenter: function(a) {
        var c = this._getFirstChild(),
            b = this._getLastChild();
        return c.prelim + ((b.prelim - c.prelim) + a._getNodeSize(b)) / 2
    },
    _getFirstChild: function() {
        return this._getChildAt(0)
    },
    _getLastChild: function() {
        return this._getChildAt(this._getChildrenCount() - 1)
    },
    _drawChildrenLinks: function(m) {
        var l = [],
            r,
            g,
            p,
            f,
            n,
            e,
            b = m.zoom,
            j = m.line,
            v = j.pen,
            a = jQuery.boxModel
                ? 8
                : 0,
            o = ECOTree._getLineColor(this),
            u = ECOTree._getLineArrows(this),
            i = m.config.arrowsOffset,
            d = m.config.exwarehouseOffset,
            q = this.nodeChildren
                ? this.nodeChildren.length
                : 0,
            t = 12;
        j.setArrowsIcon(u);
        if (q > 0 && !this.collapsed) {
            var h = this.nodeChildren.length;
            r = this.XPosition + this.width + a;
            g = this.YPosition + (this.height / 2) + d;
            p = r + m.config.iLevelSeparation / 2 - a - t;
            f = g;
            j.setColor(j.pen.defaultColor);
            l.push(j.drawLine({
                id: "exw_" + this.id,
                x0: r,
                y0: g,
                x1: p,
                y1: f
            }));
            if (q > 1) {
                r = this.XPosition + this.width + m.config.iLevelSeparation / 2 - t;
                g = this.YPosition + (this.height / 2) + i;
                p = r;
                var c = this.nodeChildren[h - 1];
                f = c.YPosition + (this.height / 2) + v.weight / 2 + (q > 1
                    ? i
                    : d) - 1;
                j.setColor(j.pen.defaultColor);
                l.push(j.drawLine({
                    id: "mid_" + this.id,
                    x0: r,
                    y0: g,
                    x1: p,
                    y1: f
                }))
            }
        }
        if (!this.isRoot) {
            if (this._getLeftSibling() == null && this._getRightSibling() == null) {
                r = this.XPosition - m.config.iLevelSeparation / 2 - t;
                g = this.YPosition + (this.height / 2) + d;
                p = this.XPosition;
                f = g
            } else {
                r = this.XPosition - m.config.iLevelSeparation / 2 - t;
                g = this.YPosition + (this.height / 2) + i;
                p = this.XPosition;
                f = g
            }
            j.setColor(o);
            var k;
            if (m.zoom == 0.5 && $.browser.msie && ($.browser.version == "6.0" || $.browser.version == "7.0")) {
                k = true
            }
            l.push(j.drawLine({
                id: "sto_" + this.id,
                x0: r,
                y0: g,
                x1: p,
                y1: f,
                arrows: true,
                adjustA: k
            }))
        }
        return l.join("")
    }
};
ECOLine = function(a) {
    a = a || {};
    a.color = a.color || "#11A709";
    a.weight = a.weight || 8;
    a.arrowsDefaultW = 14;
    a.arrowsDefaultH = 13;
    a.defaultColor = "#11A709";
    a.arrowsW = a.arrowsW || a.arrowsDefaultW;
    a.arrowsH = a.arrowsH || a.arrowsDefaultH;
    this.pen = a
};
ECOLine.prototype = {
    setPen: function(a) {
        if (!a) {
            this.pen = a
        }
    },
    setColor: function(a) {
        if (a) {
            this.pen.color = a
        }
    },
    setLineWeight: function(a) {
        if (a) {
            this.pen.weight = a
        }
    },
    setArrowsSize: function(a) {
        if (a) {
            this.pen.arrowsW = this.pen.arrowsDefaultW * a;
            this.pen.arrowsH = this.pen.arrowsDefaultH * a
        }
    },
    setArrowsIcon: function(a) {
        if (a) {
            this.pen.arrowsIcon = a
        }
    },
    drawLine: function(d) {
        if (!d || !d.x0 || !d.y0 || !d.x1 || !d.y1) {
            return ""
        }
        var a = d.id,
            c = d.x0,
            n = d.y0,
            b = d.x1,
            m = d.y1,
            o = d.arrows,
            h = d.adjustA,
            p = [],
            k = this.pen.color,
            g = this.pen.weight,
            l = this.pen.arrowsW,
            i = this.pen.arrowsH,
            j = this.pen.arrowsIcon;
        if (n == m) {
            if (o === true) {
                p.push('<div id="arrows_' + a + '" style="position:absolute;overflow:hidden;left:' + (c < b
                    ? c
                    : b) + "px;top:" + (n - g / 2) + "px;width:" + (Math.abs(b - c) + 1 - l / 2 - 3) + "px;height:" + g + "px;background-color:" + k + '"></div>');
                var f,
                    e;
                f = c > b
                    ? c
                    : b;
                f -= l;
                e = n - l / 2 + 1;
                p.push('<div id="' + a + '" style="position:absolute;overflow:hidden;left:' + f + "px;top:" + (e + (h
                    ? -1
                    : 0)) + 'px;"><img width="' + l + 'px" height="' + i + 'px" src="' + ECOTree.IMAGE_PATH + "images/" + j + '"></div>')
            } else {
                p.push('<div id="' + a + '" style="position:absolute;overflow:hidden;left:' + (c < b
                    ? c
                    : b) + "px;top:" + (n - g / 2) + "px;width:" + (Math.abs(b - c) + 1) + "px;height:" + g + "px;background-color:" + k + '"></div>')
            }
        }
        if (c == b) {
            p.push('<div id="' + a + '" style="position:absolute;overflow:hidden;left:' + c + "px;top:" + (n < m
                ? n
                : m) + "px;width:" + g + "px;height:" + (Math.abs(m - n) + 1) + "px;background-color:" + k + '"></div>')
        }
        return p.join("")
    }
};
ECOTree = function(b, c, a) {
    this.config = {
        iMaxDepth: 100,
        iLevelSeparation: ECOTree.LEVEL_SEPARATION,
        iSiblingSeparation: ECOTree.SIBLING_SEPARATION,
        iSubtreeSeparation: ECOTree.SUBTREE_SEPARATION,
        iRootOrientation: ECOTree.RO_TOP,
        iNodeJustification: ECOTree.NJ_TOP,
        topXAdjustment: 10,
        topYAdjustment: -85,
        render: "Auto",
        linkType: "M",
        linkColor: "blue",
        nodeColor: "#CCCCFF",
        nodeBgColor: "#DEDEDF",
        nodeBgGradientColor: "#FDFDFD",
        nodeFill: ECOTree.NF_GRADIENT,
        nodeBorderColor: "#b6b6b6",
        nodeSelColor: "#FFFFCC",
        levelColors: [
            "#5555FF", "#8888FF", "#AAAAFF", "#CCCCFF"
        ],
        levelBorderColors: [
            "#5555FF", "#8888FF", "#AAAAFF", "#CCCCFF"
        ],
        colorStyle: ECOTree.CS_NODE,
        searchMode: ECOTree.SM_DSC,
        selectMode: ECOTree.SL_SINGLE,
        defaultNodeWidth: 208,
        defaultNodeHeight: 115,
        exwarehouseOffset: 55,
        arrowsOffset: 42,
        expandedImage: ECOTree.IMAGE_PATH + "images/expand.png",
        collapsedImage: ECOTree.IMAGE_PATH + "images/collapse.png",
        rootLayout: false,
        expandedIconH: 18,
        defaultLineWeight: ECOTree.DEFAULT_LINE_WEIGHT
    };
    this.obj = b;
    this.nodeTip = a;
    this.version = "1.0";
    this.elm = typeof c == "string"
        ? document.getElementById(c)
        : c;
    this.self = this;
    this.render = (this.config.render == "Auto")
        ? ECOTree._getAutoRenderMode()
        : this.config.render;
    this.ctx = null;
    this.canvasoffsetTop = 0;
    this.canvasoffsetLeft = 0;
    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
    this.treeLevelMaxX = [];
    this.treeLevelMaxY = [];
    this.rootYOffset = 0;
    this.rootXOffset = 0;
    this.nDatabaseNodes = [];
    this.mapIDs = {};
    this.root = new ECONode({id: -1, pid: null, width: 2, height: 2});
    this.iSelectedNode = -1;
    this.iLastSearch = 0;
    this.zoom = 1;
    this.scale = 2;
    this.blowUp = this.blowUp || false;
    this.reduce = this.reduce || true;
    this.scaleFactors = [0.5, 0.8, 1];
    this.showNodeTip = false;
    this._initNodeTip();
    this.line = new ECOLine()
};
ECOTree.LEVEL_SEPARATION = 100;
ECOTree.SIBLING_SEPARATION = 20;
ECOTree.SUBTREE_SEPARATION = 40;
ECOTree.DEFAULT_LINE_WEIGHT = 8;
ECOTree.RO_TOP = 0;
ECOTree.RO_BOTTOM = 1;
ECOTree.RO_RIGHT = 2;
ECOTree.RO_LEFT = 3;
ECOTree.NJ_TOP = 0;
ECOTree.NJ_CENTER = 1;
ECOTree.NJ_BOTTOM = 2;
ECOTree.NF_GRADIENT = 0;
ECOTree.NF_FLAT = 1;
ECOTree.CS_NODE = 0;
ECOTree.CS_LEVEL = 1;
ECOTree.SM_DSC = 0;
ECOTree.SM_META = 1;
ECOTree.SM_BOTH = 2;
ECOTree.SL_MULTIPLE = 0;
ECOTree.SL_SINGLE = 1;
ECOTree.SL_NONE = 2;
ECOTree.IMAGE_PATH = "./images/";
ECOTree.ENGINE_PRIORITY = ["Canvas", "Vml"];
ECOTree._getAutoRenderMode = function() {
    var c = ECOTree.ENGINE_PRIORITY,
        a = c.length;
    for (var b = 0; b < a; b++) {
        if (ECOSupport[c[b]]) {
            return c[b]
        }
    }
};
ECOTree._canvasNodeClickHandler = function(a, c, b) {
    if (c != b) {
        return
    }
    a.selectNode(b, true)
};
ECOTree._canvasNodeMouseOverHandler = function(c, a, g) {
    var b = c
        ? c
        : (window.event
            ? window.event
            : null);
    var f,
        d;
    f = b.pageX;
    d = b.pageY;
    if (!f && f !== 0) {
        f = b.clientX || 0;
        d = b.clientY || 0
    }
    if (a) {
        a = ECOTree[a]
    }
    if (g) {
        a._showNodeTip(g, f, d)
    }
};
ECOTree._canvasNodeMouseOutHandler = function(a) {
    if (a) {
        a = ECOTree[a]
    }
    a._hideNodeTip()
};
ECOTree._firstWalk = function(j, h, a) {
    var f = j.config.rootLayout;
    var b = null;
    if (h.pid != null) {
        h.width = j.config.defaultNodeWidth;
        h.height = j.config.defaultNodeHeight
    }
    h.XPosition = 0;
    h.YPosition = 0;
    h.prelim = 0;
    h.modifier = 0;
    h.leftNeighbor = null;
    h.rightNeighbor = null;
    j._setLevelHeight(h, a);
    j._setLevelWidth(h, a);
    j._setNeighbors(h, a);
    if (h._getChildrenCount() == 0 || a == j.config.iMaxDepth) {
        b = h._getLeftSibling();
        if (b != null) {
            h.prelim = b.prelim + j._getNodeSize(b) + j.config.iSiblingSeparation
        } else {
            h.prelim = 0
        }
    } else {
        var d = h._getChildrenCount();
        for (var e = 0; e < d; e++) {
            var c = h._getChildAt(e);
            ECOTree._firstWalk(j, c, a + 1)
        }
        var g;
        if (f) {
            g = 0
        } else {
            g = h._getChildrenCenter(j);
            g -= j._getNodeSize(h) / 2
        }
        b = h._getLeftSibling();
        if (b != null) {
            h.prelim = b.prelim + j._getNodeSize(b) + j.config.iSiblingSeparation;
            h.modifier = h.prelim - g;
            ECOTree._apportion(j, h, a)
        } else {
            h.prelim = g
        }
    }
};
ECOTree._apportion = function(t, p, b) {
    var o = p._getFirstChild();
    var d = o.leftNeighbor;
    var i = 1;
    for (var g = t.config.iMaxDepth - b; o != null && d != null && i <= g;) {
        var s = 0;
        var r = 0;
        var n = o;
        var m = d;
        for (var f = 0; f < i; f++) {
            n = n.nodeParent;
            m = m.nodeParent;
            s += n.modifier;
            r += m.modifier
        }
        var c = (d.prelim + r + t._getNodeSize(d) + t.config.iSubtreeSeparation) - (o.prelim + s);
        if (c > 0) {
            var h = p;
            var a = 0;
            for (; h != null && h != m; h = h._getLeftSibling()) {
                a++
            }
            if (h != null) {
                var q = p;
                var e = c / a;
                for (; q != m; q = q._getLeftSibling()) {
                    q.prelim += c;
                    q.modifier += c;
                    c -= e
                }
            }
        }
        i++;
        if (o._getChildrenCount() == 0) {
            o = t._getLeftmost(p, 0, i)
        } else {
            o = o._getFirstChild()
        }
        if (o != null) {
            d = o.leftNeighbor
        }
    }
};
ECOTree._secondWalk = function(l, f, b, d, c) {
    if (b <= l.config.iMaxDepth) {
        var e = l.rootXOffset + f.prelim + d;
        var k = l.rootYOffset + c;
        var g = 0;
        var a = 0;
        var i = false;
        switch (l.config.iRootOrientation) {
            case ECOTree.RO_TOP:
            case ECOTree.RO_BOTTOM:
                g = l.maxLevelHeight[b];
                a = f.height;
                break;
            case ECOTree.RO_RIGHT:
            case ECOTree.RO_LEFT:
                g = l.maxLevelWidth[b];
                i = true;
                a = f.width;
                break
        }
        switch (l.config.iNodeJustification) {
            case ECOTree.NJ_TOP:
                f.XPosition = e;
                f.YPosition = k;
                break;
            case ECOTree.NJ_CENTER:
                f.XPosition = e;
                f.YPosition = k + (g - a) / 2;
                break;
            case ECOTree.NJ_BOTTOM:
                f.XPosition = e;
                f.YPosition = (k + g) - a;
                break
        }
        if (i) {
            var j = f.XPosition;
            f.XPosition = f.YPosition;
            f.YPosition = j
        }
        switch (l.config.iRootOrientation) {
            case ECOTree.RO_BOTTOM:
                f.YPosition = -f.YPosition - a;
                break;
            case ECOTree.RO_RIGHT:
                f.XPosition = -f.XPosition - a;
                break
        }
        if (f.adjustH) {
            f.YPosition += f.adjustH / 2
        }
        switch (l.config.iRootOrientation) {
            case ECOTree.RO_BOTTOM:
                f.YPosition = -f.YPosition - a;
                break;
            case ECOTree.RO_RIGHT:
                f.XPosition = -f.XPosition - a;
                break
        }
        switch (l.config.iRootOrientation) {
            case ECOTree.RO_TOP:
            case ECOTree.RO_BOTTOM:
                if (!l.treeLevelMaxX[b]) {
                    l.treeLevelMaxX[b] = 0
                }
                if (f.XPosition > l.treeLevelMaxX[b]) {
                    l.treeLevelMaxX[b] = f.XPosition
                }
                break;
            case ECOTree.RO_RIGHT:
            case ECOTree.RO_LEFT:
                if (!l.treeLevelMaxY[b]) {
                    l.treeLevelMaxY[b] = 0
                }
                if (f.YPosition > l.treeLevelMaxY[b]) {
                    l.treeLevelMaxY[b] = f.YPosition
                }
                break
        }
        if (f._getChildrenCount() != 0) {
            ECOTree._secondWalk(l, f._getFirstChild(), b + 1, d + f.modifier, c + g + l.config.iLevelSeparation)
        }
        var h = f._getRightSibling();
        if (h != null) {
            ECOTree._secondWalk(l, h, b, d, c)
        }
    }
};
ECOTree._getNodeColor = function(a) {
    a = a || "";
    var b;
    switch (a) {
        case "1":
            b = "#B2DA7E";
            break;
        case "2":
            b = "#84B0DD";
            break;
        case "3":
            b = "#A992BE";
            break;
        case "4":
            b = "#EA956D";
            break;
        default:
            b = "#B2DA7E"
    }
    return b
};
ECOTree._getNodeClass = function(a) {
    a = a || "";
    var b;
    switch (a) {
        case "1":
            b = "green";
            break;
        case "2":
            b = "blue";
            break;
        case "3":
            b = "purple";
            break;
        case "4":
            b = "orange";
            break;
        default:
            b = "green"
    }
    return b
};
ECOTree.prototype._getNodeBorderColor = function(a) {
    a = a || 1;
    var b = this.config.nodeBorderColor;
    if (a == 2) {
        b = "#ED1C24"
    }
    return b
};
ECOTree._getLineColor = function(b) {
    var a = parseInt(b.nodeInflowType) || 1,
        c;
    switch (a) {
        case 1:
            c = "#11A709";
            break;
        case 2:
            c = "#ED1C24";
            break;
        case 3:
            c = "#0072BC";
            break;
        default:
            c = "#11A709"
    }
    return c
};
ECOTree._getLineArrows = function(c) {
    var b = parseInt(c.nodeInflowType) || 1,
        a;
    switch (b) {
        case 1:
            a = "arrows-green.png";
            break;
        case 2:
            a = "arrows-red.png";
            break;
        case 3:
            a = "arrows-blue.png";
            break;
        default:
            a = "arrows-green.png"
    }
    return a
};
ECOTree.prototype._positionTree = function() {
    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
    ECOTree._firstWalk(this.self, this.root, 0);
    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP:
        case ECOTree.RO_LEFT:
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition;
            break;
        case ECOTree.RO_BOTTOM:
        case ECOTree.RO_RIGHT:
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition
    }
    ECOTree._secondWalk(this.self, this.root, 0, 0, 0);
    var a = function(b) {
        var c = b._getFirstChild();
        if (c) {
            c.levelFirstNode = true;
            a(c)
        }
    };
    this.root.levelFirstNode = true;
    a(this.root)
};
ECOTree.prototype._setLevelHeight = function(a, b) {
    if (this.maxLevelHeight[b] == null) {
        this.maxLevelHeight[b] = 0
    }
    if (this.maxLevelHeight[b] < a.height) {
        this.maxLevelHeight[b] = a.height
    }
};
ECOTree.prototype._setLevelWidth = function(a, b) {
    if (this.maxLevelWidth[b] == null) {
        this.maxLevelWidth[b] = 0
    }
    if (this.maxLevelWidth[b] < a.width) {
        this.maxLevelWidth[b] = a.width
    }
};
ECOTree.prototype._setNeighbors = function(a, b) {
    a.leftNeighbor = this.previousLevelNode[b];
    if (a.leftNeighbor != null) {
        a.leftNeighbor.rightNeighbor = a
    }
    this.previousLevelNode[b] = a
};
ECOTree.prototype._getNodeSize = function(a) {
    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP:
        case ECOTree.RO_BOTTOM:
            return a.width;
        case ECOTree.RO_RIGHT:
        case ECOTree.RO_LEFT:
            return a.height
    }
    return 0
};
ECOTree.prototype._getLeftmost = function(e, g, d) {
    if (g >= d) {
        return e
    }
    if (e._getChildrenCount() == 0) {
        return null
    }
    var f = e._getChildrenCount();
    for (var b = 0; b < f; b++) {
        var a = e._getChildAt(b);
        var c = this._getLeftmost(a, g + 1, d);
        if (c != null) {
            return c
        }
    }
    return null
};
ECOTree.prototype._selectNodeInt = function(a, b) {
    if (this.config.selectMode == ECOTree.SL_SINGLE) {
        if ((this.iSelectedNode != a) && (this.iSelectedNode != -1)) {
            this.nDatabaseNodes[this.iSelectedNode].isSelected = false
        }
        this.iSelectedNode = (this.nDatabaseNodes[a].isSelected && b)
            ? -1
            : a
    }
    this.nDatabaseNodes[a].isSelected = (b)
        ? !this.nDatabaseNodes[a].isSelected
        : true
};
ECOTree.prototype._collapseAllInt = function(a) {
    var b = null;
    for (var c = 0; c < this.nDatabaseNodes.length; c++) {
        b = this.nDatabaseNodes[c];
        if (b.canCollapse) {
            b.collapsed = a
        }
    }
    this.updateTree()
};
ECOTree.prototype._selectAllInt = function(a) {
    var c = null;
    for (var b = 0; b < this.nDatabaseNodes.length; b++) {
        c = this.nDatabaseNodes[b];
        c.isSelected = a
    }
    this.iSelectedNode = -1;
    this.updateTree()
};
ECOTree.prototype._drawTree = function() {
    var a = [];
    var b = null;
    for (var c = 0; c < this.nDatabaseNodes.length; c++) {
        b = this.nDatabaseNodes[c];
        if (!b._isAncestorCollapsed()) {
            a.push(this._drawNodeUseDiv(b, c));
            a.push(b._drawChildrenLinks(this.self))
        }
    }
    return a.join("")
};
ECOTree.prototype._drawNodeUseDiv = function(e, f) {
    var b;
    switch (this.zoom) {
        case 1:
            b = "big_box";
            break;
        case 0.8:
            b = "mid_box";
            break;
        case 0.5:
            b = "small_box";
            break
    }
    var d = [];
    d.push('<div id="' + e.id + '" class="' + b + " rounde " + ECOTree._getNodeClass(e.nodeType) + '" ');
    d.push('style="position:absolute; top:' + e.YPosition + "px; left:" + e.XPosition + 'px;" ');
    d.push("onmouseenter=\"javascript:ECOTree._canvasNodeMouseOverHandler(event, '" + this.obj + "','" + f + "');\" onmouseleave=\"javascript:ECOTree._canvasNodeMouseOutHandler('" + this.obj + "')\"");
    d.push(">");
    d.push('<div class="box_info clearfix">');
    d.push("<b></b>");
    d.push('<div class="btn"></div>');
    d.push('<p class="clearboth">' + e.companyName + "</p>");
    d.push("</div>");
    d.push('<div class="tel_info clearfix">');
    d.push('<div class="float_l">');
    d.push("<i>" + (e.isRoot
        ? "生产量"
        : "入库") + "</i>");
    d.push("<h1>" + e.storage + "</h1>");
    d.push("</div>");
    d.push('<div class="arrow"></div>');
    d.push('<div class="float_r">');
    d.push('<i class="textalign_right">出库</i>');
    d.push("<h2>" + e.exwarehouse + "</h2>");
    d.push("</div>");
    d.push("</div>");
    d.push("</div>");
    var a = jQuery.boxModel
        ? 8
        : 0;
    if (e.canCollapse) {
        d.push("<div ");
        d.push('style="z-index:1;position:absolute; top:' + (e.YPosition + e.height / 2 - this.config.expandedIconH / 2) + "px; left:" + (e.XPosition + e.width + a) + 'px;" ');
        d.push(">");
        d.push("<a href=\"javascript:ECOTree['" + this.obj + "'].collapseNode('" + f + "', true);\" >");
        d.push('<img border=0 src="' + ((e.collapsed)
            ? this.config.collapsedImage
            : this.config.expandedImage) + '" >');
        d.push("</a>");
        d.push("</div>")
    }
    var c = this.config.arrowsOffset;
    d.push('<div id="line' + e.id + '" ');
    d.push('style="position:absolute; top:' + (e.YPosition + e.height / 2 + c - this.line.pen.weight * 3) + "px; left:" + (e.XPosition + -this.config.iLevelSeparation / 2) + 'px;" ');
    d.push(">");
    if (e.nodeParent && e.nodeParent.id != -1) {
        if (this.scale > 0) {
            d.push(e.parentExwarehouse)
        }
    }
    d.push("</div>");
    return d.join("")
};
ECOTree.prototype._creatHTML = function() {
    var d = [];
    this._positionTree();
    var c = 0,
        a = 0;
    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP:
        case ECOTree.RO_BOTTOM:
            for (var b = 0; b < this.treeLevelMaxX.length; b++) {
                if (c < this.treeLevelMaxX[b]) {
                    c = this.treeLevelMaxX[b]
                }
            }
            c += this.config.defaultNodeWidth;
            a = (this.maxLevelHeight.length - 1) * (this.config.iLevelSeparation + this.config.defaultNodeHeight);
            break;
        case ECOTree.RO_LEFT:
        case ECOTree.RO_RIGHT:
            for (var b = 0; b < this.treeLevelMaxY.length; b++) {
                if (a < this.treeLevelMaxY[b]) {
                    a = this.treeLevelMaxY[b]
                }
            }
            a += this.config.defaultNodeHeight;
            c = (this.maxLevelWidth.length - 1) * (this.config.iLevelSeparation + this.config.defaultNodeWidth)
    }
    d.push(this._drawTree());
    return d.join("")
};
ECOTree.prototype._initNodeTip = function() {
    if (!this.tipTemplate) {
        var a = [];
        a.push('<div class="{0}" ');
        a.push(">");
        a.push('<div class="txt">{1}</div>');
        a.push('<table width="100%" border="0" cellspacing="0" cellpadding="0">');
        a.push('<tr><th>归属地：</th><td style="text-align: left;line-height:30px;">{2}</td></tr>');
        a.push('<tr><th>入库总量：</th><td><b class="zs bo">{3}</b></td></tr>');
        a.push('<tr><th>库存总量：</th><td><b class="zs bo">{4}</b></td></tr>');
        a.push('<tr><th>出库总量：</th><td><b class="zs bo">{5}</b></td></tr>');
        a.push("</table>");
        a.push("</div>");
        this.tipTemplate = a.join("")
    }
};
ECOTree.prototype._showNodeTip = function(d, k, j) {
    if (this.showNodeTip === false) {
        var g,
            e;
        g = document.body.clientWidth;
        e = document.body.clientHeight;
        var c = this.nDatabaseNodes[d],
            f = 295,
            a = 246,
            l = 10;
        if ((k + f) > g) {
            k = k - f
        }
        if ((j + a) > e) {
            j = j - a
        }
        var i = this.zoom < 0.8
            ? "tips2"
            : "tips";
        var h = [
            i,
            c.companyName,
            c.location,
            c.storage,
            c.inventory,
            c.exwarehouse
        ];
        var b = ECOSupport.format(this.tipTemplate, h);
        this.nodeTip.style.visibility = "visible";
        this.nodeTip.style.top = j + l + "px";
        this.nodeTip.style.left = k + l + "px";
        this.nodeTip.innerHTML = b;
        this.showNodeTip = true
    }
};
ECOTree.prototype._hideNodeTip = function() {
    this.nodeTip.style.visibility = "hidden";
    this.showNodeTip = false
};
ECOTree.prototype.updateTree = function(a) {
    this.config.iSubtreeSeparation = parseInt(ECOTree.SUBTREE_SEPARATION * this.zoom);
    this.config.defaultLineWeight = parseInt(ECOTree.DEFAULT_LINE_WEIGHT * this.zoom);
    switch (this.zoom) {
        case 1:
            this.config.defaultNodeWidth = 208;
            this.config.defaultNodeHeight = 115;
            this.config.arrowsOffset = 42;
            this.config.exwarehouseOffset = 55;
            this.config.topYAdjustment = -75;
            this.config.iLevelSeparation = ECOTree.LEVEL_SEPARATION;
            break;
        case 0.8:
            this.config.defaultNodeWidth = 142;
            this.config.defaultNodeHeight = 94;
            this.config.arrowsOffset = 38;
            this.config.exwarehouseOffset = 50;
            this.config.topYAdjustment = -75;
            this.config.iLevelSeparation = ECOTree.LEVEL_SEPARATION;
            break;
        case 0.5:
            this.config.defaultNodeWidth = 43;
            this.config.defaultNodeHeight = 43;
            this.config.arrowsOffset = 10;
            this.config.exwarehouseOffset = 20;
            this.config.topYAdjustment = -55;
            this.config.iLevelSeparation = ECOTree.LEVEL_SEPARATION - 20;
            break
    }
    this.line.setLineWeight(this.config.defaultLineWeight);
    this.line.setArrowsSize(this.zoom);
    this.elm.innerHTML = this._creatHTML();
    if (a === true) {
        this.elm.style.display = "none";
        this.nodeFx()
    }
    ECOSupport.unmask()
};
ECOTree.prototype.nodeFx = function(j) {
    var j = j || "show",
        c = this.elm,
        a = c.children,
        f = a.length,
        g = this.root,
        h,
        e = [];
    for (var d = 0; d < f; d++) {
        a[d].style.display = "none"
    }
    c.style.display = "block";
    h = g._getFirstChild();
    while (h) {
        e.push(h);
        h = h._getFirstChild()
    }
    var b = function(q, k) {
        var u = document,
            s,
            i = 0,
            r = k.length,
            t = q.length,
            m,
            l = 0,
            p = {},
            n;
        var o = function() {
            if (!k[i]) {
                clearInterval(s);
                return
            }
            if (l < t) {
                m = q[l++].id;
                $(u.getElementById(m))[j](800);
                $(u.getElementById("exw_" + m))[j](800);
                $(u.getElementById("sto_" + m))[j](800);
                $(u.getElementById("arrows_sto_" + m))[j](800);
                $(u.getElementById("line" + m))[j](800);
                p[m] = true
            } else {
                n = k[i];
                $(n)[j](800);
                i++
            }
        };
        s = setInterval(o, 10)
    };
    b(e, a)
};
ECOTree.prototype.scaleFactor = (function() {
    return function(a) {
        if (a === "in") {
            this.scale++
        } else {
            if (a === "out") {
                this.scale--
            }
        }
        if (this.scale > 2) {
            this.scale = 2
        }
        if (this.scale < 0) {
            this.scale = 0
        }
        return this.scale
    }
})();
ECOTree.prototype.initScaleFactor = function(a) {
    switch (a) {
        case 0.5:
            this.scale = 0;
            break;
        case 0.8:
            this.scale = 1;
            break;
        case 1:
            this.scale = 2;
            break
    }
};
ECOTree.prototype.canvasZoom = function(c) {
    var b = this.scaleFactor(c);
    var a = this.scaleFactors[b];
    if (c == "in" && !this.blowUp) {
        return
    }
    if (c == "out" && !this.reduce) {
        return
    }
    this.zoom = a;
    this.blowUp = b != 2;
    this.reduce = b != 0;
    this.updateTree()
};
ECOTree.prototype.add = function(b) {
    if (!b || typeof b != "object") {
        return null
    }
    b.width = b.width || this.config.defaultNodeWidth;
    b.height = b.height || this.config.defaultNodeHeight;
    if (b.showHeader === false || b.nodeInflowType == 2) {} else {
        b.showHeader = true
    }
    b.metadata = (typeof b.metadata != "undefined")
        ? b.metadata
        : "";
    b.storage = (typeof b.storage != "undefined")
        ? b.storage
        : 0;
    b.exwarehouse = (typeof b.exwarehouse != "undefined")
        ? b.exwarehouse
        : 0;
    b.companyName = (typeof b.companyName != "undefined")
        ? b.companyName
        : "";
    b.companyId = (typeof b.companyId != "undefined")
        ? b.companyId
        : "";
    b.nodeType = (typeof b.nodeType != "undefined")
        ? b.nodeType
        : "1";
    if (b.nodeType == "5" || b.nodeType == "6") {
        b.nodeType = "4"
    }
    b.nodeInflowType = (typeof b.nodeInflowType != "undefined")
        ? b.nodeInflowType
        : 1;
    b.nodeInflowLineDesc = (typeof b.nodeInflowLineDesc != "undefined")
        ? b.nodeInflowLineDesc
        : "";
    b.collapsed = (typeof b.collapsed != "undefined")
        ? (b.collapsed == "true"
            ? true
            : false)
        : false;
    b.nodeColor = ECOTree._getNodeColor(b.nodeType);
    b.nodeBorderColor = this._getNodeBorderColor(b.nodeInflowType);
    var f = null;
    if (b.pid == -1) {
        f = this.root
    } else {
        for (var a = 0; a < this.nDatabaseNodes.length; a++) {
            if (this.nDatabaseNodes[a].id == b.pid) {
                f = this.nDatabaseNodes[a];
                break
            }
        }
    }
    var e = new ECONode(b);
    if (f == null) {
        throw new Error("对不起，您查询的数据不完整！[ ID：" + e.pid + "]")
    }
    e.nodeParent = f;
    f.canCollapse = true;
    var c = this.nDatabaseNodes.length;
    e.dbIndex = this.mapIDs[b.id] = c;
    this.nDatabaseNodes[c] = e;
    var d = f.nodeChildren.length;
    e.siblingIndex = d;
    f.nodeChildren[d] = e;
    return e
};
ECOTree.prototype.addAll = function(a) {
    this.clearData();
    if (a && Object.prototype.toString.apply(a) == "[object Array]") {
        a[0].isRoot = true;
        a[0].pid = -1;
        this.add(a[0]);
        for (var b = 1; b < a.length; b++) {
            this.add(a[b])
        }
    }
};
ECOTree.prototype.clearData = function() {
    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
    this.treeLevelMaxX = [];
    this.treeLevelMaxY = [];
    this.nDatabaseNodes = [];
    this.mapIDs = {};
    this.root = new ECONode({id: -1, pid: null, width: 2, height: 2})
};
ECOTree.prototype.searchNodes = function(d) {
    var b = null;
    var f = (this.config.selectMode == ECOTree.SL_SINGLE);
    if (typeof d == "undefined") {
        return
    }
    if (d == "") {
        return
    }
    var c = false;
    var e = 0;
    if (this.iLastSearch) {
        var a = this.nDatabaseNodes[this.iLastSearch];
        $("#" + a.id).removeClass("hightlight")
    }
    for (; e < this.nDatabaseNodes.length; e++) {
        b = this.nDatabaseNodes[e];
        if (b.companyName.indexOf(d) != -1) {
            if (b._isAncestorCollapsed()) {
                b._setAncestorsExpanded();
                this.updateTree()
            }
            c = true
        }
        if (f && c) {
            this.iLastSearch = e;
            break
        }
    }
    $("#" + b.id).addClass("hightlight");
    return b
};
ECOTree.prototype.searchNodeList = function(f, c) {
    if (typeof f == "undefined" || f == "") {
        return
    }
    var e,
        b = [],
        h = [],
        a = {};
    var d = 0;
    for (var g = 0; g < this.nDatabaseNodes.length; g++) {
        if (d > c) {
            break
        }
        e = this.nDatabaseNodes[g];
        if (e.companyName.indexOf(f) == 0) {
            if (!a[e.companyName]) {
                a[e.companyName] = true;
                b.push(e.companyName);
                d++
            }
        } else {
            if (e.companyName.indexOf(f) != -1) {
                if (!a[e.companyName]) {
                    h.push(e.companyName);
                    a[e.companyName] = true;
                    d++
                }
            }
        }
    }
    return b.concat(h)
};
ECOTree.prototype.selectAll = function() {
    if (this.config.selectMode != ECOTree.SL_MULTIPLE) {
        return
    }
    this._selectAllInt(true)
};
ECOTree.prototype.unselectAll = function() {
    this._selectAllInt(false)
};
ECOTree.prototype.collapseAll = function() {
    this._collapseAllInt(true)
};
ECOTree.prototype.expandAll = function() {
    this._collapseAllInt(false)
};
ECOTree.prototype.collapseNode = function(c, b) {
    this.nDatabaseNodes[c].collapsed = !this.nDatabaseNodes[c].collapsed;
    if (b) {
        ECOSupport.mask();
        var a = this;
        setTimeout(function() {
            a.updateTree()
        }, 1000)
    }
};
ECOTree.prototype.selectNode = function(b, a) {
    this._selectNodeInt(this.mapIDs[b], true);
    if (a) {
        this.updateTree()
    }
};
ECOTree.prototype.setNodeTitle = function(c, d, b) {
    var a = this.mapIDs[c];
    this.nDatabaseNodes[a].dsc = d;
    if (b) {
        this.updateTree()
    }
};
ECOTree.prototype.setNodeMetadata = function(c, d, b) {
    var a = this.mapIDs[c];
    this.nDatabaseNodes[a].meta = d;
    if (b) {
        this.updateTree()
    }
};
ECOTree.prototype.setNodeTarget = function(c, d, b) {
    var a = this.mapIDs[c];
    this.nDatabaseNodes[a].target = d;
    if (b) {
        this.updateTree()
    }
};
ECOTree.prototype.setNodeColors = function(e, b, c, d) {
    var a = this.mapIDs[e];
    if (b) {
        this.nDatabaseNodes[a].c = b
    }
    if (c) {
        this.nDatabaseNodes[a].bc = c
    }
    if (d) {
        this.updateTree()
    }
};
ECOTree.prototype.getSelectedNodes = function() {
    var b = null;
    var a = [];
    var d = null;
    for (var c = 0; c < this.nDatabaseNodes.length; c++) {
        b = this.nDatabaseNodes[c];
        if (b.isSelected) {
            d = {
                id: b.id,
                dsc: b.dsc,
                meta: b.meta
            };
            a[a.length] = d
        }
    }
    return a
};
(function(b) {
    var a = {
        createTraceContainer: function(w) {
            if (!w) {
                return
            }
            var m = w.parentContainer,
                r = w.width,
                o = w.height,
                d = w.adjustW || 0,
                i = w.adjustH || 0,
                l = w.obj;
            var u = document.createElement("div");
            u.className = "trace";
            var k = [];
            k.push('<div class="drugDescribe">');
            k.push('	 <div class="info">');
            k.push('		总量： <span class="blue">0</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;最长环节数： <span class="yellow">0</span>');
            k.push("	 </div>");
            k.push("</div>");
            k.push('<div id="traceGraphic" class="graphic">');
            k.push('		<div class="header">');
            k.push('			<div class="inner">');
            k.push('				<div class="search"><span class="info">企业名称：</span>');
            k.push('            		<div style="float:left;width:320px;">');
            k.push('						<dl class="searchSelect">');
            k.push("							<dt>");
            k.push('								<input type="text" name="companyName" class="input1">');
            k.push("							</dt>");
            k.push("							<dd>");
            k.push("							</dd>");
            k.push("						</dl>");
            k.push('					    <input type="button" class="input2">');
            k.push("					</div>");
            k.push("				</div>");
            k.push('				<div class="contral">');
            k.push('					<input type="button" class="btn btn3" onclick="javascript:jQuery.traceGraphic.fullScreen(this, \'traceGraphic\', \'' + l + "');\">");
            k.push('					<input type="button" class="btn btn2" onclick="javascript:jQuery.traceGraphic.doZoom(this, \'' + l + "','out');\">");
            k.push('					<input type="button" class="btn btn1" onclick="javascript:jQuery.traceGraphic.doZoom(this, \'' + l + "','in');\">");
            k.push("				</div>");
            k.push("			</div>");
            k.push("		</div>");
            k.push('		<div class="canvas">');
            k.push('    		<div class="node"></div>');
            k.push("		</div>");
            k.push('		<div class="legend-collapsed" style="z-index:100;"><div class="extended"></div></div>');
            k.push("</div>");
            k.push('<div style="position:absolute;z-index: 202;visibility:hidden"></div>');
            u.innerHTML = k.join("");
            m.appendChild(u);
            var t = u.children[1].children[0],
                p = u.children[2],
                g = u.children[1].children[1].children[0],
                q = u.children[1].children[2],
                f = u.children[1].children[2].children[0];
            var y = parseFloat(jQuery.css(g, "paddingTop")) + parseFloat(jQuery.css(g, "paddingBottom")),
                v = parseFloat(jQuery.css(g, "paddingLeft")) + parseFloat(jQuery.css(g, "paddingRight")),
                c = b(t).outerHeight(),
                j = b(".drugDescribe", u).outerHeight();
            d += jQuery.boxModel
                ? v
                : 0;
            i += c + j + (jQuery.boxModel
                ? y
                : 0);
            g.style.height = o - i + "px";
            g.style.width = r - d + "px";
            var n = new ECOTree(l, g, p);
            ECOTree[l] = n;
            n.container = m;
            n.config.iRootOrientation = ECOTree.RO_LEFT;
            n.config.iNodeJustification = ECOTree.NJ_CENTER;
            n.config.iMaxDepth = 1000;
            n.config.rootLayout = true;
            n.config.adjustW = d;
            n.config.adjustH = i;
            n.zoom = 0.8;
            n.initScaleFactor(0.8);
            n.blowUp = true;
            n.reduce = true;
            jQuery.traceGraphic.setBtnGray(b(".btn2", u), n);
            b(".inner .search .input2", t).click(function() {
                var A = b(".inner .search .input1").val();
                var z = n.searchNodes(A);
                if (z) {
                    g.scrollLeft = z.XPosition;
                    g.scrollTop = z.YPosition
                }
            });
            var e = function(z, B) {
                if (b.trim(B) == "") {
                    return
                }
                var A = n.searchNodeList(B, 10);
                if (A) {
                    z.autocomplete({source: A})
                }
            };
            var s = b(".inner .search .input1", t);
            s.bind("focus", function() {
                e(b(this), b(this).val())
            });
            s.bind("keyup", function() {
                e(b(this), b(this).val())
            });
            s.bind("keydown", function() {
                e(b(this), b(this).val())
            });
            b(document).click(function(z) {
                if (z.target.className != "input1") {
                    b(".searchSelect dd", t).hide()
                }
            });
            b(f).click((function() {
                var z = false;
                return function() {
                    if (z) {
                        f.parentNode.className = "legend-collapsed";
                        z = false
                    } else {
                        f.parentNode.className = "legend-extended";
                        z = true
                    }
                }
            })());
            var h = document.documentElement.clientWidth,
                x = document.documentElement.clientHeight;
            b(window).bind("resize", function() {
                if (h != document.documentElement.clientWidth || x != document.documentElement.clientHeight) {
                    jQuery.traceGraphic.graphicResize("traceGraphic", n)
                }
                h = document.documentElement.clientWidth;
                x = document.documentElement.clientHeight
            });
            return n
        },
        loadTrace: function(d) {
            if (!this.traceGraphicObj) {
                return
            }
            var c = this.traceGraphicObj,
                e = function(h) {
                    var j = h.storage,
                        i = c.maxLevelHeight.length - 1,
                        g = h.pkgUnit,
                        f = [];
                    f.push('总量： <span class="blue">');
                    f.push(j);
                    f.push("</span> （单位：");
                    f.push(g);
                    f.push('）&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;最长环节数： <span class="yellow">');
                    f.push(i);
                    f.push("</span>");
                    b(c.container).find(".drugDescribe .info").html(f.join(""))
                };
            ECOSupport.mask();
            if (d.data) {
                c.addAll(d.data);
                setTimeout(function() {
                    c.updateTree(true);
                    e(d.data[0])
                }, 500)
            } else {
                if (d.url && typeof d.url == "string") {
                    b.ajax({
                        type: d.type || "get",
                        dataType: d.dataType || "json",
                        contentType: d.contentType || "application/json;charset=utf-8",
                        url: d.url,
                        data: d.params,
                        success: function(f, h) {
                            try {
                                c.addAll(f)
                            } catch (g) {
                                alert(g.message);
                                ECOSupport.unmask();
                                return
                            }
                            setTimeout(function() {
                                try {
                                    c.updateTree();
                                    e(f[0])
                                } catch (i) {
                                    alert("json数据格式不正确！");
                                    ECOSupport.unmask()
                                }
                            }, 500)
                        },
                        error: function(f, h, g) {
                            alert("您查询的药品流向信息不存在！");
                            ECOSupport.unmask()
                        }
                    })
                }
            }
        }
    };
    jQuery.traceGraphic = {
        traceGraphicObj: null,
        createTraceContainer: function(c) {
            this.traceGraphicObj = a.createTraceContainer.call(this, c)
        },
        loadTrace: function(c) {
            a.loadTrace.call(this, c)
        },
        doZoom: function(d, c, e) {
            if (c) {
                c = ECOTree[c];
                c.canvasZoom(e);
                this.setBtnGray(d, c)
            }
        },
        fullScreen: (function() {
            var d = false,
                c,
                e;
            return function(m, i, n) {
                if (!n) {
                    return
                }
                n = ECOTree[n];
                var f = document.getElementById(i),
                    j = f.children[1].children[0],
                    h = n.config.adjustH,
                    g = b(".header", f).outerHeight();
                if (d) {
                    m.className = "btn btn3";
                    f.style.top = "";
                    f.style.left = "";
                    f.style.width = "";
                    f.style.height = "";
                    f.style.zIndex = "";
                    f.style.position = "static";
                    j.style.height = e;
                    d = false
                } else {
                    m.className = "btn btn4";
                    c = j.style.width;
                    e = j.style.height;
                    f.style.top = "0px";
                    f.style.left = "0px";
                    var l = document.body.clientWidth,
                        k = document.body.clientHeight;
                    f.style.width = l + "px";
                    f.style.height = k + "px";
                    f.style.zIndex = "201";
                    f.style.position = "absolute";
                    j.style.height = parseInt(k) - g - (jQuery.boxModel
                        ? 20
                        : 0) + "px";
                    d = true
                }
                n.full = d
            }
        })(),
        graphicResize: function(g, f) {
            var m = 300,
                n = 800,
                l = document.body.clientWidth,
                k = document.body.clientHeight,
                e = document.getElementById(g),
                h = e.children[1].children[0],
                j = e.children[0].children[0],
                o = parseFloat(jQuery.css(h, "paddingTop")) + parseFloat(jQuery.css(h, "paddingBottom")),
                d = f.config.adjustH,
                c = b(j).outerHeight(),
                i = f.config.adjustW;
            if (l < n) {
                e.style.width = n + "px"
            } else {
                e.style.width = ""
            }
            l = l < n
                ? n
                : l;
            k = k < m
                ? m
                : k;
            if (f.full) {
                h.style.height = k - c - (jQuery.boxModel
                    ? o
                    : 0) + "px"
            } else {
                h.style.height = k - d + "px"
            }
            h.style.width = l - i + "px"
        },
        setBtnGray: function(e, c) {
            var f = b(e).parent().find(".btn1");
            var d = b(e).parent().find(".btn2");
            if (!c.blowUp) {
                f.addClass("blowup")
            } else {
                f.removeClass("blowup")
            }
            if (!c.reduce) {
                d.addClass("reduce")
            } else {
                d.removeClass("reduce")
            }
        }
    }
})(jQuery);
