/**
 * NPC 动态控制，以节省GPU计算
 * 超出范围自动隐藏、范围内自动显示
 */
let NpcVisibilityManager = {
  schema: {
    range: { type: "number", default: 10 }, // 可见距离
    checkInterval: { type: "int", default: 10 }, // 每 N 帧检查一次
    element: { type: "string", default: "npc" }, // NPC 元素选择器
    enabled: { type: "boolean", default: true },//是否启用动态显隐
  },

  init: function () {
    this.npcs = []; // 获取所有 NPC
    this.camera = this.el.sceneEl.camera;
    this.frustum = new THREE.Frustum();
    this.lastPlayerPos = new THREE.Vector3();
    this.playerPos = new THREE.Vector3(); // 复用
    this.npcPos = new THREE.Vector3(); // 复用
    this.frameCount = 0;
    this.npcQueue = []; // 用于分帧加载 NPC
    this.loadedNPCs = false;

    localStorage.setItem("loadedNPCs", false);

    this.updateNpcList();
    
    // **每帧分批加载 NPC，避免首帧卡顿**
    this.el.sceneEl.addEventListener("loaded", this.updateNpcList.bind(this));
    this.el.addEventListener("load-npc", () => {
      if (this.loadedNPCs) return;
      console.log("load-npc")
      this.lazyLoadNPCs();
    });
  },

  tick: function () {
    if (!this.data.enabled) return;
    this.frameCount++;
    if (this.frameCount % this.data.checkInterval !== 0) return; // 降低计算频率

    this.camera.getWorldPosition(this.playerPos);
    // 判断相机是否移动
    if (this.playerPos.distanceToSquared(this.lastPlayerPos) < 0.001) {
      // return; // 没动就退出，不执行计算
    }

    this.lastPlayerPos.copy(this.playerPos);

    // 更新摄像机视锥
    this.camera.updateMatrixWorld();
    this.frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        this.camera.projectionMatrix,
        this.camera.matrixWorldInverse
      )
    );
    

    // 遍历所有 NPC，检查可见性
    for (let npc of this.npcs) {
      if (!npc.object3D) return;

      npc.object3D.getWorldPosition(this.npcPos);
      const distance = this.playerPos.distanceTo(this.npcPos);
      let inView = this.frustum.containsPoint(this.npcPos); // 视野检测

      let isVisible = false;
      if (inView && distance < this.data.range) {
        isVisible = true;
      }
      if (npc.object3D.visible != isVisible) {
        // console.log("显隐变化，目标状态",isVisible,"当前状态",npc.object3D.visible,"目标距离：",distance)
        // console.log("npc", npc.object3D);
        npc.object3D.visible = isVisible;
      }
    }
  },
  updateNpcList: function () {
    this.npcQueue = Array.from(Array.from(document.querySelectorAll(`[${this.data.element}]`)));
  },
  lazyLoadNPCs: function () {
    const batchSize = 5; // 每帧加载 5 个 NPC，防止卡顿
    let timer = null;
    const loadNextBatch = () => {
      for (let i = 0; i < batchSize; i++) {
        if (this.npcQueue.length > 0) {
          const npc = this.npcQueue.shift();
          this.npcs.push(npc);
          if (this.data.enabled) {
            npc.object3D.visible = false;  
          } else {
            npc.object3D.visible = true;
          }
        }
      }

      // 如果仍有 NPC 未加载，下一帧继续
      if (this.npcQueue.length <= 0) {
        console.log("NPC加载完成", new Date())
        this.loadedNPCs = true;
        localStorage.setItem("loadedNPCs", true);
        clearInterval(timer);
      }
    };

    // **延迟 500ms 开始加载，保证场景稳定后再加载 NPC**
    // setTimeout(() => {
    //   loadNextBatch();
    // }, 1000);
    timer = setInterval(() => {
      loadNextBatch();
    }, 300);
  },
};
export default NpcVisibilityManager;
