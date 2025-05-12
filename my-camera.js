let LOG = (message) => {
    console.log(message)
}
const MyCamera = {
    schema: {
        direct: {
            type: 'string',
            default: 'back'
        },
        distance: {
            type: "number",
            default: 80
        }
    },
    init() {
        let openCamera = this.openCamera.bind(this)
        this.onSuccess = this.onSuccess.bind(this)
        this.onFailure = this.onFailure.bind(this)
        this.video = document.createElement("video")
        this.ios = !!window.navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
        this.front = (this.data.direct === 'back') ? false : true
        this.accessPermissions = window.navigator.permissions && window.navigator.permissions.query
        this.hasDevices = window.navigator.mediaDevices.enumerateDevices
        if (this.accessPermissions) {
            window.navigator.permissions.query({ name: 'camera' }).then((permission) => {
                openCamera(permission)
            }).catch((error) => {
                LOG("没有检测到摄像头")
            })
        } else {
            LOG("没有摄像头权限")
        }
    },
    openCamera(permission) {
        if (permission && permission.state === 'denied') {
            LOG("摄像头权限不被允许")
            return
        }
        if (this.hasDevices) {
            const { onSuccess, onFailure, front, ios } = this
            window.navigator.mediaDevices.enumerateDevices().then(devices => {
                devices = devices.filter(d => d.kind === 'videoinput');
                if (devices.length <= 0) {
                    LOG("无摄像头对应驱动")
                    return
                }
                let deviceId = devices[devices.length - 1].deviceId
                let configuration = {}
                if (ios) {
                    let facingMode = 'environment'
                    if (front) {
                        facingMode = 'user'
                    }
                    configuration = {
                        audio: false,
                        video: {
                            facingMode: facingMode
                        }
                    }
                } else {
                    if (devices.length <= 1) {
                        let facingMode = 'environment'
                        if (front) {
                            facingMode = 'user'
                        }
                        configuration = {
                            audio: false,
                            video: {
                                facingMode: facingMode
                            }
                        }
                    } else {
                        if (front) {
                            devices = devices.filter(d => (d.label.toLowerCase().indexOf("front") > -1))
                            deviceId = devices.length > 0 ? devices[0].deviceId : deviceId
                        } else {
                            devices = devices.filter(d => {
                                return (d.label.toLowerCase().indexOf("back") > -1)
                            })
                            deviceId = devices.length > 0 ? devices[devices.length - 1].deviceId : deviceId
                        }
                        configuration = {
                            audio: false,
                            video: {
                                optional: [{ sourceId: deviceId }],
                            }
                        }
                    }

                }
                window.navigator.mediaDevices.getUserMedia(configuration).then(onSuccess).catch(onFailure)
            })
        } else {
            LOG("当前浏览器不支持媒体设备")
        }
    },
    onSuccess(stream) {
        const { el } = this
        const { sceneEl } = el
        const { distance } = this.data
        let camera = null
        for (let i = 0; i < el.object3D.children.length; i++) {
            const item = el.object3D.children[i]
            if ("isCamera" in item && item.isCamera) {
                camera = item
                break
            }
        }

        const track = stream.getVideoTracks()[0];
        const scene = this.el.object3D
        if (typeof track === 'undefined') {
            LOG("摄像头开启失败")
            return
        }
        const { video, _canvas } = this
        video.setAttribute('autoplay', 'autoplay')
        video.setAttribute('playsinline', 'playsinline')
        video.setAttribute('webkit-playsinline', 'webkit-playsinline')
        video.setAttribute('muted', true)
        video.srcObject = stream
        video.onloadeddata = () => {
            video.play()
            let videoAspect = video.videoWidth / video.videoHeight
            let offsetX = 0
            let offsetY = 0
            let scaleX = 1
            let scaleY = 1
            if (camera) {
                let h = Math.tan(camera.fov * Math.PI / 360) * distance * 2
                let w = camera.aspect * h
                const geometry = new THREE.PlaneGeometry(w, h);
                if (videoAspect > camera.aspect) {
                    let w = camera.aspect * video.videoHeight
                    scaleX = w / video.videoWidth
                    offsetX = (1 - scaleX) * 0.5

                } else {
                    let h = video.videoWidth / camera.aspect
                    scaleY = h / video.videoHeight
                    offsetY = (1 - scaleY) * 0.5
                }
                const shaderMaterial = new THREE.ShaderMaterial({
                    uniforms: {
                        u_texture: {
                            value: new THREE.VideoTexture(video)
                        },
                        sX: {
                            value: scaleX
                        },
                        sY: {
                            value: scaleY
                        },
                        oX: {
                            value: offsetX
                        },
                        oY: {
                            value: offsetY
                        }
                    },

                    vertexShader:
                        `precision highp float;
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                    }
                    `,
                    fragmentShader: `
                    precision highp float;
                    uniform sampler2D u_texture;
                    varying vec2 vUv;
                    uniform float sX;
                    uniform float sY;
                    uniform float oX;
                    uniform float oY;
                    void main() {
                        vec4 texColor = texture2D(u_texture, vUv * vec2(sX,sY) + vec2(oX,oY));
                        gl_FragColor = texColor;
                    } 
                    `
                });
                const plane = new THREE.Mesh(geometry, shaderMaterial);
                plane.position.z = -distance
                camera.add(plane);
            }

            sceneEl.emit("openCamera")
        }
    },
    onFailure(error) {
        console.log(error)
        switch (error.name) {
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                LOG("没有找到摄像头")
                break;
            case 'SourceUnavailableError':
                LOG("当前摄像头被占用")
                break;
            case 'PermissionDeniedError':
            case 'SecurityError':
                LOG("当前摄像头权限访问失败")
                break;
            default:
                LOG("当前摄像头拒接访问")
                break;
        }
    }
}
export default MyCamera