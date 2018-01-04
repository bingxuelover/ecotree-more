# ecotree-more

ecotree基础上实现更多功能：缩放、弹出、线条追溯等

# Demo入口

- examples\index.html

# 文档说明

- 其中js文件ECOLine.js、ECONode.js、ECOTree.js分别用来生成追溯图线、节点和树，是追溯图的核心类。
- ECOSupport.js提供了一些工具类方法，而TraceGraphic.js封装实例化追溯图类，并提供了生成追溯图的接口、其他辅助功能的实现。
- traceGraphic-all-debug.js和traceGraphic-all.js是打包后的js文件。

# 核心算法与方法

追溯图的实现是基于ECOTree实现的，核心算法参考ECOTree本身提供的算法，在这基础上，扩展了jQuery插件jQuery.traceGraphic，其主要API为：

## 插件的主要API

- createTraceContainer：创建追溯图容器
- loadTrace：加载追溯图
- doZoom：缩放追溯图
- fullScreen：全屏显示
- graphicResize：追溯图自适应处理，即改变窗口大小时会调用该方法

## ECOTree组件中主要API

- ECOTree：构造函数，用法 var traceGraphic = new ECOTree(obj, canvas, nodeTip);
- addAll：一次性添加多个节点，对应的方法为add（一次性添加一个节点） updateTree：更新显示追溯图，该方法中有一个参数，如果设为true则显示动画效果
