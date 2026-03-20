sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, JSONModel, MessageBox, MessageToast) => {
    "use strict";

    return Controller.extend("project1.controller.View1", {
        onInit() {
            this.getView().setModel(new JSONModel({
                cameraActive: false,
                hasPhoto: false,
                photoSrc: ""
            }), "camera");
        },

        onActivateCamera() {
            const oModel = this.getView().getModel("camera");

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                MessageBox.error(this._getText("cameraNotSupported"));
                return;
            }

            if (this._oStream) {
                MessageToast.show(this._getText("cameraAlreadyActive"));
                this._attachStreamToVideo();
                return;
            }

            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: {
                        ideal: "environment"
                    }
                },
                audio: false
            }).then((oStream) => {
                this._oStream = oStream;
                oModel.setProperty("/cameraActive", true);
                this._attachStreamToVideo();
                MessageToast.show(this._getText("cameraActivated"));
            }).catch(() => {
                MessageBox.error(this._getText("cameraAccessError"));
            });
        },

        onTakePhoto() {
            const oCameraDomRef = this.byId("cameraFeed").getDomRef();
            const oModel = this.getView().getModel("camera");

            if (!oCameraDomRef) {
                MessageBox.error(this._getText("cameraAccessError"));
                return;
            }

            const oVideo = oCameraDomRef.querySelector("video");
            const oCanvas = oCameraDomRef.querySelector("canvas");

            if (!oVideo || !oCanvas || !oVideo.videoWidth || !oVideo.videoHeight) {
                MessageBox.error(this._getText("cameraNotReady"));
                return;
            }

            oCanvas.width = oVideo.videoWidth;
            oCanvas.height = oVideo.videoHeight;
            oCanvas.getContext("2d").drawImage(oVideo, 0, 0, oCanvas.width, oCanvas.height);

            oModel.setProperty("/photoSrc", oCanvas.toDataURL("image/png"));
            oModel.setProperty("/hasPhoto", true);
            MessageToast.show(this._getText("photoCaptured"));
            this._stopCameraStream();
        },

        onExit() {
            this._stopCameraStream();
        },

        _attachStreamToVideo() {
            const oCamera = this.byId("cameraFeed");
            const oCameraDomRef = oCamera && oCamera.getDomRef();

            if (!oCameraDomRef) {
                setTimeout(() => {
                    this._attachStreamToVideo();
                }, 0);
                return;
            }

            const oVideo = oCameraDomRef.querySelector("video");

            if (oVideo) {
                oVideo.srcObject = this._oStream;
                oVideo.play().catch(() => {
                    MessageBox.error(this._getText("cameraPlaybackError"));
                });
            }
        },

        _stopCameraStream() {
            const oModel = this.getView().getModel("camera");

            if (this._oStream) {
                this._oStream.getTracks().forEach((oTrack) => {
                    oTrack.stop();
                });
                this._oStream = null;
            }

            oModel.setProperty("/cameraActive", false);
        },

        _getText(sKey) {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
        }
    });
});
