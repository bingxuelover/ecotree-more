$(document).ready(function() {

    // 创建流程图容器
    ECOTree.IMAGE_PATH = '../';
    var width = document.body.clientWidth,
        height = document.body.clientHeight;
    adjustH = $('#traceInfo').outerHeight();//调整高度
    jQuery.traceGraphicLeft.createTraceContainer({
        parentContainer : $('#traceContainerPop')[0],
        obj : 'traceGraphic2',// 对象，保存到ECOTree中，供鼠标操作节点时使用
        width : width,
        height : height,
        adjustH : adjustH,// 调整高度，指其他区域所占的高度
        adjustW : 0// 调整宽度，指其他区域所占的宽度
	});
	jQuery.traceGraphicRight.createTraceContainer({
        parentContainer : $('#traceContainerPop')[0],
        obj : 'traceGraphic3',// 对象，保存到ECOTree中，供鼠标操作节点时使用
        width : width,
        height : height,
        adjustH : adjustH,// 调整高度，指其他区域所占的高度
        adjustW : 0// 调整宽度，指其他区域所占的宽度
	});  
    
    /**
	 * 显示
	 */
	$(function() {
        ECOSupport.mask();
        // 加载流程图
        jQuery.traceGraphicLeft.loadTrace({
            data : data
        });
		jQuery.traceGraphicRight.loadTrace({
            data : enterdata
        });
    });    
});