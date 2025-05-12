let NpcPathMove = {
  schema: {
    pathPoints: { type: "string", default: "0 0 0, 5 0 2, 10 0 0, 5 0 -2" }, // 以字符串形式存储路径点
    speed: { type: "number", default: 1 }, // 速度
    offset: { type: "number", default: 0 }, //旋转偏移量
  },

  init: function () {
    // 解析路径点字符串，转换为 THREE.Vector3 数组
    this.points = this.data.pathPoints.split(",").map((pointStr) => {
      let coords = pointStr.trim().split(" ").map(Number);
      return new THREE.Vector3(coords[0], coords[1], coords[2]);
    });

    if (this.points.length < 2) {
      console.error("路径点不够，至少需要 2 个点！");
      return;
    }
    // 创建平滑路径
    this.curve = new THREE.CatmullRomCurve3(this.points, true); // true = 封闭路径
    this.pathLength = this.computeCurveLength(); // 计算路径总长度
    this.t = 0; // 初始化路径进度
    this.lastDirection = new THREE.Vector3();
    if(!AxeMath.isHeadSet()){
      this.tick = AFRAME.utils.throttleTick(this.tick, 40, this); 
    }
  },

  tick: function (_, delta) {
    if (!this.curve || this.pathLength === 0) return;

    let deltaSeconds = delta / 1000; // 计算帧间隔时间 (单位: 秒)
    let distanceToMove = this.data.speed * deltaSeconds; // 本帧移动的实际距离
    let tIncrement = distanceToMove / this.pathLength; // 计算 t 的步进值

    this.t = (this.t + tIncrement) % 1; // 确保 t 在 [0,1] 内循环

    // 获取当前路径上的点
    let newPos = this.curve.getPointAt(this.t);
    this.el.object3D.position.copy(newPos);

    // 计算 NPC 朝向
    let nextT = (this.t + 0.01) % 1; // 取稍后一点避免零除
    let nextPos = this.curve.getPointAt(nextT);
    this.updateRotation(newPos, nextPos);
  },

  updateRotation: function (currentPos, nextPos) {
    let direction = new THREE.Vector3().subVectors(nextPos, currentPos).normalize();
    if(direction.x == this.lastDirection.x && direction.z == this.lastDirection.z) return;
    this.lastDirection.copy(direction);
    let angle = Math.atan2(direction.x, direction.z);
    this.el.object3D.rotation.y = angle + this.data.offset;
  },

  computeCurveLength: function () {
    let divisions = 100; // 采样点数，越大越精确
    let points = this.curve.getPoints(divisions);
    let length = 0;

    for (let i = 0; i < divisions; i++) {
      length += points[i].distanceTo(points[i + 1]);
    }
    return length;
  },
};

export default NpcPathMove;
