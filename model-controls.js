let ModelControls = {
  schema: {
    mode: { type: "string", default: "rotation" }, // 可选 'rotation' 或 'position'
    minScale: { type: "number", default: 0.5 },
    maxScale: { type: "number", default: 3.0 },
    rotationSpeed: { type: "number", default: 0.5 },
    moveSpeed: { type: "number", default: 0.005 },
    scaleFactor: { type: "number", default: 1 },
  },
  init: function () {
    this.scaleFactor = 1;
    this.initialDistance = null;
    this.model = this.el;

    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;

    this.bindEvents();
  },
  bindEvents: function () {
    window.addEventListener("wheel", this.onMouseWheel.bind(this));
    window.addEventListener("mousedown", this.onMouseDown.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("mouseup", this.onMouseUp.bind(this));

    this.el.sceneEl.canvas.addEventListener(
      "touchstart",
      this.onTouchStart.bind(this)
    );
    this.el.sceneEl.canvas.addEventListener(
      "touchmove",
      this.onTouchMove.bind(this)
    );
    this.el.sceneEl.canvas.addEventListener(
      "touchend",
      this.onTouchEnd.bind(this)
    );
  },

  /** 🔍 检查模型是否可交互 */
  isInteractable: function () {
    let visible =
      this.model.getAttribute("visible") &&
      this.model.parentNode.object3D.visible;
    let scale = this.model.getAttribute("scale");
    return (
      visible !== false && !(scale.x === 0 && scale.y === 0 && scale.z === 0)
    );
  },

  /** 🖱 PC 鼠标滚轮缩放 */
  onMouseWheel: function (event) {
    if (!this.isInteractable()) return;

    let scale = this.model.getAttribute("scale");
    let delta = event.deltaY * -0.001 * this.data.scaleFactor;
    let newScale = Math.max(
      this.data.minScale,
      Math.min(this.data.maxScale, scale.x + delta)
    );

    this.model.setAttribute("scale", { x: newScale, y: newScale, z: newScale });
  },

  /** 🖱 PC 鼠标拖动旋转/移动 */
  onMouseDown: function (event) {
    if (!this.isInteractable()) return;
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
  },
  onMouseMove: function (event) {
    if (!this.isDragging || !this.isInteractable()) return;

    let dx = event.clientX - this.lastX;
    let dy = event.clientY - this.lastY;

    if (this.data.mode === "rotation") {
      let rotation = this.model.getAttribute("rotation");
      rotation.y += dx * this.data.rotationSpeed;
      //限制y旋转角度，最多旋转45度
      rotation.y = Math.min(Math.max(rotation.y, 105), 245);


      rotation.x -= dy * this.data.rotationSpeed;
      //限制x旋转角度，最多旋转45度
      // console.log(rotation.x);
      rotation.x = Math.min(Math.max(rotation.x, -45), 45);
      
      this.model.setAttribute("rotation", rotation);
    } else if (this.data.mode === "position") {
      let position = this.model.getAttribute("position");
      position.x += dx * this.data.moveSpeed;
      position.y -= dy * this.data.moveSpeed;
      this.model.setAttribute("position", position);
    }

    this.lastX = event.clientX;
    this.lastY = event.clientY;
  },
  onMouseUp: function () {
    this.isDragging = false;
  },

  /** 📱 触摸交互：双指缩放 & 单指旋转/移动 */
  onTouchStart: function (event) {
    if (!this.isInteractable()) return;

    if (event.touches.length === 2) {
      this.initialDistance = this.getDistance(event.touches);
    } else if (event.touches.length === 1) {
      this.isDragging = true;
      this.lastX = event.touches[0].clientX;
      this.lastY = event.touches[0].clientY;
    }
  },
  onTouchMove: function (event) {
    if (!this.isInteractable()) return;

    if (event.touches.length === 2 && this.initialDistance) {
      let newDistance = this.getDistance(event.touches);
      let scale = this.model.getAttribute("scale");
      let scaleFactor = newDistance / this.initialDistance;

      let newScale = Math.max(
        this.data.minScale,
        Math.min(this.data.maxScale, scale.x * scaleFactor)
      );
      this.model.setAttribute("scale", {
        x: newScale,
        y: newScale,
        z: newScale,
      });

      this.initialDistance = newDistance;
    } else if (event.touches.length === 1 && this.isDragging) {
      if (
        typeof this.lastX === "undefined" ||
        typeof this.lastY === "undefined"
      ) {
        this.lastX = event.touches[0].clientX;
        this.lastY = event.touches[0].clientY;
        return;
      }

      let dx = event.touches[0].clientX - this.lastX;
      let dy = event.touches[0].clientY - this.lastY;

      if (this.data.mode === "rotation") {
        let rotation = this.model.getAttribute("rotation");
        rotation.y -= dx * this.data.rotationSpeed;
        rotation.x -= dy * this.data.rotationSpeed;
        this.model.setAttribute("rotation", rotation);
      } else if (this.data.mode === "position") {
        let position = this.model.getAttribute("position");
        position.x += dx * this.data.moveSpeed;
        position.y -= dy * this.data.moveSpeed;
        this.model.setAttribute("position", position);
      }

      this.lastX = event.touches[0].clientX;
      this.lastY = event.touches[0].clientY;
    }
  },
  onTouchEnd: function () {
    this.isDragging = false;
    this.initialDistance = null;
  },

  /** 🔢 计算双指间的距离（用于缩放） */
  getDistance: function (touches) {
    let dx = touches[0].clientX - touches[1].clientX;
    let dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  },
};
export default ModelControls;
