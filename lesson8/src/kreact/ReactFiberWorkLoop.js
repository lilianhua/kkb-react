//根节点

import {
  updateFragmentComponent,
  updateFunctionComponent,
  updateHostComponent,
} from "./ReactFiberReconciler";
import {scheduleCallback, shouldYield} from "./scheduler";
import {isStringOrNumber, isFn, Placement, Update, updateNode} from "./utils";

// wip work in progress 当前正在工作当中的
let wipRoot = null;
// 将要更新的下一个fiber节点;
let nextUnitOfWork = null;

// 处理更新
export function scheduleUpdateOnFiber(fiber) {
  fiber.alternate = {...fiber};
  wipRoot = fiber;
  wipRoot.sibling = null;

  nextUnitOfWork = wipRoot;

  scheduleCallback(workLoop);
}

// 协调
function performUnitOfWork(wip) {
  // * 1. 更新自己
  // todo 原生标签 函数组件 类组件等
  const {type} = wip;
  if (isFn(type)) {
    updateFunctionComponent(wip);
  } else if (isStringOrNumber(type)) {
    // 原生标签
    updateHostComponent(wip);
  } else {
    // fragment
    updateFragmentComponent(wip);
  }

  // * 2. 返回下一个要更新的fiber
  // 深度优先遍历
  // 王朝的故事
  if (wip.child) {
    return wip.child;
  }

  let next = wip;
  while (next) {
    if (next.sibling) {
      return next.sibling;
    }
    next = next.return;
  }
  return null;
}

function workLoop() {
  while (nextUnitOfWork && !shouldYield()) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  //提交
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
}

// requestIdleCallback(workLoop);

// 提交
function commitRoot() {
  commitWorker(wipRoot.child);
}

// 找父dom节点
function getParentNode(fiber) {
  let next = fiber.return;
  while (!next.stateNode) {
    next = next.return;
  }

  return next.stateNode;
}
function commitWorker(fiber) {
  if (!fiber) {
    return;
  }
  const {flags, stateNode} = fiber;

  // 父dom节点
  // 所有fiber都有dom节点吗 0
  let parentNode = getParentNode(fiber); //fiber.return.stateNode;
  // 1.提交自己

  // 插入
  if (flags & Placement && stateNode) {
    parentNode.appendChild(stateNode);
  }

  // 更新属性
  if (flags & Update && stateNode) {
    updateNode(stateNode, fiber.alternate.props, fiber.props);
  }

  // 2.提交孩子
  commitWorker(fiber.child);
  // 3.提交下一个兄弟
  commitWorker(fiber.sibling);
}
