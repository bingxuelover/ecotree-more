/**
 * ECOTree 辅助类
 * @type
 */
ECOSupport = {
    Canvas : 'Canvas',
    Svg : 'Svg',
    Vml : 'Vml',
    
    init : function() {
        var doc = document,
            tests = this.tests,
            ln = tests.length, i, test;

        for (i = 0; i < ln; i++) {
            test = tests[i];
            this[test.identity] = test.fn.call(this, doc);
        }
    },

    //判断浏览器的兼容性，主要处理了canva、svg 和 vml的判断 参考ExtJs 4 实现
    tests : [

    /**
     * @property SVG True if the device supports SVG
     * @type {Boolean}
     */
    {
        identity : 'Svg',
        fn : function(doc) {
            return !!doc.createElementNS
                    && !!doc.createElementNS("http:/" + "/www.w3.org/2000/svg", "svg").createSVGRect;
        }
    },

    /**
     * @property Canvas True if the device supports Canvas
     * @type {Boolean}
     */
    {
        identity : 'Canvas',
        fn : function(doc) {
            return !!doc.createElement('canvas').getContext;
        }
    },

    /**
     * @property VML True if the device supports VML
     * @type {Boolean}
     */
    {
        identity : 'Vml',
        fn : function(doc) {
            var d = doc.createElement("div");
            d.innerHTML = "<!--[if vml]><br><br><![endif]-->";
            return (d.childNodes.length == 2);
        }
    }
    ]
};

ECOSupport.init();

/**
 * 实现对象继承 Copies all the properties of config to obj.
 * 
 * @param {Object} obj The receiver of the properties
 * @param {Object} config The source of the properties
 * @param {Object} defaults A different object that will also be applied for
 *            default values
 * @return {Object} returns obj
 * @member
 */
ECOSupport.apply = function(o, c, defaults){
    if(defaults){
        ECOSupport.apply(o, defaults);
    }
    if(o && c && typeof c == 'object'){
        for(var p in c){
            o[p] = c[p];
        }
    }
    return o;
};

/**
 * var cls = 'my-class', text = 'Some text'; 
 * var s = ECOSupport.format('&lt;div class="{0}">{1}&lt;/div>', cls, text); 
 * // s now contains the string:
 * '&lt;div class="my-class">Some text&lt;/div>' </code></pre>
 * 
 * @param {String} string The tokenized string to be formatted
 * @param {String} value1 The value to replace token {0}
 * @param {String} value2 Etc...
 * @return {String} The formatted string
 * @static
 */
ECOSupport.format = function(format){
	var args = [];
	if(arguments.length > 1 ){
		if(typeof arguments[1] == 'object' && Object.prototype.toString.apply(arguments[1]) === '[object Array]'){
			args = arguments[1];
		}else{
			args = Array.prototype.slice.call(arguments, 1, arguments.length);
		}
	}
    return format.replace(/\{(\d+)\}/g, function(m, i){
        return args[i];
    });
};

/**
 * 遮罩层
 * @param {} element 遮罩的div层
 * @param {} msg 提示信息
 */
// private
ECOSupport.mask = function(msg, element) {
    if (!element) {
        element = document.body;
    } else {
        element = typeof element == 'string' ? document.getElementById(element) : element;
    }
    var mask = document.getElementById('maskId');

    if (!mask) {
        mask = document.createElement('div');
        mask.id = 'maskId';
        mask.className = 'trace-mapbg-mask';
        var innerMask = document.createElement('div');
        innerMask.className = 'trace-mapbg-mask-msg trace-mapbg-mask-loading';
        mask.appendChild(innerMask);
        element.appendChild(mask);
    }

    var viewportWidth = document.body.clientWidth,
        viewportHeight = document.body.clientHeight,
        innerMask2 = $('div', mask),
        top = viewportHeight / 2 - innerMask2.outerHeight() / 2,
        left = viewportWidth / 2 - innerMask2.outerWidth() / 2;
        
    innerMask2[0].style.top = top + 'px';
    innerMask2[0].style.left = left + 'px';
    mask.style.display = 'block';
},

/**
 * 删除遮罩层
 */
// private
ECOSupport.unmask = function(element) {
    var mask = document.getElementById('maskId');
    if(mask){
    	mask.style.display = 'none';
    }
};