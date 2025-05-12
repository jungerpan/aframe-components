let NpcFixAnimation = {
  schema: {
    clip: { type: "string", default: "idle" }, // 动画名称
  },
  init: function () {
    let el = this.el;

    el.addEventListener("model-loaded", () => {
      let model = el.getObject3D("mesh");
      if (!model) return;

      let mixer = new THREE.AnimationMixer(model);
      el.mixer = mixer;

      // 获取所有动画
      let clips = model.animations;
      let walkClip = THREE.AnimationClip.findByName(clips, this.data.clip); // 确保动画名称正确

      if (walkClip) {
        let action = mixer.clipAction(walkClip);
        action.loop = THREE.LoopRepeat;
        action.clampWhenFinished = true;
        action.play();
      }

      // 找到 Root Bone 并锁定位置
      this.rootBone = model.getObjectByName("Root") || model.getObjectByName("Hips");
    });
    if(!AxeMath.isHeadSet()){
      this.tick = AFRAME.utils.throttleTick(this.tick, 40, this); 
    }
  },
  tick: function (_, delta) {
      if(!this.rootBone) return
      this.el.mixer.update(delta / 1000);
      this.rootBone.position.set(0, 0, 0);
  },
};
export default NpcFixAnimation;
