<template>
  <div
    class="el-steps"
    :class="[
       !simple && 'el-steps--' + direction,
       simple && 'el-steps--simple'
     ]">
      <slot></slot>
  </div>
</template>

<script>
import Migrating from 'element-ui/src/mixins/migrating';

export default {
  name: 'ElSteps',

  mixins: [Migrating], // TODO 用于开发环境下控制台提示一些迁移或者即将修改的属性和方法的。

  props: {
    space: [Number, String], //每个 step 的间距，不填写将自适应间距。支持百分比。
    active: Number, //设置当前激活步骤
    direction: {  //显示方向
      type: String,
      default: 'horizontal'
    },
    alignCenter: Boolean, //进行居中对齐
    simple: Boolean, //	是否应用简洁风格。设置 simple 可应用简洁风格，该条件下 align-center / description / direction / space 都将失效。
    finishStatus: { //设置结束步骤的状态
      type: String,
      default: 'finish'
    },
    processStatus: { //设置当前步骤的状态
      type: String,
      default: 'process'
    }
  },

  data() {
    return {
      steps: [], //记录步骤数数组
      stepOffset: 0
    };
  },

  methods: {
    //  属性迁移
    getMigratingConfig() {
      return {
        props: {
          'center': 'center is removed.'
        }
      };
    }
  },

  watch: {
    // 当前激活步骤改变时，触发父组件的change方法，将改变前和改变后的步骤作为参数传递出去
    active(newVal, oldVal) {
      this.$emit('change', newVal, oldVal)
    },

    steps(steps) {
      steps.forEach((child, index) => {
        child.index = index;
      });
    }
  }
};
</script>
