<template>
  <transition name="el-message-fade" @after-leave="handleAfterLeave">
    <div
      :class="[
        'el-message',
        type && !iconClass ? `el-message--${ type }` : '',
        center ? 'is-center' : '',
        showClose ? 'is-closable' : '',
        customClass
      ]"
      :style="positionStyle"
      v-show="visible"
      @mouseenter="clearTimer"
      @mouseleave="startTimer"
      role="alert"> 
      <i :class="iconClass" v-if="iconClass"></i>
      <i :class="typeClass" v-else></i>
      <slot>
        <p v-if="!dangerouslyUseHTMLString" class="el-message__content">{{ message }}</p>
        <p v-else v-html="message" class="el-message__content"></p>
      </slot>
      <!--  FEAT 4 可手动关闭  -->
      <i v-if="showClose" class="el-message__closeBtn el-icon-close" @click="close"></i>
    </div>
  </transition>
</template>

<script type="text/babel">
  const typeMap = {
    success: 'success',
    info: 'info',
    warning: 'warning',
    error: 'error'
  };

  export default {
    data() {
      // 需要传入组件内的配置项并不是通过props传入的，这些配置都写在data中了，那怎么实现将配置项传入到组件中呢？这就需要看main.js的了
      return {
        visible: false,
        message: '', //消息文字
        duration: 3000, //显示时间, 毫秒。设为 0 则不会自动关闭
        type: 'info', //主题   可选值success/warning/info/error
        iconClass: '', //自定义图标的类名，会覆盖 type
        customClass: '', //自定义类名
        onClose: null, //onClose参数，它的作用是关闭弹窗时的回调, 参数为被关闭的 message 实例
        showClose: false, //是否显示关闭按钮
        closed: false,
        verticalOffset: 20, //Message 距离窗口顶部的偏移量
        timer: null,
        dangerouslyUseHTMLString: false, //允许确认框内容为html格式（message为HTML字符串）。message 属性虽然支持传入 HTML 片段，但是在网站上动态渲染任意 HTML 是非常危险的，因为容易导致 XSS 攻击。因此在 dangerouslyUseHTMLString 打开的情况下，请确保 message 的内容是可信的，永远不要将用户提交的内容赋值给 message 属性。
        center: false //文字是否居中
      };
    },

    computed: {
      // 根据type返回对应的图标类名
      typeClass() {
        return this.type && !this.iconClass
          ? `el-message__icon el-icon-${ typeMap[this.type] }`
          : '';
      },
      positionStyle() {
        return {
          'top': `${ this.verticalOffset }px`
        };
      }
    },

    watch: {
      closed(newVal) {
        if (newVal) {
          this.visible = false;
        }
      }
    },

    methods: {
      handleAfterLeave() {
        this.$destroy(true);
        this.$el.parentNode.removeChild(this.$el);
      },

      close() {
        // TODO为什么通过watch，而不是直接在close里加 visible = false
        this.closed = true;
        // 在data中初始化onClose为null，当我们需要这个回调时，onClose就为函数了，此时在关闭的时候调用this.onClose(this)，同时，我们将message实例传入到函数中，方便使用者进行更多自定义的操作。
        if (typeof this.onClose === 'function') {
          this.onClose(this);
        }
      },

      clearTimer() {
        clearTimeout(this.timer);
      },

      startTimer() {
        if (this.duration > 0) {
          this.timer = setTimeout(() => {
            if (!this.closed) {
              this.close();
            }
          }, this.duration);
        }
      },
      keydown(e) {
        if (e.keyCode === 27) { // esc关闭消息，element-plus有优化
          if (!this.closed) {
            this.close();
          }
        }
      }
    },
    mounted() {
      // FEAT 1、定时消失
      this.startTimer();
      document.addEventListener('keydown', this.keydown);
    },
    beforeDestroy() {
      document.removeEventListener('keydown', this.keydown);
    }
  };
</script>
