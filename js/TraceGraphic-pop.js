(function($) {
    var methods = {
    	/**
    	 * 创建流程图容器
    	 */
        createTraceContainer : function(config) {
        	if(!config){
        		return;
        	}
            //创建流程图整体框架
            var container = config.parentContainer,
                width = 400,
                height = config.height,
                adjustW = config.adjustW || 0,
                adjustH = config.adjustH || 0, 
                obj = config.obj;
                       
            var trace = document.createElement('div');
            trace.className = 'trace';
			var html=[];
			html.push('<div id="traceGraphicLeft" class="graphic" style="border:0 none;">');
			html.push('		<div class="canvas">');
            html.push('    		<div class="node" style="padding:0; width:100%; height:100%; overflow-x:hidden; overflow-y:auto;">');
            html.push('    		    <div id="pop_left"></div>');
            html.push('    		    <div id="pop_right"></div>');
            html.push('		    </div>');
            html.push('		</div>');
            html.push('</div>');
			trace.innerHTML= html.join('');
					
            container.appendChild(trace);
            var canvas = trace.children[0].children[0].children[0].children[0];
			
            // 此处设置canvas的高宽度ie和标准盒子模式不一样 
            var canvasPaddingTB = parseFloat(jQuery.css( canvas, 'paddingTop')) + parseFloat(jQuery.css( canvas, 'paddingBottom')),
            	canvasPaddingLR = parseFloat(jQuery.css( canvas, 'paddingLeft')) + parseFloat(jQuery.css( canvas, 'paddingRight'));
                
            adjustW += jQuery.boxModel ? canvasPaddingLR : 0;
            adjustH += jQuery.boxModel ? canvasPaddingTB : 0;
            
            canvas.style.height = height - adjustH + 'px';
            canvas.style.width = width - adjustW + 'px';
			            
            var traceGraphicLeft = new ECOTree(obj, canvas);
            ECOTree[obj] = traceGraphicLeft;
            traceGraphicLeft.container = container;
            traceGraphicLeft.config.iRootOrientation = ECOTree.RO_LEFT;
            traceGraphicLeft.config.iNodeJustification = ECOTree.NJ_CENTER;
			traceGraphicLeft.config.topXAdjustment = 20;
			traceGraphicLeft.config.topYAdjustment = -50;
            traceGraphicLeft.config.iMaxDepth = 1000;
            traceGraphicLeft.config.rootLayout = true;
            traceGraphicLeft.config.adjustW = adjustW;
            traceGraphicLeft.config.adjustH = adjustH;
            traceGraphicLeft.zoom = 0.8; //test
            traceGraphicLeft.initScaleFactor(0.8);
            //自适应高度事件
            /**
             * 解决ie6中的bug
             * 在ie6中，DOM中某个元素区块的大小发生变化时也会激发window的resize监听函数，
             * 为了防止函数多次执行，每次window的resize事件发生时，我们可以判断一下浏览器窗口大小是否改变了，只有真的改变时我们才执行监听函数
             */
            var resizeWidth = document.documentElement.clientWidth,
				resizeHeight = document.documentElement.clientHeight;
            $(window).bind('resize', function() {
                if (resizeWidth != document.documentElement.clientWidth
                        || resizeHeight != document.documentElement.clientHeight) {
                    jQuery.traceGraphicLeft.graphicResize('traceGraphicLeft', traceGraphicLeft);
                }
                resizeWidth = document.documentElement.clientWidth;
                resizeHeight = document.documentElement.clientHeight;
            });
            return traceGraphicLeft;
        },
        
        loadTrace : function(config) {
        	if(!this.traceGraphicObj){
        		return;	
        	}
        	var traceGraphicLeft = this.traceGraphicObj,
        		updateInfo = function(data) {
                    
                };
        	ECOSupport.mask();
        	if (config.data) {
				traceGraphicLeft.addAll(config.data);
                setTimeout(function() {
                    traceGraphicLeft.updateTree();
                }, 500);
            } else if (config.url && typeof config.url == 'string') {
                $.ajax({
                    type : config.type || 'get',
                    dataType : config.dataType || 'json',
                    contentType : config.contentType || 'application/json;charset=utf-8',
                    url : config.url,
                    data : config.params,
                    success : function(data, textStatus) {
                    	try {
                            traceGraphicLeft.addAll(data);
                        } catch (e) {
                            alert(e.message);
                            ECOSupport.unmask();
                            return;
                        }
                        
		                setTimeout(function() {
                            try {
                                traceGraphicLeft.updateTree();
                            } catch (e) {
                                alert('json数据格式不正确！');
                                ECOSupport.unmask();
                            }
                        }, 500);
                    },
                    error : function(request, textStatus, errorThrown) {
                        alert('您查询的药品流向信息不存在！');
                    	ECOSupport.unmask();
                    }
                });
            }
        }
    };    
    /**
     * 流程图插件
     */
    jQuery.traceGraphicLeft = {    	
    	/**
         * 实例化追溯对象
         */
    	traceGraphicObj : null,
    	createTraceContainer : function(config) {
    		this.traceGraphicObj = methods.createTraceContainer.call(this, config);
        },
    	loadTrace : function(config) {
            methods.loadTrace.call(this, config);
        },  
        /**
         * 流程图自适应处理
         */
        graphicResize : function(id, traceGraphicLeft) {
            var maxHeight = 300,
                maxWidth = 680,
                viewportWidth = document.documentElement.clientWidth,
                viewportHeight = document.documentElement.clientHeight,
                graphic = document.getElementById(id),
                canvas = graphic.children[0].children[0],
                canvasPaddingTB = parseFloat(jQuery.css(canvas, 'paddingTop'))
                        + parseFloat(jQuery.css(canvas, 'paddingBottom')),
                adjustH = traceGraphicLeft.config.adjustH,
                adjustW = traceGraphicLeft.config.adjustW;
            if (viewportWidth < maxWidth) {
                graphic.style.width = maxWidth + 'px';
            } else {
                graphic.style.width = '';
            }
            viewportWidth = viewportWidth < maxWidth ? maxWidth : viewportWidth;
            viewportHeight = viewportHeight < maxHeight ? maxHeight : viewportHeight;

            canvas.style.height = viewportHeight + adjustH + 'px';
            canvas.style.width = viewportWidth - adjustW  + 'px';			
        }
    };
})(jQuery);

