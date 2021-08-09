<template>
  <form class="el-form" :class="[
    labelPosition ? 'el-form--label-' + labelPosition : '',
    { 'el-form--inline': inline }
  ]">
  <!-- 主要内容是以slot插入的 -->
    <slot></slot>
  </form>
</template>
<script>
/* 关于校验：
1.各表单组件里（如input），this.dispatch 来自于mixins中的emitter，作用是不断查找和判断父组件是否是ElFormItem，找到之后就在这个父组件上$emit("el.form.blur", ...)，然后ElFormItem通过监听el.form.blur事件来校验。
2.el-form-item：根据校验规则做验证，控制显示错误信息
通过mounted内监听事件（el.form.blur）进行真正的校验；同时也通过dispatch把自己保存在el-form里面，方便el-form对整个表单validate。
3.el-form：设置form的数据对象和校验规则，以及主动触发对
表单进行校验。
*/
  import objectAssign from 'element-ui/src/utils/merge';

  export default {
    name: 'ElForm',

    componentName: 'ElForm',

    provide() {
      return {
        // el-form通过下面的方式实现了在它的子组件里面能够通过this.elForm来访问el-form的功能。比如 FormItem 用来获取校验的数据和规则
        elForm: this
      };
    },

    props: {
      model: Object,//表单数据对象
      rules: Object, //自定义表单验证规则	
      labelPosition: String, //表单域标签的位置，如果值为 left 或者 right 时，则需要设置 label-width
      labelWidth: String, //表单域标签的宽度，例如 '50px'。作为 Form 直接子元素的 form-item 会继承该值。支持 auto。
      labelSuffix: {  //表单域标签的后缀	
        type: String,
        default: ''
      },
      inline: Boolean, //行内表单模式	
      inlineMessage: Boolean,
      statusIcon: Boolean, //是否在输入框中显示校验结果反馈图标	
      showMessage: { //是否显示校验错误信息	
        type: Boolean,
        default: true
      },
      size: String, //用于控制该表单内组件的尺寸	
      disabled: Boolean, //是否禁用该表单内的所有组件。若设置为 true，则表单内组件上的 disabled 属性不再生效
      validateOnRuleChange: { //是否在 rules 属性改变后立即触发一次验证。    用在watch里
        type: Boolean,
        default: true
      },
      hideRequiredAsterisk: { //是否隐藏必填字段的标签旁边的红色星号
        type: Boolean,
        default: false
      }
    },
    watch: {
      rules() {
        // remove then add event listeners on form-item after form rules change
        this.fields.forEach(field => {
          field.removeValidateEvents();
          field.addValidateEvents();
        });

        if (this.validateOnRuleChange) {
          this.validate(() => {});
        }
      }
    },
    computed: {
      // 计算表单内部标签的长度，自动返回最大长度
      autoLabelWidth() {
        if (!this.potentialLabelWidthArr.length) return 0;
        const max = Math.max(...this.potentialLabelWidthArr);
        return max ? `${max}px` : '';
      }
    },
    data() {
      return {
        fields: [], //存储了哪些 el-form-item是需要校验的
        potentialLabelWidthArr: [] // use this array to calculate auto width
      };
    },
    created() {
      //  通过在Form中监听事件来完成数据的存放与删除
      // 监听'el.form.addField 
    // 当触发该事件时, 为fields数组添加form-item实例
      this.$on('el.form.addField', (field) => {
        if (field) {
          this.fields.push(field);
        }
      });
      /* istanbul ignore next */
          // 监听'el.form.addField 
    // 当触发该事件时, 为fields数组移除form-item实例
      this.$on('el.form.removeField', (field) => {
        if (field.prop) {
          // 如果定义了规则属性
          this.fields.splice(this.fields.indexOf(field), 1);
        }
      });
    },
    methods: {
      // 对整个表单进行重置，将所有字段值重置为初始值并移除校验结果
      resetFields() {
        // 如果form没有绑定数据，则返回错误提示，否则调用对应项formItem的resetFields()方法
        if (!this.model) {
          console.warn('[Element Warn][Form]model is required for resetFields to work.');
          return;
        }
        this.fields.forEach(field => {
          // 重置表单：就是让里面每个item各自重置自己即可。
          field.resetField();
        });
      },
      // 移除表单项的校验结果。参数为formItem对应的prop属性（待移除的表单项的 prop 属性或者 prop 组成的数组），传入参数，移除对应参数的校验结果，如不传则移除整个表单的校验结果
      clearValidate(props = []) {
        // 清空校验：支持清空针对某个prop的校验，可以是字符串，也可以是数组。如果什么都不传的话，就去情况整个表单的校验了
        const fields = props.length
          ? (typeof props === 'string'
            ? this.fields.filter(field => props === field.prop)
            : this.fields.filter(field => props.indexOf(field.prop) > -1)
          ) : this.fields;
        fields.forEach(field => {
          // 调用对应项的formItem的clearValidate()方法
          field.clearValidate();
        });
      },
      /* 对整个表单进行全局校验的方法。
      参数为一个回调函数。该回调函数会在校验结束后被调用，并传入两个参数：是否校验成功和未通过校验的字段。若不传入回调函数（传入其他参数或者不传入），则会返回一个 promise
      使用场景：比如在按钮提交前调用Form的validate方法,就可以对所有规则统一进行验证
      */
      validate(callback) { 
        if (!this.model) {
          // 如果form没有绑定数据，则返回错误提示
          console.warn('[Element Warn][Form]model is required for validate to work!');
          return;
        }

        let promise;
        // if no callback, return promise
        if (typeof callback !== 'function' && window.Promise) {
          // 如果传入的参数不是函数，则调用window.Promise,将callback变成一个函数
          promise = new window.Promise((resolve, reject) => {
            callback = function(valid) {
              valid ? resolve(valid) : reject(valid);
            };
          });
        }

        let valid = true;
        let count = 0;
        // 如果需要验证的fields为空，调用验证时立刻返回callback
        if (this.fields.length === 0 && callback) {
          // 如果没有需要验证的formItem，返回callback(true)
          callback(true);
        }
        // 如果有需要验证的formItem,则循环调用对应formItem的validate()方法，将未通过校验的项放入invalidFields对象中，当所有项的验证都完成后，调用callback函数，将验证结果和验证未通过的项放入回调函数中
        let invalidFields = {};
        this.fields.forEach(field => {
          field.validate('', (message, field) => {
            // 如果有返回信息, 则说明验证失败
            if (message) {
              valid = false;
            }
            //将错误对象复制到invalidFields
            invalidFields = objectAssign({}, invalidFields, field);
            // 调动回调函数
            if (typeof callback === 'function' && ++count === this.fields.length) {
              callback(valid, invalidFields);
            }
          });
        });

        if (promise) {
          return promise;
        }
      },
      // 指定字段进行校验
      validateField(props, cb) {
        // 单独校验某个item，根据传入的prop过滤出对应的field，如果有多个只取第一个，然后校验，执行回调。
        props = [].concat(props);
        // 从全部校验项中筛选出传入的需要校验的项，如果没有，则返回错误提示；如果校验项存在，则遍历调用对应项的validate方法，每一个校验项都会调用对应的cb方法；
        const fields = this.fields.filter(field => props.indexOf(field.prop) !== -1);
        if (!fields.length) {
          console.warn('[Element Warn]please pass correct props!');
          return;
        }

        fields.forEach(field => {
          field.validate('', cb);
        });
      },
      getLabelWidthIndex(width) {
        const index = this.potentialLabelWidthArr.indexOf(width);
        // it's impossible
        if (index === -1) {
          throw new Error('[ElementForm]unpected width ', width);
        }
        return index;
      },
      registerLabelWidth(val, oldVal) {
        if (val && oldVal) {
          const index = this.getLabelWidthIndex(oldVal);
          this.potentialLabelWidthArr.splice(index, 1, val);
        } else if (val) {
          this.potentialLabelWidthArr.push(val);
        }
      },
      deregisterLabelWidth(val) {
        const index = this.getLabelWidthIndex(val);
        this.potentialLabelWidthArr.splice(index, 1);
      }
    }
  };
</script>
