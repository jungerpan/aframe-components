/**
 * UI动画控制
 */
let AnimationUi = {
  schema: {
    className: {
      type: "string",
      default: "", //close-button
    },
    factor: { type: "number", default: 2 }, // 放大倍数，可自定义
    dur: { type: "number", default: 300 }, // 动画时长
    scale: { type: "number", default: 1.2 }, //目标scale值
    clickWait: { type: 'bool', default: false },
    cascade: { type: 'bool', default: false },
  },
  init() {
    let { className, factor, dur, scale } = this.data;
    this.factor = factor;
    this.dur = dur;
    this.scale = scale;

    if (AxeMath.isHeadSet()) {
      this.hoverEvent = "raycaster-intersected";
      this.leaveEvent = "raycaster-intersected-cleared";
    } else {
      this.hoverEvent = "mouseenter";
      this.leaveEvent = "mouseleave";
    }
    if (className) {
      this[className]();
    }
  },
  animationButton() {
    const { el, hoverEvent, leaveEvent, factor, dur, data } = this;
    //buttonAnimation

    // 记录初始 scale
    const originalScale = el.object3D.scale.clone();
    const targetScale = originalScale.clone().multiplyScalar(factor);
    // 添加放大动画
    if (data.clickWait) {
      let clicked = false;
      el.addEventListener("update-scale",({detail})=>{
        let s = detail.scale;
        originalScale.set(s.x, s.y, s.y)
      })
      
      let clicked_event = () => {
        if(clicked) return;
        clicked = true;
        setTimeout(() => {
          clicked = false;
          el.setAttribute('scale', `${originalScale.x} ${originalScale.y} ${originalScale.z}`)
        }, 2000);
      }
      if(data.cascade){
        el.parentElement.addEventListener("notify-click", clicked_event);
      }
      el.setAttribute('animation__hover', {
        property: 'scale',
        to: `${targetScale.x} ${targetScale.y} ${targetScale.z}`,
        dur: dur,
        enabled: false
      });
      el.addEventListener(hoverEvent, () => {
        if (clicked) return;
        el.setAttribute('animation__hover', "enabled", true)
        setTimeout(() => {
          el.setAttribute('animation__hover', "enabled", false)
        }, dur);
      });
      el.setAttribute('animation__leave', {
        property: 'scale',
        to: `${originalScale.x} ${originalScale.y} ${originalScale.z}`,
        dur: dur,
        enabled: false
      });
      el.addEventListener(leaveEvent, () => {
        if (clicked) return;
        el.setAttribute('animation__leave', "enabled", true)
        setTimeout(() => {
          el.setAttribute('animation__leave', "enabled", false)
        }, dur);
      });
      el.addEventListener('entityclick', ()=>{
        clicked_event();
        if(data.cascade){
          el.parentElement.emit("notify-click");
        }
      })
    } else {
      // 添加放大动画
      el.setAttribute('animation__hover', {
        property: 'scale',
        to: `${targetScale.x} ${targetScale.y} ${targetScale.z}`,
        dur: dur,
        startEvents: hoverEvent
      });
      // 添加还原动画
      el.setAttribute('animation__leave', {
        property: 'scale',
        to: `${originalScale.x} ${originalScale.y} ${originalScale.z}`,
        dur: dur,
        startEvents: leaveEvent
      });
    }
  },
  animationPlane() {
    const geometry = this.el.getAttribute("geometry") || { width: 1, height: 1, depth: 1 };
    const width = geometry.width;
    const height = geometry.height;
    const currentPos = this.el.getAttribute("position");
    const initialPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z }; // 复制初始值
    const maxScale = this.scale * this.factor;

    //计算左下角position
    const leftLowerX = currentPos.x - (width * this.scale) / 2;
    const leftLowerY = currentPos.y - (height * this.scale) / 2;

    // 计算左下角固定的偏移（关键优化点）
    let maxX = leftLowerX + (width * maxScale) / 2;
    let maxY = leftLowerY + (height * maxScale) / 2;

    let targetX = leftLowerX + (width * this.scale) / 2;
    let targetY = leftLowerY + (height * this.scale) / 2;

    this.el.addEventListener("animation-plane-show", () => {
      // 移除旧动画
      this.el.removeAttribute("animation__expand");
      this.el.removeAttribute("animation__pos_expand");
      this.el.removeAttribute("animation__shrink");
      this.el.removeAttribute("animation__pos_shrink");
      // 1. 先放大
      this.el.setAttribute("animation__expand", {
        property: "scale",
        to: `${maxScale} ${maxScale} ${maxScale}`,
        dur: this.dur,
        easing: "easeOutQuad",
      });

      this.el.setAttribute("animation__pos_expand", {
        property: "position",
        from: `${leftLowerX} ${leftLowerY} ${initialPos.z}`,
        to: `${maxX} ${maxY} ${initialPos.z}`,
        dur: this.dur,
        easing: "easeOutQuad",
      });

      // 2. 缩小回 1
      setTimeout(() => {
        this.el.setAttribute("animation__shrink", {
          property: "scale",
          to: `${this.scale} ${this.scale} ${this.scale}`,
          dur: 150,
          easing: "easeInQuad",
        });

        this.el.setAttribute("animation__pos_shrink", {
          property: "position",
          to: `${targetX} ${targetY} ${initialPos.z}`,
          dur: 150,
          easing: "easeInQuad",
        });
      }, this.dur);
    });
    this.el.addEventListener("animation-plane-hide", () => {
      // 移除旧动画
      this.el.removeAttribute("animation__expand");
      this.el.removeAttribute("animation__pos_expand");
      this.el.removeAttribute("animation__shrink");
      this.el.removeAttribute("animation__pos_shrink");

      // 1. 先放大再缩小
      this.el.setAttribute("animation__expand", {
        property: "scale",
        to: `${maxScale} ${maxScale} ${maxScale}`,
        dur: 150,
        easing: "easeOutQuad",
      });

      this.el.setAttribute("animation__pos_expand", {
        property: "position",
        to: `${maxX} ${maxY} ${initialPos.z}`,
        dur: 150,
        easing: "easeOutQuad",
      });
      // 2. 缩小回 0
      setTimeout(() => {
        this.el.setAttribute("animation__shrink", {
          property: "scale",
          to: "0 0 0",
          dur: this.dur,
          easing: "easeInQuad",
        });

        this.el.setAttribute("animation__pos_shrink", {
          property: "position",
          to: `${leftLowerX} ${leftLowerY} ${initialPos.z}`,
          dur: this.dur,
          easing: "easeInQuad",
        });
      }, 150);
    });
  },
};
export default AnimationUi;
