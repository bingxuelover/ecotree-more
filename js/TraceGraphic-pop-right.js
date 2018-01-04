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

            var canvasRight = document.getElementById('pop_right');
            
			// 此处设置canvas的高宽度ie和标准盒子模式不一样 
            var canvasPaddingTB = parseFloat(jQuery.css( canvasRight, 'paddingTop')) + parseFloat(jQuery.css( canvasRight, 'paddingBottom')),
            	canvasPaddingLR = parseFloat(jQuery.css( canvasRight, 'paddingLeft')) + parseFloat(jQuery.css( canvasRight, 'paddingRight'));    
            adjustW += jQuery.boxModel ? canvasPaddingLR : 0;
            adjustH += jQuery.boxModel ? canvasPaddingTB : 0;         
            canvasRight.style.height = 'auto';
            canvasRight.style.width = width - adjustW + 'px';
			canvasRight.style.position = 'absolute';
			canvasRight.style.top = '0';
			canvasRight.style.left = '0';

			var traceGraphicRight = new ECOTree(obj, canvasRight);
            ECOTree[obj] = traceGraphicRight;
            traceGraphicRight.container = container;
            traceGraphicRight.config.iRootOrientation = ECOTree.RO_RIGHT;
            traceGraphicRight.config.iNodeJustification = ECOTree.NJ_CENTER;
			traceGraphicRight.config.topXAdjustment = 20;
			traceGraphicRight.config.topYAdjustment = -1200;
            traceGraphicRight.config.iMaxDepth = 1000;
            traceGraphicRight.config.rootLayout = true;
            traceGraphicRight.config.adjustW = adjustW;
            traceGraphicRight.config.adjustH = adjustH;
            traceGraphicRight.zoom = 0.8; //test
            traceGraphicRight.initScaleFactor(0.8);
            
            return traceGraphicRight;
        },
        
        loadTrace : function(config) {
        	if(!this.traceGraphicObj){
        		return;	
        	}
        	var traceGraphicRight = this.traceGraphicObj,
        		updateInfo = function(data) {
                    
                };
        	ECOSupport.mask();
        	if (config.data) {
				traceGraphicRight.addAll(config.data);
                setTimeout(function() {
                    traceGraphicRight.updateTree();
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
                            traceGraphicRight.addAll(data);
                        } catch (e) {
                            alert(e.message);
                            ECOSupport.unmask();
                            return;
                        }
                        
		                setTimeout(function() {
                            try {
                                traceGraphicRight.updateTree();
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
    jQuery.traceGraphicRight = {
    	/**
         * 实例化追溯对象
         */
    	traceGraphicObj : null,

    	createTraceContainer : function(config) {
    		this.traceGraphicObj = methods.createTraceContainer.call(this, config);
        },
        
    	loadTrace : function(config) {
            methods.loadTrace.call(this, config);
        }      
    };
})(jQuery);

