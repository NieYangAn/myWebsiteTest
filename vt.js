 // 计算同类元素的父元素
  function querySimEleParent(list) {
    var parentNode = undefined;
    var paramList = Array.prototype.slice.call(list);
    // list 可能有纵向三个、横向三个或纵横九个
    // 遍历第一个元素的parent
    while(paramList[0] && paramList[0].parentNode) {
      // 遍历list里的元素
      var hasSameParent = true;
      for (var x = 0; x < paramList.length; x ++) {
        // 必须全部都等时，才是最终的parent
        for (var y = 1; y < paramList.length - 1; y ++) {
          if (paramList[x].parentNode !== paramList[y].parentNode) {
            hasSameParent = false;
          }
        }
        if (hasSameParent) {
          parentNode = paramList[x].parentNode;
          return parentNode;
        }
      }

      for (var z = 0; z < paramList.length; z ++) {
        paramList[z] = paramList[z].parentNode;
      }
    }
    
    return parentNode;
  }

  // 查询同类元素参数路径
  function querySimEleParaPath(path, rangePath) {
    var orgPath = path;
    var lastPath = orgPath.indexOf(rangePath) === 0 ? orgPath.slice(rangePath.length) : undefined;
    var simEleParaChildPath = '';
    // 当埋点元素于range相同时，两个路径由于取法不同会出错，做同化处理
    if (lastPath === undefined) {
        while(orgPath.indexOf(":nth-of-type") !== -1) {
            if(document.querySelector(rangePath + orgPath.slice(orgPath.indexOf(":nth-of-type"))) && document.querySelector(rangePath + orgPath.slice(orgPath.indexOf(":nth-of-type"))).isEqualNode(document.querySelector(path))) {
                lastPath = orgPath.slice(orgPath.indexOf(":nth-of-type"));
                simEleParaChildPath = lastPath.slice(lastPath.indexOf(":nth-of-type") + 15);
                break;
            }
            orgPath = orgPath.slice(orgPath.indexOf(")") + 1);
        }
    } else {
        simEleParaChildPath = lastPath.slice(lastPath.indexOf(")") + 1);
    }

    return {
        simElePath: rangePath + simEleParaChildPath,
    };
  }

    // 查询同类元素路径
  function querySimilarElePath(el, queryParamRange) {
    // 原始路径
    var orgPath = queryCssPath(el);
    // 最右端":nth-of-type"之前的路径
    var firstPath = orgPath.slice(0, orgPath.lastIndexOf(":nth-of-type"));
    // 最右端":nth-of-type"之后的路径
    var lastPath = orgPath.slice(orgPath.lastIndexOf(")") + 1);
    var hasSimilarEles = false;

    //  最右端":nth-of-type()"内的数字
    // 路径内含有nth节点、不与自己进行比较、且这个路径下的元素是存在的
    if (orgPath.lastIndexOf(":nth-of-type") !== -1 && (document.querySelectorAll(firstPath+ lastPath).length) > 1) {
      hasSimilarEles = true;
    };

    while (firstPath.lastIndexOf(":nth-of-type") !== -1 && !hasSimilarEles) {
      firstPath = firstPath.slice(0, firstPath.lastIndexOf(":nth-of-type"));
      lastPath = orgPath.slice(firstPath.length).slice(orgPath.slice(firstPath.length).indexOf(")") + 1);
      if (document.querySelectorAll(firstPath + lastPath).length > 1) {
          hasSimilarEles = true;
          break;
      };
    }
    
    if (hasSimilarEles) {
        return queryParamRange ? firstPath : (firstPath + lastPath);
    }
    return undefined;
  }

  // 同级节点比较
  function compareSameLevelEl(el, selector) {
      var sameObj = {
          currNodeSite: 1,
          sameEls: [],
          uniqClass: "",
          sameClass: ""
      }
      // 所有兄弟节点
        var childElNode = el.parentNode ? el.parentNode.children : undefined;
      // 查询同类型兄弟节点
      var sameElNode = el.previousElementSibling;
      // 查询兄弟节点
      var sibElNode = el.previousElementSibling;
      // 兄弟节点所有类名
      var sibClasses = [];
      // 记录当前元素于所有兄弟节点的位置
      var thisElIndex = 0;
        // 当前选中元素class并去重
        var thisClass = Array.from(new Set(el.className.replace(AVOID_VT_CLASS, "").split(' ')));
      // 定位次元素在父类所有子元素的index
      for (var i = 0; i < childElNode.length; i++) {
          if (sibElNode) {
              thisElIndex++;
              sibElNode = sibElNode.previousElementSibling;
          }
      }

      // 遍历所有此元素的同类元素
      for (var i = 0; i < childElNode.length; i++) {
          // 当前元素父节点的所有子元素class
          var childClass = childElNode[i].className.replace(AVOID_VT_CLASS, "").split(' ');

          // 取除本身以外的所有sibling的类名
          if (thisElIndex !== i) {
              Array.prototype.push.apply(sibClasses, childClass);
          }

          // 记录所有同类型兄弟节点放入sameEls数组
          if (childElNode[i].nodeName.toLowerCase() === selector) {
              sameObj.sameEls.push(childElNode[i]);
          }
          // 定位此元素在同类元素中的位置   指定类型元素的第n个
          if (sameElNode && (sameElNode.nodeName.toLowerCase() === selector)) {
              sameObj.currNodeSite++;
              sameElNode = sameElNode.previousElementSibling;
          } else if (sameElNode) {
              sameElNode = sameElNode.previousElementSibling;
          }
      }

      for(var i = 0; i < thisClass.length; i++){
          if(thisClass[i]==''){
              thisClass.splice(i, 1);
              i--;
          }
      }

      sameObj.uniqClass = findAvailableClass(thisClass, sibClasses).uniq;
      sameObj.sameClass = findAvailableClass(thisClass, sibClasses).same;
      return sameObj;
  }

  // 选取类名: 类名唯一时取唯一类名，否则取重复类名
  function findAvailableClass(thClass, classes) {
      var className = {
          uniq: "",
          same: ""
      }

      // 对非法class名进行筛选，如果选中元素有合法类名取合法类名，若没有取非法类名
      // 例如class="123a bbb$ ccc"取"ccc";
      // class="123a bbb$"取最后一个非法类名;
      // 只有一个非法类名时取该非法类名
      var flag = new RegExp("^[0-9]|[~!@#$%^&*()\+=<>?:\"{}|,.\/;'\\[\]·~！@#￥%&*（）\+={}|《》？：“”【】、；‘'，。、]");
      for (var i = 0; i < thClass.length; i++) {
          // 当类名中含有非法类名，且不全为非法类名时，从类名数组中剔除；若全为非法类名（即被剃的只剩一个非法类名）时，取该（最后一个）非法类名
          if(flag.test(thClass[i]) && thClass.length > 1) {
              thClass.splice(i, 1);
              i--;
          }
      }

      for (var i = 0; i < thClass.length; i++) {
          if (thClass[i] !== "") {
              if (classes.indexOf(thClass[i]) !== -1) {
                  className.same = thClass[i];
              } else {
                  className.uniq = thClass[i];
              }
          }
      }

      return className;
  }

  // 从右往左遍历原数组，原数组打散，分到每个类型的节点数组里
  function splitOriginPathArr(originPathArr, objArr, pathArrsObj) {
      for (var i = originPathArr.length - 1; i >= 0; i--) {
          objArr[i] = {
              item: originPathArr[i],
              index: i
          }
          // 如果有id，必为首节点（外层进行了截断），有且只有一个
          if (originPathArr[i].indexOf("#") !== -1) {
              pathArrsObj.idNode.push(objArr[i]);
          } else if (originPathArr[i].indexOf(":nth-of-type") !== -1) {
              pathArrsObj.nthArr.push(objArr[i]);
          } else if (originPathArr[i].indexOf(".") !== -1) {
              pathArrsObj.classArr.push(objArr[i]);
          } else {
              pathArrsObj.nodeArr.push(objArr[i]);
          }
      }
  }

  // 判断前后两个节点的关系“  ”或“ > ”
  function confirmConnector(prevIndex, nextIndex) {
      return prevIndex === (nextIndex - 1) ? " > " : "  ";
  }

  // 将新路径数组拼接成字符串
  function concatNewPath(pathArr) {
      var newPath = pathArr[0] ? pathArr[0].item : "";
      for (var i = 0; i < pathArr.length - 1; i++) {
          newPath = newPath + confirmConnector(pathArr[i].index, pathArr[i + 1].index) + pathArr[i + 1].item
      }
      return newPath;
  }

  // nth节点是关键，且关联同类元素，须遍历完，因此可以抽出；之后的id、class、node是一边插入一边判断唯一后跳出，因此不做抽象
  // TODO: 给用户提供选择的余地，任一个nth节点的nth属性都可删除，每一条都进行圈选显示
  function buildNthNodesPath(pathArrsObj, leafNode, newPath, newPathArr) {
      // 有nth节点 且 nth数组的第一项不是叶子节点
      if (pathArrsObj.nthArr[0] && pathArrsObj.nthArr[0].index !== leafNode.index || !pathArrsObj.nthArr[0]) {
          newPathArr.unshift(leafNode);
      }

      // 循环将nth节点插进数组
      for (var i = 0; i < pathArrsObj.nthArr.length; i++) {
          newPathArr.unshift(pathArrsObj.nthArr[i]);
      }

      newPath = concatNewPath(newPathArr);
      return newPath
  }

  // 判断路径是否唯一 且 长度大于3
  function approvedSelectorPath(newPath) {
    var isRangeUniq = true;
    var arrOfNewPath = newPath.replace(/>/g, "").split("  ");

    // 初步判断如果有range，range路径的第一个元素是否唯一
    if(newPath.lastIndexOf(":nth-of-type") !== -1){
      isRangeUniq = document.querySelectorAll(newPath.slice(0, newPath.lastIndexOf(":nth-of-type")) + ":nth-of-type(1)").length === 1;
    } 
    return isRangeUniq && document.querySelectorAll(newPath).length === 1 && (arrOfNewPath.length >= 3);
}

  // 简化路径
  function simplifyPath(path) {
      // 根据原始path数组建立一个新数组
      var originPathArr = path.slice();
      // 用来记录名称和index的对象数组
      var objArr = [];
      // 新路径的数组对象，用来存放nth节点数组、class节点数组、node节点数组、id节点数组
      var pathArrsObj = {
          nthArr: [],
          classArr: [],
          nodeArr: [],
          idNode: []
      };
      // 返回的简化后的新路径
      var newPath = "";
      var newPathArr = []
      // 用来连接节点与节点之间的符号“  ”或“ > ”
      var connector = "";
      // 叶子节点
      var leafNode = {
          item: originPathArr[originPathArr.length - 1],
          index: originPathArr.length - 1
      };

      //如果叶子节点是id节点，直接取id
      if (leafNode && leafNode.item.indexOf("#") !== -1) {
          return newPath = path.join("");
      }

      // 从右往左遍历原数组，原数组打散，分到每个类型的节点数组里
      splitOriginPathArr(originPathArr, objArr, pathArrsObj);

      // 首轮链接叶子节点和nth节点
      newPath = buildNthNodesPath(pathArrsObj, leafNode, newPath, newPathArr);

      if (approvedSelectorPath(newPath)) {
          return newPath;
      };


      // 当原path提取nth-of-type后路径仍不唯一，需要往空隙间添加class节点或node节点

      // 插入id节点
      if (pathArrsObj.idNode.length > 0) {
          newPathArr.unshift(pathArrsObj.idNode[0]);
          newPath = concatNewPath(newPathArr);
          if (approvedSelectorPath(newPath)) {
              return newPath;
          };
      }

      var newPathArrForNode = newPathArr.slice();

      // 插入class节点
      for (var i = 0; i < pathArrsObj.classArr.length; i++) {
          // 与原节点位置进行比较，在适当位置插入
          for (var j = newPathArr.length - 1; j >= 0; j--) {
              if (pathArrsObj.classArr[i].index < newPathArr[j].index && (j === 0 || pathArrsObj.classArr[i].index > newPathArr[j - 1].index)) {
                  newPathArr.splice(j, 0, pathArrsObj.classArr[i])
              }
          }
          newPath = concatNewPath(newPathArr);
          if (approvedSelectorPath(newPath)) {
              return newPath;
          };
      }

      // 或插入node节点
      for (var i = 0; i < pathArrsObj.nodeArr.length; i++) {
          // 与原节点位置进行比较，在适当位置插入
          for (var j = newPathArrForNode.length - 1; j >= 0; j--) {
              if (pathArrsObj.nodeArr[i].index < newPathArrForNode[j].index && (j === 0 || pathArrsObj.nodeArr[i].index > newPathArrForNode[j - 1].index)) {
                  newPathArrForNode.splice(j, 0, pathArrsObj.nodeArr[i])
              }
          }
          newPath = concatNewPath(newPathArrForNode);
          if (approvedSelectorPath(newPath)) {
              return newPath;
          };
      }

      // 或插入class和node节点
      for (var i = 0; i < pathArrsObj.nodeArr.length; i++) {
          // 与原节点位置进行比较，在适当位置插入
          for (var j = newPathArr.length - 1; j >= 0; j--) {
              if (pathArrsObj.nodeArr[i].index < newPathArr[j].index && (j === 0 || pathArrsObj.nodeArr[i].index > newPathArr[j - 1].index)) {
                  newPathArr.splice(j, 0, pathArrsObj.nodeArr[i])
              }
          }
          newPath = concatNewPath(newPathArr);
          if (approvedSelectorPath(newPath)) {
              return newPath;
          };
      }

      // 如果仍不唯一，基本是body的子节点，直接用原路径
      newPath = path.join(" > ");
      return newPath;
  }

  // 查询css路径
  function queryCssPath(el) {
      var path = [];
      if (!(el instanceof Element)) {
          return;
      }

      while (el.nodeType === Node.ELEMENT_NODE) {
          var selector = el.nodeName.toLowerCase();

          if (el.id) {
              // 存在ID 直接返回ID作为首节点
              selector = '#' + el.id;
              path.unshift(selector);
              break;
          } else {
                var sameObj = compareSameLevelEl(el, selector)

                if (sameObj.uniqClass) {
                    selector += ('.' + sameObj.uniqClass);
                } else if (sameObj.sameEls.length > 1) {
                    if (sameObj.sameClass) {
                        selector += ('.' + sameObj.sameClass);
                  }
                    selector += (':nth-of-type(' + sameObj.currNodeSite + ')');
              }

              path.unshift(selector);
              el = el.parentNode;
          }
      }

      var pathStr = path.join(' > ');
        try{
            document.querySelectorAll(pathStr);
            // 当且仅当class内含有“\”时，document.querySelectorAll(pathStr).length === 0，直接抛异常。不然代码本身不抛
            if(document.querySelectorAll(pathStr).length === 0) {
              throw pathStr;
            }
            return simplifyPath(path);
        } catch (exp){
            throw pathStr;
        }
  };

  function queryUniqClass(selectors) {
    // 记录当前层的所有元素的className
    var allClass = [];
    // 用来记录是否有uniqClass
    var uniqClassCount = 0;
    var dynaDomList = [];
    var childHasOneChild = true;
    // 用来记录孩子的孩子的数组
    var childList = [];
    // 先遍历记录当前层的所有元素的className
    Array.prototype.forEach.call(selectors, function(item) {
      var thisClassList = item.classList;
      Array.prototype.push.apply(allClass, thisClassList);
      // 如果每个子元素没有子元素，或者子元素不止一个
      if (!item.children || (item.children && item.children.length !== 1)) {
        childHasOneChild = false;
        childList = [];
      } else if (item.children && item.children.length === 1) {
        childList.push(item.children[0]);
      }
    });
    // 再做一次遍历
    Array.prototype.forEach.call(selectors, function(item) {
      // 遍历每个元素的className
      // 同一个dom只记录该元素的第一个uniqclass
      var hasUniqClass = false;
      Array.prototype.forEach.call(item.classList, function(subItem) {
        // 拷贝一个allClass数组，查询数组中含有的当前元素的当前class是否唯一（只考虑唯一的情况才算uniq）
        var allClassCopy = Array.prototype.slice.call(allClass);
        allClassCopy.splice(allClass.indexOf(subItem), 1)
        // vt添加的样式class不能算在内
        if (!AVOID_VT_CLASS.test(subItem) && allClassCopy.indexOf(subItem) === -1 && !hasUniqClass) {
          hasUniqClass = true;
          dynaDomList.push({'class': subItem});
          createDynaMoveBlockList();
          dynaMoveBlockList[uniqClassCount].show();
          visualSelect._setMovePosition(item, dynaMoveBlockList[uniqClassCount].dom);
          dynaMoveBlockList[uniqClassCount].dom.setAttribute('class', item.nodeName.toLowerCase() + '_' + subItem);
          parentDom.appendChild(dynaMoveBlockList[uniqClassCount].dom);
          uniqClassCount ++;
        }
      })
    });
    if (!dynaDomList.length && childHasOneChild) {
      // 把子元素层的子元素（如果每个仅有一个子元素）代进去再算一遍
      return queryUniqClass(childList)
    } 
    return dynaDomList;
  }

  // 多选一 抓取动态class元素
  function grabDynaParam(range) {
      // 范围元素
      var rangeDom = document.querySelector(range);
      // 子元素数组
      var childDoms = rangeDom.children;
      // 先销毁已添加的小块dynaMoveBlock，否则一直点抓取无限添加
      dynaMoveBlockList.forEach(function(item, index){
        item._super.clean();
      })
      dynaMoveBlockList = [];
      while(childDoms.length === 1) {
        childDoms = childDoms[0].children;
      }
      return queryUniqClass(childDoms);
  }

    /**
   * if element is out of param range
   * @param {*} element element
   * @note element is out of similar element param range
   */
  function isOutOfSimEleRange(element) {
    while (element) {
        if (element.classList) {
            for(var i = 0; i < element.classList.length; i++) {
                if(element.classList[i].indexOf("dtm-web-visual-sim-elePara-range") !== -1) {
                    return false;
                }
            }
        }
      element = element.parentNode;
    }
  
    return true;
  }
