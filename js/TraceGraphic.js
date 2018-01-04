/**
 * 数据加载
 * $(document).ready(function() {
			$("#traceGraphic").createTrace({
			    data: data,
			});
	});

 * Ajax请求
	$(document).ready(function() {
			$("#traceGraphic").createTrace({
			    url:'',
				params:''
			});
	});

 */
(function($) {
    var methods = {
        /**
    	 * 创建流程图容器
    	 */
        createTraceContainer: function(config) {
            if (!config) {
                return;
            }
            //创建流程图整体框架
            var container = config.parentContainer,
                width = config.width,
                height = config.height,
                adjustW = config.adjustW || 0,
                adjustH = config.adjustH || 0,
                obj = config.obj;

            var trace = document.createElement('div');
            trace.className = 'trace';
            var html = [];
            html.push('<div class="drugDescribe">');
            html.push('	 <div class="info">');
            html.push('		总量： <span class="blue">0</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;最长环节数： <span class="yellow">0</span>');
            html.push('	 </div>');
            html.push('</div>');
            html.push('<div id="traceGraphic" class="graphic">');
            html.push('		<div class="header">');
            html.push('			<div class="inner">');
            html.push('				<div class="search"><span class="info">搜索：</span>');
            html.push('            		<div style="float:left;width:320px;">');
            html.push('						<dl class="searchSelect">');
            html.push('							<dt>');
            html.push('								<input type="text" name="companyName" class="input1">');
            html.push('							</dt>');
            html.push('							<dd>');
            html.push('							</dd>');
            html.push('						</dl>');
            html.push('					    <input type="button" class="input2">');
            html.push('					</div>');
            html.push('				</div>');
            html.push('				<div class="contral">');
            html.push('					<input type="button" class="btn btn3" onclick="javascript:jQuery.traceGraphic.fullScreen(this, \'traceGraphic\', \'' + obj + '\');">'); // 全屏
            html.push('					<input type="button" class="btn btn2" onclick="javascript:jQuery.traceGraphic.doZoom(this, \'' + obj + '\',\'out\');">'); // 缩小
            html.push('					<input type="button" class="btn btn1" onclick="javascript:jQuery.traceGraphic.doZoom(this, \'' + obj + '\',\'in\');">'); // 放大
            html.push('                 <span class="btn_arrow"></span>');
            html.push('				</div>');
            html.push('			</div>');
            html.push('		</div>');
            html.push('		<div class="canvas">');
            html.push('    		<div class="node"></div>');
            html.push('		</div>');
            html.push('		<div class="legend-collapsed" style="z-index:100;"><div class="extended"></div></div>');
            html.push('</div>');
            html.push('<div style="position:absolute; z-index: 202; visibility:hidden"></div>');
            html.push('<div id="poptree_div" style="">');
            html.push('    <span class="closeIcon"></span>');
            html.push('    <div style="position:relative; width:100%; height:100%; overflow-x:auto; overflow-y:hidden;"></div>');
            html.push('</div>');

            trace.innerHTML = html.join('');
            container.appendChild(trace);
            var header = trace.children[1].children[0],
                nodeTip = trace.children[2],
                popTree = trace.children[3],
                //returnTip = trace.children[3],
                canvas = trace.children[1].children[1].children[0],
                legendP = trace.children[1].children[2],
                legend = trace.children[1].children[2].children[0];
            // 根据canvas是否显示滚动条动态设置图例的显示位置
            //            if(canvas.offsetHeight - canvas.clientHeight == 0){
            //            	legendP.style.bottom = '10px';
            //            } else{
            //            	legendP.style.bottom = '20px';
            //            }
            // 此处设置canvas的高宽度ie和标准盒子模式不一样
            var canvasPaddingTB = parseFloat(jQuery.css(canvas, 'paddingTop')) + parseFloat(jQuery.css(canvas, 'paddingBottom')),
                canvasPaddingLR = parseFloat(jQuery.css(canvas, 'paddingLeft')) + parseFloat(jQuery.css(canvas, 'paddingRight')),
                headerH = $(header).outerHeight(),
                drugDescribe = $('.drugDescribe', trace).outerHeight();

            adjustW += jQuery.boxModel
                ? canvasPaddingLR
                : 0;
            adjustH += headerH + drugDescribe + (jQuery.boxModel
                ? canvasPaddingTB
                : 0);

            canvas.style.height = height - adjustH + 'px';
            canvas.style.width = width - adjustW + 'px';

            var traceGraphic = new ECOTree(obj, canvas, nodeTip, popTree);
            ECOTree[obj] = traceGraphic;
            traceGraphic.container = container;
            traceGraphic.config.iRootOrientation = ECOTree.RO_LEFT;
            traceGraphic.config.iNodeJustification = ECOTree.NJ_CENTER;
            traceGraphic.config.iMaxDepth = 1000;
            traceGraphic.config.rootLayout = true;
            traceGraphic.config.adjustW = adjustW;
            traceGraphic.config.adjustH = adjustH;
            traceGraphic.zoom = 0.8; //test
            traceGraphic.initScaleFactor(0.8);

            //如果节点初始的时候不是最大，则需要设置如下代码
            traceGraphic.blowUp = true;
            traceGraphic.reduce = true;

            //设置放大缩小按钮灰色显示
            jQuery.traceGraphic.setBtnGray($('.btn2', trace), traceGraphic);

            //绑定事件
            //搜索点击事件
            $('.inner .search .input2', header).click(function() {
                var companyName = $('.inner .search .input1').val();
                var node = traceGraphic.searchNodes(companyName);
                if (node) {
                    canvas.scrollLeft = node.XPosition;
                    canvas.scrollTop = node.YPosition;
                }

            });

            //输入框输入内容匹配页面中的企业信息事件
            var filterCompany = function(element, companyName) {
                if ($.trim(companyName) == '') {
                    return;
                }
                var list = traceGraphic.searchNodeList(companyName, 10);
                if (list) {
                    element.autocomplete({source: list});
                }

                //            	if(list){
                //            		var html = [],
                //            		    select = $('.searchSelect dd', header);
                //            		for (var i = 0, len = list.length; i < len; i++) {
                //						html.push('<a href="#none" title="' + list[i] + '">' + list[i] + '</a>');
                //	                }
                //	                select.html(html.join(''));
                //	                select.show();
                //	                select.find('a').click(function(){
                //						var optionTxt = $(this).text();
                //						$(this).parent().siblings('dt').find('input').val(optionTxt);
                //						$(this).parent().hide();
                //					});
                //            	}
            };
            var companyInput = $('.inner .search .input1', header);
            companyInput.bind("focus", function() {
                filterCompany($(this), $(this).val());
            });
            companyInput.bind("keyup", function() {
                filterCompany($(this), $(this).val());
            });
            companyInput.bind("keydown", function() {
                filterCompany($(this), $(this).val());
            });
            $(document).click(function(e) {
                if (e.target.className != 'input1') {
                    $('.searchSelect dd', header).hide();
                }
            });

            //展开折叠点击事件
            $(legend).click((function() {
                var extended = false; //默认展开
                return function() {
                    if (extended) {
                        legend.parentNode.className = 'legend-collapsed';
                        extended = false;
                    } else {
                        legend.parentNode.className = 'legend-extended';
                        extended = true;
                    }
                };
            })());

            //自适应高度事件
            /**
             * 解决ie6中的bug
             * 在ie6中，DOM中某个元素区块的大小发生变化时也会激发window的resize监听函数，
             * 为了防止函数多次执行，每次window的resize事件发生时，我们可以判断一下浏览器窗口大小是否改变了，只有真的改变时我们才执行监听函数
             */
            var resizeWidth = document.documentElement.clientWidth,
                resizeHeight = document.documentElement.clientHeight;
            $(window).bind('resize', function() {
                if (resizeWidth != document.documentElement.clientWidth || resizeHeight != document.documentElement.clientHeight) {
                    jQuery.traceGraphic.graphicResize('traceGraphic', 'poptree_div', traceGraphic);
                }
                resizeWidth = document.documentElement.clientWidth,
                resizeHeight = document.documentElement.clientHeight;
            });
            return traceGraphic;
        },

        loadTrace: function(config) {
            if (!this.traceGraphicObj) {
                return;
            }
            var traceGraphic = this.traceGraphicObj,
                updateInfo = function(data) {
                    var storage = data.storage,
                        level = traceGraphic.maxLevelHeight.length - 1,
                        pkgUnit = data.pkgUnit,
                        html = [];
                    html.push('总量： <span class="blue">');
                    html.push(storage);
                    html.push('</span>');
                    html.push('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;最长环节数： <span class="yellow">');
                    html.push(level);
                    html.push('</span>');
                    $(traceGraphic.container).find('.drugDescribe .info').html(html.join(''));
                };
            ECOSupport.mask();
            if (config.data) {
                traceGraphic.addAll(config.data);
                setTimeout(function() {
                    traceGraphic.updateTree(true);
                    updateInfo(config.data[0]);
                }, 500);
            } else if (config.url && typeof config.url == 'string') {
                $.ajax({
                    type: config.type || 'get',
                    dataType: config.dataType || 'json',
                    contentType: config.contentType || 'application/json;charset=utf-8',
                    url: config.url,
                    data: config.params,
                    success: function(data, textStatus) {
                        try {
                            traceGraphic.addAll(data);
                        } catch (e) {
                            alert(e.message);
                            ECOSupport.unmask();
                            return;
                        }

                        setTimeout(function() {
                            try {
                                traceGraphic.updateTree();
                                updateInfo(data[0]);
                            } catch (e) {
                                alert('json数据格式不正确！');
                                ECOSupport.unmask();
                            }
                        }, 500);
                    },
                    error: function(request, textStatus, errorThrown) {
                        alert('您查询的药品流向信息不存在！');
                        ECOSupport.unmask();
                        //                    	var div = document.createComment('div');
                        //                    	div.id = 'drugDialog';
                        //                    	div.innerHTML = '您查询的药品流向信息不存在！';
                        //                    	document.appendChild(div);
                        //                    	$("#drugDialog" ).dialog( "open" );
                    }
                });
            }
        }
    };

    /**
     * 流程图插件
     */
    jQuery.traceGraphic = {

        /**
         * 实例化追溯对象
         */
        traceGraphicObj: null,

        /**
    	 * 创建流程图容器
    	 * config中参数有
    	   {
		    	parentContainer : $('#traceContainer')[0],//初始化流程图的容器
		        obj : 'traceGraphic1',// 用来标示流程图的id
		        width : width,//流程图容器宽度
		        height : height,//流程图容器高度
		        adjustH : adjustH,// 调整高度，指其他区域所占的高度
		        adjustW : 0// 调整宽度，指其他区域所占的宽度
		   }
    	 */
        createTraceContainer: function(config) {
            this.traceGraphicObj = methods.createTraceContainer.call(this, config);
        },

        /**
         * 加载流程图
         * config中的参数有
           {
	            data:data,
	            url:url,
	            params:params,
	            type:'get',
	            dataType :'json',
	            contentType :'application/json;charset=utf-8'
           }
         * 其中data和url是二者选一的，其他参数都是可选的，主要设置ajax交互方式，如不设置，类中会调用默认值
         */
        loadTrace: function(config) {
            methods.loadTrace.call(this, config);
        },

        /**
         * 缩放
         *
         * @param {} btn 按钮
         * @param {} tree 树对象
         * @param {} sacle 放大还是缩小，in放大、out缩小
         */
        doZoom: function(btn, tree, sacle) {
            if (tree) {
                tree = ECOTree[tree];
                tree.canvasZoom(sacle);
                this.setBtnGray(btn, tree);
            }
        },

        /**
         *
         * @param {} id 全屏的dom对象id
         */
        fullScreen: (function() {
            var full = false,
                lastWidth,
                lastHeight;
            return function(buton, id, tree) {
                if (!tree) {
                    return;
                }
                tree = ECOTree[tree];
                var graphic = document.getElementById(id),
                    canvas = graphic.children[1].children[0],
                    adjustH = tree.config.adjustH,
                    headerH = $('.header', graphic).outerHeight();
                if (full) { // 全屏时
                    buton.className = 'btn btn3';

                    graphic.style.top = '';
                    graphic.style.left = '';
                    graphic.style.width = '';
                    graphic.style.height = '';
                    graphic.style.zIndex = '';
                    graphic.style.position = 'static';

                    canvas.style.height = lastHeight;
                    full = false;
                } else {
                    buton.className = 'btn btn4';

                    lastWidth = canvas.style.width;
                    lastHeight = canvas.style.height;
                    graphic.style.top = '0px';
                    graphic.style.left = '0px';
                    var viewportWidth = document.body.clientWidth,
                        viewportHeight = document.body.clientHeight;
                    graphic.style.width = viewportWidth + 'px';
                    graphic.style.height = viewportHeight + 'px';
                    graphic.style.zIndex = '201';
                    graphic.style.position = 'absolute';

                    canvas.style.height = parseInt(viewportHeight) - headerH - (jQuery.boxModel
                        ? 20
                        : 0) + 'px';
                    full = true;
                }
                tree.full = full; //全局
            };
        })(),

        /**
         * 流程图自适应处理
         */
        graphicResize: function(id, poptree, traceGraphic) {
            var maxHeight = 300,
                maxWidth = 800,
                maxWidthP = 680,
                viewportWidth = document.documentElement.clientWidth,
                viewportHeight = document.documentElement.clientHeight,
                graphic = document.getElementById(id),
                popTree = document.getElementById(poptree),
                canvas = graphic.children[1].children[0],
                header = graphic.children[0].children[0],
                canvasPaddingTB = parseFloat(jQuery.css(canvas, 'paddingTop')) + parseFloat(jQuery.css(canvas, 'paddingBottom')),
                adjustH = traceGraphic.config.adjustH,
                headerH = $(header).outerHeight(),
                adjustW = traceGraphic.config.adjustW;
            if (viewportWidth < maxWidth) {
                graphic.style.width = maxWidth + 'px';
            } else {
                graphic.style.width = '';
            }
            if (popTree.offsetWidth > maxWidthP) {
                popTree.style.width = maxWidthP + 'px';
            }
            if (popTree.offsetWidth > viewportWidth) {
                popTree.style.width = '80%';
                popTree.style.left = '5%';
            } else {
                popTree.style.left = (viewportWidth - popTree.offsetWidth) / 2 + 'px';
            }
            popTree.style.height = viewportHeight * 0.8 + 'px';
            viewportWidth = viewportWidth < maxWidth
                ? maxWidth
                : viewportWidth;
            viewportHeight = viewportHeight < maxHeight
                ? maxHeight
                : viewportHeight;

            //graphic.style.width = viewportWidth - adjustW  + 'px';
            //graphic.style.height = viewportHeight - adjustH  + 'px';
            if (traceGraphic.full) { //全屏时
                canvas.style.height = viewportHeight - headerH - (jQuery.boxModel
                    ? canvasPaddingTB
                    : 0) + 'px';
                //graphic.style.height = viewportHeight - headerH - (jQuery.boxModel ? canvasPaddingTB : 0)  + 'px';
            } else {
                canvas.style.height = viewportHeight - adjustH + 'px';
            }
            canvas.style.width = viewportWidth - adjustW + 'px';
        },

        /**
         * 设置放大缩小按钮灰色显示
         */
        setBtnGray: function(btn, tree) {
            var blowBtn = $(btn).parent().find('.btn1');
            var reduceBtn = $(btn).parent().find('.btn2');
            if (!tree.blowUp) { // 放大按钮变成灰色
                blowBtn.addClass('blowup');
            } else {
                blowBtn.removeClass('blowup');
            }
            if (!tree.reduce) { // 缩小按钮变成灰色
                reduceBtn.addClass('reduce');
            } else {
                reduceBtn.removeClass('reduce');
            }
        }
    };

})(jQuery);
