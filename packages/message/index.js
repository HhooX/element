import Message from './src/main.js';
export default Message;



// 入口文件是packages/message/index.js，它引入里src/main.js【挂载到Vue实例上】，而src/main.vue才是message组件的本身，当我们调用this.$message("..")时，组件就会弹出

// 使用方法：
// ①【单独引入】import { Message } from 'element-ui';调用 Message(options) 或 我们也为每个 type 定义了各自的方法，如 Message.success(options)。并且可以调用 Message.closeAll() 手动关闭所有实例。
// ②【全局】this.$message 会返回当前 Message 的实例。如果需要手动关闭实例，可以调用它的 close 方法。