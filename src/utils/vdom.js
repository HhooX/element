import { hasOwn } from 'element-ui/src/utils/util';
// node是对象，并且有componentOptions属性，我们就认为它是个vnode节点。
export function isVNode(node) {
  return node !== null && typeof node === 'object' && hasOwn(node, 'componentOptions');
};
