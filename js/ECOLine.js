/**
 * 画线操作
 * @param {} pen
 * color 颜色
 * weight 线宽
 * arrows 是否带箭头
 */
ECOLine = function(pen) {
	pen = pen || {};
	pen.color = pen.color || '#11A709';
	pen.weight = pen.weight || 5;//线的宽度
	pen.arrowsDefaultW = 13;//箭头默认宽度
	pen.arrowsDefaultH = 13;//箭头默认高度	
	pen.arrowsDefaultRW = 37;//箭头默认宽度
	pen.arrowsDefaultRH = 23;//箭头默认高度
	pen.arrowsIconTop = 'arrows-purple-back-top.png';
	pen.defaultColor = '#11A709';//默认线条颜色
	pen.defaultBackColor = '#ae5da1';
	pen.arrowsW = pen.arrowsW || pen.arrowsDefaultW;//箭头宽度
	pen.arrowsH = pen.arrowsH || pen.arrowsDefaultH;//箭头高度
	pen.arrowsRW = pen.arrowsRW || pen.arrowsDefaultRW;//箭头宽度
	pen.arrowsRH = pen.arrowsRH || pen.arrowsDefaultRH;//箭头高度
	
	this.pen = pen;
};

ECOLine.prototype = {
	/**
	 * 重新设置画笔
	 * @param {} pen
	 */
	setPen : function(pen){
		if(!pen){
			this.pen = pen;
		}
	},
	
	/**
	 * 设置画笔颜色
	 * @param {} color
	 */
	setColor : function(color){
		if(color){
			this.pen.color = color;
		}
	},
	
	/**
	 * 设置线的宽度
	 * @param {} weight
	 */
	setLineWeight : function(weight){
		if(weight){
			this.pen.weight = weight;
		}
	},
	
	/**
	 * 设置箭头大小
	 * @param {} zoom 比例因子
	 */
	setArrowsSize : function(zoom){
		if(zoom){
			this.pen.arrowsW = this.pen.arrowsDefaultW * zoom;
			this.pen.arrowsH = this.pen.arrowsDefaultH * zoom;
			this.pen.arrowsReturnW = this.pen.arrowsDefaultRW * zoom;
			this.pen.arrowsReturnH = this.pen.arrowsDefaultRH * zoom;
		}
	},
	
	/**
	 * 设置线箭头图标
	 * @param {} arrowsIcon
	 */
	setArrowsIcon : function(arrowsIcon){
		if(arrowsIcon){
			this.pen.arrowsIcon = arrowsIcon;
		}
	},
	
	/**
     * 画线，目前只支持水平和垂直绘制
     * @param {} config
     * config 中有以下属性
     * @param {} id 节点id
     * @param {} x0 开始x坐标
     * @param {} y0 开始y坐标
     * @param {} x1 结束x坐标
     * @param {} y1 结束y坐标
     * @param {} arrows 是否显示箭头
     * @param {} updateDoc 显示箭头的位置
     * @param {} adjustA 是否调整箭头位置
	 
     */
    drawLine : function(config) {
		if(!config || !config.x0 || !config.y0 || !config.x1 || !config.y1){
			return '';
		}
		var id = config.id, x0 = config.x0, y0 = config.y0, x1 = config.x1, y1 = config.y1,
		    nodeInflowType = config.nodeInflowType, arrows = config.arrows, 
			backLine = config.backLine, updateDoc = config.updateDoc,
			zIndex = config.zIndex, zoom = config.zoom,
			adjustA = config.adjustA, adjustH8 = config.adjustH8, adjustH1 = config.adjustH1,
		    s = [],
            lineColor = this.pen.color,
            lineWeight = this.pen.weight,
            arrowsW = this.pen.arrowsW,
            arrowsH = this.pen.arrowsH,
            arrowsReturnW = this.pen.arrowsReturnW,
            arrowsReturnH = this.pen.arrowsReturnH,
            arrowsIcon = this.pen.arrowsIcon,
            arrowsIconTop = this.pen.arrowsIconTop;
        // For Horizontal line
        if (y0 == y1) {
			/*入库线条*/
			var adjustY,xl,xr,axl,axr,lineWidth;
			xl = (x0 < x1 ? x0 : x1);
			axl = xl + arrowsW/2 + (adjustH8 ? -1 : 0) + (adjustH1 ? 1 : 0);
			xr = x0 > x1 ? x0 : x1;
			xr = xr - arrowsW;
			axr = xr;
			adjustY = y0 - arrowsH / 2;
			lineWidth = Math.abs(x1-x0) - arrowsW/3;
			//入库直线部分
			var straightLine='<div id="sline_' + id + '" style="position:absolute;overflow:hidden;left:' + xl
                        + 'px;top:' + (y0 - lineWeight / 2) + 'px;width:' + lineWidth
                        + 'px;height:' + lineWeight + 'px;background-color:' + lineColor
                        + ';z-index:'+ (zIndex ? zIndex : '') +'"></div>';
			//出库箭头
			var arrowOut='<div id="arrowl_' + id + '" style="position:absolute;overflow:hidden;left:' + axl + 'px;top:'
                        + (adjustY + (adjustH8 ? 1 : 0)) + 'px;"><img width="' 
						+ arrowsW + 'px" height="' + arrowsH + 'px" src="' + ECOTree.IMAGE_PATH
                        + 'images/' + arrowsIcon + ((nodeInflowType==2||nodeInflowType==4) ? '.png' : '') + '"></div>';
			//入库箭头
			var arrowIn='<div id="arrowr_' + id + '" style="position:absolute;overflow:hidden;left:' + axr + 'px;top:'
                        + (adjustY + (adjustH8 ? 1 : 0)) + 'px;"><img width="' 
						+ arrowsW + 'px" height="' + arrowsH + 'px" src="' + ECOTree.IMAGE_PATH
                        + 'images/' + arrowsIcon + ((nodeInflowType==2||nodeInflowType==4) ? '.png' : '') + '"></div>';
			switch (nodeInflowType){
				case "0":
				    s.push('<div id="dashed_' + id + '" style="position:absolute;overflow:hidden;left:' + xl
                        + 'px;top:' + (y0 - lineWeight/2) + 'px;width:' + lineWidth 
						+ 'px;height:' + lineWeight + 'px;background:url('+ ECOTree.IMAGE_PATH
                        + 'images/back-gray.png) repeat-x; z-index:'+ (zIndex ? zIndex : '') +'"></div>');//虚线
				    break;
				case "1":
				    s.push(straightLine);//直线部分
					s.push(arrowOut);//出库箭头
					s.push(arrowIn);//入库箭头
				    break;
				case "2":
				case "4":
					var z8Top = (zoom==0.8 && $.browser.msie && $.browser.version <= '7.0') ? 1 : 0;
					axr_back = axr + arrowsW - arrowsReturnW - 1;
					//console.log(lineWeight,'a',arrowsReturnW,'a',arrowsW,'line',lineWidth,axr_back);
					adjustY_back = y0 - arrowsReturnH + lineWeight/2 + z8Top;
					//if(arrowsReturnW){arrowsW = arrowsReturnW; arrowsH = arrowsReturnH;}
					s.push(straightLine);//直线部分
					if(config.obj=='traceGraphic1'){//树形结构中使用回折线
						s.push('<div id="arrowl_' + id + '" style="position:absolute;overflow:hidden;left:'
					    + axr_back + 'px;top:' + adjustY_back + 'px;"><img width="' 
						+ arrowsReturnW + 'px" height="' + arrowsReturnH + 'px" src="'
						+ ECOTree.IMAGE_PATH + 'images/' + arrowsIcon + '-icon.png"></div>');//退货出库箭头
					}else{
						if(updateDoc==1||updateDoc==2){
							s.push(arrowOut);//出库箭头
						}
						if(updateDoc==2||updateDoc==3){
							s.push(arrowIn);//入库箭头
						}
					}
				    break;
				case "3":
				    s.push(straightLine);//直线部分
					if(updateDoc==1||updateDoc==2){
						s.push(arrowOut);//出库箭头
					}
					if(updateDoc==2||updateDoc==3){
						s.push(arrowIn);//入库箭头
					}
				    break;
				default:
				    s.push('<div id="sline_' + id + '" style="position:absolute;overflow:hidden;left:' + xl
                        + 'px;top:' + (y0 - lineWeight/2) + 'px;width:' + (lineWidth+arrowsW/2)
                        + 'px;height:' + lineWeight + 'px;background-color:' + lineColor
                        + ';z-index:'+ (zIndex ? zIndex : '') +'"></div>');//出库直线
				    break;
				
			}
			// 退货详情水平线	
			if(backLine == true){
				//退货详情转折线的水平线头部
				 var arrowHB = (arrowsW>11 && arrowsW<14) ? 20 : arrowsW;
				 s.push('<div id="bot_' + id + '" style="position:absolute;overflow:hidden;left:' 
					 + (xr + arrowsW) + 'px;top:' + (y0 - lineWeight / 2)+ 'px;height:'+(lineWeight+arrowHB)
					 +'px;"><img width="'+ lineWeight +'px" height="'+ (lineWeight+arrowsW) +'px" src="' 
					 + ECOTree.IMAGE_PATH + 'images/' + arrowsIcon 
					 + '-back-bot.png"><span style="display:block; width:'+lineWeight+'px;height:'
					 +(lineWeight+arrowHB-arrowsW)+'px;background-color:'+lineColor+';"></span></div>');//返回箭头的起始
							
				if(arrows==true && (updateDoc==2||updateDoc==3)){
					s.push('<div id="top_' + id + '" style="position:absolute;overflow:hidden;left:' 
					    + (xl-lineWeight) + 'px;top:' + (adjustY + (adjustH8 ? 1 : 0))
						+ 'px;"><img width="' + arrowsH + 'px" height="' + arrowsW + 'px" src="' + ECOTree.IMAGE_PATH
						+ 'images/' + arrowsIcon + '-back.png"></div>');//回退入库箭头					
				}
				if(updateDoc==2||updateDoc==1){
					s.push('<div id="top_' + id + '" style="position:absolute;overflow:hidden;left:' 
					    + (xr-lineWeight) + 'px;top:' + (adjustY + (adjustH8 ? 1 : 0))
						+ 'px;"><img width="' + arrowsH + 'px" height="' + arrowsW + 'px" src="' + ECOTree.IMAGE_PATH
						+ 'images/' + arrowsIcon + '-back.png"></div>');//回退出库箭头					
				}
            }
        }
        // For Vertical line
        if (x0 == x1) {
			if (arrows === true){
				s.push('<div id="top_' + id + '" style="position:absolute;overflow:hidden;left:' 
				+ (x0 - arrowsW/2 + lineWeight/2 + (adjustA ? 1 : 0) + (adjustH8 ? 1 : 0)) 
				+ 'px;top:' + (y0 < y1 ? y0-arrowsW+1 : y1-arrowsW+1) 
				+ 'px;"><img width="' + arrowsH + 'px" height="' + arrowsW + 'px" src="' 
				+ ECOTree.IMAGE_PATH + 'images/' + arrowsIconTop + '"></div>');//返回箭头的头部
			}
        	s.push('<div id="' + id + '" style="position:absolute;overflow:hidden;left:' + x0 + 'px;top:' 
			+ (y0 < y1 ? y0 : y1) + 'px;width:' + lineWeight + 'px;height:' + (Math.abs(y1 - y0) + 1) 
			+ 'px;background-color:' + lineColor + ';z-index:'+ (zIndex ? zIndex : '') +'"></div>');//垂直线无箭头
        }
        return s.join('');
    }
};
