/**
 * 树节点
 * 对于每层树最左侧节点，线用其他颜色标注，目前用橙色标注
 * @param conf 配置项 为object对象 conf 参数有
 * @param {} id 节点id 必设置项
 * @param {} pid 父节点id 必设置项
 * @param {} width 节点宽度
 * @param {} height 节点高度
 * 
 * @param {} storage 入库
 * @param {} exwarehouse 出库
 * @param {} inventory 库存
 * @param {} companyName 公司名称
 * @param {} companyId 公司id
 * @param {} location 所在地
 * @param {} nodeType 节点类型，目前包括S、P、J、Q
 * @param {} nodeInflowType 节点流入类型，目前有正常出库、退货、没有出库有入库，主要用节点线的颜色来区分
 * @param {} collapsed 是否折叠
 * 
 * @param {} nodeColor 节点颜色
 * @param {} nodeBorderColor 节点边框颜色
 * 
 */
ECONode = function(conf) {
    ECOSupport.apply(this, conf);
    
    this.siblingIndex = 0;//
    this.dbIndex = 0;//
    this.XPosition = 0;//节点x坐标
    this.YPosition = 0;//节点y坐标
    this.prelim = 0;//节点相对偏移量，即同属父节点下的孩子节点，坐标相对偏移量
    this.modifier = 0;//有子节点并且有左兄弟节点的节点才设置该属性值，表示该节点绝对偏移量，计算该节点的孩子节点坐标时用到该值
    this.leftNeighbor = null;// 左邻居节点，包括不属于同一父节点的情况
    this.rightNeighbor = null;// 右邻居节点，包括不属于同一父节点的情况
    this.nodeParent = null;//父节点
    this.nodeChildren = [];//孩子节点

    this.canCollapse = false;//是否可以折叠

    this.isSelected = false;//是否被选中
};

/**
 * 定义ECONode 原型方法，方法前面加 _ 表示私有方法 private
 * @type 
 */
ECONode.prototype = {
    /**
     * 返回节点所在的层
     * 
     * @return {Number}
     */
    _getLevel : function() {
        if (this.nodeParent.id == -1) {
            return 0;
        } else{
        	return this.nodeParent._getLevel() + 1;
        }
    },

    /**
     * 查看祖先是否折叠
     * 
     * @return {Boolean}
     */
    _isAncestorCollapsed : function() {
        if (this.nodeParent.collapsed) {
            return true;
        } else {
            if (this.nodeParent.id == -1) {
                return false;
            } else {
                return this.nodeParent._isAncestorCollapsed();
            }
        }
    },

    /**
     * 展开所有祖先节点
     */
    _setAncestorsExpanded : function() {
        if (this.nodeParent.id == -1) {
            return;
        } else {
            this.nodeParent.collapsed = false;
            return this.nodeParent._setAncestorsExpanded();
        }
    },

    /**
     * 返回父节点
     * 
     * @return {}
     */
    _getParentNode : function() {
        return this.nodeParent;
    },

    /**
     * 返回孩子节点树的长度
     * 
     * @return {Number}
     */
    _getChildrenCount : function() {
        if (this.collapsed) {
            return 0;
        }
        if (this.nodeChildren == null) {
            return 0;
        } else {
            return this.nodeChildren.length;
        }
    },

    /**
     * 返回左兄弟节点，这两个节点必须是同属一个父节点
     * 
     * @return {}
     */
    _getLeftSibling : function() {
        if (this.leftNeighbor != null && this.leftNeighbor.nodeParent == this.nodeParent) {
            return this.leftNeighbor;
        }
        return null;
    },
    /**
     * 返回右兄弟节点，这两个节点必须是同属一个父节点
     * 
     * @return {}
     */
    _getRightSibling : function() {
        if (this.rightNeighbor != null && this.rightNeighbor.nodeParent == this.nodeParent) {
            return this.rightNeighbor;
        }
        return null;
    },

    /**
     * 根据i返回孩子节点
     * 
     * @param {} i
     * @return {}
     */
    _getChildAt : function(i) {
        return this.nodeChildren[i];
    },

    /**
     * 返回该层所有孩子节点的中心位置
     * 
     * @param {} tree
     * @return {}
     */
    _getChildrenCenter : function(tree) {
        var node = this._getFirstChild(),
            node1 = this._getLastChild();
        return node.prelim + ((node1.prelim - node.prelim) + tree._getNodeSize(node1)) / 2;
    },

    /**
     * 返回第一个孩子节点
     * 
     * @return {}
     */
    _getFirstChild : function() {
        return this._getChildAt(0);
    },

    /**
     * 返回最后一个孩子节点
     * 
     * @return {}
     */
    _getLastChild : function() {
        return this._getChildAt(this._getChildrenCount() - 1);
    },
	
	/**
     * 返回高亮显示的父节点
     * 改动2013-11
     * @return {}
     */	
	 _getPNode : function(pid) {
		var pId=pid;
		var parentId=this.nodeParent.id;
        if (parentId == pId) {
            return pNode=this.nodeParent;
        } else{
        	return pNode=this.nodeParent._getPNode(pId);
        }
    },

    /**
     * 画线，第一个孩子节点与父节点对齐
     * 
     * @param {} tree 树
     * @return {}
     */
    _drawChildrenLinks : function (tree) {
        var s = [], xa, ya, xb, yb, node, // 孩子节点
            lineColor,
            zoom = tree.zoom,// 比例因子
            line = tree.line,
            pen = line.pen,
            adjustX = jQuery.boxModel ? 8 : 0,
            color = ECOTree._getLineColor(this),
            arrowsIcon = ECOTree._getLineArrows(this),
            arrowsOffset = tree.config.arrowsOffset,//入库箭头偏移量
            exwarehouseOffset = tree.config.exwarehouseOffset,//出库偏移量
            len = this.nodeChildren ? this.nodeChildren.length : 0,
            midLineAdjust = 12;
		    line.setArrowsIcon(arrowsIcon);
        // 当该节点有孩子节点时才显示出库线和中间线
		
        if (len > 0 && !this.collapsed) {
            var childLen = this.nodeChildren.length;
            // 出库线
			switch(tree.config.iRootOrientation)
			{	
				case ECOTree.RO_LEFT:
					xa = this.XPosition + this.width + adjustX;
					ya = this.YPosition + (this.height / 2) + exwarehouseOffset;
					xb = xa + tree.config.iLevelSeparation / 2 - adjustX - midLineAdjust;
					yb = ya;	
					break;		
				case ECOTree.RO_RIGHT:
					xa = this.XPosition - adjustX/2;
					ya = this.YPosition + (this.height / 2) + exwarehouseOffset;
					xb = xa - tree.config.iLevelSeparation / 2 + adjustX + midLineAdjust;
					yb = ya;			
					break;
			}
            line.setColor(line.pen.defaultColor);
            s.push(line.drawLine({
            	id : 'exw_' + this.id,
                x0 : xa,
                y0 : ya,
                x1 : xb,
                y1 : yb
            }));
            // 中间线
            if(len > 1){
				switch(tree.config.iRootOrientation)
				{							
					case ECOTree.RO_LEFT:
						xa = this.XPosition + this.width + tree.config.iLevelSeparation / 2 - midLineAdjust;
						ya = this.YPosition + (this.height / 2) + arrowsOffset;
						xb = xa;
						var lastChildNode = this.nodeChildren[childLen - 1];
						yb = lastChildNode.YPosition + (this.height / 2) + pen.weight / 2  + (len > 1 ? arrowsOffset : exwarehouseOffset) - 1;	
						break;	
					case ECOTree.RO_RIGHT:
						xa = this.XPosition - tree.config.iLevelSeparation / 2 + midLineAdjust;
						ya = this.YPosition + (this.height / 2) + arrowsOffset;
						xb = xa;
						var lastChildNode = this.nodeChildren[childLen - 1];
						yb = lastChildNode.YPosition + (this.height / 2) + pen.weight / 2  + (len > 1 ? arrowsOffset : exwarehouseOffset) - 1;			
						break;		
				}
	            line.setColor(line.pen.defaultColor);
                s.push(line.drawLine({
                	id : 'mid_' + this.id,
                    x0 : xa,
                    y0 : ya,
                    x1 : xb,
                    y1 : yb
                }));
            }
        }
        
        //入库线
        if (!this.isRoot) {
			switch(tree.config.iRootOrientation)
			{	
				case ECOTree.RO_LEFT:
				    xa = this.XPosition - tree.config.iLevelSeparation / 2 - midLineAdjust;
					xb = this.XPosition;
					break;	
				case ECOTree.RO_RIGHT:
					xa = this.XPosition + this.width + tree.config.iLevelSeparation / 2 + midLineAdjust;
					xb = this.XPosition + this.width + adjustX;		
					break;	
			}
			if (this._getLeftSibling() == null && this._getRightSibling() == null) {		
				ya = this.YPosition + (this.height / 2) + exwarehouseOffset;
			} else {
				ya = this.YPosition + (this.height / 2) + arrowsOffset;
			}	
			yb = ya;

            line.setColor(color);
            var adjustA,adjustH8,adjustH1;
            if(tree.zoom == 0.5 && $.browser.msie && ($.browser.version == '6.0' || $.browser.version == '7.0') ){
            	adjustA = true;
            }
			if(tree.zoom == 0.8 && $.browser.msie && ($.browser.version == '6.0' || $.browser.version == '7.0') ){
            	adjustH8 = true;
            }
			if(tree.zoom == 1 && $.browser.msie && ($.browser.version == '6.0' || $.browser.version == '7.0') ){
            	adjustH1 = true;
            }
            s.push(line.drawLine({
            	id : 'sto_' + this.id,
                x0 : xa,
                y0 : ya,
                x1 : xb,
                y1 : yb,
				zoom : zoom,
				obj : tree.obj,
                arrows : true,
                adjustA : adjustA,
				adjustH8 : adjustH8,
				adjustH1 : adjustH1,
				nodeInflowType : this.nodeInflowType || "0",
				updateDoc: this.updateDoc || "0"
            }));
        }
        
        return s.join('');
    },
	
    /**
     * 画线，回退节点
     * 改动2013-11
     * @param {} tree 树
     * @return {}
     */
    _drawBacksLinks : function (tree,pNode,node) {
        var s = [], xa, ya, xb, yb, node, // 孩子节点
            lineColor,
            zoom = tree.zoom,// 比例因子
            line = tree.line,
            pen = line.pen,
            adjustX = jQuery.boxModel ? 5 : 0,
            color = ECOTree._getLineColor(node),
            arrowsIcon = ECOTree._getLineArrows(node),
            len = this.nodeChildren ? this.nodeChildren.length : 0,
            midLineAdjust = 12;
		    line.setArrowsIcon(arrowsIcon);
            xa = this.XPosition + this.width - 15 + adjustX/2;
            ya = this.YPosition + (this.height / 2);		
			xpa = pNode.XPosition + this.width/3*2 + adjustX/2;
            ypa = pNode.YPosition + (pNode.height / 2);	
			var adjustA,adjustH8,adjustH1;
            if(zoom == 0.5 && $.browser.msie && ($.browser.version == '6.0' || $.browser.version == '7.0') ){
            	adjustA = true;
            }
			if(zoom == 0.8 && $.browser.msie && ($.browser.version == '6.0' || $.browser.version == '7.0') ){
            	adjustH8 = true;
            }
			if(zoom == 1 && $.browser.msie && ($.browser.version == '6.0' || $.browser.version == '7.0') ){
            	adjustH1 = true;
            }
            // 水平线		
            line.setColor(color);
            s.push(line.drawLine({
            	id : 'backh_' + this.id,
                x0 : xa,
                y0 : ya,
                x1 : xpa,
                y1 : ya,
				backLine : true,
				arrows : ypa==ya,
				adjustA : adjustA,
				adjustH8 : adjustH8,
				adjustH1 : adjustH1,
				zIndex : 1000000000,
				updateDoc: node.updateDoc || "0"
            }));
            // 垂直线
            if(ypa!==ya){
	            line.setColor(color);
                s.push(line.drawLine({
                	id : 'backv_' + this.id,
                    x0 : xpa,
                    y0 : ypa,
                    x1 : xpa,
                    y1 : ya,
				    zoom : zoom,
					arrows : true,
				    adjustA : adjustA,	
				    adjustH8 : adjustH8,
				    adjustH1 : adjustH1,				
					zIndex : 1000000000,
					updateDoc: node.updateDoc || "0"
                }));
            }     
        return s.join('');
    }
};