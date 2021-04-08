<template>
  <transition name="el-alert-fade">

    <!-- 
      typeClass：根据传入的type控制样式
      center: 根据传入的center控制内容是否居中
      role：无障碍网页应用,读屏软件会用到
     -->
    <div
      class="el-alert"
      :class="[typeClass, center ? 'is-center' : '', 'is-' + effect]"
      v-show="visible"
      role="alert"
    >
      <!-- 
        showIcon: 控制是否显示icon
        iconClass: 根据传入的type动态控制icon的样式
        isBigIcon： 如果传入了description（辅助性文字）或者 插槽内传入了内容 则显示大icon
$slots.default ： 获取所有匿名插槽分发的内容
       -->
      <i class="el-alert__icon" :class="[ iconClass, isBigIcon ]" v-if="showIcon"></i>
      <div class="el-alert__content">
        <!-- 如果传入了description（辅助性文字）或者 传入了匿名插槽 则显示加粗title -->
        <span class="el-alert__title" :class="[ isBoldTitle ]" v-if="title || $slots.title">
        <!-- 传入插槽内容则显示插槽内容 未传入默认显示slot内的内容description -->
          <slot name="title">{{ title }}</slot>
        </span>  
        <!-- 
          closable: 是否显示关闭按钮，默认显示
          closeText： 关闭按钮自定义文字，无显示X有显示文字
         -->
       
        <p class="el-alert__description" v-if="$slots.default && !description"><slot></slot></p>
        <p class="el-alert__description" v-if="description && !$slots.default">{{ description }}</p>
        <i class="el-alert__closebtn" :class="{ 'is-customed': closeText !== '', 'el-icon-close': closeText === '' }" v-show="closable" @click="close()">{{closeText}}</i>
      </div>
    </div>
  </transition>
</template>

<script type="text/babel">
  const TYPE_CLASSES_MAP = {
    'success': 'el-icon-success',
    'warning': 'el-icon-warning',
    'error': 'el-icon-error'
  };
  export default {
    name: 'ElAlert',

    props: {
      title: {
        type: String,
        default: ''
      },
      description: {
        type: String,
        default: ''
      },
      // 接收主题 computed里会根据不同type返回对应的样式
      type: {
        type: String,
        default: 'info'
      },
      closable: {
        type: Boolean,
        default: true
      },
      // 关闭按钮自定义文字
      closeText: {
        type: String,
        default: ''
      },
      showIcon: Boolean,
      center: Boolean,
      effect: {
        type: String,
        default: 'light',
        validator: function(value) {
          return ['light', 'dark'].indexOf(value) !== -1;
        }
      }
    },

    data() {
      return {
        visible: true
      };
    },

    methods: {
      close() {
        this.visible = false;
        this.$emit('close');
      }
    },

    computed: {
      typeClass() {
        return `el-alert--${ this.type }`;
      },

      iconClass() {
        return TYPE_CLASSES_MAP[this.type] || 'el-icon-info';
      },

      isBigIcon() {
        return this.description || this.$slots.default ? 'is-big' : '';
      },

      isBoldTitle() {
        return this.description || this.$slots.default ? 'is-bold' : '';
      }
    }
  };
</script>
