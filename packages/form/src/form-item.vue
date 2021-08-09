<template>
  <div class="el-form-item" :class="[{
      'el-form-item--feedback': elForm && elForm.statusIcon,
      'is-error': validateState === 'error',
      'is-validating': validateState === 'validating',
      'is-success': validateState === 'success',
      'is-required': isRequired || required,
      'is-no-asterisk': elForm && elForm.hideRequiredAsterisk
    },
    sizeClass ? 'el-form-item--' + sizeClass : ''
  ]">
  <!-- 标签域 -->
    <label-wrap
      :is-auto-width="labelStyle && labelStyle.width === 'auto'"
      :update-all="form.labelWidth === 'auto'">
      <label :for="labelFor" class="el-form-item__label" :style="labelStyle" v-if="label || $slots.label">
        <!-- 标签文本的内容。插槽默认内容为label 加上定义的后缀 -->
        <slot name="label">{{label + form.labelSuffix}}</slot>
      </label>
    </label-wrap>
    <div class="el-form-item__content" :style="contentStyle">
       <slot></slot> <!--具体表单控件插槽，如单选等 -->
      <transition name="el-zoom-in-top">
        <!-- 自定义表单校验信息的显示方式，作用域插槽，参数为 { error } -->
        <slot
          v-if="validateState === 'error' && showMessage && form.showMessage"
          name="error"
          :error="validateMessage">
          <div
            class="el-form-item__error"
            :class="{
              'el-form-item__error--inline': typeof inlineMessage === 'boolean'
                ? inlineMessage
                : (elForm && elForm.inlineMessage || false)
            }"
          >
            {{validateMessage}}
          </div>
        </slot>
      </transition>
    </div>
  </div>
</template>
<script>
  import AsyncValidator from 'async-validator'; //校验库
  import emitter from 'element-ui/src/mixins/emitter'; //高低阶组件之间事件通信
  import objectAssign from 'element-ui/src/utils/merge';
  import { noop, getPropByPath } from 'element-ui/src/utils/util';
  import LabelWrap from './label-wrap';
  export default {
    name: 'ElFormItem',

    componentName: 'ElFormItem',

    mixins: [emitter],
// inject父组件elForm的，同时它还把自己给provide出去
    provide() {
      return {
        elFormItem: this
      };
    },

    inject: ['elForm'],

    props: {
      label: String,//标签文本	
      labelWidth: String,//表单域标签的的宽度，例如 '50px'。支持 auto。
      prop: String, //需校验的字段名,对应表单域 model 字段，在使用 validate、resetFields 方法的情况下，该属性是必填的.传入 Form 组件的 model 中的字段
      required: { //是否必填，如不设置，则会根据校验规则自动生成
        type: Boolean,
        default: undefined
      },
      rules: [Object, Array],//表单验证规则	
      error: String,//表单域验证错误信息, 设置该值会使表单验证状态变为error，并显示该错误信息
      validateStatus: String,
      for: String,
      inlineMessage: { //以行内形式展示校验信息	
        type: [String, Boolean],
        default: ''
      },
      showMessage: {//是否显示校验错误信息	
        type: Boolean,
        default: true
      },
      size: String //用于控制该表单域下组件的尺寸	
    },
    components: {
      // use this component to calculate auto width
      LabelWrap
    },
    watch: {
      // error和validateStatus就是props里面的，说明如果有外部组件通过传参改变这个两个信息的话， el-form-item会优先听从外部值。
      error: {
        immediate: true,
        handler(value) {
          this.validateMessage = value;
          this.validateState = value ? 'error' : '';
        }
      },
      validateStatus(value) {
        this.validateState = value;
      }
    },
    computed: {
      labelFor() {
        return this.for || this.prop;
      },
      labelStyle() {
        const ret = {};
        if (this.form.labelPosition === 'top') return ret;
        const labelWidth = this.labelWidth || this.form.labelWidth;
        if (labelWidth) {
          ret.width = labelWidth;
        }
        return ret;
      },
      contentStyle() {
        const ret = {};
        const label = this.label;
        if (this.form.labelPosition === 'top' || this.form.inline) return ret;
        if (!label && !this.labelWidth && this.isNested) return ret;
        const labelWidth = this.labelWidth || this.form.labelWidth;
        if (labelWidth === 'auto') {
          if (this.labelWidth === 'auto') {
            ret.marginLeft = this.computedLabelWidth;
          } else if (this.form.labelWidth === 'auto') {
            ret.marginLeft = this.elForm.autoLabelWidth;
          }
        } else {
          ret.marginLeft = labelWidth;
        }
        return ret;
      },
      form() {
        // 找到它最近的el-form组件，并且会根据父组件是否含有el-form-item来判断自身是否备嵌套
        let parent = this.$parent;
        let parentName = parent.$options.componentName;
        while (parentName !== 'ElForm') {
          if (parentName === 'ElFormItem') {
            this.isNested = true;
          }
          parent = parent.$parent;
          parentName = parent.$options.componentName;
        }
        return parent;
      },
      fieldValue() {
        const model = this.form.model;
        // 如果el-from对没有model或者当前el-form-item没有设置prop的话，不计算fieldValue
        if (!model || !this.prop) { return; }
// 会根据prop计算得出path，然后由path把getPropByPath(model, path, true).v作为当前的fieldValue
        let path = this.prop;
        if (path.indexOf(':') !== -1) {
          path = path.replace(/:/, '.');
        }

        return getPropByPath(model, path, true).v;
      },
      isRequired() {
        let rules = this.getRules();
        let isRequired = false;

        if (rules && rules.length) {
          rules.every(rule => {
            if (rule.required) {
              isRequired = true;
              return false;
            }
            return true;
          });
        }
        return isRequired;
      },
      _formSize() {
        return this.elForm.size;
      },
      elFormItemSize() {
        return this.size || this._formSize;
      },
      sizeClass() {
        return this.elFormItemSize || (this.$ELEMENT || {}).size;
      }
    },
    data() {
      return {
        validateState: '',
        validateMessage: '',
        validateDisabled: false,
        validator: {},
        isNested: false,
        computedLabelWidth: ''
      };
    },
    methods: {
      validate(trigger, callback = noop) {
         // 使用第三方库async-validator做规则校验
        // 根据model,rules和prop获取表单组件如el-input的值和校验规则rule
        this.validateDisabled = false; // 验证禁止关闭
        // 获取符合trigger的规则
        const rules = this.getFilteredRule(trigger);
        if ((!rules || rules.length === 0) && this.required === undefined) {
          // 如果没有定义规则并且没有定义必须填写，立即执行回调
          callback();
          return true;
        }
      // 改变验证状态为正在验证
        this.validateState = 'validating';

        const descriptor = {};
        // 为了匹配AsyncValidator插件所需要的格式,需要做规则数据做一些操作
        if (rules && rules.length > 0) {
          // 如果校验规则存在，去掉每一项校验规则里面的trigger字段，把当前formItem的prop作为key,校验规则作为value,放入descriptor
          rules.forEach(rule => {
            delete rule.trigger;
          });
        }
        // AsyncValidator需要的验证规则格式
        descriptor[this.prop] = rules;
      // 执行校验
        const validator = new AsyncValidator(descriptor);
        const model = {};
    // AsyncValidator需要的验证数据
        model[this.prop] = this.fieldValue;
      // {firstFields: true}参数代表当某一规则校验失败时，即终止校验
        validator.validate(model, { firstFields: true }, (errors, invalidFields) => {
          // 验证状态
          this.validateState = !errors ? 'success' : 'error';
          // 验证信息
          this.validateMessage = errors ? errors[0].message : '';
// 执行回调函数
          callback(this.validateMessage, invalidFields);
          // 提交validate事件
          this.elForm && this.elForm.$emit('validate', this.prop, !errors, this.validateMessage || null);
        });
      },
      // 清除所有当前验证状态结果
      clearValidate() {
        this.validateState = '';
        this.validateMessage = '';
        this.validateDisabled = false;
      },
      // 对该表单项所有字段进行重置，将其值重置为初始值并移除校验结果
      resetField() {
        // 清除验证信息与状态
        this.validateState = '';
        this.validateMessage = '';
    // 获取model数据模型中所对应的值
        let model = this.form.model;
        let value = this.fieldValue;
        let path = this.prop;
        if (path.indexOf(':') !== -1) {
          path = path.replace(/:/, '.');
        }

        let prop = getPropByPath(model, path, true);

        this.validateDisabled = true;
        // 重置为一开始获取的初始值
        if (Array.isArray(value)) {
          prop.o[prop.k] = [].concat(this.initialValue);
        } else {
          prop.o[prop.k] = this.initialValue;
        }

        // reset validateDisabled after onFieldChange triggered
        this.$nextTick(() => {
          this.validateDisabled = false;
        });

        this.broadcast('ElTimeSelect', 'fieldReset', this.initialValue);
      },
      getRules() {
        // 得到当前的formItem对应的prop的校验规则
        // 3种规则
        let formRules = this.form.rules;
        const selfRules = this.rules;
        const requiredRule = this.required !== undefined ? { required: !!this.required } : [];

        const prop = getPropByPath(formRules, this.prop || '');
        formRules = formRules ? (prop.o[this.prop || ''] || prop.v) : [];
        // 当前formItem的行内校验规则优先于form绑定的校验规则，如果当前formItem有required,则合并到校验规则中
        return [].concat(selfRules || formRules || []).concat(requiredRule);
      },
      getFilteredRule(trigger) {
        const rules = this.getRules();
        // 得到当前触发条件下的校验规则，如果没有填写触发条件，则返回当前formItem的所有校验规则
        return rules.filter(rule => {
          if (!rule.trigger || trigger === '') return true;
          if (Array.isArray(rule.trigger)) {
            return rule.trigger.indexOf(trigger) > -1;
          } else {
            return rule.trigger === trigger;
          }
        }).map(rule => objectAssign({}, rule));
      },
      onFieldBlur() {
        this.validate('blur');
      },
      onFieldChange() {
        if (this.validateDisabled) {
          this.validateDisabled = false;
          return;
        }

        this.validate('change');
      },
      updateComputedLabelWidth(width) {
        this.computedLabelWidth = width ? `${width}px` : '';
      },
      addValidateEvents() {
        const rules = this.getRules();

        if (rules.length || this.required !== undefined) {
          this.$on('el.form.blur', this.onFieldBlur);
          this.$on('el.form.change', this.onFieldChange);
        }
      },
      removeValidateEvents() {
        this.$off();
      }
    },
    mounted() {
      if (this.prop) {
        // 如果定义了需要验证的字段 向父Form组件添加filed
        this.dispatch('ElForm', 'el.form.addField', [this]);
        // ？？？？这是在干什么
        let initialValue = this.fieldValue;
        if (Array.isArray(initialValue)) {
          initialValue = [].concat(initialValue);
        }
        // 与直接赋值的区别？
        Object.defineProperty(this, 'initialValue', {
          value: initialValue
        });
        // 各种监听事件
        this.addValidateEvents();
      }
    },
    beforeDestroy() {
      // 移除之前删除form中的数据字段
      this.dispatch('ElForm', 'el.form.removeField', [this]);
    }
  };
</script>
