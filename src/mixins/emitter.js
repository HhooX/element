function broadcast(componentName, eventName, params) {
  this.$children.forEach(child => {
    var name = child.$options.componentName;

    if (name === componentName) {
      child.$emit.apply(child, [eventName].concat(params));
    } else {
      broadcast.apply(child, [componentName, eventName].concat([params]));
    }
  });
}
export default {
  methods: {
    // dispatch函数是不停的向上去遍历父节点并且通过$emit去触发事件，到达根节点之后停止。
    // 找到这个组件指定的父组件
    // 使用vm.$emit触发这个父组件的事件（包括自定义事件）
    // 其中的componentName是element组件自定义的一个属性
    dispatch(componentName, eventName, params) { // 向上循环查找父元素并且派发事件，解决单纯使用$parent的跨级问题
      var parent = this.$parent || this.$root;// 找到组件的父组件，或者这个组件本就是根组件。
      var name = parent.$options.componentName;// 获取到组件的componentName的值

      while (parent && (!name || name !== componentName)) {
        // 只要parent为true,并且有name为false，或者name和componentName不全等，就一直循环。
        parent = parent.$parent;// 获取上一层组件实例对象

        if (parent) {// 如果上层组件存在，重新将上层组件的componentName的值赋值给他
          name = parent.$options.componentName;
        }
      }
      if (parent) {
        parent.$emit.apply(parent, [eventName].concat(params));
      }
    },
    // broadcast函数是不停的去遍历子节点并且通过$emit去触发事件，直到所有的子节点遍历完成之后停止。
    broadcast(componentName, eventName, params) {
      broadcast.call(this, componentName, eventName, params);
    }
  }
};
