sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/Label",
  "sap/m/Input"
], function (Controller, MessageBox, MessageToast, Dialog, Button, Label, Input) {
  "use strict";

  return Controller.extend("sap.mm.material.controller.MaterialDetail", {
    onInit: function () {
      this.getOwnerComponent().getRouter()
        .getRoute("MaterialDetail").attachPatternMatched(this._onRoute, this);
    },

    _onRoute: function (oEvent) {
      var sMaterialId = decodeURIComponent(oEvent.getParameter("arguments").materialId);

      // Luôn fetch fresh từ OData để đảm bảo data mới nhất sau khi tạo/sửa
      var oDataModel = this.getOwnerComponent().getModel("materialData");
      var oContext   = oDataModel.bindContext("/Materials('" + sMaterialId + "')");

      this.getView().setBusy(true);
      oContext.requestObject().then(function (oData) {
        this.getOwnerComponent().setModel(
          new sap.ui.model.json.JSONModel(oData), "detailModel"
        );
        this.getView().setBusy(false);
      }.bind(this)).catch(function () {
        this.getView().setBusy(false);
        MessageBox.error("Không tìm thấy vật liệu: " + sMaterialId);
      }.bind(this));
    },

    onNavBack: function () {
      this.getOwnerComponent().getRouter().navTo("MaterialList");
    },

    onNavToLaunchpad: function () {
      window.location.href = "../../launchpad/index.html";
    },

    onDelete: function () {
      var oDetailModel    = this.getOwnerComponent().getModel("detailModel");
      var sMaterialNumber = oDetailModel.getProperty("/MaterialNumber");
      MessageBox.confirm("Xóa vật liệu " + sMaterialNumber + "?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          var oDataModel = this.getOwnerComponent().getModel("materialData");
          oDataModel.bindContext("/Materials('" + sMaterialNumber + "')")
            .delete().then(function () {
              MessageToast.show("Đã xóa vật liệu " + sMaterialNumber);
              this.onNavBack();
            }.bind(this)).catch(function (e) {
              MessageBox.error("Lỗi xóa: " + (e.message || e));
            });
        }.bind(this)
      });
    },

    onChangeStatus: function () {
      var oDetailModel    = this.getOwnerComponent().getModel("detailModel");
      var sMaterialNumber = oDetailModel.getProperty("/MaterialNumber");
      var sCurrentStatus  = oDetailModel.getProperty("/Status");
      var oInput = new Input({ placeholder: "Lý do thay đổi..." });
      var oDialog = new Dialog({
        title: "Thay Đổi Trạng Thái",
        content: [new Label({ text: "Trạng thái hiện tại: " + sCurrentStatus }), oInput],
        beginButton: new Button({
          text: "Xác Nhận", type: "Accept",
          press: function () {
            var sNewStatus = sCurrentStatus === "Active" ? "Inactive" : "Active";
            var oModel     = this.getOwnerComponent().getModel("materialData");
            var oOp        = oModel.bindContext("/changeMaterialStatus(...)");
            oOp.setParameter("MaterialNumber", sMaterialNumber);
            oOp.setParameter("NewStatus", sNewStatus);
            oOp.setParameter("ChangeReason", oInput.getValue());
            oOp.execute().then(function () {
              MessageToast.show("Đã đổi trạng thái sang " + sNewStatus);
              oDetailModel.setProperty("/Status", sNewStatus);
              oDialog.close();
            }).catch(function (e) { MessageBox.error(e.message || e); });
          }.bind(this)
        }),
        endButton: new Button({ text: "Hủy", press: function () { oDialog.close(); } })
      });
      this.getView().addDependent(oDialog);
      oDialog.open();
    },

    onDuplicate: function () {
      var oDetailModel    = this.getOwnerComponent().getModel("detailModel");
      var sMaterialNumber = oDetailModel.getProperty("/MaterialNumber");
      var sDesc           = oDetailModel.getProperty("/MaterialDescription");
      var oInput = new Input({ value: sDesc + " (Bản Sao)" });
      var oDialog = new Dialog({
        title: "Nhân Bản Vật Liệu",
        content: [new Label({ text: "Mô tả vật liệu mới:" }), oInput],
        beginButton: new Button({
          text: "Nhân Bản", type: "Accept",
          press: function () {
            var oModel = this.getOwnerComponent().getModel("materialData");
            var oOp    = oModel.bindContext("/duplicateMaterial(...)");
            oOp.setParameter("MaterialNumber", sMaterialNumber);
            oOp.setParameter("NewDescription", oInput.getValue());
            oOp.execute().then(function () {
              var oResult = oOp.getBoundContext().getObject();
              MessageBox.success("Đã nhân bản thành: " + oResult.newMaterialNumber, {
                onClose: function () { this.onNavBack(); }.bind(this)
              });
              oDialog.close();
            }.bind(this)).catch(function (e) { MessageBox.error(e.message || e); });
          }.bind(this)
        }),
        endButton: new Button({ text: "Hủy", press: function () { oDialog.close(); } })
      });
      this.getView().addDependent(oDialog);
      oDialog.open();
    }
  });
});
