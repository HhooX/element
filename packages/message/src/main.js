import Vue from 'vue';
import Main from './main.vue';
import { PopupManager } from 'element-ui/src/utils/popup';
import { isVNode } from 'element-ui/src/utils/vdom';
// FEAT 2.1 创建构造器。通过组件构造器的方式Vue.extend()注册组件而不是Vue.component()，extend的优势在于可以深度自定义，比如插入到具体哪个dom中；接着，用一个函数包裹着这个组件实例，暴露给Vue的原型方法上；
let MessageConstructor = Vue.extend(Main);

let instance;
let instances = []; // 存放当前未close的message
let seed = 1;

// Message的初始化方法
// 这段代码引入之前的组件文件，通过Vue.extend(Main)生成一个组件构建器，同时声明一个Message方法，挂载到Vue.prototype.$message上；
// Message内部首先对传入的配置做了兼容，如果传入的是字符串this.$message("测试")，就转变成这种形式：
// options = {
//   message: '传入的字符串'
// };

// 如果传入的配置是对象的话，就依据上面的组件构建器创建一个新的实例，并将用户自定义的配置传入到实例的参数中：
// instance = new MessageConstructor({
//   data: options
// });

const Message = function(options) {
  // 当前 Vue 实例是否运行于服务器
  if (Vue.prototype.$isServer) return;
  options = options || {};
  if (typeof options === 'string') {
    options = {
      message: options
    };
  }
  let userOnClose = options.onClose;// 外界传递进来的关闭方法
  let id = 'message_' + seed++;// 弹窗ID，每次增加，保证唯一性
  // [重写options.onClose]注册关闭事件,在main.vue中触发close事件，调用这里的onClose
  options.onClose = function() {
    Message.close(id, userOnClose);
  };
  //  FEAT 2.2 创建实例
  instance = new MessageConstructor({ // 创建message对象，main.vue中的data,被options覆盖
    data: options // Message的参数options会作为data传递给main.vue组件里的 data
  });
  instance.id = id;
  // message可以支持VNode。判断instance.message是不是虚拟节点。如果是vnode节点，直接将其赋值到instance.$slots.default上即可。
  if (isVNode(instance.message)) {
    instance.$slots.default = [instance.message];
    instance.message = null;
  }

  //  FEAT 2.3 之后，将这个实例挂载
  instance.$mount(); // dom挂载。当挂载的时候会执行main.vue里的mounted里的方法
  document.body.appendChild(instance.$el); // 在body上添加弹出message
  let verticalOffset = options.offset || 20; // 获取传入的据顶端的偏移量，默认为20
  instances.forEach(item => {
    verticalOffset += item.$el.offsetHeight + 16; // 根据现在有多少个message弹出计算实际位置。添加mesagge到dom后，当有新message时，它的verticalOffset是前面所有message的高加16
  });
  instance.verticalOffset = verticalOffset; // 给实例赋值据顶端偏移
  instance.visible = true; // 显示message
  // css z-index层级叠加，覆盖之前已出现但还未close的message
  instance.$el.style.zIndex = PopupManager.nextZIndex();
  instances.push(instance); // 将实例对象放入instances数组

  // 返回实例
  return instance;
};

// FEAT 3 message不同状态。给Message增加四个直接调用的方法。 支持this.$message.success('xxx')方式调用，等同于this.$message({type: 'success',message: 'xxx'})
// 为单独调用的方式，绑定初始化事件。如：Message.success(options)
['success', 'warning', 'info', 'error'].forEach(type => {
  Message[type] = options => {
    if (typeof options === 'string') {
      options = {
        message: options
      };
    }
    options.type = type;
    return Message(options);
  };
});

// 弹窗的关闭事件
// 组件的close方法中调用onClose再调该方法
Message.close = function(id, userOnClose) {
  let len = instances.length;
  let index = -1;
  let removedHeight;
  for (let i = 0; i < len; i++) {
    if (id === instances[i].id) { // 通过id找到该message实例
      removedHeight = instances[i].$el.offsetHeight;
      index = i;
      if (typeof userOnClose === 'function') {
        userOnClose(instances[i]);
      }
      instances.splice(i, 1); // 移除message实例
      break;
    }
  }
  if (len <= 1 || index === -1 || index > instances.length - 1) return;
  for (let i = index; i < len - 1 ; i++) {
    let dom = instances[i].$el;
    dom.style['top'] =
      parseInt(dom.style['top'], 10) - removedHeight - 16 + 'px';
  }
};

// 关闭所有的消息提示弹窗
Message.closeAll = function() {
  for (let i = instances.length - 1; i >= 0; i--) {
    instances[i].close();
  }
};

export default Message;

