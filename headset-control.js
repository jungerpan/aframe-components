const TimeDelay = (t) => t > 1 ? t / Math.pow(10, Math.ceil(Math.log10(t))) : t;
const HeadSetControl = {
    schema: {
        headsetId: {
            type: 'string',
            default: '#rig'
        },
        hand: {
            type: 'string',
            default: 'right'
        }
    },
    init() {
        this.isHeadSet = AxeMath.isHeadSet();
        if (!this.isHeadSet) return;
        const { el, data } = this
        const { sceneEl } = el
        const { headsetId, hand } = data
        const cameraE = document.querySelector('a-camera');
        const cameraObject = cameraE.object3D;
        const headsetE = document.querySelector(headsetId);
        // sceneEl.addEventListener('loaded', () => {
        //     // if (AxeMath.isHeadSet()) {
        //     //     headsetE.object3D.position.y = 0;
        //     // }

        // });
        let direction = 0;
        let rotation = 0;
        let cameraDirection = new THREE.Vector3();
        let enableMove = true;
        sceneEl.addEventListener('in-secret', () => {
            enableMove = false;
        })
        sceneEl.addEventListener('leave-secret', () => {
            enableMove = true;
        })
        let axisY = new THREE.Vector3(0, 1, 0);
        const angle = Math.PI / 2;
        this.walkAnimation = (t) => {
            if (hand == 'left') {
                if (direction != 0) {
                    cameraObject.getWorldDirection(cameraDirection)
                    cameraDirection.y = 0;
                    cameraDirection.normalize().multiplyScalar(t * 0.5).multiplyScalar(direction);
                    headsetE.object3D.position.add(cameraDirection);
                } else if (rotation != 0) {
                    cameraObject.getWorldDirection(cameraDirection)
                    cameraDirection.y = 0;
                    cameraDirection.normalize().applyAxisAngle(axisY, angle).multiplyScalar(t * 0.5).multiplyScalar(rotation);
                    headsetE.object3D.position.add(cameraDirection);
                }
            } else if (hand == 'right') {
                if (rotation != 0) {
                    // 围绕轴旋转
                    headsetE.object3D.rotation.y -= rotation * t * 0.05;
                }
            }


        }
        // 顶部按下
        el.addEventListener("thumbstickmoved", (evt) => {
            const x = evt.detail.x; // 左右移动
            const y = evt.detail.y; // 前后移动
            const absX = Math.abs(x);
            const absY = Math.abs(y);
            if (hand == 'left') {
                // 纵向移动
                if (enableMove && absY > absX && absY >= 0.1) {
                    direction = y / absY;
                    return
                }
                direction = 0;
            }
            // 横向移动
            if (absX > absY && absX > 0.1) {
                rotation = x / absX;
                return;
            }
            rotation = 0;
        })
    },
    tick(_, t) {
        if (this.isHeadSet && this.walkAnimation) {
            this.walkAnimation(TimeDelay(t))
        }
    }
}

export default HeadSetControl;