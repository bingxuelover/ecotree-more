/**
 * 主类 树
 * 
 * @param {} obj 树的对象名称
 * @param {} elm 渲染树的容器
 * @param {} nodeTip 节点提示对象
 */
ECOTree = function(obj, elm, nodeTip, popTree) {
    this.config = {
        iMaxDepth : 100,// 树的最大深度
        iLevelSeparation : ECOTree.LEVEL_SEPARATION,// 节点层数之间的间距
        iSiblingSeparation : ECOTree.SIBLING_SEPARATION,// 节点之间的间距，指兄弟节点
        iSubtreeSeparation : ECOTree.SUBTREE_SEPARATION,// 两颗子树之间的间距
        
        iRootOrientation : ECOTree.RO_TOP,// 树展现方向，从上往下还是从左往右，默认为从上往下
        iNodeJustification : ECOTree.NJ_TOP,// 节点对齐方式
        topXAdjustment : 10,//调整整颗树x坐标（对于左右排列指y坐标）
        topYAdjustment : -85,//调整整颗树y坐标（对于左右排列指x坐标）
        render : "Auto",
        linkType : "M",//线型，是直线还是平滑斜线
        linkColor : "11A709",//线的默认颜色
        nodeColor : "#CCCCFF",//节点默认显示颜色
        nodeBgColor : "#DEDEDF",//节点背景颜色
        nodeBgGradientColor : "#FDFDFD",//节点背景渐变颜色
        nodeFill : ECOTree.NF_GRADIENT,//节点填充颜色，是否渐变
        nodeBorderColor : "#b6b6b6",//节点边框颜色
        nodeSelColor : "#FFFFCC",//节点选中颜色
        levelColors : ["#5555FF", "#8888FF", "#AAAAFF", "#CCCCFF"],//渐变色值
        levelBorderColors : ["#5555FF", "#8888FF", "#AAAAFF", "#CCCCFF"],
        colorStyle : ECOTree.CS_NODE,
        searchMode : ECOTree.SM_DSC,//节点查询方式
        selectMode : ECOTree.SL_SINGLE,//节点选中方式，默认单一选择
        defaultNodeWidth : 208,// 节点默认宽度
        defaultNodeHeight : 115,// 节点默认高度
        exwarehouseOffset : 55,//出库偏移量
        arrowsOffset : 42,//入库箭头偏移量
        expandedImage : ECOTree.IMAGE_PATH + 'images/expand.png',
        collapsedImage : ECOTree.IMAGE_PATH + 'images/collapse.png',
        
        // 以下为扩展
        rootLayout : false,// 根节点是居中布局还是与起始位置对齐，默认为false居中布局
        expandedIconH : 18,//折叠展开图片宽度
        defaultLineWeight : ECOTree.DEFAULT_LINE_WEIGHT//线的默认宽度
    };
	
    this.obj = obj;
    this.nodeTip = nodeTip;
    this.popTree = popTree;
    this.version = "1.0";
    this.elm = typeof elm == "string" ?
            document.getElementById(elm) : elm;// 渲染的容器
    this.self = this;
    this.render = (this.config.render == "Auto")
            ? ECOTree._getAutoRenderMode()
            : this.config.render;
    this.ctx = null;
    
    //画布偏移量
    this.canvasoffsetTop = 0;
    this.canvasoffsetLeft = 0;

    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
    
    this.treeLevelMaxX = [];//当上下排列时，求树每层最大x坐标
    this.treeLevelMaxY = [];//当左右排列时，求树每层最大y坐标
    
    //根节点偏移量
    this.rootYOffset = 0;
    this.rootXOffset = 0;

    //所有节点数据
    this.nDatabaseNodes = [];
    //所有节点id
    this.mapIDs = {};

    // 根节点
    this.root = new ECONode({
        id : -1,
        pid : null,
        width : 2,
        height : 2
    });
    this.iSelectedNode = -1;
    this.iLastSearch = 0;
    
    this.zoom = 1;//缩放比例，实际放大或缩小的百分比
    this.scale = 2;//缩放因子，即缩放的级别，默认最大级别
    this.blowUp = this.blowUp || false;//是否可以放大
    this.reduce = this.reduce || true;//是否可以缩小
    
    //可缩放的级别
    this.scaleFactors = [0.5, 0.8, 1];
    
    this.showNodeTip = false;
	this.showPopTree = false
    // 扩展功能，初始化节点信息提示框
    this._initNodeTip();
	//this._initNodeTipNotIn();
    
    //初始化线实例
    this.line = new ECOLine();

};

// Constant values
//树的部分参数默认值
ECOTree.LEVEL_SEPARATION = 100; // 节点层数之间的间距
ECOTree.SIBLING_SEPARATION = 20; // 节点之间的间距，指兄弟节点
ECOTree.SUBTREE_SEPARATION = 40; // 两颗子树之间的间距
ECOTree.DEFAULT_LINE_WEIGHT = 5; // 线的默认宽度
    
// Tree orientation
ECOTree.RO_TOP = 0;// 从上往下显示树形
ECOTree.RO_BOTTOM = 1;// 从下往上显示树形
ECOTree.RO_RIGHT = 2;// 从右往左显示树形
ECOTree.RO_LEFT = 3;// 从左往右显示树形

// Level node alignment
ECOTree.NJ_TOP = 0;
ECOTree.NJ_CENTER = 1;
ECOTree.NJ_BOTTOM = 2;

// Node fill type
ECOTree.NF_GRADIENT = 0;
ECOTree.NF_FLAT = 1;

// Colorizing style
ECOTree.CS_NODE = 0;
ECOTree.CS_LEVEL = 1;

// Search method: Title, metadata or both
ECOTree.SM_DSC = 0;
ECOTree.SM_META = 1;
ECOTree.SM_BOTH = 2;

// Selection mode: single, multiple, no selection
ECOTree.SL_MULTIPLE = 0;
ECOTree.SL_SINGLE = 1;
ECOTree.SL_NONE = 2;

// 扩展，设置默认图片路径
ECOTree.IMAGE_PATH = './images/';

// 兼容性，目前没有兼容 Svg，待扩展
ECOTree.ENGINE_PRIORITY = ['Canvas', 'Vml'];

//返回渲染模式
ECOTree._getAutoRenderMode = function() {
    var enginePriority = ECOTree.ENGINE_PRIORITY,
        len = enginePriority.length;
    for (var i = 0; i < len; i++) {
        if (ECOSupport[enginePriority[i]]) {
            return enginePriority[i];
        }
    }
};


/**
 * 画布节点点击事件
 * 
 * @param {} tree
 * @param {} target
 * @param {} nodeid
 */
ECOTree._canvasNodeClickHandler = function(tree, target, nodeid) {
    if (target != nodeid)
        return;
    tree.selectNode(nodeid, true);
};

/**
 * 鼠标移入节点触发的事件
 * @param {} e
 * @param {} tree
 * @param {} nodeIndex
 */
ECOTree._canvasNodeMouseOverHandler = function(e, tree, nodeIndex) {
	var evt = e ? e : (window.event ? window.event : null); //这里兼容ie和firefox
	
//	var node = evt.srcElement ? evt.srcElement : evt.target; //evt.target在火狐上才能识别。
//	var findNode = function(node){
//		if(node.id = nodeId){
//			return node;
//		}
//		findNode(node.parentNode);
//	};
//	var nodeDiv = findNode(node);
	
	var X, Y;
    X = evt['pageX'];
    Y = evt['pageY'];
    if (!X && X !== 0) {
        X = evt['clientX'] || 0;
        Y = evt['clientY'] || 0;
    }
    if(tree){
    	tree = ECOTree[tree];
    }
    if (nodeIndex) {
        tree._showNodeTip(nodeIndex, X, Y);
    }
    
};

/**
 * 鼠标移出节点触发的事件
 * @param {} tree
 */
ECOTree._canvasNodeMouseOutHandler = function(tree) {
	if(tree){
    	tree = ECOTree[tree];
    }
    tree._hideNodeTip();
};

//改动2014-3
/**
 * 画布节点点击查看详情事件
 * 
 * @param {} tree
 * @param {} nodeid
 */
ECOTree._canvasPopShow = function(tree, nodeid) {
    if(tree){
    	tree = ECOTree[tree];
    }
	if (nodeid) {
	    tree._showPopTree(nodeid);
	}
};
//改动2013-11
/**
 * 鼠标点击回退节点触发的事件
 * @param {} tree
 * @param {} nodeid
 * @param {} nodepid
 * @param {} nodeIndex
 */
ECOTree._canvasNodeClickShowLineHandler = function(tree, nodeid ,nodepid, nodeIndex, update) {
    var treeOld=tree;
	if(tree){
    	tree = ECOTree[tree];
    }
	var nodeIndex=parseInt(nodeIndex);
	//console.log(treeOld,tree,nodeIndex,nodeid,nodepid)
	//console.log(tree.iSelectedNode,nodeIndex);
	/*点击取消显示*/
	if(update){tree.iSelectedNode=-1;}
	if(nodeIndex==tree.iSelectedNode){
		var backsHDiv=document.getElementById('backsH');
		if(backsHDiv){
			$('.backnode_box').removeClass('backnode_box');
			tree.elm.removeChild(backsHDiv);
		}
		tree.iSelectedNode=-1;
		return;
	}
	/*点击切换显示*/
	if(document.getElementById('backsH')){
		tree.elm.removeChild(document.getElementById('backsH'));
		$('.backnode_box').removeClass('backnode_box');
		tree.iSelectedNode=-1;
	}//取消之前的回退线路
	tree.iSelectedNode=nodeIndex;		
	var b=[],node=null,nodeP=null;
	node=tree.nDatabaseNodes[nodeIndex]; 	
	nodeP=node.nodeParent;
	nodeP._getPNode(nodeid);
	$('#'+pNode.id+',#'+nodeP.id).addClass('backnode_box');
	//$('#'+nodeP.id).addClass('backnode_box');
	if(nodeP._isAncestorCollapsed()){
		nodeP._setAncestorsExpanded();
		tree.updateTree();
		ECOTree._canvasReturnShow(event, treeOld, nodepid, pNode.dbIndex);
		$('#'+pNode.id+',#'+nodeP.id).addClass('backnode_box');
	}
	var canvas = document.getElementById(nodeid).parentNode;
	if(pNode){
		canvas.scrollLeft = pNode.XPosition;
		canvas.scrollTop = pNode.YPosition;
	}//console.log(pNode,node,nodeP)
    b.push(nodeP._drawBacksLinks(tree,pNode,node));
	var backsH=document.createElement('div');
	tree.elm.appendChild(backsH);
	backsH.id='backsH';
	backsH.innerHTML=b.join('');
	return node;
};

/**
 * 回退列表展现
 * @param {} tree
 * @param {} nodeId
 * @param {} nodeIndex
 * @param {} type 回退出库/入库
 */
ECOTree._canvasReturnShow=function(e,tree, nodeid, nodeIndex, type){
	if(tree){
    	tree = ECOTree[tree];
    }
	var node=tree.nDatabaseNodes[nodeIndex];
	var X=node.XPosition,Y=node.YPosition;
	var returnNodeName= type ? "returnL_" : "returnW_";
	var returnNodeList=document.getElementById(returnNodeName+nodeIndex);
	if(returnNodeList && returnNodeList.style.visibility=='visible'){
		tree._hideReturnTip(nodeIndex, type);
	}else{
		tree._showReturnTip(tree,nodeid, nodeIndex, X, Y, type);
	}
};
/**
 * 回退列表关闭
 * @param {} tree
 * @param {} nodeIndex
 */
ECOTree._canvasReturnHide = function(tree, nodeIndex, type) {
	if(tree){
    	tree = ECOTree[tree];
    }
    tree._hideReturnTip(nodeIndex, type);
};

// Layout algorithm
/**
 * 第一次遍历所有节点 主要设置树的每层level高度、宽度、节点的邻居，相对起始节点偏移量，相对节点中心偏移量
 * 
 * @param {} tree
 * @param {} treeNode
 * @param {} level
 */
ECOTree._firstWalk = function(tree, treeNode, level) {
	
    var rootLayout = tree.config.rootLayout;
    var leftSibling = null;
    
    //根据比例因子修改节点高宽度，可以单独放在一个方法中循环设置节点高宽度，待定
    if(treeNode.pid != null){
    	treeNode.width = tree.config.defaultNodeWidth;
    	treeNode.height = tree.config.defaultNodeHeight;
    }
    
    treeNode.XPosition = 0;
    treeNode.YPosition = 0;
    treeNode.prelim = 0;// 设置同属一个父节点，即兄弟节点之间的间距（偏移量），第一个孩子偏移量为0
    treeNode.modifier = 0;// 该值设置，主要是为孩子节点坐标来定位的，即孩子节点的坐标会加上该值来定位的（只有有孩子节点并且该节点有左邻居节点）
    treeNode.leftNeighbor = null;
    treeNode.rightNeighbor = null;
    tree._setLevelHeight(treeNode, level);// 当前层最大的高度
    tree._setLevelWidth(treeNode, level);// 当前层最大的宽度
    tree._setNeighbors(treeNode, level);// 建立当前层节点之间的兄弟或邻近关系
    
    // 为每个节点计算左边的大小
    if (treeNode._getChildrenCount() == 0 || level == tree.config.iMaxDepth) {// 叶子节点
        leftSibling = treeNode._getLeftSibling();
        if (leftSibling != null) {
            treeNode.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling)
                    + tree.config.iSiblingSeparation;
        } else {
            treeNode.prelim = 0;
        }
    } else {
        var n = treeNode._getChildrenCount();
        for (var i = 0; i < n; i++) {
            var iChild = treeNode._getChildAt(i);
            ECOTree._firstWalk(tree, iChild, level + 1);
        }
        var midPoint;
		if(rootLayout){
			midPoint = 0;
		}else{// 父节点居中显示
			midPoint = treeNode._getChildrenCenter(tree);
        	midPoint -= tree._getNodeSize(treeNode) / 2;// 定位元素的左边
		}
        leftSibling = treeNode._getLeftSibling();
        if (leftSibling != null) {// 不是兄弟节点中第一个节点，即起始位置节点
            treeNode.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling)
                    + tree.config.iSiblingSeparation;
            treeNode.modifier = treeNode.prelim - midPoint;// 当前节点的本层的定位与根据子元素计算定位之间的差距
            ECOTree._apportion(tree, treeNode, level);// 有左兄弟且有子层有子树的才需要
        } else {// 兄弟节点中第一个节点
        	treeNode.prelim = midPoint;
        }
    }
};

/**
 * 调整节点坐标 必须确保firstChild 和firstChildLeftNeighbor不为null，即有子节点并且子节点存在左邻居
 * 
 * @param {} tree
 * @param {} treeNode
 * @param {} level
 */
ECOTree._apportion = function(tree, treeNode, level) {
    var firstChild = treeNode._getFirstChild();// 第一个孩子节点
    var firstChildLeftNeighbor = firstChild.leftNeighbor;// 孩子节点的左节点
    var j = 1;
    for (var k = tree.config.iMaxDepth - level; firstChild != null
            && firstChildLeftNeighbor != null && j <= k;) {
        var modifierSumRight = 0;
        var modifierSumLeft = 0;
        var rightAncestor = firstChild;// 右侧节点祖先
        var leftAncestor = firstChildLeftNeighbor;// 左侧节点祖先
        for (var l = 0; l < j; l++) {
            rightAncestor = rightAncestor.nodeParent;
            leftAncestor = leftAncestor.nodeParent;
            modifierSumRight += rightAncestor.modifier;
            modifierSumLeft += leftAncestor.modifier;
        }

        var totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft
                + tree._getNodeSize(firstChildLeftNeighbor) + tree.config.iSubtreeSeparation)
                - (firstChild.prelim + modifierSumRight);
        if (totalGap > 0) {
            var subtreeAux = treeNode;
            var numSubtrees = 0;
            
            for (; subtreeAux != null && subtreeAux != leftAncestor; subtreeAux = subtreeAux
                    ._getLeftSibling())
                numSubtrees++;

            if (subtreeAux != null) {
                var subtreeMoveAux = treeNode;
                var singleGap = totalGap / numSubtrees;
                for (; subtreeMoveAux != leftAncestor; subtreeMoveAux = subtreeMoveAux
                        ._getLeftSibling()) {
                    subtreeMoveAux.prelim += totalGap;
                    subtreeMoveAux.modifier += totalGap;
                    totalGap -= singleGap;
                }

            }
        }
        j++;
        if (firstChild._getChildrenCount() == 0)
            firstChild = tree._getLeftmost(treeNode, 0, j);
        else
            firstChild = firstChild._getFirstChild();
        if (firstChild != null)
            firstChildLeftNeighbor = firstChild.leftNeighbor;
    }
};

/**
 * 第二次遍历树节点 调整节点坐标
 * 
 * @param {} tree 树
 * @param {} node 节点
 * @param {} level 所处的位置
 * @param {} X x坐标
 * @param {} Y y坐标
 */
ECOTree._secondWalk = function(tree, node, level, X, Y) {
    if (level <= tree.config.iMaxDepth) {
        var xTmp = tree.rootXOffset + node.prelim + X;
        var yTmp = tree.rootYOffset + Y;
        var maxsizeTmp = 0;
        var nodesizeTmp = 0;
        var flag = false;

        switch (tree.config.iRootOrientation) {
            case ECOTree.RO_TOP :
            case ECOTree.RO_BOTTOM :
                maxsizeTmp = tree.maxLevelHeight[level];
                nodesizeTmp = node.height;
                break;

            case ECOTree.RO_RIGHT :
            case ECOTree.RO_LEFT :
                maxsizeTmp = tree.maxLevelWidth[level];
                flag = true;
                nodesizeTmp = node.width;
                break;
        }
        switch (tree.config.iNodeJustification) {
            case ECOTree.NJ_TOP :
                node.XPosition = xTmp;
                node.YPosition = yTmp;
                break;

            case ECOTree.NJ_CENTER :
                node.XPosition = xTmp;
                node.YPosition = yTmp + (maxsizeTmp - nodesizeTmp) / 2;
                break;

            case ECOTree.NJ_BOTTOM :
                node.XPosition = xTmp;
                node.YPosition = (yTmp + maxsizeTmp) - nodesizeTmp;
                break;
        }
        if (flag) {
            var swapTmp = node.XPosition;
            node.XPosition = node.YPosition;
            node.YPosition = swapTmp;
        }
        switch (tree.config.iRootOrientation) {
            case ECOTree.RO_BOTTOM :
                node.YPosition = -node.YPosition - nodesizeTmp;
                break;

            case ECOTree.RO_RIGHT :
                node.XPosition = -node.XPosition - nodesizeTmp;
                break;
        }
        //该处扩展代码，只支持左右排列，主要是调整高度小的节点
        if(node.adjustH){
        	node.YPosition += node.adjustH / 2;
        }
        
        //当上下排列时，求树每层最大x坐标，当左右排列时，求树每层最大y坐标
        switch (tree.config.iRootOrientation) {
            case ECOTree.RO_TOP :
            case ECOTree.RO_BOTTOM :
                if(!tree.treeLevelMaxX[level]){
                	tree.treeLevelMaxX[level] = 0;
                }
                if(node.XPosition > tree.treeLevelMaxX[level]){
                	tree.treeLevelMaxX[level] = node.XPosition;
                }
                break;

            case ECOTree.RO_RIGHT :
            case ECOTree.RO_LEFT :
                if(!tree.treeLevelMaxY[level]){
                	tree.treeLevelMaxY[level] = 0;
                }
                if(node.YPosition > tree.treeLevelMaxY[level]){
                	tree.treeLevelMaxY[level] = node.YPosition;
                }
                break;
        }
    
        if (node._getChildrenCount() != 0){
            ECOTree._secondWalk(tree, node._getFirstChild(), level + 1, X + node.modifier, Y
                            + maxsizeTmp + tree.config.iLevelSeparation);
        }
        var rightSibling = node._getRightSibling();
        if (rightSibling != null){
            ECOTree._secondWalk(tree, rightSibling, level, X, Y);
        }//console.log(node,node.XPosition);
    }
};
//改动2013-11
/**
 * 根据节点类型，返回节点填充颜色
 * 
 * @param {} nodeType 1生产企业，2批发企业，3第三方物流 企业，4其他
 * @param {} nodeType 1生产企业，2批发企业，3零售企业，4医疗机构，5代理机构，6未入网企业
 */
ECOTree._getNodeColor = function(nodeType) {
    nodeType = nodeType || '';
    var nodeColor;
    switch (nodeType) {
        case '1' :
            nodeColor = '#B2DA7E';
            break;
        case '2' :
            nodeColor = '#84B0DD';
            break;
        case '3' :
            nodeColor = '#A992BE';
            break;
        case '4' :
            nodeColor = '#EA956D';
            break;
        case '5' :
            nodeColor = '#EA956D';
            break;
        case '6' :
            nodeColor = '#EA956D';
            break;
        default :
            nodeColor = '#B2DA7E';
    }
    return nodeColor;
};
//改动2013-11
/**
 * 根据节点类型返回节点所对应的样式
 * @param {} nodeType 1生产企业，2批发企业，3第三方物流 企业，4其他
 * @param {} nodeType 1生产企业，2批发企业，3零售企业，4医疗机构，5代理机构，6未入网企业
 * @return {}
 */
ECOTree._getNodeClass = function(nodeType) {
    nodeType = nodeType || '';
    var nodeClass;
    switch (nodeType) {
        case '1' :
            nodeClass = 'green';
            break;
        case '2' :
            nodeClass = 'blue';
            break;
        case '3' :
            nodeClass = 'purple';
            break;
        case '4' :
            nodeClass = 'orange';
            break;
        case '5' :
            nodeClass = 'daili';
            break;
        case '6' :
            nodeClass = 'weiruw';
            break;
        default :
            nodeClass = 'orange';
    }
    return nodeClass;
};

/**
 * 根据节点流入类型返回节点边框颜色，目前有：1正常出库、2退货、3没有出库有入库
 * 
 * @param {} nodeInflowType
 * @return {}
 */
ECOTree.prototype._getNodeBorderColor = function(nodeInflowType) {
    nodeInflowType = nodeInflowType || 1;
    var nodeBorderColor = this.config.nodeBorderColor;
//    switch (nodeInflowType) {
//        case 1 :
//            nodeBorderColor = '#11A709';
//            break;
//        case 2 :
//            nodeBorderColor = '#ED1C24';
//            break;
//        case 3 :
//            nodeBorderColor = '#0072BC';
//            break;
//        default :
//            nodeBorderColor = '#11A709';
//    }
    switch (nodeInflowType) {
		case 2:
		    nodeBorderColor = '#cc66cc';
			break;
		case 4:
		    nodeBorderColor = '#ff9933';
			break;
	}
    return nodeBorderColor;
};

/**
 * 返回线的颜色
 * @param {} node
 * @return {}
 */
ECOTree._getLineColor = function(node) {
//	if(node.levelFirstNode){//如果是每层第一个节点，则返回颜色#FF9000
//		return '#FF9000';
//	}
    var nodeInflowType = parseInt(node.nodeInflowType) || 0,
        lineColor;
    switch (nodeInflowType) {
        case 0:
		    lineColor = '#cccccc';
			break;
	    case 1 :
            lineColor = '#11A709';
            break;
        case 2 :
            lineColor = '#cc66cc';
            break;
        case 3 :
            lineColor = '#0066ff';
            break;
        case 4 :
            lineColor = '#ff9933';
            break;
        default :
            lineColor = '#11A709';
    }
    return lineColor;
};

/**
 * 根据节点流向返回箭头图标
 * @param {} node
 * nodeInflowType 1:正常出库，2：退货，3：没有出库有入库
 * @return {}
 */
ECOTree._getLineArrows = function(node) {
    var nodeInflowType = parseInt(node.nodeInflowType) || 1,
        arrowsIcon;
    switch (nodeInflowType) {
        case 1 :
            arrowsIcon = 'arrows-green.png';
            break;
        case 2 :
            arrowsIcon = 'arrows-purple';
            break;
        case 3 :
            arrowsIcon = 'arrows-blue.png';
            break;
        case 4 :
            arrowsIcon = 'arrows-orange';
            break;
        default :
            arrowsIcon = 'arrows-green.png';
    }
    return arrowsIcon;
};
/*ECOTree._getNotUploaded = function(node) {
    var notUploaded = node.notUploaded || false;
    return notUploaded;
};*/

ECOTree._getNodeInflowType = function(node) {
    var nodeInflowType = node.nodeInflowType || 1;
    return nodeInflowType;
};

/**
 * 调整树节点的坐标位置
 */
ECOTree.prototype._positionTree = function() {
    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
    ECOTree._firstWalk(this.self, this.root, 0);

    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP :
        case ECOTree.RO_LEFT :
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition;
            break;

        case ECOTree.RO_BOTTOM :
        case ECOTree.RO_RIGHT :
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition;
    }

    ECOTree._secondWalk(this.self, this.root, 0, 0, 0);
    
    //标识每层第一个节点
    var setLevleFirstNode = function (node){
    	var firstChild = node._getFirstChild();
    	if(firstChild){
    		firstChild.levelFirstNode = true;//设置每层第一个节点
    		setLevleFirstNode(firstChild);
    	}
    };
    this.root.levelFirstNode = true;
    setLevleFirstNode(this.root);
};


/**
 * 设置每层的高度
 * 
 * @param {} node
 * @param {} level
 */
ECOTree.prototype._setLevelHeight = function(node, level) {
    if (this.maxLevelHeight[level] == null)
        this.maxLevelHeight[level] = 0;
    if (this.maxLevelHeight[level] < node.height)
        this.maxLevelHeight[level] = node.height;
};

/**
 * 设置每层的宽度
 * 
 * @param {} node
 * @param {} level
 */
ECOTree.prototype._setLevelWidth = function(node, level) {
    if (this.maxLevelWidth[level] == null)
        this.maxLevelWidth[level] = 0;
    if (this.maxLevelWidth[level] < node.width)
        this.maxLevelWidth[level] = node.width;
};

/**
 * 设置每个节点的左右兄弟或邻居节点
 * 
 * @param {} node
 * @param {} level
 */
ECOTree.prototype._setNeighbors = function(node, level) {
    node.leftNeighbor = this.previousLevelNode[level];
    if (node.leftNeighbor != null)
        node.leftNeighbor.rightNeighbor = node;
    this.previousLevelNode[level] = node;
};

/**
 * 返回节点的大小
 * 
 * @param {} node
 * @return {Number}
 */
ECOTree.prototype._getNodeSize = function(node) {
    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP :
        case ECOTree.RO_BOTTOM :
            return node.width;

        case ECOTree.RO_RIGHT :
        case ECOTree.RO_LEFT :
            return node.height;
    }
    return 0;
};

/**
 * 返回最大maxlevel的节点
 * 
 * @param {} node
 * @param {} level
 * @param {} maxlevel
 * @return {}
 */
ECOTree.prototype._getLeftmost = function(node, level, maxlevel) {
    if (level >= maxlevel)
        return node;
    if (node._getChildrenCount() == 0)
        return null;

    var n = node._getChildrenCount();
    for (var i = 0; i < n; i++) {
        var iChild = node._getChildAt(i);
        var leftmostDescendant = this._getLeftmost(iChild, level + 1, maxlevel);
        if (leftmostDescendant != null)
            return leftmostDescendant;
    }

    return null;
};

ECOTree.prototype._selectNodeInt = function(dbindex, flagToggle) {
    if (this.config.selectMode == ECOTree.SL_SINGLE) {
        if ((this.iSelectedNode != dbindex) && (this.iSelectedNode != -1)) {
            this.nDatabaseNodes[this.iSelectedNode].isSelected = false;
        }
        this.iSelectedNode = (this.nDatabaseNodes[dbindex].isSelected && flagToggle) ? -1 : dbindex;
    }
    this.nDatabaseNodes[dbindex].isSelected = (flagToggle)
            ? !this.nDatabaseNodes[dbindex].isSelected
            : true;
};

ECOTree.prototype._collapseAllInt = function(flag) {
    var node = null;
    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if (node.canCollapse)
            node.collapsed = flag;
    }
    this.updateTree();
};

ECOTree.prototype._selectAllInt = function(flag) {
    var node = null;
    for (var k = 0; k < this.nDatabaseNodes.length; k++) {
        node = this.nDatabaseNodes[k];
        node.isSelected = flag;
    }
    this.iSelectedNode = -1;
    this.updateTree();
};

/**
 * 画树
 * 
 * @return {}
 */
ECOTree.prototype._drawTree = function() {
    var s = [];
    var node = null;
    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if (!node._isAncestorCollapsed()) {
            s.push(this._drawNodeUseDiv(node, n));
            s.push(node._drawChildrenLinks(this.self));
        }
    }
    return s.join('');
};

/**
 * 画节点
 * @param {} node 节点
 * @param {} nodeIndex 节点序号
 */
ECOTree.prototype._drawNodeUseDiv = function(node, nodeIndex) {
	
	var nodeZoomClass,nodeZoomReturnClass="";
	
	switch (this.zoom) {
        case 1 :
        	nodeZoomClass = 'big_box';
            break;
        case 0.8 :
        	nodeZoomClass = 'mid_box';
            break;
        case 0.5 :
        	nodeZoomClass = 'small_box';
			nodeZoomReturnClass = 'back_small_box rounde';
            break;
    }   
    var s = [];
	
	//改动2013-11 2014-4
	if((node.nodeInflowType==2 || node.nodeInflowType==4) && this.obj=='traceGraphic1'){//退货显示的节点
	    switch(this.config.iRootOrientation)
		{	
			case ECOTree.RO_LEFT:
				var hzoom = this.zoom<0.8 ? 0.7 : 1.3;
				var yTop = this.zoom<0.8 ? node.YPosition : (node.YPosition + node.height/2*hzoom);
				s.push('<div id="' + node.id + '" class="back_box ' + nodeZoomReturnClass + ' ' + ECOTree._getNodeClass(node.nodeType) +'" ');
				s.push('style="position:absolute; top:' + yTop + 'px; left:' + node.XPosition + 'px;" ');
				s.push('onclick="javascript:ECOTree._canvasNodeClickShowLineHandler(\'' + this.obj + '\',\'' + node.id + '\',\''
						+ node.pid + '\',\'' + nodeIndex + '\');"');
				s.push('>');
				if(this.zoom<0.8){
					s.push('<div class="back_box_info">查看路径</div>');
				}
				s.push('</div>');	
				break;	
			case ECOTree.RO_RIGHT:
				s.push('<div id="' + node.id + '" class="' + nodeZoomClass + ' rounde ' + ECOTree._getNodeClass(node.nodeType) +'" ');
				s.push('style="position:absolute; top:' + node.YPosition + 'px; left:' + node.XPosition + 'px;" ');
				s.push('>');
				s.push('<div class="box_info clearfix">');
				s.push('<b></b>');
				s.push('<p title=' + node.companyName + '>' + node.companyName + '</p>');
				s.push('</div>');
				s.push('<div class="tel_info clearfix">');
				s.push('<div class="float_l">');
				s.push('<i>' + (node.isRoot ? '生产量' : '入库') + '</i>');
				s.push('<h1>' + node.storage + (node.returnList==1 ? '<span class="icon_return" onclick="javascript:ECOTree._canvasReturnShow(event, \'' + this.obj + '\',\''+ node.id +'\',\''+ nodeIndex+'\');"><img src="../images/icon_ru.gif" /></span>' : '') + '</h1>');
				s.push('</div>');
				s.push('<div class="float_r">');
				s.push('<i class="tr">出库</i>');
				s.push('<h2>' + node.exwarehouse + (node.returnList==2 ? '<span class="icon_return" onclick="javascript:ECOTree._canvasReturnShow(event, \'' + this.obj + '\',\''+ node.id +'\',\''+ nodeIndex+'\',true);"><img src="../images/icon_chu.gif" /></span>' : '') + '</h2>');
				s.push('</div>');
				s.push('</div>');
				s.push('</div>');		
				break;	
		}
		
	}else{
		s.push('<div id="' + node.id + '" class="' + nodeZoomClass + ' rounde ' + ECOTree._getNodeClass(node.nodeType) +'" ');
		s.push('style="position:absolute; top:' + node.YPosition + 'px; left:' + node.XPosition + 'px;" ');
		s.push('>');
		s.push('<div class="box_info clearfix">');
		s.push('<b></b>');
		if(this.obj=='traceGraphic1'){
			clickFuc=' onclick="javascript:ECOTree._canvasPopShow(\'' + this.obj + '\',\''+ node.id +'\');" style="cursor:pointer;"';
		}else{clickFuc=' onclick="javascript:void(0);"';}
		s.push('<p title="' + node.companyName + '"' + clickFuc + '>' + node.companyName + '</p>');
		s.push('</div>');
		s.push('<div class="tel_info clearfix">');
		s.push('<div class="float_l">');
		s.push('<i>' + (node.isRoot ? '生产量' : '入库') + '</i>');
		s.push('<h1>' + node.storage + (node.returnList==1 ? '<span class="icon_return" onclick="javascript:ECOTree._canvasReturnShow(event, \'' + this.obj + '\',\''+ node.id +'\',\''+ nodeIndex+'\');"><img src="../images/icon_ru.gif" /></span>' : '') + '</h1>');
		s.push('</div>');
		s.push('<div class="float_r">');
		s.push('<i class="tr">出库</i>');
		s.push('<h2>' + node.exwarehouse + (node.returnList==2 ? '<span class="icon_return" onclick="javascript:ECOTree._canvasReturnShow(event, \'' + this.obj + '\',\''+ node.id +'\',\''+ nodeIndex+'\',true);"><img src="../images/icon_chu.gif" /></span>' : '') + '</h2>');
		s.push('</div>');
		s.push('</div>');
		s.push('</div>');	
	}
    

    // 折叠图标
    var adjustX = jQuery.boxModel ? 8 : 0;
    if (this.obj=='traceGraphic1' && node.canCollapse) {
        s.push('<div ');
        s.push('style="z-index:1;position:absolute; top:'
                + (node.YPosition + node.height / 2 - this.config.expandedIconH / 2) + 'px; left:'
                + (node.XPosition + node.width + adjustX) + 'px;" ');
        s.push('>');
        s.push('<a href="javascript:ECOTree[\'' + this.obj +'\'].collapseNode(\'' + nodeIndex + '\', true);" >');
        s.push('<img border=0 src="'
                + ((node.collapsed) ? this.config.collapsedImage : this.config.expandedImage)
                + '" >');
        s.push('</a>');
        s.push('</div>');
    }

    // 线上显示的入库数量
    var arrowsOffset = this.config.arrowsOffset;//箭头偏移量
    s.push('<div id="line_num_' + node.id + '" ');
	switch(this.config.iRootOrientation)
	{	
		case ECOTree.RO_LEFT:
			top1 = node.YPosition + node.height / 2 * 0.9 + arrowsOffset - this.line.pen.weight * 3;
			left1 = node.XPosition - this.config.iLevelSeparation / 2;
			top2 = node.YPosition + node.height / 2 * 0.6 + arrowsOffset - this.line.pen.weight * 3;
			left2 = left1;
			break;	
		case ECOTree.RO_RIGHT:
			top1 = node.YPosition + node.height / 2 * 0.9 + arrowsOffset - this.line.pen.weight * 3;
			left1 = node.XPosition + node.width + arrowsOffset/2 ;
			top2 = node.YPosition + node.height / 2 * 0.6 + arrowsOffset - this.line.pen.weight * 3;
			left2 = left1;		
			break;	
	}
	if(node.nodeInflowType==2 || node.nodeInflowType==4){
		s.push('style="position:absolute; top:' + top2 + 'px; left:' + left2 + 'px;" ');
	}else{
		s.push('style="position:absolute; top:' + top1 + 'px; left:' + left1 + 'px;" ');
	}
    s.push('>');
    if (node.nodeParent && node.nodeParent.id != -1) {
    	if(this.scale > 0){//不是最小一级则显示数字
    		s.push(node.parentExwarehouse);
    	}
    }
    s.push('</div>');

    return s.join('');
};

/**
 * 创建画布html，把节点转换为html格式
 * 
 * @return {}
 */
ECOTree.prototype._creatHTML = function() {
    var s = [];

    // 首先调整各节点位置
    this._positionTree();

    // 计算画布的高度和宽度
    var width = 0, height = 0;
    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP :
        case ECOTree.RO_BOTTOM :
            for (var i = 0; i < this.treeLevelMaxX.length; i++) {
            	if(width < this.treeLevelMaxX[i]){
            		width = this.treeLevelMaxX[i];
            	}
            }
            width += this.config.defaultNodeWidth;
            height = (this.maxLevelHeight.length - 1) * (this.config.iLevelSeparation + this.config.defaultNodeHeight);
            break;

        case ECOTree.RO_LEFT :
        case ECOTree.RO_RIGHT :
            for (var i = 0; i < this.treeLevelMaxY.length; i++) {
            	if(height < this.treeLevelMaxY[i]){
            		height = this.treeLevelMaxY[i];
            	}
            }
            height += this.config.defaultNodeHeight;
            width = (this.maxLevelWidth.length - 1) * (this.config.iLevelSeparation + this.config.defaultNodeWidth);
			break;
    }
    
    s.push(this._drawTree());

    return s.join('');
};

// 初始化鼠标移到节点上显示的数据
ECOTree.prototype._initNodeTip = function(){
	if (!this.tipTemplate) {
        var t = [];
        t.push('<div class="{0}" ');
        t.push('>');
        t.push('<div class="txt">{1}</div>');
        t.push('<table width="100%" border="0" cellspacing="0" cellpadding="0">');
        t.push('<tr><th>归属地：</th><td style="text-align: left;line-height:30px;">{2}</td></tr>');
        t.push('<tr><th>入库总量：</th><td><b class="zs bo">{3}</b></td></tr>');
        t.push('<tr><th>库存总量：</th><td><b class="zs bo">{4}</b></td></tr>');
        t.push('<tr><th>出库总量：</th><td><b class="zs bo">{5}</b></td></tr>');
        t.push('</table>');
        t.push('</div>');
        this.tipTemplate = t.join('');
    }
};
/**
 * 显示节点提示信息
 * @param {} nodeIndex
 */
ECOTree.prototype._showNodeTip = function(nodeIndex, x, y) {
	if(this.showNodeTip === false){
	    var viewportWidth, viewportHeight;
	    var documentbody = document.documentElement ? document.documentElement : document.body;
	    viewportWidth = documentbody.clientWidth;
        viewportHeight = documentbody.clientHeight;
        var node = this.nDatabaseNodes[nodeIndex],
            tipWidth = 295,
            tipHeight = 246,
            adjustXY = 10;

        if ((x + tipWidth) > viewportWidth) {
            x = x - tipWidth;
        }
	    
	    if ((y + tipHeight) > viewportHeight){
	    	y = y - tipHeight;
	    }
	    
		//根据节点id加载节点提示数据，这里先用测试数据
	    var tipClass = this.zoom < 0.8 ? 'tips2' : 'tips';
		var nodeTipData = [tipClass, node.companyName, node.location, node.storage, node.inventory,node.exwarehouse];
	    var tipHtml = ECOSupport.format(this.tipTemplate,nodeTipData);
		this.nodeTip.style.visibility = 'visible';
		this.nodeTip.style.top = y + adjustXY + 'px';
		this.nodeTip.style.left = x + adjustXY + 'px';
		
		this.nodeTip.innerHTML = tipHtml;
		this.showNodeTip = true;
	}	
};
/**
 * 隐藏节点提示信息
 */
ECOTree.prototype._hideNodeTip = function(){
	this.nodeTip.style.visibility = 'hidden';
	this.showNodeTip = false;
};
/**
 * 显示详细信息
 * @param {} nodeIndex
 */
ECOTree.prototype._showPopTree = function(nodeid){
	if(this.showPopTree === false){
		ECOSupport.mask();
		var thisTree=this;
	    var viewportWidth, viewportHeight;
	    var documentbody = document.documentElement ? document.documentElement : document.body;
	    viewportWidth = documentbody.clientWidth;
        viewportHeight = documentbody.clientHeight;
        var popWidth = '80%',
            popHeight = '80%',
            adjustX = '6%',
            adjustY = '10%';
				
		this.popTree.style.visibility = 'visible';
		this.popTree.style.top =  adjustX;
		this.popTree.style.left =  adjustY;
		this.popTree.style.width =  popWidth;
		this.popTree.style.height =  popHeight;
		if(this.popTree.offsetWidth>680){this.popTree.style.width='680px'}
		this.popTree.style.left = (viewportWidth - this.popTree.offsetWidth) / 2 + 'px';
		
		this.popTree.children[0].onclick=function(){thisTree._hidePopTree();};
		var htmlPage='index-pop.html';
		var popHtml='<iframe id="poptree_iframe" width="680px" height="100%" src="" scrolling="no" frameborder="0" style="position:relative;"></iframe>';
		this.popTree.children[1].innerHTML = popHtml;
		document.getElementById('poptree_iframe').src = htmlPage;
		this.showPopTree = true;
	}	
}
/**
 * 隐藏详细信息
 */
ECOTree.prototype._hidePopTree = function(){
	this.popTree.children[1].innerHTML = '';
	this.popTree.style.visibility = 'hidden';
	this.showPopTree = false;
	ECOSupport.unmask();
};
/**
 * 显示节点退货列表
 * @param {} tree
 * @param {} nodeId
 * @param {} nodeIndex
 * @param {} x
 * @param {} y
 * @param {} type true退回library或退至warehouse
 */
ECOTree.prototype._showReturnTip = function(tree, nodeid, nodeIndex, x, y, type) {
	var returnNodeName= type ? "returnL_" : "returnW_";
	var spanId=returnNodeName+nodeIndex+'list_arrow';
	var returnNodeList=document.getElementById(returnNodeName+nodeIndex);
	if(!returnNodeList){
        var node = this.nDatabaseNodes[nodeIndex];
		//根据节点id加载节点提示数据，这里先用测试数据
		var xRu = this.zoom < 0.9 ? 50 : 50;
		var xChu = this.zoom < 0.9 ? 125 : 190;
		var adjustY = this.zoom < 0.9 ? 106 : 127;
        if (x) { x = x;}	    
	    if (y){ y = y + adjustY;}
		if(type){
		    //出库 
			var x1=xChu;
			nodeid='a9923abd28664a4985b86de1e03246f7';//动态时不需要设置
		    var returnArray=[{
				'nodeid':'6d95c16fd7ce43f1a2aafac31326b7a0',
				'nodepid':nodeid,
				'nodeIndex':151,
				'storage':'200',
				'companyName':'上海九州通医药有限公司'
			}];
		}else{
		//入库
			var x1=xRu;
		    nodeid='6d95c16fd7ce43f1a2aafac31326b7a0';//动态时不需要设置
			var returnArray=[{
				'nodeid':nodeid,
				'nodepid':'a9923abd28664a4985b86de1e03246f7',
				'nodeIndex':151,
				'storage':'500',
				'companyName':'无锡星洲医药有限公司'
			},{
				'nodeid':nodeid,
				'nodepid':'5665771',
				'nodeIndex':195,
				'storage':'400',
				'companyName':'上海万众医院'
			}];
		}
		//展开下一级效果测试数据
		/*if(type){
		    //出库 
			var x1=xChu;
			nodeid='260d0ef006d84d99bb5ef2ba963cefea';//动态时不需要设置
		    var returnArray=[{
				'nodeid':'2eb9e565c61f4b56adc807de558866eb',
				'nodepid':nodeid,
				'nodeIndex':167,
				'storage':'10',
				'companyName':'江苏康生药业有限公司'
			}];
		}else{
		//入库
			var x1=xRu;
		    nodeid='2eb9e565c61f4b56adc807de558866eb';//动态时不需要设置
			var returnArray=[{
				'nodeid':nodeid,
				'nodepid':'260d0ef006d84d99bb5ef2ba963cefea',
				'nodeIndex':167,
				'storage':'10',
				'companyName':'江苏华晓医药物流有限公司'
			}];
		}*/
		var t = [];
        t.push('<div class="return_list">');
		t.push('<span class="return_list_arrow" id="'+spanId+'"></span>');
        /*t.push('<span class="return_list_close" onclick="javascript:ECOTree._canvasReturnHide(\''+this.obj+'\',\''+nodeIndex+'\'');
		if(type){
			t.push(', \'' + type + '\'');
		}
		t.push(');">close</span>');*/
        t.push('<ul>');
		for(var i=0; i<returnArray.length; i++){
			t.push('<li><input type="button" class="return_list_btn" value="" onclick="javascript:ECOTree._canvasNodeClickShowLineHandler(\'' + this.obj + '\',\'' + returnArray[i].nodeid + '\',\''
            + returnArray[i].nodepid + '\',\'' + returnArray[i].nodeIndex + '\');" />');
			if(type){
				t.push(' 退货出库 <em>' + returnArray[i].storage + '</em> 至' + returnArray[i].companyName +'</li>');
			}else{
				t.push(' 退货入库 <em>' + returnArray[i].storage + '</em> 从' + returnArray[i].companyName +'</li>');
			}
		}
        t.push('</ul>');
        t.push('</div>');
		var tHtml=t.join('');
		
		var returnTip=document.createElement("div");
		tree.elm.appendChild(returnTip);		
		returnTip.innerHTML = tHtml;
		returnTip.id=returnNodeName+nodeIndex;
		
		returnTip.style.visibility = 'visible';
		returnTip.style.position='absolute';
		returnTip.style.zIndex='100000000';
		returnTip.style.top = y  + 'px';
		returnTip.style.left = x + 'px';
		document.getElementById(spanId).style.left = x1 + 'px';
	}else if(returnNodeList.style.visibility=='hidden'){
		returnNodeList.style.visibility = 'visible';
	}
};
/**
 * 隐藏节点提示信息
 */
ECOTree.prototype._hideReturnTip = function(nodeIndex,type){
	if(type){
	    var returnNodeName="returnL_";
	}else{
		var returnNodeName="returnW_";
	}
	document.getElementById(returnNodeName+nodeIndex).style.visibility = 'hidden';
};




// ECOTree API begins here...

ECOTree.prototype.updateTree = function(animate) {
	
    // 缩放后设置参数大小  
    //this.config.iLevelSeparation = parseInt(ECOTree.LEVEL_SEPARATION * this.zoom);
    //this.config.iSiblingSeparation = parseInt(ECOTree.SIBLING_SEPARATION * this.zoom);
    this.config.iSubtreeSeparation = parseInt(ECOTree.SUBTREE_SEPARATION * this.zoom);
    this.config.defaultLineWeight = parseInt(ECOTree.DEFAULT_LINE_WEIGHT * this.zoom);
	//修改节点高宽度
	switch(this.config.iRootOrientation)
	{	
		case ECOTree.RO_LEFT:
			switch (this.zoom) {
				case 1 :
					this.config.defaultNodeWidth = 208;
					this.config.defaultNodeHeight = 115;
					this.config.arrowsOffset = 42;
					this.config.exwarehouseOffset = 55;
					this.config.topYAdjustment = -75;
					this.config.iLevelSeparation = ECOTree.LEVEL_SEPARATION;
					break;
				case 0.8 :
					this.config.defaultNodeWidth = 142;
					this.config.defaultNodeHeight = 94;
					this.config.arrowsOffset = 38;
					this.config.exwarehouseOffset = 50;
					if(this.obj=='traceGraphic1'){
						this.config.topYAdjustment = -50;
					}else{
						this.config.topYAdjustment = 154;
					}
					this.config.iLevelSeparation = ECOTree.LEVEL_SEPARATION;
					break;
				case 0.5 :
					this.config.defaultNodeWidth = 43;
					this.config.defaultNodeHeight = 43;
					this.config.arrowsOffset = 10;
					this.config.exwarehouseOffset = 20;
					this.config.topYAdjustment = -55;
					this.config.iLevelSeparation = ECOTree.LEVEL_SEPARATION - 20;
					break;
			}
		    break;
		case ECOTree.RO_RIGHT:
		//修改节点高宽度
			switch (this.zoom) {
				case 0.8 :
					this.config.defaultNodeWidth = 142;
					this.config.defaultNodeHeight = 94;
					this.config.arrowsOffset = 38;
					this.config.exwarehouseOffset = 50;
					this.config.topYAdjustment = -500;
					this.config.iLevelSeparation = ECOTree.LEVEL_SEPARATION;
					break;
			}
		    break;
	}
    
    
    this.line.setLineWeight(this.config.defaultLineWeight);
	//改动2013-11
	if($(".backnode_box").length>0){
		var nodeid=$(".backnode_box").eq(0).attr('id');
		var nodepid=$(".backnode_box").eq(1).attr('id');
	}
    //设置线箭头大小
    this.line.setArrowsSize(this.zoom);
	this.elm.innerHTML = this._creatHTML();	
	if(nodeid){
		ECOTree._canvasNodeClickShowLineHandler(this.obj, nodeid ,nodepid, this.iSelectedNode, true); 
		//ECOTree._canvasReturnShow(event, this.obj, nodepid, pNode.dbIndex);
	}
    //处理动画效果
    if(animate === true){
    	this.elm.style.display = 'none';
    	this.nodeFx();
    }
    ECOSupport.unmask();
};

/**
 * 动画效果
 * @ param fxType
 */
ECOTree.prototype.nodeFx = function(fxType){
	var fxType = fxType || 'show', element = this.elm,
        nodes = element.children,
        len = nodes.length,
        root = this.root,
        firstChildNode,
        firstRowNodes = [];
        
    for (var i = 0; i < len; i++) {
		nodes[i].style.display = 'none';
    }
    element.style.display = 'block';
    
    //首先显示第一行数据节点
    firstChildNode = root._getFirstChild();
    while(firstChildNode){
    	firstRowNodes.push(firstChildNode);
    	firstChildNode = firstChildNode._getFirstChild();
    }
    
    var fx = function(firstRowNodes, nodes){
    	var doc = document,
    	    pross,
            counter = 0,
            len = nodes.length,
            rowNodesL = firstRowNodes.length,
            nodeId,
            step = 0,
            finished = {},
            node;
    	
    	var innerFn = function(){
    		if(!nodes[counter]){
    			clearInterval(pross);
    			return;
    		}
    		if(step < rowNodesL){//先动画第一行
    			nodeId = firstRowNodes[step++].id;
    			$(doc.getElementById(nodeId))[fxType](800);
    			$(doc.getElementById('exw_' + nodeId))[fxType](800);
    			//$(doc.getElementById('mid_' + nodeId))[fxType](800);
    			$(doc.getElementById('sto_' + nodeId))[fxType](800);
    			$(doc.getElementById('arrows_sto_' + nodeId))[fxType](800);
    			$(doc.getElementById('line' + nodeId))[fxType](800);
    			finished[nodeId] = true;
    		}else{
    			node = nodes[counter];
    			//if(!finished[node.id]){//判断是否已动画过
    				$(node)[fxType](800);
    			//}else{
    				//$(nodes[++counter]).fadeIn(800);
    			//}
    			counter++;	
    		}
    		
    		//nodes[counter].style.display = 'block';
    		
    	};
    	pross = setInterval(innerFn, 10);
    };
	
    fx(firstRowNodes, nodes);
};

/**
 * 初始化缩放因子，目前支持3级缩放
 * this.scaleFactors = [0.5, 0.8, 1];
 */
ECOTree.prototype.scaleFactor = (function() {
    return function(sacle) {
        if (sacle === 'in') {// 放大
            this.scale++;
        } else if (sacle === 'out') {// 缩小
            this.scale--;
        }
        if (this.scale > 2) {
            this.scale = 2;
        }
        if (this.scale < 0) {
            this.scale = 0;
        }
        return this.scale;
    };
})();

ECOTree.prototype.initScaleFactor = function(zoom) {
    switch (zoom) {
        case 0.5 :
            this.scale = 0;
            break;
        case 0.8 :
            this.scale = 1;
            break;
        case 1 :
            this.scale = 2;
            break;
    }
};
/**
 * 画布的缩放
 * 
 * @param {} sacle 放大还是缩小，in放大、out缩小
 */
//改动2013-11
ECOTree.prototype.canvasZoom = function(sacle) {
    var scaleFactor = this.scaleFactor(sacle);
    var zoom = this.scaleFactors[scaleFactor];// 目前缩放比例

    if (sacle == 'in' && !this.blowUp) {
        return;
    }
    if (sacle == 'out' && !this.reduce) {
        return;
    }
    this.zoom = zoom;
    this.blowUp = scaleFactor != 2;// 等于2则不能再放大
    this.reduce = scaleFactor != 0;// 等于0则不能再缩小
	//this.iSelectedNode=-1;
    this.updateTree();
};


/**
 * 添加一个节点
 * 
 * @param conf 配置项 为object对象 conf 参数有
 * @param {} id 节点id 必设置项
 * @param {} pid 父节点id 必设置项
 * @param {} width 节点宽度
 * @param {} height 节点高度
 * @param {} target
 * @param {} metadata
 * 
 * @param {} storage 入库
 * @param {} exwarehouse 出库
 * @param {} companyName 公司名称
 * @param {} companyId 公司id
 * 
 * @param {} nodeType 节点类型，目前包括S、P、J、Q、、
 * @param {} nodeInflowType 节点流入类型，目前有：1.正常出库，2.退货，3.出入库不符
 * @param {} nodeInflowLineDesc
 * @param {} collapsed 是否折叠
 * @param {} showHeader 是否显示表头，入库信息
 * 
 * 以下根据节点类型和节点流入类型计算
 * @param {} nodeColor 节点颜色
 * @param {} nodeBorderColor 节点边框颜色
 */
ECOTree.prototype.add = function(conf) {
	if(!conf || typeof conf != 'object'){
		return null;
    }
    conf.width = conf.width || this.config.defaultNodeWidth;
    conf.height = conf.height || this.config.defaultNodeHeight;
    if(conf.showHeader === false || conf.nodeInflowType == 2){//生产企业或者退回企业不显示表头
    	//conf.height -= 25;
    	//conf.adjustH = 25;
    }else{
    	conf.showHeader = true;//默认为true
    }
    conf.metadata = (typeof conf.metadata != 'undefined') ? conf.metadata : '';

    // 扩展数据
    conf.storage = (typeof conf.storage != 'undefined') ? conf.storage : 0;// 入库
    conf.exwarehouse = (typeof conf.exwarehouse != 'undefined') ? conf.exwarehouse : 0;// 出库
    conf.companyName = (typeof conf.companyName != 'undefined') ? conf.companyName : '';// 公司名称
    conf.companyId = (typeof conf.companyId != 'undefined') ? conf.companyId : '';// 公司id

    conf.nodeType = (typeof conf.nodeType != 'undefined') ? conf.nodeType : '1';
	// 节点类型，目前包括'1','生产企业','2','批发企业','3','零售单位','4','卫生医疗机构','5','代理企业','6','未入网企业'
    conf.nodeInflowType = (typeof conf.nodeInflowType != 'undefined') ? conf.nodeInflowType : 0;
	// 节点流入类型，目前有：1 正常出库、2 退货、3 没有出库有入库
    conf.nodeInflowLineDesc = (typeof conf.nodeInflowLineDesc != 'undefined')
            ? conf.nodeInflowLineDesc
            : '';// 流入线上面显示的内容
    conf.collapsed = (typeof conf.collapsed != 'undefined') ? (conf.collapsed == 'true' ? true : false) : false;// 是否折叠
	   
    conf.nodeColor = ECOTree._getNodeColor(conf.nodeType);
    conf.nodeBorderColor = this._getNodeBorderColor(conf.nodeInflowType);

    var pnode = null; // Search for parent node in database
    if (conf.pid == -1) {
        pnode = this.root;
    } else {
        for (var k = 0; k < this.nDatabaseNodes.length; k++) {
            if (this.nDatabaseNodes[k].id == conf.pid) {
                pnode = this.nDatabaseNodes[k];
                break;
            }
        }
    }
	
    var node = new ECONode(conf); 
    if(pnode == null){
    	throw new Error('对不起，您查询的数据不完整！[ ID：' + node.pid + ']');
    	//throw new Error('[' + node.location +'] [企业Id：' + node.id + '] 数据不完整！');
    }
    
    node.nodeParent = pnode; // Set it's parent
    pnode.canCollapse = true; // It's obvious that now the parent can collapse
    var i = this.nDatabaseNodes.length; // Save it in database
    node.dbIndex = this.mapIDs[conf.id] = i;
    this.nDatabaseNodes[i] = node;
    var h = pnode.nodeChildren.length; // Add it as child of it's parent
    node.siblingIndex = h;
    pnode.nodeChildren[h] = node;
    
    return node;
};

/**
 * 添加多个节点
 * @param {} nodeData
 */
ECOTree.prototype.addAll = function(nodeData) {
	//清空之前的数据
	this.clearData();
    if (nodeData && Object.prototype.toString.apply(nodeData) == '[object Array]') {
        nodeData[0].isRoot = true;
        nodeData[0].pid = -1;
        this.add(nodeData[0]);
        for (var i = 1; i < nodeData.length; i++) {
            this.add(nodeData[i]);
        }
    }
};

/**
 * 清空数据
 */
ECOTree.prototype.clearData = function() {
	this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
    this.treeLevelMaxX = [];
    this.treeLevelMaxY = [];
    this.nDatabaseNodes = [];
    this.mapIDs = {};
    
	//清空时，需要重新初始化this.root
    this.root = new ECONode({
        id : -1,
        pid : null,
        width : 2,
        height : 2
    });
};

/**
 * 查找节点
 * 
 * @param {} companyName
 */
ECOTree.prototype.searchNodes = function(companyName) {
    var node = null;
    var sm = (this.config.selectMode == ECOTree.SL_SINGLE);

    if (typeof companyName == "undefined")
        return;
    if (companyName == "")
        return;

    var found = false;
    var n = 0;
    
    //首先删除上一次查询的高亮
    if(this.iLastSearch){
    	var lastNode = this.nDatabaseNodes[this.iLastSearch];
    	$('#'+lastNode.id).removeClass('hightlight');
    }
    
    for (; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if (node.companyName.indexOf(companyName) != -1) {
        	if(node._isAncestorCollapsed()){
        		node._setAncestorsExpanded();
        		this.updateTree();
        	}
            //this._selectNodeInt(node.dbIndex, false);
            found = true;
        }
        if (sm && found) {
            this.iLastSearch = n;
            break;
        }
    }
    
    //处理结点高亮显示
    $('#'+node.id).addClass('hightlight');
    return node;
};

/**
 * 根据公司名称查询节点列表
 * @param {String} companyName 公司名称
 * @param {Number} num 列表显示的行数
 */
ECOTree.prototype.searchNodeList = function(companyName, num) {
	if (typeof companyName == "undefined" || companyName == ""){
    	return;
    }
    var node,
    	list1 = [],
    	list2 = [],
    	_repeat = {};

    var step = 0;
    
    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        if (step > num) {
            break;
        }
        node = this.nDatabaseNodes[n];
        if (node.companyName.indexOf(companyName) == 0) {
        	if(!_repeat[node.companyName]){
        		_repeat[node.companyName] = true;
        		list1.push(node.companyName);
            	step++;
        	}
        } else if (node.companyName.indexOf(companyName) != -1) {
        	if(!_repeat[node.companyName]){
        		list2.push(node.companyName);
        		_repeat[node.companyName] = true;
            	step++;
        	}
        }
    }
    
    return list1.concat(list2);
};

/**
 * 选择所有节点
 */
ECOTree.prototype.selectAll = function() {
    if (this.config.selectMode != ECOTree.SL_MULTIPLE)
        return;
    this._selectAllInt(true);
};

/**
 * 取消已选择的所有节点
 */
ECOTree.prototype.unselectAll = function() {
    this._selectAllInt(false);
};

/**
 * 折叠所有节点
 */
ECOTree.prototype.collapseAll = function() {
    this._collapseAllInt(true);
};

/**
 * 展开所有节点
 */
ECOTree.prototype.expandAll = function() {
    this._collapseAllInt(false);
};

/**
 * 折叠节点
 * 
 * @param {} nodeIndex 节点index，用来唯一标示节点
 * @param {} upd
 */
//改动2013-11
ECOTree.prototype.collapseNode = function(nodeIndex, upd) {
    this.nDatabaseNodes[nodeIndex].collapsed = !this.nDatabaseNodes[nodeIndex].collapsed;
    if (upd){
    	ECOSupport.mask();
    	var me = this;
		me.iSelectedNode=-1;
    	setTimeout(function() {
            me.updateTree();
        }, 1000);
        
    }
};

/**
 * 选择节点
 * 
 * @param {} nodeid
 * @param {} upd
 */
ECOTree.prototype.selectNode = function(nodeid, upd) {
    this._selectNodeInt(this.mapIDs[nodeid], true);
    if (upd)
        this.updateTree();
};

/**
 * 设置节点标题
 * 
 * @param {} nodeid
 * @param {} title
 * @param {} upd
 */
ECOTree.prototype.setNodeTitle = function(nodeid, title, upd) {
    var dbindex = this.mapIDs[nodeid];
    this.nDatabaseNodes[dbindex].dsc = title;
    if (upd)
        this.updateTree();
};

/**
 * 设置节点数据
 * 
 * @param {} nodeid
 * @param {} meta
 * @param {} upd
 */
ECOTree.prototype.setNodeMetadata = function(nodeid, meta, upd) {
    var dbindex = this.mapIDs[nodeid];
    this.nDatabaseNodes[dbindex].meta = meta;
    if (upd)
        this.updateTree();
};

/**
 * 设置节点目标元素
 * 
 * @param {} nodeid
 * @param {} target
 * @param {} upd
 */
ECOTree.prototype.setNodeTarget = function(nodeid, target, upd) {
    var dbindex = this.mapIDs[nodeid];
    this.nDatabaseNodes[dbindex].target = target;
    if (upd)
        this.updateTree();
};

/**
 * 设置节点填充颜色
 * 
 * @param {} nodeid
 * @param {} color
 * @param {} border
 * @param {} upd
 */
ECOTree.prototype.setNodeColors = function(nodeid, color, border, upd) {
    var dbindex = this.mapIDs[nodeid];
    if (color)
        this.nDatabaseNodes[dbindex].c = color;
    if (border)
        this.nDatabaseNodes[dbindex].bc = border;
    if (upd)
        this.updateTree();
};

/**
 * 获取选择的节点
 * 
 * @return {}
 */
ECOTree.prototype.getSelectedNodes = function() {
    var node = null;
    var selection = [];
    var selnode = null;

    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if (node.isSelected) {
            selnode = {
                "id" : node.id,
                "dsc" : node.dsc,
                "meta" : node.meta
            };
            selection[selection.length] = selnode;
        }
    }
    return selection;
};